import React from 'react';
import { Image, View } from 'react-native';

import { initials } from '../utils/format';
import { colors, fonts, shadow } from '../theme';
import { Text } from './Text';

const tints = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export function Avatar({ name, uri, size = 44 }: { name: string; uri?: string | null; size?: number }) {
  const tint = tints[(name.charCodeAt(0) || 0) % tints.length]!;
  if (uri) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: colors.white, overflow: 'hidden' }}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: size / 2 }} />
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tint + '18',
        borderWidth: 1.5,
        borderColor: tint + '35',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: tint, fontFamily: fonts.bold, fontSize: size * 0.4 }}>{initials(name)}</Text>
    </View>
  );
}
