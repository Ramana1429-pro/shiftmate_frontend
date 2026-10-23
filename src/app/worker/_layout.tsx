import { Stack } from 'expo-router';
import React from 'react';

import { colors } from '../../theme';

export const unstable_settings = { anchor: '(tabs)' };

export default function WorkerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="event/[id]" />
      <Stack.Screen name="confirmed" />
      <Stack.Screen name="check-in/[id]" />
      <Stack.Screen name="rate/[bookingId]" />
    </Stack>
  );
}
