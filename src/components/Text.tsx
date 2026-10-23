import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, fonts } from '../theme';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'bodyMedium' | 'small' | 'caption' | 'label';

const variants: Record<Variant, TextStyle> = {
  h1: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  center?: boolean;
}

export function Text({ variant = 'body', color, muted, center, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        variants[variant],
        { color: color ?? (muted ? colors.textMuted : colors.text) },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
