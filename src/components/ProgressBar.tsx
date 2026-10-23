import React from 'react';
import { View } from 'react-native';

import { colors, fonts } from '../theme';
import { Text } from './Text';

/** Slots progress: green while there is room, amber when nearly full, red when full. */
export function SlotsProgressBar({ filled, total, showLabel = true }: { filled: number; total: number; showLabel?: boolean }) {
  const pct = total > 0 ? Math.min(1, filled / total) : 0;
  const left = Math.max(0, total - filled);
  const color = left === 0 ? colors.danger : pct >= 0.7 ? colors.accent : colors.success;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: 7, borderRadius: 4, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: 7, borderRadius: 4, backgroundColor: color }} />
      </View>
      {showLabel ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" color={left === 0 ? colors.dangerDark : colors.textMuted} style={{ fontFamily: fonts.medium }}>
            {left === 0 ? 'All shifts filled' : `${left} of ${total} slots left`}
          </Text>
          <Text variant="caption" muted style={{ fontFamily: fonts.medium, fontSize: 11 }}>
            {Math.round(pct * 100)}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}
