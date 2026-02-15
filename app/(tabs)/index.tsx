import HomeScreen from '@/src/screens/home-screen';
import SupervisorDashboard from '@/src/screens/supervisor-dashboard';
import { useAuthStore } from '@/src/store/auth-store';
import React from 'react';

export default function HomeTab() {
  const { user } = useAuthStore();
  
  // Show different dashboards based on role
  if (user?.role === 'admin' || user?.role === 'supervisor') {
    return <SupervisorDashboard />;
  }
  
  return <HomeScreen />;
}
