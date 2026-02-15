// Mock API Client with Static Data

import {
    ApiResponse,
    AttendanceRecord,
    DashboardStats,
    FieldOfficerStatus,
    GeoFence,
    Report,
    ReportPhoto,
    Task,
    User,
} from '@/src/types';
import { addDays, format, subDays } from 'date-fns';

// ============ MOCK DATA ============

const mockUsers: User[] = [
  {
    id: 'user-1',
    employeeId: 'EMP001',
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1 555-123-4567',
    role: 'field_officer',
    avatar: 'https://i.pravatar.cc/150?img=1',
    department: 'Field Operations',
    supervisorId: 'user-4',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'user-2',
    employeeId: 'EMP002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 555-234-5678',
    role: 'field_officer',
    avatar: 'https://i.pravatar.cc/150?img=5',
    department: 'Field Operations',
    supervisorId: 'user-4',
    createdAt: '2023-02-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'user-3',
    employeeId: 'EMP003',
    name: 'Mike Wilson',
    email: 'mike.wilson@company.com',
    phone: '+1 555-345-6789',
    role: 'field_officer',
    avatar: 'https://i.pravatar.cc/150?img=3',
    department: 'Maintenance',
    supervisorId: 'user-4',
    createdAt: '2023-03-10T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'user-4',
    employeeId: 'SUP001',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    phone: '+1 555-456-7890',
    role: 'supervisor',
    avatar: 'https://i.pravatar.cc/150?img=9',
    department: 'Operations',
    createdAt: '2022-06-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'user-5',
    employeeId: 'ADM001',
    name: 'Admin User',
    email: 'admin@company.com',
    phone: '+1 555-567-8901',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?img=12',
    department: 'Administration',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    odId: 'od-task-1',
    odSynced: true,
    title: 'Site Inspection - Downtown Office',
    description: 'Perform routine safety inspection at the downtown office location. Check fire exits, emergency equipment, and overall building safety compliance.',
    assignedTo: 'user-1',
    assignedBy: 'user-4',
    status: 'in_progress',
    priority: 'high',
    dueDate: addDays(new Date(), 1).toISOString(),
    estimatedDuration: 120,
    address: '123 Main Street, Downtown',
    clientName: 'ABC Corporation',
    clientPhone: '+1 555-111-2222',
    checklistItems: [
      { id: 'cl-1', title: 'Check fire extinguishers', isCompleted: true, completedAt: new Date().toISOString() },
      { id: 'cl-2', title: 'Inspect emergency exits', isCompleted: true, completedAt: new Date().toISOString() },
      { id: 'cl-3', title: 'Test alarm systems', isCompleted: false },
      { id: 'cl-4', title: 'Review safety documentation', isCompleted: false },
    ],
    createdAt: subDays(new Date(), 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    odId: 'od-task-2',
    odSynced: true,
    title: 'Equipment Maintenance - Warehouse A',
    description: 'Scheduled maintenance for forklift and conveyor systems. Ensure all equipment meets safety standards.',
    assignedTo: 'user-1',
    assignedBy: 'user-4',
    status: 'pending',
    priority: 'medium',
    dueDate: addDays(new Date(), 3).toISOString(),
    estimatedDuration: 180,
    address: '456 Industrial Blvd, Warehouse District',
    clientName: 'Warehouse Solutions Inc',
    checklistItems: [
      { id: 'cl-5', title: 'Inspect forklift brakes', isCompleted: false },
      { id: 'cl-6', title: 'Check conveyor belt tension', isCompleted: false },
      { id: 'cl-7', title: 'Lubricate moving parts', isCompleted: false },
    ],
    createdAt: subDays(new Date(), 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    odId: 'od-task-3',
    odSynced: true,
    title: 'Client Meeting - Project Review',
    description: 'Meet with client to review project progress and discuss next steps.',
    assignedTo: 'user-2',
    assignedBy: 'user-4',
    status: 'assigned',
    priority: 'high',
    dueDate: new Date().toISOString(),
    estimatedDuration: 60,
    address: '789 Business Park, Suite 100',
    clientName: 'Tech Innovations Ltd',
    clientPhone: '+1 555-333-4444',
    createdAt: subDays(new Date(), 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    odId: 'od-task-4',
    odSynced: true,
    title: 'Security System Installation',
    description: 'Install new security camera system at retail location.',
    assignedTo: 'user-3',
    assignedBy: 'user-4',
    status: 'completed',
    priority: 'medium',
    dueDate: subDays(new Date(), 1).toISOString(),
    estimatedDuration: 240,
    actualDuration: 210,
    address: '321 Retail Ave',
    clientName: 'Quick Mart',
    completedAt: subDays(new Date(), 1).toISOString(),
    createdAt: subDays(new Date(), 5).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString(),
  },
];

const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    odId: 'od-att-1',
    odSynced: true,
    userId: 'user-1',
    date: format(new Date(), 'yyyy-MM-dd'),
    checkInTime: new Date(new Date().setHours(8, 55, 0)).toISOString(),
    checkInLocation: { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() },
    status: 'present',
    isWithinGeoFence: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'att-2',
    odId: 'od-att-2',
    odSynced: true,
    userId: 'user-1',
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    checkInTime: subDays(new Date(), 1).toISOString(),
    checkOutTime: subDays(new Date(), 1).toISOString(),
    status: 'present',
    workDuration: 480,
    totalHours: 8,
    isWithinGeoFence: true,
    createdAt: subDays(new Date(), 1).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString(),
  },
  {
    id: 'att-3',
    odId: 'od-att-3',
    odSynced: true,
    userId: 'user-1',
    date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    checkInTime: subDays(new Date(), 2).toISOString(),
    checkOutTime: subDays(new Date(), 2).toISOString(),
    status: 'late',
    workDuration: 450,
    totalHours: 7.5,
    isWithinGeoFence: true,
    createdAt: subDays(new Date(), 2).toISOString(),
    updatedAt: subDays(new Date(), 2).toISOString(),
  },
];

const mockReports: Report[] = [
  {
    id: 'report-1',
    odId: 'od-report-1',
    odSynced: true,
    userId: 'user-1',
    type: 'inspection',
    title: 'Site Inspection Report - Downtown Office',
    description: 'Completed routine safety inspection. All areas meet compliance standards.',
    status: 'approved',
    photos: [
      { id: 'p1', uri: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400', timestamp: new Date().toISOString(), isSynced: true },
      { id: 'p2', uri: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400', timestamp: new Date().toISOString(), isSynced: true },
    ],
    location: { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() },
    address: '123 Main Street, Downtown',
    taskId: 'task-1',
    submittedAt: subDays(new Date(), 1).toISOString(),
    reviewedBy: 'user-4',
    reviewedAt: new Date().toISOString(),
    createdAt: subDays(new Date(), 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'report-2',
    odId: 'od-report-2',
    odSynced: true,
    userId: 'user-1',
    type: 'daily',
    title: 'Daily Activity Report',
    description: 'Summary of daily activities and tasks completed.',
    status: 'submitted',
    photos: [],
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'report-3',
    odId: 'od-report-3',
    odSynced: false,
    userId: 'user-1',
    type: 'incident',
    title: 'Minor Equipment Issue',
    description: 'Reported minor issue with warehouse equipment. Requires maintenance.',
    status: 'draft',
    photos: [
      { id: 'p3', uri: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400', timestamp: new Date().toISOString(), isSynced: false },
    ],
    location: { latitude: 37.7849, longitude: -122.4094, timestamp: Date.now() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockGeoFences: GeoFence[] = [
  {
    id: 'geo-1',
    name: 'Main Office',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 200,
    type: 'office',
    isActive: true,
  },
  {
    id: 'geo-2',
    name: 'Warehouse A',
    latitude: 37.7849,
    longitude: -122.4094,
    radius: 150,
    type: 'client',
    isActive: true,
  },
  {
    id: 'geo-3',
    name: 'Downtown Client',
    latitude: 37.7649,
    longitude: -122.4294,
    radius: 100,
    type: 'client',
    isActive: true,
  },
];

const mockDashboardStats: DashboardStats = {
  totalFieldOfficers: 15,
  activeToday: 12,
  onLeave: 2,
  pendingTasks: 8,
  completedTasksToday: 5,
  attendanceRate: 0.87,
  averageWorkHours: 7.5,
};

const mockOfficerStatuses: FieldOfficerStatus[] = [
  {
    userId: 'user-1',
    user: mockUsers[0],
    isOnline: true,
    lastLocation: { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() },
    lastLocationUpdate: new Date().toISOString(),
    batteryLevel: 78,
    currentTask: mockTasks[0],
    todayAttendance: mockAttendanceRecords[0],
  },
  {
    userId: 'user-2',
    user: mockUsers[1],
    isOnline: true,
    lastLocation: { latitude: 37.7849, longitude: -122.4094, timestamp: Date.now() },
    lastLocationUpdate: new Date().toISOString(),
    batteryLevel: 45,
    currentTask: mockTasks[2],
  },
  {
    userId: 'user-3',
    user: mockUsers[2],
    isOnline: false,
    lastLocation: { latitude: 37.7649, longitude: -122.4294, timestamp: Date.now() - 3600000 },
    lastLocationUpdate: subDays(new Date(), 0).toISOString(),
    batteryLevel: 92,
  },
];

// ============ MOCK API CLIENT ============

// Simulate network delay
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Current logged in user (changes based on login)
let currentUser: User | null = null;

class MockApiClient {
  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, _params?: Record<string, string>): Promise<ApiResponse<T>> {
    await simulateDelay(300);
    
    // Route to appropriate handler
    if (endpoint === '/auth/me' || endpoint === '/user/profile') {
      return this.getCurrentUser() as ApiResponse<T>;
    }
    if (endpoint === '/dashboard/stats') {
      return { success: true, data: mockDashboardStats as T };
    }
    if (endpoint === '/officers/status') {
      return { success: true, data: mockOfficerStatuses as T };
    }
    if (endpoint === '/tasks' || endpoint.startsWith('/tasks?')) {
      return { success: true, data: this.getTasksForUser() as T };
    }
    if (endpoint.startsWith('/tasks/')) {
      const id = endpoint.split('/')[2];
      return this.getTaskById(id) as ApiResponse<T>;
    }
    if (endpoint === '/attendance/today') {
      return { success: true, data: this.getTodayAttendance() as T };
    }
    if (endpoint === '/attendance/history') {
      return { success: true, data: mockAttendanceRecords as T };
    }
    if (endpoint === '/geofences') {
      return { success: true, data: mockGeoFences as T };
    }
    if (endpoint === '/reports') {
      return { success: true, data: this.getReportsForUser() as T };
    }
    if (endpoint.startsWith('/reports/')) {
      const id = endpoint.split('/')[2];
      return this.getReportById(id) as ApiResponse<T>;
    }
    if (endpoint === '/team' || endpoint === '/officers') {
      return { success: true, data: mockUsers.filter(u => u.role === 'field_officer') as T };
    }
    
    return { success: true, data: null as T };
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    await simulateDelay(500);
    
    if (endpoint === '/auth/login') {
      return this.handleLogin(data) as ApiResponse<T>;
    }
    if (endpoint === '/auth/logout') {
      currentUser = null;
      return { success: true, data: null as T };
    }
    if (endpoint === '/auth/forgot-password') {
      return { success: true, data: { message: 'Password reset email sent' } as T };
    }
    if (endpoint === '/attendance/check-in') {
      return this.handleCheckIn(data) as ApiResponse<T>;
    }
    if (endpoint === '/attendance/check-out') {
      return this.handleCheckOut(data) as ApiResponse<T>;
    }
    if (endpoint === '/reports/submit' || endpoint === '/reports') {
      return this.handleSubmitReport(data) as ApiResponse<T>;
    }
    if (endpoint === '/tasks/update') {
      return this.handleUpdateTask(data) as ApiResponse<T>;
    }
    
    return { success: true, data: data as T };
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    await simulateDelay(400);
    
    if (endpoint.startsWith('/tasks/')) {
      return this.handleUpdateTask(data) as ApiResponse<T>;
    }
    if (endpoint.startsWith('/reports/')) {
      return { success: true, data: data as T };
    }
    
    return { success: true, data: data as T };
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.put<T>(endpoint, data);
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    await simulateDelay(300);
    return { success: true, data: null as T };
  }

  /**
   * File upload (mock)
   */
  async uploadFile<T>(
    endpoint: string, 
    file: { uri: string; name: string; type: string }, 
    additionalData?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    await simulateDelay(800); // Simulate longer upload time
    
    // Mock successful upload response
    const mockResponse = {
      url: `https://mock-storage.example.com/${file.name}`,
      id: 'file-' + Date.now(),
      ...additionalData,
    };
    
    return { success: true, data: mockResponse as T };
  }

  // ============ PRIVATE HANDLERS ============

  private getCurrentUser(): ApiResponse<User> {
    if (currentUser) {
      return { success: true, data: currentUser };
    }
    // Default to field officer for demo
    return { success: true, data: mockUsers[0] };
  }

  private handleLogin(data?: Record<string, unknown>): ApiResponse<{ user: User; token: string; refreshToken: string }> {
    const email = data?.email as string;
    
    // Find user by email or use demo accounts
    let user: User | undefined;
    
    if (email === 'admin@company.com' || email === 'admin') {
      user = mockUsers.find(u => u.role === 'admin');
    } else if (email === 'supervisor@company.com' || email === 'supervisor') {
      user = mockUsers.find(u => u.role === 'supervisor');
    } else if (email === 'officer@company.com' || email === 'officer') {
      user = mockUsers.find(u => u.role === 'field_officer');
    } else {
      user = mockUsers.find(u => u.email === email) || mockUsers[0];
    }

    if (user) {
      currentUser = user;
      return {
        success: true,
        data: {
          user,
          token: 'mock-jwt-token-' + user.id,
          refreshToken: 'mock-refresh-token-' + user.id,
        },
      };
    }

    return {
      success: false,
      error: { code: 'AUTH_FAILED', message: 'Invalid credentials' },
    };
  }

  private getTasksForUser(): Task[] {
    if (!currentUser) return mockTasks;
    
    if (currentUser.role === 'field_officer') {
      return mockTasks.filter(t => t.assignedTo === currentUser!.id);
    }
    
    // Supervisors and admins see all tasks
    return mockTasks;
  }

  private getTaskById(id: string): ApiResponse<Task> {
    const task = mockTasks.find(t => t.id === id);
    if (task) {
      return { success: true, data: task };
    }
    return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };
  }

  private getTodayAttendance(): AttendanceRecord | null {
    const today = format(new Date(), 'yyyy-MM-dd');
    const userId = currentUser?.id || 'user-1';
    return mockAttendanceRecords.find(a => a.date === today && a.userId === userId) || null;
  }

  private getReportsForUser(): Report[] {
    if (!currentUser) return mockReports;
    
    if (currentUser.role === 'field_officer') {
      return mockReports.filter(r => r.userId === currentUser!.id);
    }
    
    return mockReports;
  }

  private getReportById(id: string): ApiResponse<Report> {
    const report = mockReports.find(r => r.id === id);
    if (report) {
      return { success: true, data: report };
    }
    return { success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } };
  }

  private handleCheckIn(data?: Record<string, unknown>): ApiResponse<AttendanceRecord> {
    const newRecord: AttendanceRecord = {
      id: 'att-new-' + Date.now(),
      odId: 'od-att-new-' + Date.now(),
      odSynced: true,
      userId: currentUser?.id || 'user-1',
      date: format(new Date(), 'yyyy-MM-dd'),
      checkInTime: new Date().toISOString(),
      checkInLocation: data?.location as any,
      checkInPhoto: data?.photo as string,
      status: 'present',
      isWithinGeoFence: true,
      notes: data?.notes as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockAttendanceRecords.unshift(newRecord);
    return { success: true, data: newRecord };
  }

  private handleCheckOut(data?: Record<string, unknown>): ApiResponse<AttendanceRecord> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const userId = currentUser?.id || 'user-1';
    const record = mockAttendanceRecords.find(a => a.date === today && a.userId === userId);
    
    if (record) {
      record.checkOutTime = new Date().toISOString();
      record.checkOutLocation = data?.location as any;
      record.checkOutPhoto = data?.photo as string;
      record.workDuration = 480; // Mock 8 hours
      record.totalHours = 8;
      record.updatedAt = new Date().toISOString();
      return { success: true, data: record };
    }
    
    return { success: false, error: { code: 'NOT_FOUND', message: 'No check-in record found' } };
  }

  private handleSubmitReport(data?: Record<string, unknown>): ApiResponse<Report> {
    const newReport: Report = {
      id: 'report-new-' + Date.now(),
      odId: 'od-report-new-' + Date.now(),
      odSynced: true,
      userId: currentUser?.id || 'user-1',
      type: (data?.type as Report['type']) || 'daily',
      title: (data?.title as string) || 'New Report',
      description: (data?.description as string) || '',
      status: 'submitted',
      photos: (data?.photos as ReportPhoto[]) || [],
      location: data?.location as any,
      taskId: data?.taskId as string,
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockReports.unshift(newReport);
    return { success: true, data: newReport };
  }

  private handleUpdateTask(data?: Record<string, unknown>): ApiResponse<Task> {
    const taskId = data?.id as string || data?.taskId as string;
    const task = mockTasks.find(t => t.id === taskId);
    
    if (task) {
      Object.assign(task, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return { success: true, data: task };
    }
    
    return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };
  }
}

// Export singleton instance
export const apiClient = new MockApiClient();
export default apiClient;

// Export helper to get current mock user (for debugging)
export const getCurrentMockUser = () => currentUser;
export const setCurrentMockUser = (user: User | null) => { currentUser = user; };
