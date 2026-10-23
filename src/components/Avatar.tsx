import React from 'react';
import { Image, View } from 'react-native';

import { initials } from '../utils/format';
import { colors, fonts } from '../theme';
import { Text } from './Text';

const tints = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export function Avatar({ name, uri, size = 44 }: { name: string; uri?: string | null; size?: number }) {
  const tint = tints[(name.charCodeAt(0) || 0) % tints.length]!;
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tint + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: tint, fontFamily: fonts.semibold, fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  );
}
