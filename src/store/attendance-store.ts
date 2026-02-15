// Zustand Store - Attendance State Management

import { ATTENDANCE_CONFIG, STORAGE_KEYS } from '@/src/config/constants';
import { apiClient } from '@/src/services/api/client';
import { locationService } from '@/src/services/location/location-service';
import { offlineQueue } from '@/src/services/offline/queue-manager';
import { encryptedStorage } from '@/src/services/storage/encrypted-storage';
import { AttendanceRecord, GeoFence, GeoLocation } from '@/src/types';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

interface AttendanceState {
  todayRecord: AttendanceRecord | null;
  history: AttendanceRecord[];
  recentRecords: AttendanceRecord[];
  geoFences: GeoFence[];
  geoFenceStatus: 'checking' | 'within' | 'outside' | 'unknown';
  isLoading: boolean;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
  error: string | null;
}

interface AttendanceActions {
  // Fetching
  fetchTodayAttendance: () => Promise<void>;
  fetchHistory: (month?: Date) => Promise<void>;
  fetchRecentAttendance: (days?: number) => Promise<void>;
  fetchGeoFences: () => Promise<void>;
  
  // Check in/out - updated signatures
  checkIn: (location: GeoLocation, photo?: string, notes?: string) => Promise<AttendanceRecord>;
  checkOut: (location: GeoLocation, photo?: string, notes?: string) => Promise<AttendanceRecord>;
  
  // Geofence validation
  validateGeoFence: (location: GeoLocation) => Promise<boolean>;
  
  // Utilities
  isWithinAnyGeoFence: (location: GeoLocation) => { isWithin: boolean; geoFence?: GeoFence };
  canCheckIn: () => boolean;
  canCheckOut: () => boolean;
  
  // State
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AttendanceStore = AttendanceState & AttendanceActions;

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  // Initial state
  todayRecord: null,
  history: [],
  recentRecords: [],
  geoFences: [],
  geoFenceStatus: 'unknown',
  isLoading: false,
  isCheckingIn: false,
  isCheckingOut: false,
  error: null,

  // Fetch today's attendance
  fetchTodayAttendance: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await apiClient.get<AttendanceRecord>(`/attendance/today`, {
        date: today,
      });

