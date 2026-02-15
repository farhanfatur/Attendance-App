// Offline Queue System with Conflict Resolution

import { OFFLINE_CONFIG, STORAGE_KEYS } from '@/src/config/constants';
import {
    ConflictResolution,
    OfflineActionType,
    OfflineQueueItem
} from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '../api/client';

type QueueListener = (queue: OfflineQueueItem[]) => void;

class OfflineQueueManager {
  private queue: OfflineQueueItem[] = [];
  private isProcessing = false;
  private isSyncing = false;
  private listeners: Set<QueueListener> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize the queue from storage
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
      
      // Start background sync
      this.startBackgroundSync();
      
      // Listen for network changes
      NetInfo.addEventListener(state => {
        if (state.isConnected && !this.isSyncing) {
          this.processQueue();
        }
      });
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
    }
  }

  /**
   * Add item to offline queue
   */
  async enqueue(
    type: OfflineActionType,
    payload: Record<string, unknown>,
    options?: {
      priority?: number;
      conflictResolution?: ConflictResolution;
      maxRetries?: number;
    }
  ): Promise<string> {
    const id = uuidv4();
    
    const item: OfflineQueueItem = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options?.maxRetries ?? OFFLINE_CONFIG.defaultMaxRetries,
      priority: options?.priority ?? this.getDefaultPriority(type),
      conflictResolution: options?.conflictResolution ?? OFFLINE_CONFIG.defaultConflictResolution,
      status: 'pending',
      localVersion: 1,
    };

    this.queue.push(item);
    this.sortQueue();
    await this.persistQueue();
    this.notifyListeners();

    // Try to process immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Get default priority based on action type
   */
  private getDefaultPriority(type: OfflineActionType): number {
    const priorities: Record<OfflineActionType, number> = {
      attendance_check_in: 100,
      attendance_check_out: 100,
      task_update: 80,
      report_submit: 60,
      location_update: 40,
      photo_upload: 20,
    };
    return priorities[type] || 50;
  }

  /**
   * Sort queue by priority and timestamp
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Persist queue to storage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(this.queue)
      );
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  /**
   * Process queued items
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return;
    }

    this.isProcessing = true;
    this.isSyncing = true;

    try {
      const pendingItems = this.queue.filter(item => 
        item.status === 'pending' || item.status === 'failed'
      );

      const batch = pendingItems.slice(0, OFFLINE_CONFIG.syncBatchSize);

      for (const item of batch) {
        await this.processItem(item);
      }
    } finally {
      this.isProcessing = false;
      this.isSyncing = false;
      await this.persistQueue();
      this.notifyListeners();
    }
  }

  /**
   * Process single queue item
   */
  private async processItem(item: OfflineQueueItem): Promise<void> {
    const itemIndex = this.queue.findIndex(q => q.id === item.id);
    if (itemIndex === -1) return;

    this.queue[itemIndex].status = 'syncing';
    this.queue[itemIndex].lastAttempt = Date.now();

    try {
      const result = await this.executeAction(item);
      
      if (result.success) {
        this.queue[itemIndex].status = 'completed';
        // Remove completed items
        this.queue = this.queue.filter(q => q.id !== item.id);
      } else if (result.conflict) {
        await this.handleConflict(item, result.serverData);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.queue[itemIndex].retryCount++;
      this.queue[itemIndex].errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.queue[itemIndex].retryCount >= item.maxRetries) {
        this.queue[itemIndex].status = 'failed';
      } else {
        this.queue[itemIndex].status = 'pending';
      }
    }
  }

  /**
   * Execute the actual API call
   */
  private async executeAction(item: OfflineQueueItem): Promise<{
    success: boolean;
    conflict?: boolean;
    serverData?: Record<string, unknown>;
    error?: string;
  }> {
    const endpoints: Record<OfflineActionType, string> = {
      attendance_check_in: '/attendance/check-in',
      attendance_check_out: '/attendance/check-out',
      task_update: '/tasks/update',
      report_submit: '/reports/submit',
      location_update: '/location/update',
      photo_upload: '/uploads/photo',
    };

    try {
      const response = await apiClient.post(endpoints[item.type], {
        ...item.payload,
        _offlineId: item.id,
        _localVersion: item.localVersion,
        _timestamp: item.timestamp,
      });

      const data = response.data as { conflict?: boolean; serverData?: Record<string, unknown> } | undefined;

      if (data?.conflict) {
        return {
          success: false,
          conflict: true,
          serverData: data.serverData,
        };
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        return {
          success: false,
          conflict: true,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflict(
    item: OfflineQueueItem,
    serverData?: Record<string, unknown>
  ): Promise<void> {
    const itemIndex = this.queue.findIndex(q => q.id === item.id);
    if (itemIndex === -1) return;

    switch (item.conflictResolution) {
      case 'client_wins':
        // Force push local changes
        item.localVersion++;
        this.queue[itemIndex].status = 'pending';
        break;

      case 'server_wins':
        // Discard local changes
        this.queue = this.queue.filter(q => q.id !== item.id);
        // Emit event to update local state with server data
        if (serverData) {
          this.emitServerUpdate(item.type, serverData);
        }
        break;

      case 'merge':
        // Attempt to merge changes
        const mergedPayload = this.mergeChanges(item.payload, serverData || {});
        this.queue[itemIndex].payload = mergedPayload;
        this.queue[itemIndex].localVersion++;
        this.queue[itemIndex].status = 'pending';
        break;

      case 'manual':
        // Mark for manual resolution
        this.queue[itemIndex].status = 'failed';
        this.queue[itemIndex].errorMessage = 'Conflict requires manual resolution';
        this.queue[itemIndex].serverVersion = serverData?._version as number;
        break;
    }
  }

  /**
   * Merge local and server changes
   */
  private mergeChanges(
    local: Record<string, unknown>,
    server: Record<string, unknown>
  ): Record<string, unknown> {
    // Simple merge strategy: local wins for conflicts, add new server fields
    return {
      ...server,
      ...local,
      _merged: true,
      _mergedAt: Date.now(),
    };
  }

  /**
   * Emit server update event
   */
  private emitServerUpdate(type: OfflineActionType, data: Record<string, unknown>): void {
    // This would typically use an event emitter or state management
    console.log('Server update received:', type, data);
  }

  /**
   * Start background sync interval
   */
  private startBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.processQueue();
    }, OFFLINE_CONFIG.syncInterval);
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get current queue
   */
  getQueue(): OfflineQueueItem[] {
    return [...this.queue];
  }

  /**
   * Get queue stats
   */
  getStats(): {
    total: number;
    pending: number;
    syncing: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(q => q.status === 'pending').length,
      syncing: this.queue.filter(q => q.status === 'syncing').length,
      failed: this.queue.filter(q => q.status === 'failed').length,
    };
  }

  /**
   * Remove item from queue
   */
  async removeItem(id: string): Promise<void> {
    this.queue = this.queue.filter(q => q.id !== id);
    await this.persistQueue();
    this.notifyListeners();
  }

  /**
   * Retry failed item
   */
  async retryItem(id: string): Promise<void> {
    const itemIndex = this.queue.findIndex(q => q.id === id);
    if (itemIndex === -1) return;

    this.queue[itemIndex].status = 'pending';
    this.queue[itemIndex].retryCount = 0;
    await this.persistQueue();
    this.processQueue();
  }

  /**
   * Retry all failed items
   */
  async retryAllFailed(): Promise<void> {
    this.queue.forEach((item, index) => {
      if (item.status === 'failed') {
        this.queue[index].status = 'pending';
        this.queue[index].retryCount = 0;
      }
    });
    await this.persistQueue();
    this.processQueue();
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.queue]));
  }

  /**
   * Clear completed items older than specified age
   */
  async clearOldItems(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = Date.now() - maxAgeMs;
    this.queue = this.queue.filter(q => 
      q.status !== 'completed' || q.timestamp > cutoff
    );
    await this.persistQueue();
  }
}

export const offlineQueue = new OfflineQueueManager();
export default offlineQueue;
