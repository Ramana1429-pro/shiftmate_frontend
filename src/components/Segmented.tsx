import React, { useEffect, useState } from 'react';
import { Animated, type LayoutChangeEvent, Pressable, View } from 'react-native';

import { colors, fonts, shadow } from '../theme';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Tab-style switcher with animated sliding pill indicator and count pills. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const [slideAnim] = useState(() => new Animated.Value(activeIndex));

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) {
      Animated.spring(slideAnim, {
        toValue: idx,
        friction: 8,
        tension: 130,
        useNativeDriver: true,
      }).start();
    }
  }, [value, options, slideAnim]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const innerWidth = containerWidth > 8 ? containerWidth - 8 : 0;
  const tabWidth = options.length > 0 && innerWidth > 0 ? innerWidth / options.length : 0;

  return (
    <View
      onLayout={onLayout}
      style={{
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.border,
        position: 'relative',
      }}
    >
      {/* Animated Sliding Pill */}
      {containerWidth > 0 && tabWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            width: tabWidth,
            bottom: 4,
            backgroundColor: colors.card,
            borderRadius: 10,
            ...shadow.sm,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: options.map((_, i) => i),
                  outputRange: options.map((_, i) => i * tabWidth),
                }),
              },
            ],
          }}
        />
      ) : null}

      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={`tab-${o.value}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [
              {
                flex: 1,
                height: 38,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: 10,
                // Fallback static background if containerWidth not measured yet
                backgroundColor: containerWidth === 0 && active ? colors.card : 'transparent',
                opacity: pressed && !active ? 0.75 : 1,
                zIndex: 1,
              },
              containerWidth === 0 && active ? shadow.sm : undefined,
            ]}
          >
            <Text
              style={{
                fontFamily: active ? fonts.bold : fonts.medium,
                fontSize: 13,
                color: active ? colors.primary : colors.textMuted,
              }}
            >
              {o.label}
            </Text>
            {o.count !== undefined ? (
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 10,
                  backgroundColor: active ? colors.primarySoft : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 11,
                    color: active ? colors.primaryDark : colors.textMuted,
                  }}
                >
                  {o.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

