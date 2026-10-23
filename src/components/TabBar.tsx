import type { LucideIcon } from 'lucide-react-native';
import React from 'react';

import { colors, fonts } from '../theme';

export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textFaint,
  tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
  tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 64, paddingTop: 6, paddingBottom: 8 },
  sceneStyle: { backgroundColor: colors.bg },
} as const;

export const tabIcon = (Icon: LucideIcon) =>
  function TabIcon({ color, size }: { color: import('react-native').ColorValue; size: number }) {
    return <Icon color={color as string} size={size} strokeWidth={1.9} />;
  };
