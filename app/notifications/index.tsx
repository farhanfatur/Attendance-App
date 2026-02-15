// Notifications Screen - View all notifications

import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, parseISO, startOfDay } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Notification {
  id: string;
  type: 'task' | 'attendance' | 'report' | 'system' | 'alert';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    taskId?: string;
    reportId?: string;
    attendanceId?: string;
  };
}

// Mock notifications - replace with actual data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'task',
    title: 'New Task Assigned',
    message: 'You have been assigned "Site Inspection - Downtown"',
    isRead: false,
    createdAt: new Date().toISOString(),
    data: { taskId: '1' },
  },
  {
    id: '2',
    type: 'attendance',
    title: 'Check-in Reminder',
    message: "Don't forget to check in for today",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    type: 'alert',
    title: 'Geofence Alert',
    message: 'You are outside the designated work area',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4',
    type: 'report',
    title: 'Report Approved',
    message: 'Your field report has been approved by supervisor',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    data: { reportId: '1' },
  },
  {
    id: '5',
    type: 'system',
    title: 'App Update Available',
    message: 'A new version of the app is available. Please update.',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

interface SectionData {
  title: string;
  data: Notification[];
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // In production, fetch notifications from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== id));
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);

    switch (notification.type) {
      case 'task':
        if (notification.data?.taskId) {
          router.push(`/tasks/${notification.data.taskId}`);
        }
        break;
      case 'report':
        if (notification.data?.reportId) {
          router.push(`/reports/${notification.data.reportId}`);
        }
        break;
      case 'attendance':
        router.push('/(tabs)/attendance');
        break;
      default:
        // Just mark as read, no navigation
        break;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const icons: Record<Notification['type'], string> = {
      task: 'clipboard-outline',
      attendance: 'time-outline',
      report: 'document-text-outline',
      system: 'settings-outline',
      alert: 'warning-outline',
    };
    return icons[type];
  };

  const getNotificationColor = (type: Notification['type']) => {
    const colors: Record<Notification['type'], string> = {
      task: '#007AFF',
      attendance: '#34C759',
      report: '#5856D6',
      system: '#8E8E93',
      alert: '#FF9500',
    };
    return colors[type];
  };

  const groupNotificationsByDate = (): SectionData[] => {
    const groups: Record<string, Notification[]> = {};

    notifications.forEach(notification => {
      const date = startOfDay(parseISO(notification.createdAt));
      const key = date.toISOString();

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dateKey, items]) => {
        const date = parseISO(dateKey);
        let title = format(date, 'MMMM d, yyyy');

        if (isToday(date)) {
          title = 'Today';
        } else if (isYesterday(date)) {
          title = 'Yesterday';
        }

        return { title, data: items };
      });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const sections = groupNotificationsByDate();

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item.id)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${getNotificationColor(item.type)}15` },
        ]}
      >
        <Ionicons
          name={getNotificationIcon(item.type) as any}
          size={22}
          color={getNotificationColor(item.type)}
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {format(parseISO(item.createdAt), 'h:mm a')}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      {unreadCount > 0 && (
        <View style={styles.headerActions}>
          <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyMessage}>
            You're all caught up! Check back later for updates.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  unreadCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  markAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  unreadItem: {
    backgroundColor: '#F0F8FF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  unreadText: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
