// Officer Detail Screen for Supervisors

import { Badge, Button, Card } from '@/src/components/ui';
import { AttendanceRecord, AttendanceStatus, Task, User } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { eachDayOfInterval, endOfMonth, format, isToday, parseISO, startOfMonth } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Mock data - replace with actual API calls
const mockOfficer: User = {
  id: '1',
  employeeId: 'EMP001',
  name: 'John Smith',
  email: 'john.smith@company.com',
  phone: '+1 555-123-4567',
  role: 'field_officer',
  avatar: 'https://i.pravatar.cc/150?img=1',
  department: 'Field Operations',
  supervisorId: 'sup1',
  createdAt: '2023-01-15T00:00:00Z',
  updatedAt: '2024-01-20T00:00:00Z',
};

const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    odId: 'od1',
    odSynced: true,
    userId: '1',
    date: format(new Date(), 'yyyy-MM-dd'),
    checkInTime: format(new Date().setHours(9, 5), "yyyy-MM-dd'T'HH:mm:ss"),
    checkOutTime: format(new Date().setHours(17, 30), "yyyy-MM-dd'T'HH:mm:ss"),
    status: 'present',
    workDuration: 505,
    isWithinGeoFence: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    odId: 'od1',
    odSynced: true,
    title: 'Site Inspection - Downtown',
    description: 'Conduct site inspection',
    status: 'in_progress',
    priority: 'high',
    assignedTo: '1',
    assignedBy: 'sup1',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    odId: 'od2',
    odSynced: true,
    title: 'Equipment Maintenance',
    description: 'Regular maintenance check',
    status: 'pending',
    priority: 'medium',
    assignedTo: '1',
    assignedBy: 'sup1',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function OfficerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [officer, setOfficer] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadOfficerData();
  }, [id]);

  const loadOfficerData = async () => {
    // In production, fetch from API
    setOfficer(mockOfficer);
    setAttendance(mockAttendance);
    setTasks(mockTasks);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadOfficerData();
    setIsRefreshing(false);
  }, []);

  const handleCall = () => {
    if (officer?.phone) {
      Linking.openURL(`tel:${officer.phone}`);
    }
  };

  const handleEmail = () => {
    if (officer?.email) {
      Linking.openURL(`mailto:${officer.email}`);
    }
  };

  const handleAssignTask = () => {
    // Navigate to tasks tab (task assignment can be done there)
    router.push('/(tabs)/tasks');
  };

  const getAttendanceStats = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const workingDays = days.filter(d => d.getDay() !== 0 && d.getDay() !== 6);

    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const leave = attendance.filter(a => a.status === 'leave').length;

    return { present, late, absent, leave, totalWorkingDays: workingDays.length };
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const variants: Record<AttendanceStatus, 'success' | 'warning' | 'danger' | 'default'> = {
      present: 'success',
      late: 'warning',
      absent: 'danger',
      leave: 'default',
      wfh: 'default',
    };
    return <Badge label={status.replace('_', ' ')} variant={variants[status]} />;
  };

  const getTaskStatusBadge = (status: Task['status']) => {
    const variants: Record<Task['status'], 'default' | 'warning' | 'success' | 'danger'> = {
      pending: 'default',
      assigned: 'default',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger',
      on_hold: 'warning',
    };
    const labels: Record<Task['status'], string> = {
      pending: 'Pending',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      on_hold: 'On Hold',
    };
    return <Badge label={labels[status]} variant={variants[status]} />;
  };

  if (!officer) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const stats = getAttendanceStats();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: officer.avatar || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{officer.name}</Text>
            <Text style={styles.employeeId}>{officer.employeeId}</Text>
            <Badge label={officer.role.replace('_', ' ')} variant="default" />
          </View>
        </View>

        <View style={styles.contactActions}>
          <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactButton, styles.emailButton]}
            onPress={handleEmail}
          >
            <Ionicons name="mail" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{officer.department}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{officer.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{officer.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>
              Joined {format(parseISO(officer.createdAt), 'MMMM d, yyyy')}
            </Text>
          </View>
        </View>
      </Card>

      {/* Current Status */}
      <Card style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        <View style={styles.currentStatus}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, styles.statusOnline]} />
            <Text style={styles.statusLabel}>Online</Text>
          </View>
          <View style={styles.lastSeen}>
            <Ionicons name="location" size={16} color="#34C759" />
            <Text style={styles.lastSeenText}>Last seen: 2 mins ago</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewLocationButton}
          onPress={() => router.push(`/map?officerId=${id}`)}
        >
          <Ionicons name="map-outline" size={18} color="#007AFF" />
          <Text style={styles.viewLocationText}>View Live Location</Text>
        </TouchableOpacity>
      </Card>

      {/* Attendance Stats */}
      <Card style={styles.attendanceCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Attendance - {format(selectedMonth, 'MMMM yyyy')}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statWarning]}>{stats.late}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statDanger]}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.leave}</Text>
            <Text style={styles.statLabel}>Leave</Text>
          </View>
        </View>

        <View style={styles.attendanceRate}>
          <Text style={styles.attendanceRateLabel}>Attendance Rate</Text>
          <Text style={styles.attendanceRateValue}>
            {stats.totalWorkingDays > 0
              ? Math.round((stats.present / stats.totalWorkingDays) * 100)
              : 0}%
          </Text>
        </View>
      </Card>

      {/* Recent Attendance */}
      <Card style={styles.recentCard}>
        <Text style={styles.sectionTitle}>Recent Attendance</Text>
        {attendance.length === 0 ? (
          <Text style={styles.emptyText}>No attendance records found</Text>
        ) : (
          attendance.slice(0, 5).map(record => (
            <View key={record.id} style={styles.attendanceRow}>
              <View>
                <Text style={styles.attendanceDate}>
                  {isToday(parseISO(record.date))
                    ? 'Today'
                    : format(parseISO(record.date), 'EEE, MMM d')}
                </Text>
                <Text style={styles.attendanceTime}>
                  {record.checkInTime
                    ? format(parseISO(record.checkInTime), 'h:mm a')
                    : '--:--'}{' '}
                  -{' '}
                  {record.checkOutTime
                    ? format(parseISO(record.checkOutTime), 'h:mm a')
                    : '--:--'}
                </Text>
              </View>
              {getStatusBadge(record.status)}
            </View>
          ))
        )}
      </Card>

      {/* Assigned Tasks */}
      <Card style={styles.tasksCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Assigned Tasks</Text>
          <TouchableOpacity onPress={handleAssignTask}>
            <Ionicons name="add-circle" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks assigned</Text>
        ) : (
          tasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskRow}
              onPress={() => router.push(`/tasks/${task.id}`)}
            >
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDue}>
                  Due: {format(parseISO(task.dueDate), 'MMM d, h:mm a')}
                </Text>
              </View>
              {getTaskStatusBadge(task.status)}
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title="Assign New Task"
          onPress={handleAssignTask}
          icon="add-outline"
          fullWidth
        />
        <View style={styles.actionSpacer} />
        <Button
          title="View Full Report"
          onPress={() => router.push(`/reports?officerId=${id}`)}
          variant="outline"
          icon="document-text-outline"
          fullWidth
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    margin: 16,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  contactActions: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  emailButton: {
    backgroundColor: '#007AFF',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  currentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOnline: {
    backgroundColor: '#34C759',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  lastSeen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastSeenText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  viewLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  viewLocationText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  attendanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#34C759',
  },
  statWarning: {
    color: '#FF9500',
  },
  statDanger: {
    color: '#FF3B30',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  attendanceRate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  attendanceRateLabel: {
    fontSize: 14,
    color: '#3C3C43',
  },
  attendanceRateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  recentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  attendanceDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  attendanceTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  tasksCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  taskDue: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  actionsContainer: {
    padding: 16,
  },
  actionSpacer: {
    height: 12,
  },
  bottomPadding: {
    height: 40,
  },
});
