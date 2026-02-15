// Core Types for Field Workforce Management System

// ============ User & Auth Types ============
export type UserRole = 'admin' | 'supervisor' | 'field_officer';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  department: string;
  supervisorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============ Location Types ============
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeoFence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  type: 'office' | 'client' | 'custom';
  isActive: boolean;
}

export interface LocationHistory {
  id: string;
  userId: string;
  location: GeoLocation;
  batteryLevel?: number;
  networkType?: string;
  syncedAt?: string;
}

// ============ Attendance Types ============
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'wfh';
export type CheckType = 'check_in' | 'check_out';

export interface AttendanceRecord {
  id: string;
  odId: string; // offline id
  odSynced: boolean; // synced offline data
  userId: string;
  date: string;
  checkInTime?: string;
  checkInLocation?: GeoLocation;
  checkInPhoto?: string;
  checkInGeoFenceId?: string;
  checkOutTime?: string;
  checkOutLocation?: GeoLocation;
  checkOutPhoto?: string;
  checkOutGeoFenceId?: string;
  status: AttendanceStatus;
  workDuration?: number; // in minutes
  totalHours?: number; // calculated hours for display
  notes?: string;
  isWithinGeoFence: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ Task Types ============
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  odId: string;
  odSynced: boolean;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedDuration?: number; // in minutes
  actualDuration?: number;
  location?: GeoLocation;
  address?: string;
  clientName?: string;
  clientPhone?: string;
  attachments?: string[];
  checklistItems?: TaskChecklistItem[];
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  userId: string;
  type: 'status_change' | 'note' | 'photo' | 'location' | 'checklist';
  oldValue?: string;
  newValue?: string;
  attachments?: string[];
  location?: GeoLocation;
  createdAt: string;
}

// ============ Report Types ============
export type ReportType = 'daily' | 'incident' | 'inspection' | 'client_visit' | 'custom';
export type ReportStatus = 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';

export interface Report {
  id: string;
  odId: string;
  odSynced: boolean;
  userId: string;
  type: ReportType;
  title: string;
  description: string;
  status: ReportStatus;
  photos: ReportPhoto[];
  location?: GeoLocation;
  address?: string;
  taskId?: string;
  formData?: Record<string, unknown>;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportPhoto {
  id: string;
  uri: string;
  localUri?: string;
  caption?: string;
  location?: GeoLocation;
  timestamp: string;
  isSynced: boolean;
}

// ============ Offline Queue Types ============
export type OfflineActionType = 
  | 'attendance_check_in'
  | 'attendance_check_out'
  | 'task_update'
  | 'report_submit'
  | 'location_update'
  | 'photo_upload';

export type ConflictResolution = 'client_wins' | 'server_wins' | 'merge' | 'manual';

export interface OfflineQueueItem {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: number;
  conflictResolution: ConflictResolution;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  errorMessage?: string;
  lastAttempt?: number;
  serverVersion?: number;
  localVersion: number;
}

// ============ Notification Types ============
export type NotificationType = 
  | 'task_assigned'
  | 'task_updated'
  | 'attendance_reminder'
  | 'report_reviewed'
  | 'geofence_alert'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  receivedAt: string;
}

// ============ Dashboard Types ============
export interface DashboardStats {
  totalFieldOfficers: number;
  activeToday: number;
  onLeave: number;
  pendingTasks: number;
  completedTasksToday: number;
  averageWorkHours: number;
  attendanceRate: number;
}

export interface FieldOfficerStatus {
  userId: string;
  user: User;
  lastLocation?: GeoLocation;
  lastLocationUpdate?: string;
  currentTask?: Task;
  todayAttendance?: AttendanceRecord;
  isOnline: boolean;
  batteryLevel?: number;
}

// ============ API Response Types ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ WebSocket Types ============
export type WSEventType = 
  | 'task_update'
  | 'location_update'
  | 'attendance_update'
  | 'notification'
  | 'officer_status';

export interface WSMessage {
  type: WSEventType;
  payload: Record<string, unknown>;
  timestamp: number;
}
