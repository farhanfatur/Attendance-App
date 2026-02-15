import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ErrorBoundary } from '@/src/components/error-boundary';
import { QueryProvider } from '@/src/lib/query-client';
import { useAppStore } from '@/src/store/app-store';
import { initializeAuth, useAuthStore } from '@/src/store/auth-store';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Auth protection component
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const initialize = useAppStore((state) => state.initialize);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize auth from secure storage
        await initializeAuth();
        // Initialize app store (network, offline queue, etc.)
        await initialize();
      } catch (e) {
        console.error('Failed to initialize app:', e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen 
                name="tasks/[id]" 
                options={{ 
                  headerShown: true,
                  title: 'Task Details',
                  headerBackTitle: 'Back',
                }} 
              />
              <Stack.Screen 
                name="reports/new" 
                options={{ 
                  presentation: 'modal',
                  headerShown: true,
                  title: 'New Report',
                }} 
              />
              <Stack.Screen 
                name="attendance/check-in" 
                options={{ 
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Check In',
                }} 
              />
              <Stack.Screen 
                name="attendance/check-out" 
                options={{ 
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Check Out',
                }} 
              />
              <Stack.Screen 
                name="team/[id]" 
                options={{ 
                  headerShown: true,
                  title: 'Officer Details',
                  headerBackTitle: 'Team',
                }} 
              />
              <Stack.Screen 
                name="map/index" 
                options={{ 
                  headerShown: true,
                  title: 'Live Map',
                  headerBackTitle: 'Back',
                }} 
              />
              <Stack.Screen 
                name="notifications/index" 
                options={{ 
                  headerShown: true,
                  title: 'Notifications',
                  headerBackTitle: 'Back',
                }} 
              />
              <Stack.Screen 
                name="reports/[id]" 
                options={{ 
                  headerShown: true,
                  title: 'Report Details',
                  headerBackTitle: 'Reports',
                }} 
              />
              <Stack.Screen 
                name="modal" 
                options={{ presentation: 'modal', title: 'Modal' }} 
              />
            </Stack>
          </AuthGate>
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
