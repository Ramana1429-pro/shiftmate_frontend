import { AlertCircle, type LucideIcon } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';

import { colors, radius, shadow } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Icon size={32} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text variant="h3" center>
        {title}
      </Text>
      {subtitle ? (
        <Text muted center>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 12, alignSelf: 'stretch' }}>
          <Button title={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 }}>
      <AlertCircle size={36} color={colors.danger} strokeWidth={1.8} />
      <Text variant="h3" center>
        Something went wrong
      </Text>
      <Text muted center>
        {message}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: 12, alignSelf: 'stretch' }}>
          <Button title="Try again" onPress={onRetry} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

export function Skeleton({ width, height = 16, style }: { width?: number | `${number}%`; height?: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width: width ?? '100%', height, borderRadius: 8, backgroundColor: '#E5E7EB', opacity }, style]} />;
}

export function SkeletonCard() {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.card, padding: 16, gap: 10, ...shadow.card }}>
      <Skeleton width="60%" height={18} />
      <Skeleton width="40%" />
      <Skeleton width="80%" />
      <Skeleton height={6} />
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
