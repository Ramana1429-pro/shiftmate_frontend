import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '../theme';
import { Text } from './Text';

export function ListRow({
  icon: Icon,
  label,
  value,
  onPress,
  danger,
  testID,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  testID?: string;
}) {
  const tint = danger ? colors.danger : colors.primary;
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? colors.dangerSoft : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={tint} />
      </View>
      <Text style={{ flex: 1 }} color={danger ? colors.dangerDark : colors.text}>
        {label}
      </Text>
      {value ? (
        <Text variant="small" muted>
          {value}
        </Text>
      ) : null}
      {onPress && !danger ? <ChevronRight size={18} color={colors.textFaint} /> : null}
    </Pressable>
  );
}
