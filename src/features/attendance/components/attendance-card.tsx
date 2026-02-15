// Attendance Check Card Component

import { Badge, Button, Card } from '@/src/components/ui';
import { locationService } from '@/src/services/location/location-service';
import { useAttendanceStore } from '@/src/store/attendance-store';
import { GeoLocation } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { differenceInMinutes, format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AttendanceCardProps {
  onCheckInPress?: () => void;
  onCheckOutPress?: () => void;
}

export function AttendanceCard({ onCheckInPress, onCheckOutPress }: AttendanceCardProps) {
  const {
    todayRecord,
    geoFences,
    isCheckingIn,
    isCheckingOut,
    canCheckIn,
    canCheckOut,
    checkIn,
    checkOut,
    isWithinAnyGeoFence,
    fetchTodayAttendance,
    fetchGeoFences,
  } = useAttendanceStore();

  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [geoFenceStatus, setGeoFenceStatus] = useState<{ isWithin: boolean; name?: string }>({
    isWithin: false,
  });

  useEffect(() => {
    fetchTodayAttendance();
    fetchGeoFences();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation && geoFences.length > 0) {
      const result = isWithinAnyGeoFence(currentLocation);
      setGeoFenceStatus({
        isWithin: result.isWithin,
        name: result.geoFence?.name,
      });
    }
  }, [currentLocation, geoFences]);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleCheckIn = async () => {
    if (!geoFenceStatus.isWithin) {
      Alert.alert(
        'Outside Work Area',
        'You need to be within a designated work area to check in.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (onCheckInPress) {
      onCheckInPress();
    } else {
      if (!currentLocation) {
        Alert.alert('Error', 'Unable to get your current location. Please try again.');
        return;
      }
      try {
        await checkIn(currentLocation);
        Alert.alert('Success', 'Check-in successful!');
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Check-in failed');
      }
    }
  };

  const handleCheckOut = async () => {
    if (onCheckOutPress) {
      onCheckOutPress();
    } else {
      if (!currentLocation) {
        Alert.alert('Error', 'Unable to get your current location. Please try again.');
        return;
      }
      try {
        await checkOut(currentLocation);
        Alert.alert('Success', 'Check-out successful!');
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Check-out failed');
      }
    }
  };

  const getStatusBadge = () => {
    if (!todayRecord) {
      return <Badge label="Not Checked In" variant="default" />;
    }

    switch (todayRecord.status) {
      case 'present':
        return <Badge label="Present" variant="success" />;
      case 'late':
        return <Badge label="Late" variant="warning" />;
      case 'absent':
        return <Badge label="Absent" variant="danger" />;
      default:
        return <Badge label={todayRecord.status} variant="default" />;
    }
  };

  const getWorkDuration = () => {
    if (!todayRecord?.checkInTime) return null;

    const checkInTime = new Date(todayRecord.checkInTime);
    const endTime = todayRecord.checkOutTime
      ? new Date(todayRecord.checkOutTime)
      : new Date();
    
    const minutes = differenceInMinutes(endTime, checkInTime);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h ${mins}m`;
  };

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          <Text style={styles.timeText}>{format(new Date(), 'hh:mm a')}</Text>
        </View>
        {getStatusBadge()}
      </View>

      {/* Location Status */}
      <View style={styles.locationStatus}>
        {isGettingLocation ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <>
            <Ionicons
              name={geoFenceStatus.isWithin ? 'location' : 'location-outline'}
              size={20}
              color={geoFenceStatus.isWithin ? '#34C759' : '#FF9500'}
            />
            <Text style={[styles.locationText, geoFenceStatus.isWithin && styles.locationTextSuccess]}>
              {geoFenceStatus.isWithin
                ? `Within ${geoFenceStatus.name || 'work area'}`
                : 'Outside work area'}
            </Text>
          </>
        )}
        <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={18} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Check-in/out Times */}
      {todayRecord && (
        <View style={styles.timesContainer}>
          <View style={styles.timeItem}>
            <Ionicons name="log-in-outline" size={24} color="#34C759" />
            <View style={styles.timeItemText}>
              <Text style={styles.timeLabel}>Check In</Text>
              <Text style={styles.timeValue}>
                {todayRecord.checkInTime
                  ? format(new Date(todayRecord.checkInTime), 'hh:mm a')
                  : '--:--'}
              </Text>
            </View>
          </View>

          <View style={styles.timeDivider} />

          <View style={styles.timeItem}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <View style={styles.timeItemText}>
              <Text style={styles.timeLabel}>Check Out</Text>
              <Text style={styles.timeValue}>
                {todayRecord.checkOutTime
                  ? format(new Date(todayRecord.checkOutTime), 'hh:mm a')
                  : '--:--'}
              </Text>
            </View>
          </View>

          {getWorkDuration() && (
            <>
              <View style={styles.timeDivider} />
              <View style={styles.timeItem}>
                <Ionicons name="time-outline" size={24} color="#007AFF" />
                <View style={styles.timeItemText}>
                  <Text style={styles.timeLabel}>Duration</Text>
                  <Text style={styles.timeValue}>{getWorkDuration()}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {canCheckIn() ? (
          <Button
            title="Check In"
            onPress={handleCheckIn}
            icon="log-in-outline"
            loading={isCheckingIn}
            disabled={!geoFenceStatus.isWithin}
            fullWidth
            size="large"
          />
        ) : canCheckOut() ? (
          <Button
            title="Check Out"
            onPress={handleCheckOut}
            icon="log-out-outline"
            loading={isCheckingOut}
            variant="danger"
            fullWidth
            size="large"
          />
        ) : (
          <View style={styles.completedContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#34C759" />
            <Text style={styles.completedText}>Work day completed!</Text>
            <Text style={styles.completedSubtext}>
              Total: {todayRecord?.workDuration ? `${Math.floor(todayRecord.workDuration / 60)}h ${todayRecord.workDuration % 60}m` : '--'}
            </Text>
          </View>
        )}
      </View>

      {/* Sync indicator */}
      {todayRecord && !todayRecord.odSynced && (
        <View style={styles.syncIndicator}>
          <Ionicons name="cloud-upload-outline" size={14} color="#FF9500" />
          <Text style={styles.syncText}>Pending sync</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  timeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 4,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: '#666666',
  },
  locationTextSuccess: {
    color: '#34C759',
  },
  refreshButton: {
    padding: 4,
  },
  timesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeItemText: {
    alignItems: 'center',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 2,
  },
  timeDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
  actionContainer: {
    marginTop: 8,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 8,
  },
  completedSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  syncText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#FF9500',
  },
});

export default AttendanceCard;
