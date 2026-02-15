import { useColorScheme } from '@/hooks/use-color-scheme';
import { SyncBanner } from '@/src/components/ui';
import { useAppStore } from '@/src/store/app-store';
import { useAuthStore } from '@/src/store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const COLORS = {
  light: {
    tint: '#007AFF',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E5EA',
  },
  dark: {
    tint: '#0A84FF',
    tabBarBackground: '#1C1C1E',
    tabBarBorder: '#38383A',
  },
};

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user } = useAuthStore();
  const { isOnline, isSyncing, pendingSync, triggerSync } = useAppStore();
  
  const colors = COLORS[colorScheme];
  const isFieldOfficer = user?.role === 'field_officer';
  const isSupervisorOrAdmin = user?.role === 'supervisor' || user?.role === 'admin';

  return (
    <View style={styles.container}>
      {/* Sync Status Banner */}
      <SyncBanner 
        pendingCount={pendingSync}
        isSyncing={isSyncing}
        isOnline={isOnline}
        onSync={triggerSync}
      />
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: colors.tabBarBorder,
            height: 88,
            paddingTop: 8,
            paddingBottom: 28,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.tabBarBackground,
          },
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {/* Home Tab - All Roles */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerTitle: isSupervisorOrAdmin ? 'Dashboard' : 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />

        {/* Tasks Tab - All Roles */}
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'checkbox' : 'checkbox-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />

        {/* Attendance Tab - Field Officers Only */}
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Attendance',
            href: isFieldOfficer ? '/attendance' : null, // Hide for supervisors/admins
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'time' : 'time-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />

        {/* Team Tab - Supervisors & Admins Only */}
        <Tabs.Screen
          name="team"
          options={{
            title: 'Team',
            href: isSupervisorOrAdmin ? '/team' : null, // Hide for field officers
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'people' : 'people-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />

        {/* Reports Tab - All Roles */}
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'document-text' : 'document-text-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />

        {/* Profile/Settings Tab - All Roles */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'person-circle' : 'person-circle-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />

        {/* Hidden Explore Tab (remove if not needed) */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null, // Hide this tab
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
