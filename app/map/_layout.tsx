// Map stack layout

import { Stack } from 'expo-router';

export default function MapLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Live Map',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
