import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { colors, fonts } from '../theme';
import { Text } from './Text';

export function ListRow({
  icon: Icon,
  label,
  subtitle,
  value,
  onPress,
  danger,
  testID,
}: {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  testID?: string;
}) {
  const tint = danger ? colors.danger : colors.primary;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: subtitle ? 62 : 54,
        paddingHorizontal: 16,
        paddingVertical: 10,
        opacity: pressed ? 0.75 : 1,
        backgroundColor: pressed ? '#F8FAFC' : 'transparent',
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: danger ? colors.dangerSoft : colors.primarySoft,
          borderWidth: 1,
          borderColor: danger ? '#FECACA' : '#E0E7FF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={19} color={tint} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text
          style={{ fontFamily: fonts.medium, fontSize: 15 }}
          color={danger ? colors.dangerDark : colors.text}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted style={{ fontSize: 12 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="small" muted>
          {value}
        </Text>
      ) : null}
      {onPress && !danger ? <ChevronRight size={18} color={colors.textFaint} strokeWidth={2} /> : null}
    </Pressable>
  );
}
