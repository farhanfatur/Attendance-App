// Push Notification Service (FCM)

import { NOTIFICATION_CONFIG } from '@/src/config/constants';
import { AppNotification, NotificationType } from '@/src/types';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationCallback = (notification: AppNotification) => void;

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;
  private listeners: Set<NotificationCallback> = new Set();
  private responseListeners: Set<(data: Record<string, unknown>) => void> = new Set();

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    await this.registerForPushNotifications();
    this.setupNotificationChannels();
    this.setupListeners();
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require physical device');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual project ID
      });

      this.expoPushToken = tokenData.data;

      // Register token with backend
      await this.registerTokenWithBackend(this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        deviceId: Device.deviceName,
      });
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }
  }

  /**
   * Setup notification channels (Android)
   */
  private async setupNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    // Default channel
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.channelId, {
      name: NOTIFICATION_CONFIG.channelName,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });

    // Task channel
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.taskChannel, {
      name: 'Task Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    // Attendance channel
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.attendanceChannel, {
      name: 'Attendance Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    // Alert channel
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.alertChannel, {
      name: 'Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
    });
  }

  /**
   * Setup notification listeners
   */
  private setupListeners(): void {
    // Handle notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const appNotification = this.parseNotification(notification);
        this.notifyListeners(appNotification);
      }
    );

    // Handle notification response (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        this.notifyResponseListeners(data);
      }
    );
  }

  /**
   * Parse Expo notification to app notification
   */
  private parseNotification(notification: Notifications.Notification): AppNotification {
    const content = notification.request.content;
    const data = content.data as Record<string, unknown>;

    return {
      id: notification.request.identifier,
      type: (data.type as NotificationType) || 'system',
      title: content.title || '',
      body: content.body || '',
      data,
      isRead: false,
      receivedAt: new Date().toISOString(),
    };
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    options?: {
      channelId?: string;
      seconds?: number;
      date?: Date;
    }
  ): Promise<string> {
    const trigger: Notifications.NotificationTriggerInput = options?.date
      ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: options.date }
      : options?.seconds
      ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: options.seconds }
      : null;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        ...(Platform.OS === 'android' && {
          channelId: options?.channelId || NOTIFICATION_CONFIG.channelId,
        }),
      },
      trigger,
    });

    return identifier;
  }

  /**
   * Schedule attendance reminder
   */
  async scheduleAttendanceReminder(
    type: 'check_in' | 'check_out',
    time: Date
  ): Promise<string> {
    const title = type === 'check_in' 
      ? '🕐 Time to Check In'
      : '🕔 Time to Check Out';
    
    const body = type === 'check_in'
      ? "Don't forget to check in for today!"
      : 'Your work day is ending. Please check out.';

    return this.scheduleLocalNotification(title, body, { type: 'attendance_reminder' }, {
      date: time,
      channelId: NOTIFICATION_CONFIG.attendanceChannel,
    });
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get all pending notifications
   */
  async getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Subscribe to notification received
   */
  onNotification(callback: NotificationCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Subscribe to notification response (tap)
   */
  onNotificationResponse(callback: (data: Record<string, unknown>) => void): () => void {
    this.responseListeners.add(callback);
    return () => {
      this.responseListeners.delete(callback);
    };
  }

  /**
   * Notify notification listeners
   */
  private notifyListeners(notification: AppNotification): void {
    this.listeners.forEach(callback => callback(notification));
  }

  /**
   * Notify response listeners
   */
  private notifyResponseListeners(data: Record<string, unknown>): void {
    this.responseListeners.forEach(callback => callback(data));
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  /**
   * Show immediate notification
   */
  async showImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Immediately shows the notification
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
