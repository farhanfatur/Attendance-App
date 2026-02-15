import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="new" 
        options={{ 
          presentation: 'modal',
          headerShown: true,
          title: 'New Report',
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: true,
          title: 'Report Details',
        }} 
      />
    </Stack>
  );
}
