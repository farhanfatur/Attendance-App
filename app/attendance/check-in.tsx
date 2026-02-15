import { Badge, Button, Card } from '@/src/components/ui';
import { ATTENDANCE_CONFIG } from '@/src/config/constants';
import { locationService } from '@/src/services/location/location-service';
import { useAttendanceStore } from '@/src/store/attendance-store';
import { GeoLocation } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckInScreen() {
  const router = useRouter();
  const { checkIn, isLoading, geoFenceStatus, validateGeoFence } = useAttendanceStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [isWithinGeoFence, setIsWithinGeoFence] = useState(false);

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
          
          // Validate geofence
          if (loc) {
            const geoFenceResult = await validateGeoFence(loc);
            setIsWithinGeoFence(geoFenceResult);
          }
        }
      } catch (error) {
        console.error('Failed to get location:', error);
        Alert.alert('Location Error', 'Unable to get your current location');
      } finally {
        setLocationLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take a check-in photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: ATTENDANCE_CONFIG.photoQuality,
        allowsEditing: false,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleCheckIn = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please wait for location to be detected');
      return;
    }

    if (ATTENDANCE_CONFIG.requireGeoFence && !isWithinGeoFence) {
      Alert.alert(
        'Outside Work Area',
        'You must be within the designated work area to check in',
        [{ text: 'OK' }]
      );
      return;
    }

    if (ATTENDANCE_CONFIG.requireCheckInPhoto && !photo) {
      Alert.alert('Photo Required', 'Please take a photo to check in');
      return;
    }

    try {
      await checkIn(location, photo || undefined);
      router.back();
    } catch (error: any) {
      Alert.alert('Check-In Failed', error.message || 'Unable to check in');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Check In',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
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

          {/* Location Status */}
          <Card style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons 
                name="location" 
                size={24} 
                color={isWithinGeoFence ? '#34C759' : '#FF3B30'} 
              />
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Location Status</Text>
                {locationLoading ? (
                  <View style={styles.locationLoading}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.locationLoadingText}>Detecting location...</Text>
                  </View>
                ) : (
                  <Badge 
                    label={isWithinGeoFence ? 'Within Work Area' : 'Outside Work Area'}
                    variant={isWithinGeoFence ? 'success' : 'danger'}
                    size="small"
                  />
                )}
              </View>
            </View>
            
            {location && (
              <Text style={styles.coordinates}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            )}
          </Card>

          {/* Photo Section */}
          <Card style={styles.photoCard}>
            <Text style={styles.photoTitle}>
              Check-In Photo {ATTENDANCE_CONFIG.requireCheckInPhoto && '*'}
            </Text>
            
            {photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={48} color="#8E8E93" />
                <Text style={styles.cameraText}>Take Photo</Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* Check In Button */}
        <View style={styles.footer}>
          <Button
            title="Check In"
            icon="log-in-outline"
            size="large"
            fullWidth
            loading={isLoading}
            disabled={locationLoading || (!isWithinGeoFence && ATTENDANCE_CONFIG.requireGeoFence)}
            onPress={handleCheckIn}
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
  locationCard: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationLoadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  coordinates: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  photoCard: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  cameraButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    minHeight: 200,
  },
  cameraText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  photoPreview: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    minHeight: 200,
    borderRadius: 12,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});
