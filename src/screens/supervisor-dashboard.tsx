// Admin/Supervisor Dashboard - Real-time Field Officers Tracking

import { ErrorBoundary } from '@/src/components/error-boundary';
import { RoleGate } from '@/src/components/role-gate';
import { Avatar, Badge, Card, StatusIndicator, SyncBanner } from '@/src/components/ui';
import { apiClient } from '@/src/services/api/client';
import { wsService } from '@/src/services/websocket/ws-service';
import { useAppStore } from '@/src/store/app-store';
import { useAuthStore } from '@/src/store/auth-store';
import { DashboardStats, FieldOfficerStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function SupervisorDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isOnline, isSyncing, pendingSync, isWsConnected, triggerSync } = useAppStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [officers, setOfficers] = useState<FieldOfficerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Subscribe to real-time officer status updates
    const unsubscribe = wsService.on('officer_status', (data) => {
      handleOfficerStatusUpdate(data);
    });

    // Join supervisor room for team updates
    wsService.joinRoom(`supervisor_${user?.id}`);

    return () => {
      unsubscribe();
      wsService.leaveRoom(`supervisor_${user?.id}`);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, officersResponse] = await Promise.all([
        apiClient.get<DashboardStats>('/dashboard/stats'),
        apiClient.get<FieldOfficerStatus[]>('/officers/status'),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (officersResponse.success && officersResponse.data) {
        setOfficers(officersResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfficerStatusUpdate = (data: Record<string, unknown>) => {
    const userId = data.userId as string;
    const updates = data as Partial<FieldOfficerStatus>;

    setOfficers((prev) =>
      prev.map((officer) =>
        officer.userId === userId ? { ...officer, ...updates } : officer
      )
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const getOfficersByStatus = () => {
    const online = officers.filter((o) => o.isOnline);
    const offline = officers.filter((o) => !o.isOnline);
    return { online, offline };
  };

  const { online: onlineOfficers, offline: offlineOfficers } = getOfficersByStatus();

  return (
    <ErrorBoundary>
      <RoleGate roles={['admin', 'supervisor']}>
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
                <Text style={styles.greeting}>Dashboard</Text>
                <Text style={styles.userName}>
                  {user?.role === 'admin' ? 'Administrator' : 'Supervisor'}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.wsStatus}>
                  <StatusIndicator status={isWsConnected ? 'online' : 'offline'} size={8} />
                  <Text style={styles.wsStatusText}>
                    {isWsConnected ? 'Live' : 'Offline'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/notifications')}>
                  <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Date */}
            <Text style={styles.dateText}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </Text>

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIcon, { backgroundColor: '#E5F0FF' }]}>
                    <Ionicons name="people" size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.statValue}>{stats?.totalFieldOfficers || 0}</Text>
                </View>
                <Text style={styles.statLabel}>Total Officers</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  </View>
                  <Text style={styles.statValue}>{stats?.activeToday || 0}</Text>
                </View>
                <Text style={styles.statLabel}>Active Today</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="clipboard" size={20} color="#FF9500" />
                  </View>
                  <Text style={styles.statValue}>{stats?.pendingTasks || 0}</Text>
                </View>
                <Text style={styles.statLabel}>Pending Tasks</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="trophy" size={20} color="#34C759" />
                  </View>
                  <Text style={styles.statValue}>{stats?.completedTasksToday || 0}</Text>
                </View>
                <Text style={styles.statLabel}>Completed Today</Text>
              </Card>
            </View>

            {/* Attendance Rate */}
            <Card style={styles.attendanceCard}>
              <View style={styles.attendanceHeader}>
                <Text style={styles.attendanceTitle}>Today's Attendance</Text>
                <Badge
                  label={`${Math.round((stats?.attendanceRate || 0) * 100)}%`}
                  variant={
                    (stats?.attendanceRate || 0) >= 0.9
                      ? 'success'
                      : (stats?.attendanceRate || 0) >= 0.7
                      ? 'warning'
                      : 'danger'
                  }
                />
              </View>
              <View style={styles.attendanceBar}>
                <View
                  style={[
                    styles.attendanceFill,
                    { width: `${(stats?.attendanceRate || 0) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.attendanceStats}>
                <View style={styles.attendanceStat}>
                  <Text style={styles.attendanceStatValue}>{stats?.activeToday || 0}</Text>
                  <Text style={styles.attendanceStatLabel}>Present</Text>
                </View>
                <View style={styles.attendanceStat}>
                  <Text style={styles.attendanceStatValue}>{stats?.onLeave || 0}</Text>
                  <Text style={styles.attendanceStatLabel}>On Leave</Text>
                </View>
                <View style={styles.attendanceStat}>
                  <Text style={styles.attendanceStatValue}>
                    {(stats?.totalFieldOfficers || 0) - (stats?.activeToday || 0) - (stats?.onLeave || 0)}
                  </Text>
                  <Text style={styles.attendanceStatLabel}>Absent</Text>
                </View>
              </View>
            </Card>

            {/* Online Officers */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Online Officers ({onlineOfficers.length})
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/team')}>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {onlineOfficers.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No officers currently online</Text>
                </Card>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {onlineOfficers.slice(0, 10).map((officer) => (
                    <TouchableOpacity
                      key={officer.userId}
                      style={styles.officerCard}
                      onPress={() => router.push(`/team/${officer.userId}`)}
                    >
                      <Avatar
                        name={officer.user.name}
                        size={48}
                        showStatus
                        status="online"
                      />
                      <Text style={styles.officerName} numberOfLines={1}>
                        {officer.user.name}
                      </Text>
                      {officer.currentTask && (
                        <Badge
                          label="On Task"
                          variant="info"
                          size="small"
                        />
                      )}
                      {officer.batteryLevel !== undefined && (
                        <View style={styles.batteryIndicator}>
                          <Ionicons
                            name={
                              officer.batteryLevel > 50
                                ? 'battery-full'
                                : officer.batteryLevel > 20
                                ? 'battery-half'
                                : 'battery-dead'
                            }
                            size={14}
                            color={
                              officer.batteryLevel > 50
                                ? '#34C759'
                                : officer.batteryLevel > 20
                                ? '#FF9500'
                                : '#FF3B30'
                            }
                          />
                          <Text style={styles.batteryText}>
                            {officer.batteryLevel}%
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/(tabs)/tasks')}
                >
                  <Ionicons name="add-circle-outline" size={32} color="#007AFF" />
                  <Text style={styles.actionText}>Assign Task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/map')}
                >
                  <Ionicons name="map-outline" size={32} color="#34C759" />
                  <Text style={styles.actionText}>Live Map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/(tabs)/reports')}
                >
                  <Ionicons name="documents-outline" size={32} color="#FF9500" />
                  <Text style={styles.actionText}>Review Reports</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/(tabs)/team')}
                >
                  <Ionicons name="analytics-outline" size={32} color="#E91E63" />
                  <Text style={styles.actionText}>Analytics</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom padding */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </RoleGate>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  wsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  wsStatusText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  attendanceCard: {
    margin: 16,
    padding: 20,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  attendanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  attendanceBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  attendanceFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  attendanceStat: {
    alignItems: 'center',
  },
  attendanceStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  attendanceStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
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
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  officerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 12,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  officerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  batteryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  batteryText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#8E8E93',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  actionCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
