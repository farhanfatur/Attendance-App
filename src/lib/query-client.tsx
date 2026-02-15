// React Query Configuration with Offline Support

import { QueryClient, QueryClientProvider as RQProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { CACHE_CONFIG } from '@/src/config/constants';

// Create query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_CONFIG.staleTime,
      gcTime: CACHE_CONFIG.cacheTime,
      refetchOnWindowFocus: CACHE_CONFIG.refetchOnWindowFocus,
      refetchOnReconnect: CACHE_CONFIG.refetchOnReconnect,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

// Query keys factory
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  
  // Attendance
  attendance: {
    all: ['attendance'] as const,
    today: () => [...queryKeys.attendance.all, 'today'] as const,
    recent: (days: number) => [...queryKeys.attendance.all, 'recent', days] as const,
    byDate: (date: string) => [...queryKeys.attendance.all, 'date', date] as const,
    stats: (userId?: string) => [...queryKeys.attendance.all, 'stats', userId] as const,
  },
  
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.tasks.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
    updates: (id: string) => [...queryKeys.tasks.all, 'updates', id] as const,
    assigned: (userId: string) => [...queryKeys.tasks.all, 'assigned', userId] as const,
  },
  
  // Reports
  reports: {
    all: ['reports'] as const,
    list: (status?: string) => [...queryKeys.reports.all, 'list', status] as const,
    detail: (id: string) => [...queryKeys.reports.all, 'detail', id] as const,
    drafts: () => [...queryKeys.reports.all, 'drafts'] as const,
  },
  
  // Geofences
  geofences: {
    all: ['geofences'] as const,
    list: () => [...queryKeys.geofences.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.geofences.all, 'detail', id] as const,
  },
  
  // Officers (for supervisors/admins)
  officers: {
    all: ['officers'] as const,
    list: () => [...queryKeys.officers.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.officers.all, 'detail', id] as const,
    status: () => [...queryKeys.officers.all, 'status'] as const,
    location: (id: string) => [...queryKeys.officers.all, 'location', id] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    activity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
};

// Invalidation helpers
export const invalidateQueries = {
  attendance: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all }),
  tasks: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  reports: () => queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
  officers: () => queryClient.invalidateQueries({ queryKey: queryKeys.officers.all }),
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  all: () => queryClient.invalidateQueries(),
};

// Prefetch helpers
export const prefetchQueries = {
  attendance: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.attendance.today(),
      staleTime: 60000,
    });
  },
  tasks: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.list(),
      staleTime: 60000,
    });
  },
};

// Provider component
interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <RQProvider client={queryClient}>
      {children}
    </RQProvider>
  );
}

export default queryClient;
