import type { LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '../theme';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  icon?: LucideIcon;
  hint?: string;
}

export function Input({ label, error, icon: Icon, hint, style, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 48,
          paddingHorizontal: 14,
          backgroundColor: colors.card,
          borderRadius: radius.input,
          borderWidth: focused || error ? 1.5 : 1,
          borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
        }}
      >
        {Icon ? <Icon size={18} color={focused ? colors.primary : colors.textFaint} /> : null}
        <TextInput
          {...rest}
          accessibilityLabel={label ?? rest.placeholder}
          placeholderTextColor={colors.textFaint}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingVertical: 12, outlineStyle: 'none' } as object,
            style,
          ]}
        />
      </View>
      {error ? (
        <Text variant="caption" color={colors.dangerDark}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
