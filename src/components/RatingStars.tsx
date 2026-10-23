import { Star } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '../theme';
import { Text } from './Text';

/** Read-only stars with the number, or tappable stars when onChange is given. */
export function RatingStars({
  value,
  count,
  onChange,
  size = 16,
}: {
  value: number;
  count?: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const rounded = Math.round(value);
  if (onChange) {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} accessibilityLabel={`${n} stars`} testID={`star-${n}`}>
            <Star size={size} color={colors.accent} fill={n <= value ? colors.accent : 'transparent'} strokeWidth={1.8} />
          </Pressable>
        ))}
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Star size={size} color={colors.accent} fill={rounded > 0 ? colors.accent : 'transparent'} strokeWidth={1.8} />
      <Text variant="label">{count === 0 || !value ? 'New' : value.toFixed(1)}</Text>
      {count ? (
        <Text variant="caption" muted>
          ({count})
        </Text>
      ) : null}
    </View>
  );
}
