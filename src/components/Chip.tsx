import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable } from 'react-native';

import { colors, fonts, shadow } from '../theme';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  testID?: string;
}

export function Chip({ label, selected, onPress, icon: Icon, testID }: ChipProps) {
  const fg = selected ? colors.white : colors.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 36,
          paddingHorizontal: 15,
          borderRadius: 999,
          backgroundColor: selected ? colors.primary : colors.card,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        selected ? shadow.glowPrimary : shadow.sm,
      ]}
    >
      {Icon ? <Icon size={14} color={fg} strokeWidth={2.4} /> : null}
      <Text style={{ color: fg, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
