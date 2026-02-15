// Application Constants

export const APP_CONFIG = {
  name: 'Field Workforce Manager',
  version: '1.0.0',
  environment: __DEV__ ? 'development' : 'production',
} as const;

export const API_CONFIG = {
  baseUrl: __DEV__ 
    ? 'http://localhost:3000/api/v1' 
    : 'https://api.fieldworkforce.com/v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

export const WS_CONFIG = {
  url: __DEV__
    ? 'ws://localhost:3000'
    : 'wss://api.fieldworkforce.com',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
} as const;

export const LOCATION_CONFIG = {
  // Background location tracking
  backgroundTaskName: 'BACKGROUND_LOCATION_TASK',
  updateInterval: 60000, // 1 minute
  distanceFilter: 50, // meters
  accuracy: 'high' as const,
  
  // Geofencing
  defaultGeoFenceRadius: 100, // meters
  geoFenceCheckInterval: 30000, // 30 seconds
  
  // Location history
  maxLocationHistoryItems: 1000,
  locationSyncBatchSize: 50,
} as const;

export const ATTENDANCE_CONFIG = {
  // Work hours
  defaultCheckInTime: '09:00',
  defaultCheckOutTime: '18:00',
  lateThresholdMinutes: 15,
  
  // Geofencing
  requireGeoFence: true,
  maxDistanceFromGeoFence: 100, // meters
  
  // Photo requirements
  requireCheckInPhoto: true,
  requireCheckOutPhoto: false,
  photoMaxSize: 1024 * 1024 * 2, // 2MB
  photoQuality: 0.8,
} as const;

export const OFFLINE_CONFIG = {
  // Queue settings
  maxQueueSize: 1000,
  defaultMaxRetries: 5,
  retryBackoffMultiplier: 2,
  initialRetryDelay: 1000,
  maxRetryDelay: 60000,
  
  // Sync settings
  syncInterval: 60000, // 1 minute
  syncBatchSize: 20,
  
  // Storage limits
  maxOfflinePhotos: 100,
  maxOfflineReports: 50,
  
  // Conflict resolution defaults
  defaultConflictResolution: 'client_wins' as const,
} as const;

export const NOTIFICATION_CONFIG = {
  channelId: 'fwm_default',
  channelName: 'Field Workforce Manager',
  
  // Notification types
  taskChannel: 'fwm_tasks',
  attendanceChannel: 'fwm_attendance',
  alertChannel: 'fwm_alerts',
} as const;

export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  
  // Offline data
  OFFLINE_QUEUE: 'offline_queue',
  LOCATION_HISTORY: 'location_history',
  CACHED_TASKS: 'cached_tasks',
  CACHED_ATTENDANCE: 'cached_attendance',
  CACHED_REPORTS: 'cached_reports',
  
  // Settings
  APP_SETTINGS: 'app_settings',
  LAST_SYNC_TIME: 'last_sync_time',
  
  // Encryption
  ENCRYPTION_KEY: 'encryption_key',
} as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

export const CACHE_CONFIG = {
  // React Query cache times
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  
  // Refetch settings
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;

export const UI_CONFIG = {
  // Animations
  animationDuration: 300,
  
  // FlatList optimization
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 5,
  removeClippedSubviews: true,
  
  // Pull to refresh
  refreshControlTintColor: '#007AFF',
  
  // Debounce
  searchDebounce: 300,
  locationUpdateDebounce: 1000,
} as const;

export const ROLE_PERMISSIONS = {
  admin: {
    canViewAllOfficers: true,
    canAssignTasks: true,
    canApproveReports: true,
    canManageGeoFences: true,
    canViewAnalytics: true,
    canManageUsers: true,
  },
  supervisor: {
    canViewAllOfficers: true,
    canAssignTasks: true,
    canApproveReports: true,
    canManageGeoFences: false,
    canViewAnalytics: true,
    canManageUsers: false,
  },
  field_officer: {
    canViewAllOfficers: false,
    canAssignTasks: false,
    canApproveReports: false,
    canManageGeoFences: false,
    canViewAnalytics: false,
    canManageUsers: false,
  },
} as const;

export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_UNAUTHORIZED: 'AUTH_003',
  
  // Location errors
  LOCATION_PERMISSION_DENIED: 'LOC_001',
  LOCATION_UNAVAILABLE: 'LOC_002',
  LOCATION_TIMEOUT: 'LOC_003',
  GEOFENCE_OUTSIDE: 'LOC_004',
  
  // Network errors
  NETWORK_OFFLINE: 'NET_001',
  NETWORK_TIMEOUT: 'NET_002',
  NETWORK_SERVER_ERROR: 'NET_003',
  
  // Sync errors
  SYNC_CONFLICT: 'SYNC_001',
  SYNC_FAILED: 'SYNC_002',
  
  // Validation errors
  VALIDATION_FAILED: 'VAL_001',
} as const;
