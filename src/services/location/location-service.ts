// Background Location Tracking Service

import { LOCATION_CONFIG, STORAGE_KEYS } from '@/src/config/constants';
import { GeoLocation, LocationHistory } from '@/src/types';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { v4 as uuidv4 } from 'uuid';
import { offlineQueue } from '../offline/queue-manager';
import { encryptedStorage } from '../storage/encrypted-storage';
import { wsService } from '../websocket/ws-service';

// Define background task
TaskManager.defineTask(LOCATION_CONFIG.backgroundTaskName, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    
    for (const location of locations) {
      await locationService.handleBackgroundLocation(location);
    }
  }
});

class LocationService {
  private isTracking = false;
  private lastLocation: GeoLocation | null = null;
  private locationHistory: LocationHistory[] = [];
  private watchSubscription: Location.LocationSubscription | null = null;
  private locationListeners: Set<(location: GeoLocation) => void> = new Set();

  /**
   * Initialize location service
   */
  async initialize(): Promise<void> {
    try {
      // Load cached location history
      const cached = await encryptedStorage.getObject<LocationHistory[]>(
        STORAGE_KEYS.LOCATION_HISTORY
      );
      if (cached) {
        this.locationHistory = cached;
      }
    } catch (error) {
      console.error('Failed to initialize location service:', error);
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<{
    foreground: boolean;
    background: boolean;
  }> {
    const foreground = await Location.requestForegroundPermissionsAsync();
    let background = { granted: false };

    if (foreground.granted) {
      background = await Location.requestBackgroundPermissionsAsync();
    }

    return {
      foreground: foreground.granted,
      background: background.granted,
    };
  }

  /**
   * Check if location permissions are granted
   */
  async checkPermissions(): Promise<{
    foreground: boolean;
    background: boolean;
  }> {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();

    return {
      foreground: foreground.granted,
      background: background.granted,
    };
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<GeoLocation | null> {
    try {
      const permissions = await this.checkPermissions();
      if (!permissions.foreground) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geoLocation: GeoLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        altitude: location.coords.altitude ?? undefined,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
        timestamp: location.timestamp,
      };

      this.lastLocation = geoLocation;
      return geoLocation;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  /**
   * Start foreground location tracking
   */
  async startForegroundTracking(): Promise<void> {
    if (this.watchSubscription) {
      return;
    }

    const permissions = await this.checkPermissions();
    if (!permissions.foreground) {
      throw new Error('Location permission not granted');
    }

    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: LOCATION_CONFIG.distanceFilter,
        timeInterval: LOCATION_CONFIG.updateInterval,
      },
      (location) => {
        this.handleForegroundLocation(location);
      }
    );

    this.isTracking = true;
  }

  /**
   * Stop foreground location tracking
   */
  stopForegroundTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    this.isTracking = false;
  }

  /**
   * Start background location tracking
   */
  async startBackgroundTracking(): Promise<void> {
    const permissions = await this.checkPermissions();
    if (!permissions.background) {
      throw new Error('Background location permission not granted');
    }

    const isTaskDefined = await TaskManager.isTaskDefined(
      LOCATION_CONFIG.backgroundTaskName
    );

    if (!isTaskDefined) {
      console.error('Background task not defined');
      return;
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_CONFIG.backgroundTaskName
    );

    if (!hasStarted) {
      await Location.startLocationUpdatesAsync(LOCATION_CONFIG.backgroundTaskName, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: LOCATION_CONFIG.distanceFilter,
        timeInterval: LOCATION_CONFIG.updateInterval,
        foregroundService: {
          notificationTitle: 'Location Tracking Active',
          notificationBody: 'Your location is being tracked for work purposes',
          notificationColor: '#007AFF',
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });
    }

    this.isTracking = true;
  }

  /**
   * Stop background location tracking
   */
  async stopBackgroundTracking(): Promise<void> {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_CONFIG.backgroundTaskName
    );

    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_CONFIG.backgroundTaskName);
    }

    this.isTracking = false;
  }

  /**
   * Handle foreground location update
   */
  private handleForegroundLocation(location: Location.LocationObject): void {
    const geoLocation: GeoLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
      altitude: location.coords.altitude ?? undefined,
      heading: location.coords.heading ?? undefined,
      speed: location.coords.speed ?? undefined,
      timestamp: location.timestamp,
    };

    this.lastLocation = geoLocation;
    this.notifyListeners(geoLocation);
    this.saveLocationToHistory(geoLocation);

    // Send via WebSocket if connected
    wsService.sendLocationUpdate({
      latitude: geoLocation.latitude,
      longitude: geoLocation.longitude,
      accuracy: geoLocation.accuracy,
      timestamp: geoLocation.timestamp,
    });
  }

  /**
   * Handle background location update
   */
  async handleBackgroundLocation(location: Location.LocationObject): Promise<void> {
    const geoLocation: GeoLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
      altitude: location.coords.altitude ?? undefined,
      heading: location.coords.heading ?? undefined,
      speed: location.coords.speed ?? undefined,
      timestamp: location.timestamp,
    };

    this.lastLocation = geoLocation;
    await this.saveLocationToHistory(geoLocation);

    // Queue for offline sync
    await offlineQueue.enqueue('location_update', {
      location: geoLocation,
      timestamp: Date.now(),
    });
  }

  /**
   * Save location to history
   */
  private async saveLocationToHistory(location: GeoLocation): Promise<void> {
    const historyItem: LocationHistory = {
      id: uuidv4(),
      userId: '', // Will be set from auth state
      location,
      timestamp: Date.now(),
    } as unknown as LocationHistory;

    this.locationHistory.push(historyItem);

    // Limit history size
    if (this.locationHistory.length > LOCATION_CONFIG.maxLocationHistoryItems) {
      this.locationHistory = this.locationHistory.slice(-LOCATION_CONFIG.maxLocationHistoryItems);
    }

    // Persist to storage
    await encryptedStorage.setObject(STORAGE_KEYS.LOCATION_HISTORY, this.locationHistory);
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if location is within geofence
   */
  isWithinGeoFence(
    location: GeoLocation,
    fenceLat: number,
    fenceLon: number,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      fenceLat,
      fenceLon
    );
    return distance <= radiusMeters;
  }

  /**
   * Get last known location
   */
  getLastLocation(): GeoLocation | null {
    return this.lastLocation;
  }

  /**
   * Get location history
   */
  getLocationHistory(): LocationHistory[] {
    return [...this.locationHistory];
  }

  /**
   * Clear location history
   */
  async clearLocationHistory(): Promise<void> {
    this.locationHistory = [];
    await encryptedStorage.removeItem(STORAGE_KEYS.LOCATION_HISTORY);
  }

  /**
   * Check if tracking is active
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: (location: GeoLocation) => void): () => void {
    this.locationListeners.add(callback);
    return () => {
      this.locationListeners.delete(callback);
    };
  }

  /**
   * Notify location listeners
   */
  private notifyListeners(location: GeoLocation): void {
    this.locationListeners.forEach(callback => callback(location));
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address) {
        const parts = [
          address.street,
          address.city,
          address.region,
          address.country,
        ].filter(Boolean);
        return parts.join(', ');
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }
}

export const locationService = new LocationService();
export default locationService;
