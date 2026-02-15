import { Stack } from 'expo-router';

export default function AttendanceLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="check-in" 
        options={{ 
          presentation: 'modal',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="check-out" 
        options={{ 
          presentation: 'modal',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}
