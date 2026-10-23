import React from 'react';
import { Pressable, View } from 'react-native';

import { colors, fonts } from '../theme';
import { Text } from './Text';

/** Tab-style switcher, e.g. Upcoming / Completed / Cancelled. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#EEF0F3', borderRadius: 12, padding: 3 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={`tab-${o.value}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              backgroundColor: active ? colors.card : 'transparent',
              boxShadow: active ? '0 1px 4px rgba(17,24,39,0.10)' : undefined,
            }}
          >
            <Text style={{ fontFamily: active ? fonts.semibold : fonts.medium, fontSize: 13, color: active ? colors.primary : colors.textMuted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
