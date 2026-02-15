import { Badge, Card } from '@/src/components/ui';
import { AttendanceCard } from '@/src/features/attendance/components/attendance-card';
import { useAttendanceStore } from '@/src/store/attendance-store';
import { useAuthStore } from '@/src/store/auth-store';
import { AttendanceRecord } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { eachDayOfInterval, endOfMonth, format, isToday, startOfMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AttendanceTab() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { todayRecord, history, isLoading, fetchHistory } = useAttendanceStore();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory(selectedMonth);
    setRefreshing(false);
  }, [selectedMonth]);

  // Get days in selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group attendance by date
  const attendanceByDate = history.reduce((acc, record) => {
    if (record.checkInTime) {
      const dateKey = format(new Date(record.checkInTime), 'yyyy-MM-dd');
      acc[dateKey] = record;
    }
    return acc;
  }, {} as Record<string, AttendanceRecord>);

  // Calculate stats for the month
  const monthStats = {
    present: history.filter(r => r.status === 'present').length,
    late: history.filter(r => r.status === 'late').length,
    absent: 0, // Would be calculated from working days
    totalHours: history.reduce((sum, r) => sum + (r.totalHours || 0), 0),
  };

  const previousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    if (next <= new Date()) {
      setSelectedMonth(next);
    }
  };

  const getStatusColor = (date: Date): string => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const record = attendanceByDate[dateKey];
    
    if (!record) {
      if (date > new Date()) return '#E5E5EA'; // Future
      return '#FFE5E5'; // Absent (past without record)
    }
    
    switch (record.status) {
      case 'present': return '#E8F8EC';
      case 'late': return '#FFF3E0';
      case 'wfh': return '#FFF9E6';
      case 'leave': return '#E3F2FD';
      default: return '#E5E5EA';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today's Attendance Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <AttendanceCard />
        </View>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{monthStats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#FF9500' }]}>{monthStats.late}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>{monthStats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#007AFF' }]}>
                {monthStats.totalHours.toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Hours</Text>
            </Card>
          </View>
        </View>

        {/* Calendar View */}
        <View style={styles.section}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={previousMonth} style={styles.monthNav}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {format(selectedMonth, 'MMMM yyyy')}
            </Text>
            <TouchableOpacity 
              onPress={nextMonth} 
              style={styles.monthNav}
              disabled={selectedMonth.getMonth() === new Date().getMonth()}
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={selectedMonth.getMonth() === new Date().getMonth() ? '#C7C7CC' : '#007AFF'} 
              />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {/* Empty cells for offset */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            
            {/* Day cells */}
            {daysInMonth.map(date => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const record = attendanceByDate[dateKey];
              const isCurrentDay = isToday(date);
              
              return (
                <TouchableOpacity
                  key={dateKey}
                  style={[
                    styles.dayCell,
                    { backgroundColor: getStatusColor(date) },
                    isCurrentDay && styles.todayCell,
                  ]}
                  onPress={() => {
                    if (record) {
                      // Could navigate to detail
                    }
                  }}
                >
                  <Text style={[
                    styles.dayNumber,
                    isCurrentDay && styles.todayText,
                  ]}>
                    {format(date, 'd')}
                  </Text>
                  {record && (
                    <View style={styles.dayIndicator}>
                      <Ionicons 
                        name={record.status === 'present' ? 'checkmark-circle' : 'time'} 
                        size={12} 
                        color={record.status === 'present' ? '#34C759' : '#FF9500'} 
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E8F8EC' }]} />
              <Text style={styles.legendText}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFF3E0' }]} />
              <Text style={styles.legendText}>Late</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFE5E5' }]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>
          </View>
        </View>

        {/* Recent History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Records</Text>
          {history.slice(0, 5).filter(r => r.checkInTime).map(record => (
            <Card key={record.id} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View>
                  <Text style={styles.historyDate}>
                    {format(new Date(record.checkInTime!), 'EEEE, MMM d')}
                  </Text>
                  <Text style={styles.historyTime}>
                    {format(new Date(record.checkInTime!), 'h:mm a')} - 
                    {record.checkOutTime 
                      ? format(new Date(record.checkOutTime), ' h:mm a')
                      : ' In progress'}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Badge 
                    label={record.status} 
                    variant={record.status === 'present' ? 'success' : 'warning'}
                    size="small"
                  />
                  {record.totalHours && (
                    <Text style={styles.historyHours}>
                      {record.totalHours.toFixed(1)}h
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#34C759',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNav: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: '700',
  },
  dayIndicator: {
    position: 'absolute',
    bottom: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  historyCard: {
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  historyTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyHours: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});
