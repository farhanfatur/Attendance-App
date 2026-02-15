// Zustand Store - Auth State Management

import { ROLE_PERMISSIONS, STORAGE_KEYS } from '@/src/config/constants';
import { apiClient } from '@/src/services/api/client';
import { encryptedStorage } from '@/src/services/storage/encrypted-storage';
import { wsService } from '@/src/services/websocket/ws-service';
import { AuthState, User, UserRole } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  
  // Permissions
  hasPermission: (permission: keyof typeof ROLE_PERMISSIONS.admin) => boolean;
  isRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await apiClient.post<{
            user: User;
            token: string;
            refreshToken: string;
          }>('/auth/login', { email, password });

          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;

            // Store tokens securely
            await encryptedStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            await encryptedStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            await encryptedStorage.setObject(STORAGE_KEYS.USER_DATA, user);

            // Connect WebSocket
            await wsService.connect();

            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Notify backend
          await apiClient.post('/auth/logout').catch(() => {});
          
          // Disconnect WebSocket
          wsService.disconnect();

          // Clear secure storage
          await encryptedStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await encryptedStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          await encryptedStorage.removeItem(STORAGE_KEYS.USER_DATA);

          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear local state
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      refreshUser: async () => {
        try {
          const response = await apiClient.get<User>('/auth/me');
          
          if (response.success && response.data) {
            await encryptedStorage.setObject(STORAGE_KEYS.USER_DATA, response.data);
            set({ user: response.data });
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          encryptedStorage.setObject(STORAGE_KEYS.USER_DATA, updatedUser);
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Permissions
      hasPermission: (permission: keyof typeof ROLE_PERMISSIONS.admin) => {
        const user = get().user;
        if (!user) return false;
        return ROLE_PERMISSIONS[user.role]?.[permission] ?? false;
      },

      isRole: (role: UserRole) => {
        return get().user?.role === role;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth from secure storage on app start
export async function initializeAuth(): Promise<void> {
  try {
    await encryptedStorage.initialize();
    
    const token = await encryptedStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const user = await encryptedStorage.getObject<User>(STORAGE_KEYS.USER_DATA);
    const refreshToken = await encryptedStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (token && user) {
      useAuthStore.setState({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
      });

      // Connect WebSocket
      await wsService.connect();
    }
  } catch (error) {
    console.error('Failed to initialize auth:', error);
  }
}

export default useAuthStore;
