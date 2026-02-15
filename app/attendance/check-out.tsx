import { Badge, Button, Card } from '@/src/components/ui';
import { locationService } from '@/src/services/location/location-service';
import { useAttendanceStore } from '@/src/store/attendance-store';
import { GeoLocation } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { differenceInMinutes, format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckOutScreen() {
  const router = useRouter();
  const { todayRecord, checkOut, isLoading } = useAttendanceStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [notes, setNotes] = useState('');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get current location
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const hasPermission = await locationService.requestPermissions();
        if (hasPermission) {
          const loc = await locationService.getCurrentLocation();
          setLocation(loc);
        }
      } catch (error) {
        console.error('Failed to get location:', error);
      } finally {
        setLocationLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const getWorkDuration = () => {
    if (!todayRecord?.checkInTime) return { hours: 0, minutes: 0 };
    
    const checkInTime = new Date(todayRecord.checkInTime);
    const totalMinutes = differenceInMinutes(currentTime, checkInTime);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes };
  };

  const handleCheckOut = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please wait for location to be detected');
      return;
    }

    try {
      await checkOut(location, undefined, notes || undefined);
      router.back();
    } catch (error: any) {
      Alert.alert('Check-Out Failed', error.message || 'Unable to check out');
    }
  };

  const duration = getWorkDuration();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Check Out',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Time Display */}
          <View style={styles.timeCard}>
            <Text style={styles.currentTime}>
              {format(currentTime, 'h:mm:ss')}
            </Text>
            <Text style={styles.amPm}>{format(currentTime, 'a')}</Text>
            <Text style={styles.currentDate}>
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </Text>
          </View>

          {/* Work Summary */}
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Summary</Text>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="log-in-outline" size={20} color="#34C759" />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Check In</Text>
                  <Text style={styles.summaryValue}>
                    {todayRecord?.checkInTime 
                      ? format(new Date(todayRecord.checkInTime), 'h:mm a')
                      : '--:--'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryItem}>
                <Ionicons name="log-out-outline" size={20} color="#FF9500" />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Check Out</Text>
                  <Text style={styles.summaryValue}>
                    {format(currentTime, 'h:mm a')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Duration */}
            <View style={styles.durationSection}>
              <Ionicons name="time-outline" size={24} color="#007AFF" />
              <View style={styles.durationContent}>
                <Text style={styles.durationLabel}>Working Hours</Text>
                <Text style={styles.durationValue}>
                  {duration.hours}h {duration.minutes}m
                </Text>
              </View>
              <Badge 
                label={duration.hours >= 8 ? 'Full Day' : 'Partial'}
                variant={duration.hours >= 8 ? 'success' : 'warning'}
              />
            </View>
          </Card>

          {/* Location Status */}
          <Card style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.locationTitle}>Check Out Location</Text>
              {locationLoading && (
                <Text style={styles.locationLoading}>Detecting...</Text>
              )}
            </View>
            {location && (
              <Text style={styles.coordinates}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            )}
          </Card>

          {/* Notes Section */}
          <Card style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes about today's work..."
              placeholderTextColor="#8E8E93"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>
        </ScrollView>

        {/* Check Out Button */}
        <View style={styles.footer}>
          <Button
            title="Check Out"
            icon="log-out-outline"
            size="large"
            fullWidth
            loading={isLoading}
            disabled={locationLoading}
            onPress={handleCheckOut}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timeCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
  },
  currentTime: {
    fontSize: 56,
    fontWeight: '200',
    color: '#1C1C1E',
  },
  amPm: {
    fontSize: 24,
    fontWeight: '300',
    color: '#8E8E93',
    marginTop: -8,
  },
  currentDate: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 12,
  },
  durationContent: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  durationValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  locationCard: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  locationLoading: {
    fontSize: 12,
    color: '#8E8E93',
  },
  coordinates: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  notesCard: {
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1C1C1E',
    minHeight: 100,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});
