import React from 'react';
import { View } from 'react-native';

import { colors } from '../theme';
import { Text } from './Text';

/** Slots progress: green while there is room, amber when nearly full, red when full. */
export function SlotsProgressBar({ filled, total, showLabel = true }: { filled: number; total: number; showLabel?: boolean }) {
  const pct = total > 0 ? Math.min(1, filled / total) : 0;
  const left = Math.max(0, total - filled);
  const color = left === 0 ? colors.danger : pct >= 0.7 ? colors.accent : colors.success;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
      </View>
      {showLabel ? (
        <Text variant="caption" color={left === 0 ? colors.dangerDark : colors.textMuted}>
          {left === 0 ? 'Full' : `${left} of ${total} slots left`}
        </Text>
      ) : null}
    </View>
  );
}
