// Field Officer Dashboard / Home Screen

import { ErrorBoundary } from '@/src/components/error-boundary';
import { Badge, Card, SyncBanner } from '@/src/components/ui';
import { AttendanceCard } from '@/src/features/attendance/components/attendance-card';
import { useAppStore } from '@/src/store/app-store';
import { useAttendanceStore } from '@/src/store/attendance-store';
import { useAuthStore } from '@/src/store/auth-store';
import { useTaskStore } from '@/src/store/task-store';
import { Task } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { todayRecord, fetchTodayAttendance } = useAttendanceStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { isOnline, isSyncing, pendingSync, triggerSync } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchTodayAttendance(),
      fetchTasks({ status: ['assigned', 'in_progress'] }),
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getActiveTasks = () => {
    return tasks.filter(t => t.status === 'in_progress' || t.status === 'assigned');
  };

  const handleTaskPress = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: '#FF3B30',
      high: '#FF9500',
      medium: '#007AFF',
      low: '#8E8E93',
    };
    return colors[priority] || '#8E8E93';
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Sync Banner */}
        <SyncBanner
          pendingCount={pendingSync}
          isSyncing={isSyncing}
          isOnline={isOnline}
          onSync={triggerSync}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.name || 'Officer'}</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Date */}
          <Text style={styles.dateText}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>

          {/* Attendance Card */}
          <AttendanceCard
            onCheckInPress={() => router.push('/attendance/check-in')}
            onCheckOutPress={() => router.push('/attendance/check-out')}
          />

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="clipboard-outline" size={24} color="#007AFF" />
                <Text style={styles.statNumber}>{getActiveTasks().length}</Text>
                <Text style={styles.statLabel}>Active Tasks</Text>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="document-text-outline" size={24} color="#34C759" />
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Draft Reports</Text>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="time-outline" size={24} color="#FF9500" />
                <Text style={styles.statNumber}>
                  {todayRecord?.workDuration
                    ? `${Math.floor(todayRecord.workDuration / 60)}h`
                    : '--'}
                </Text>
                <Text style={styles.statLabel}>Work Hours</Text>
              </View>
            </Card>
          </View>

          {/* Active Tasks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Tasks</Text>
              <TouchableOpacity onPress={() => router.push('/tasks')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {getActiveTasks().length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyContent}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#34C759" />
                  <Text style={styles.emptyText}>No active tasks</Text>
                  <Text style={styles.emptySubtext}>You're all caught up!</Text>
                </View>
              </Card>
            ) : (
              getActiveTasks().slice(0, 3).map((task) => (
                <TouchableOpacity
                  key={task.id || task.odId}
                  style={styles.taskCard}
                  onPress={() => handleTaskPress(task)}
                >
                  <View style={[styles.taskPriority, { backgroundColor: getPriorityColor(task.priority) }]} />
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Badge
                        label={task.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                        variant={task.status === 'in_progress' ? 'warning' : 'info'}
                        size="small"
                      />
                    </View>
                    {task.clientName && (
                      <View style={styles.taskMeta}>
                        <Ionicons name="business-outline" size={14} color="#8E8E93" />
                        <Text style={styles.taskMetaText}>{task.clientName}</Text>
                      </View>
                    )}
                    {task.dueDate && (
                      <View style={styles.taskMeta}>
                        <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                        <Text style={styles.taskMetaText}>
                          Due: {format(new Date(task.dueDate), 'MMM d')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/reports/new')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#E5F0FF' }]}>
                  <Ionicons name="create-outline" size={24} color="#007AFF" />
                </View>
                <Text style={styles.quickActionText}>New Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/(tabs)/attendance')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="calendar-outline" size={24} color="#34C759" />
                </View>
                <Text style={styles.quickActionText}>Attendance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/map')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="location-outline" size={24} color="#FF9500" />
                </View>
                <Text style={styles.quickActionText}>My Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#FCE4EC' }]}>
                  <Ionicons name="help-circle-outline" size={24} color="#E91E63" />
                </View>
                <Text style={styles.quickActionText}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#8E8E93',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyCard: {
    padding: 24,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  taskPriority: {
    width: 4,
    alignSelf: 'stretch',
  },
  taskContent: {
    flex: 1,
    padding: 14,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taskMetaText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#8E8E93',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  quickAction: {
    width: '22%',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});
