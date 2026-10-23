import { Stack } from 'expo-router';
import React from 'react';

import { colors } from '../../theme';

export const unstable_settings = { anchor: '(tabs)' };

export default function OrganizerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create" />
      <Stack.Screen name="event/[id]" />
      <Stack.Screen name="attendance/[id]" />
      <Stack.Screen name="qr/[id]" />
      <Stack.Screen name="rate/[id]" />
    </Stack>
  );
}
