import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, GUTTER } from '../theme';
import { Text } from './Text';

interface ScreenProps {
  children: React.ReactNode;
  /** Scrollable content with the standard 16px gutter */
  scroll?: boolean;
  /** Safe-area edges to pad. Tab screens use ['top'], pushed screens use ['top','bottom'] */
  edges?: ('top' | 'bottom')[];
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Pinned below the content, e.g. a sticky "Book" button */
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
  background?: string;
}

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  onRefresh,
  refreshing,
  footer,
  contentStyle,
  background = colors.bg,
}: ScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[{ padding: GUTTER, paddingBottom: 32, gap: 16 }, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Title row for pushed screens, with a back button. */
export function Header({ title, subtitle, right, onBack }: { title: string; subtitle?: string; right?: React.ReactNode; onBack?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, paddingTop: 8 + insets.top, minHeight: 56, backgroundColor: colors.bg }}>
      <Pressable
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        hitSlop={8}
        accessibilityLabel="Go back"
        testID="back"
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronLeft size={26} color={colors.text} />
      </Pressable>
      <View style={{ flex: 1, paddingHorizontal: 4 }}>
        <Text variant="h3" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Sticky action bar at the bottom of a screen. */
export function Footer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingHorizontal: GUTTER,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: 8,
      }}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="h3">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text variant="label" color={colors.primary}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
