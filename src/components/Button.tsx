import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, fonts, radius, shadow } from '../theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const palette: Record<Variant, { bg: string; fg: string; border?: string; shadow?: ViewStyle }> = {
  primary: { bg: colors.primary, fg: colors.white, shadow: shadow.glowPrimary },
  accent: { bg: colors.accent, fg: colors.white, shadow: shadow.glowAccent },
  secondary: { bg: colors.primarySoft, fg: colors.primary, border: '#E0E7FF' },
  outline: { bg: colors.card, fg: colors.text, border: colors.borderStrong, shadow: shadow.sm },
  ghost: { bg: 'transparent', fg: colors.primary },
  danger: { bg: colors.dangerSoft, fg: colors.dangerDark, border: '#FECACA' },
};

const heights: Record<Size, number> = { sm: 40, md: 50, lg: 54 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  disabled,
  fullWidth = true,
  style,
  testID,
}: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        p.shadow,
        {
          height: heights[size],
          backgroundColor: p.bg,
          borderColor: p.border ?? 'transparent',
          borderWidth: p.border ? 1 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !inactive ? 0.98 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: size === 'sm' ? 14 : 20,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={size === 'sm' ? 17 : 19} color={p.fg} strokeWidth={2.4} /> : null}
          <Text style={{ color: p.fg, fontFamily: fonts.semibold, fontSize: size === 'sm' ? 13 : 15, letterSpacing: 0.2 }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
