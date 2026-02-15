// App Store - Global App State (Network, Sync, etc.)

import { offlineQueue } from '@/src/services/offline/queue-manager';
import { wsService } from '@/src/services/websocket/ws-service';
import { OfflineQueueItem } from '@/src/types';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';

interface AppState {
  // Network
  isOnline: boolean;
  networkType: string | null;
  
  // Sync
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingSync: number;
  offlineQueue: OfflineQueueItem[];
  
  // WebSocket
  isWsConnected: boolean;
  
  // App
  isAppReady: boolean;
  isAppActive: boolean;
}

interface AppActions {
  // Network
  setNetworkState: (state: NetInfoState) => void;
  
  // Sync
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: string) => void;
  updateOfflineQueue: (queue: OfflineQueueItem[]) => void;
  triggerSync: () => Promise<void>;
  
  // WebSocket
  setWsConnected: (connected: boolean) => void;
  
  // App
  setAppReady: (ready: boolean) => void;
  setAppActive: (active: boolean) => void;
  
  // Initialize
  initialize: () => Promise<void>;
  cleanup: () => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  isOnline: true,
  networkType: null,
  isSyncing: false,
  lastSyncTime: null,
  pendingSync: 0,
  offlineQueue: [],
  isWsConnected: false,
  isAppReady: false,
  isAppActive: true,

  // Network state
  setNetworkState: (state: NetInfoState) => {
    set({
      isOnline: state.isConnected ?? false,
      networkType: state.type,
    });

    // Trigger sync when coming back online
    if (state.isConnected && !get().isSyncing) {
      get().triggerSync();
    }
  },

  // Sync state
  setSyncing: (syncing: boolean) => {
    set({ isSyncing: syncing });
  },

  setLastSyncTime: (time: string) => {
    set({ lastSyncTime: time });
  },

  updateOfflineQueue: (queue: OfflineQueueItem[]) => {
    set({
      offlineQueue: queue,
      pendingSync: queue.filter(q => q.status === 'pending' || q.status === 'failed').length,
    });
  },

  triggerSync: async () => {
    const { isSyncing, isOnline } = get();
    
    if (isSyncing || !isOnline) {
      return;
    }

    set({ isSyncing: true });

    try {
      await offlineQueue.processQueue();
      set({ lastSyncTime: new Date().toISOString() });
    } finally {
      set({ isSyncing: false });
    }
  },

  // WebSocket state
  setWsConnected: (connected: boolean) => {
    set({ isWsConnected: connected });
  },

  // App state
  setAppReady: (ready: boolean) => {
    set({ isAppReady: ready });
  },

  setAppActive: (active: boolean) => {
    set({ isAppActive: active });

    // Reconnect WebSocket when app becomes active
    if (active && get().isOnline) {
      wsService.connect();
    }
  },

  // Initialize app store
  initialize: async () => {
    try {
      // Initialize offline queue
      await offlineQueue.initialize();
      
      // Subscribe to queue changes
      offlineQueue.subscribe((queue) => {
        get().updateOfflineQueue(queue);
      });

      // Subscribe to network changes
      NetInfo.addEventListener((state) => {
        get().setNetworkState(state);
      });

      // Subscribe to WebSocket connection changes
      wsService.onConnectionChange((connected) => {
        get().setWsConnected(connected);
      });

      // Get initial network state
      const netState = await NetInfo.fetch();
      get().setNetworkState(netState);

      // Update initial queue state
      get().updateOfflineQueue(offlineQueue.getQueue());

      set({ isAppReady: true });
    } catch (error) {
      console.error('Failed to initialize app store:', error);
    }
  },

  // Cleanup
  cleanup: () => {
    offlineQueue.stopBackgroundSync();
    wsService.disconnect();
  },
}));

export default useAppStore;
