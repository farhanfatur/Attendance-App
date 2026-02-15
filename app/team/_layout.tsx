// Team stack layout for supervisor features

import { Stack } from 'expo-router';

export default function TeamLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Officer Details',
          headerBackTitle: 'Team',
        }}
      />
    </Stack>
  );
}
