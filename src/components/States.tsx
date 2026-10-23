import { AlertCircle, type LucideIcon } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';

import { colors, fonts, radius, shadow } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  actionVariant = 'primary',
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionVariant?: 'primary' | 'secondary' | 'outline';
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 38,
        paddingHorizontal: 24,
        backgroundColor: colors.card,
        borderRadius: radius.card,
        borderWidth: 0,
        gap: 8,
        ...shadow.card,
      }}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 24,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          borderWidth: 1.5,
          borderColor: '#E0E7FF',
          ...shadow.sm,
        }}
      >
        <Icon size={32} color={colors.primary} strokeWidth={2} />
      </View>
      <Text variant="h3" center style={{ fontSize: 18, fontFamily: fonts.bold, color: colors.text }}>
        {title}
      </Text>
      {subtitle ? (
        <Text muted center style={{ maxWidth: 280, lineHeight: 20, fontSize: 13.5 }}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 14, minWidth: 160 }}>
          <Button title={actionLabel} onPress={onAction} variant={actionVariant} size="md" />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 24,
        backgroundColor: colors.card,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: '#FECACA',
        gap: 8,
        ...shadow.sm,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: colors.dangerSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <AlertCircle size={28} color={colors.danger} strokeWidth={2} />
      </View>
      <Text variant="h3" center>
        Something went wrong
      </Text>
      <Text muted center style={{ maxWidth: 280 }}>
        {message}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: 12, minWidth: 150 }}>
          <Button title="Try again" onPress={onRetry} variant="outline" size="md" />
        </View>
      ) : null}
    </View>
  );
}

export function Skeleton({ width, height = 16, style }: { width?: number | `${number}%`; height?: number; style?: ViewStyle }) {
  const animRef = useRef<Animated.Value | null>(null);
  if (!animRef.current) {
    animRef.current = new Animated.Value(0.4);
  }
  const opacity = animRef.current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ width: width ?? '100%', height, borderRadius: 8, backgroundColor: '#E2E8F0', opacity }, style]} />;
}

export function SkeletonCard() {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 10, ...shadow.card }}>
      <Skeleton width="60%" height={20} />
      <Skeleton width="40%" height={14} />
      <Skeleton width="85%" height={14} />
      <Skeleton height={8} />
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
