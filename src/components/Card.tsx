import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { colors, radius, shadow } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  testID?: string;
}

export function Card({ children, onPress, style, padded = true, testID }: CardProps) {
  const base: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: padded ? 16 : 0,
    ...shadow.card,
  };
  if (!onPress) {
    return (
      <View testID={testID} style={[base, style]}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [base, { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] }, style]}
    >
      {children}
    </Pressable>
  );
}
