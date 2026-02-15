// WebSocket Service for Real-time Updates

import { STORAGE_KEYS, WS_CONFIG } from '@/src/config/constants';
import { WSEventType, WSMessage } from '@/src/types';
import { io, Socket } from 'socket.io-client';
import { encryptedStorage } from '../storage/encrypted-storage';

type EventCallback = (data: Record<string, unknown>) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private eventListeners: Map<WSEventType, Set<EventCallback>> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private pendingMessages: WSMessage[] = [];

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    const token = await encryptedStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    try {
      this.socket = io(WS_CONFIG.url, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: WS_CONFIG.maxReconnectAttempts,
        reconnectionDelay: WS_CONFIG.reconnectInterval,
        timeout: 10000,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
      this.startHeartbeat();
      this.flushPendingMessages();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
      this.stopHeartbeat();
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, need to reconnect manually
        this.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.reconnectAttempts++;
    });

    // Handle incoming messages
    this.socket.on('message', (message: WSMessage) => {
      this.handleMessage(message);
    });

    // Handle specific event types
    this.socket.on('task_update', (data) => {
      this.emitToListeners('task_update', data);
    });

    this.socket.on('location_update', (data) => {
      this.emitToListeners('location_update', data);
    });

    this.socket.on('attendance_update', (data) => {
      this.emitToListeners('attendance_update', data);
    });

    this.socket.on('notification', (data) => {
      this.emitToListeners('notification', data);
    });

    this.socket.on('officer_status', (data) => {
      this.emitToListeners('officer_status', data);
    });

    this.socket.on('pong', () => {
      // Heartbeat response received
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WSMessage): void {
    this.emitToListeners(message.type, message.payload);
  }

  /**
   * Emit event to registered listeners
   */
  private emitToListeners(type: WSEventType, data: Record<string, unknown>): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, WS_CONFIG.heartbeatInterval);
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, WS_CONFIG.reconnectInterval);
  }

  /**
   * Flush pending messages after reconnection
   */
  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.send(message.type, message.payload);
      }
    }
  }

  /**
   * Notify connection status listeners
   */
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyConnectionListeners(false);
  }

  /**
   * Send message to server
   */
  send(type: WSEventType, payload: Record<string, unknown>): void {
    const message: WSMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    if (this.socket?.connected) {
      this.socket.emit(type, payload);
    } else {
      // Queue message for later
      this.pendingMessages.push(message);
    }
  }

  /**
   * Subscribe to event type
   */
  on(type: WSEventType, callback: EventCallback): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(type)?.delete(callback);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Join a room (e.g., for supervisors to receive updates for their team)
   */
  joinRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_room', { room });
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', { room });
    }
  }

  /**
   * Send location update
   */
  sendLocationUpdate(location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
  }): void {
    this.send('location_update', { location });
  }

  /**
   * Send task status update
   */
  sendTaskUpdate(taskId: string, status: string, data?: Record<string, unknown>): void {
    this.send('task_update', { taskId, status, ...data });
  }
}

export const wsService = new WebSocketService();
export default wsService;
