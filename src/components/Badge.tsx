import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { colors, fonts } from '../theme';
import { Text } from './Text';

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const tones: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successSoft, fg: colors.successDark },
  warning: { bg: colors.accentSoft, fg: colors.accentDark },
  danger: { bg: colors.dangerSoft, fg: colors.dangerDark },
  info: { bg: colors.infoSoft, fg: '#0369A1' },
  neutral: { bg: '#F3F4F6', fg: colors.textMuted },
};

export function Badge({ label, tone = 'neutral', icon: Icon }: { label: string; tone?: Tone; icon?: LucideIcon }) {
  const t = tones[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        backgroundColor: t.bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
      }}
    >
      {Icon ? <Icon size={12} color={t.fg} strokeWidth={2.4} /> : null}
      <Text style={{ color: t.fg, fontFamily: fonts.semibold, fontSize: 11, lineHeight: 15 }}>{label}</Text>
    </View>
  );
}