      if (response.success && response.data) {
        set({ todayRecord: response.data });
        // Cache locally
        await encryptedStorage.setObject(STORAGE_KEYS.CACHED_ATTENDANCE, response.data);
      }
    } catch (error) {
      // Try to load from cache
      const cached = await encryptedStorage.getObject<AttendanceRecord>(
        STORAGE_KEYS.CACHED_ATTENDANCE
      );
      if (cached && cached.date === format(new Date(), 'yyyy-MM-dd')) {
        set({ todayRecord: cached });
      }
      console.error('Failed to fetch today attendance:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch attendance history for a month
  fetchHistory: async (month: Date = new Date()) => {
    set({ isLoading: true });
    
    try {
      const start = format(startOfMonth(month), 'yyyy-MM-dd');
      const end = format(endOfMonth(month), 'yyyy-MM-dd');
      
      const response = await apiClient.get<AttendanceRecord[]>('/attendance/history', {
        startDate: start,
        endDate: end,
      });

      if (response.success && response.data) {
        set({ history: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch recent attendance records
  fetchRecentAttendance: async (days = 7) => {
    set({ isLoading: true });
    
    try {
      const response = await apiClient.get<AttendanceRecord[]>('/attendance/recent', {
        days: days.toString(),
      });

      if (response.success && response.data) {
        set({ recentRecords: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch recent attendance:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch geofences
  fetchGeoFences: async () => {
    try {
      const response = await apiClient.get<GeoFence[]>('/geofences');

      if (response.success && response.data) {
        set({ geoFences: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch geofences:', error);
    }
  },

  // Validate geofence
  validateGeoFence: async (location: GeoLocation): Promise<boolean> => {
    set({ geoFenceStatus: 'checking' });
    
    try {
      // Ensure geofences are loaded
      if (get().geoFences.length === 0) {
        await get().fetchGeoFences();
      }
      
      const result = get().isWithinAnyGeoFence(location);
      set({ geoFenceStatus: result.isWithin ? 'within' : 'outside' });
      return result.isWithin;
    } catch (error) {
      set({ geoFenceStatus: 'unknown' });
      return false;
    }
  },

  // Check in with location
  checkIn: async (location: GeoLocation, photo?: string, notes?: string) => {
    set({ isCheckingIn: true, error: null });
    
    try {
      // Check if within geofence
      const geoFenceCheck = get().isWithinAnyGeoFence(location);
      if (ATTENDANCE_CONFIG.requireGeoFence && !geoFenceCheck.isWithin) {
        throw new Error('You must be within a designated work area to check in');
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();
      const odId = uuidv4();

      // Determine if late
      const checkInTime = new Date();
      const [defaultHour, defaultMinute] = ATTENDANCE_CONFIG.defaultCheckInTime.split(':');
      const expectedTime = new Date();
      expectedTime.setHours(parseInt(defaultHour), parseInt(defaultMinute), 0);
      
      const lateMinutes = Math.floor(
        (checkInTime.getTime() - expectedTime.getTime()) / (1000 * 60)
      );
      const isLate = lateMinutes > ATTENDANCE_CONFIG.lateThresholdMinutes;

      const record: AttendanceRecord = {
        id: '',
        odId,
        odSynced: false,
        userId: '',
        date: today,
        checkInTime: now,
        checkInLocation: location,
        checkInPhoto: photo,
        checkInGeoFenceId: geoFenceCheck.geoFence?.id,
        status: isLate ? 'late' : 'present',
        isWithinGeoFence: geoFenceCheck.isWithin,
        notes,
        createdAt: now,
        updatedAt: now,
      };

      // Try to send to server
      try {
        const response = await apiClient.post<AttendanceRecord>('/attendance/check-in', {
          location,
          photo,
          notes,
          geoFenceId: geoFenceCheck.geoFence?.id,
          odId,
        });

        if (response.success && response.data) {
          const serverRecord = { ...response.data, odSynced: true };
          set({ todayRecord: serverRecord, geoFenceStatus: 'within' });
          await encryptedStorage.setObject(STORAGE_KEYS.CACHED_ATTENDANCE, serverRecord);
          return serverRecord;
        }
      } catch {
        // Queue for offline sync
        await offlineQueue.enqueue('attendance_check_in', {
          ...record,
          location,
          photo,
          notes,
        }, {
          priority: 100,
          conflictResolution: 'client_wins',
        });
      }

      // Save locally
      set({ todayRecord: record, geoFenceStatus: geoFenceCheck.isWithin ? 'within' : 'outside' });
      await encryptedStorage.setObject(STORAGE_KEYS.CACHED_ATTENDANCE, record);
      
      return record;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check-in failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isCheckingIn: false });
    }
  },

  // Check out with location
  checkOut: async (location: GeoLocation, photo?: string, notes?: string) => {
    set({ isCheckingOut: true, error: null });
    
    try {
      const todayRecord = get().todayRecord;
      if (!todayRecord || !todayRecord.checkInTime) {
        throw new Error('You must check in first before checking out');
      }

      // Check if within geofence (optional for checkout)
      const geoFenceCheck = get().isWithinAnyGeoFence(location);

      const now = new Date().toISOString();
      const checkInTime = new Date(todayRecord.checkInTime);
      const workDuration = Math.floor((Date.now() - checkInTime.getTime()) / (1000 * 60));

      const updatedRecord: AttendanceRecord = {
        ...todayRecord,
        checkOutTime: now,
        checkOutLocation: location,
        checkOutPhoto: photo,
        checkOutGeoFenceId: geoFenceCheck.geoFence?.id,
        workDuration,
        notes: notes || todayRecord.notes,
        updatedAt: now,
        odSynced: false,
      };

      // Try to send to server
      try {
        const response = await apiClient.post<AttendanceRecord>('/attendance/check-out', {
          location,
          photo,
          notes,
          geoFenceId: geoFenceCheck.geoFence?.id,
          odId: todayRecord.odId,
        });

        if (response.success && response.data) {
          const serverRecord = { ...response.data, odSynced: true };
          set({ todayRecord: serverRecord });
          await encryptedStorage.setObject(STORAGE_KEYS.CACHED_ATTENDANCE, serverRecord);
          return serverRecord;
        }
      } catch {
        // Queue for offline sync
        await offlineQueue.enqueue('attendance_check_out', {
          ...updatedRecord,
          location,
          photo,
          notes,
        }, {
          priority: 100,
          conflictResolution: 'client_wins',
        });
      }

      // Save locally
      set({ todayRecord: updatedRecord });
      await encryptedStorage.setObject(STORAGE_KEYS.CACHED_ATTENDANCE, updatedRecord);
      
      return updatedRecord;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check-out failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isCheckingOut: false });
    }
  },

  // Check if location is within any geofence
  isWithinAnyGeoFence: (location: GeoLocation) => {
    const geoFences = get().geoFences.filter(gf => gf.isActive);
    
    for (const geoFence of geoFences) {
      if (locationService.isWithinGeoFence(
        location,
        geoFence.latitude,
        geoFence.longitude,
        geoFence.radius
      )) {
        return { isWithin: true, geoFence };
      }
    }
    
    return { isWithin: false };
  },

  // Check if can check in
  canCheckIn: () => {
    const todayRecord = get().todayRecord;
    return !todayRecord?.checkInTime;
  },

  // Check if can check out
  canCheckOut: () => {
    const todayRecord = get().todayRecord;
    return Boolean(todayRecord?.checkInTime && !todayRecord?.checkOutTime);
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useAttendanceStore;
