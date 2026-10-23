import type { LucideIcon } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, shadow } from '../theme';
import { Text } from './Text';

export interface TabBarRoute {
  key: string;
  name: string;
  params?: object;
}

export interface TabBarDescriptor {
  options: {
    title?: string;
    tabBarLabel?: string | ((props: { focused: boolean; color: string }) => React.ReactNode);
    tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
    tabBarBadge?: string | number;
    tabBarButtonTestID?: string;
    tabBarTestID?: string;
    tabBarAccessibilityLabel?: string;
  };
}

export interface AnimatedTabBarProps {
  state: {
    index: number;
    routes: TabBarRoute[];
  };
  descriptors: Record<string, TabBarDescriptor>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
  insets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

function TabItem({
  route,
  isFocused,
  descriptor,
  onPress,
  onLongPress,
}: {
  route: TabBarRoute;
  isFocused: boolean;
  descriptor: TabBarDescriptor;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { options } = descriptor;
  const [scale] = React.useState(() => new Animated.Value(isFocused ? 1 : 0.95));
  const [pillOpacity] = React.useState(() => new Animated.Value(isFocused ? 1 : 0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isFocused ? 1.06 : 1,
        friction: 6,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(pillOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused, scale, pillOpacity]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 75, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.06, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const label =
    typeof options.tabBarLabel === 'string'
      ? options.tabBarLabel
      : options.title !== undefined
        ? options.title
        : route.name;

  const color = isFocused ? colors.primary : colors.textFaint;
  const badge = options.tabBarBadge;

  return (
    <Pressable
      testID={options.tabBarButtonTestID ?? options.tabBarTestID}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
      }}
      hitSlop={6}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
        }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Active frosted pill background behind icon */}
          <Animated.View
            style={{
              position: 'absolute',
              top: -5,
              left: -14,
              right: -14,
              bottom: -5,
              borderRadius: 16,
              backgroundColor: colors.primarySoft,
              opacity: pillOpacity,
            }}
          />

          {options.tabBarIcon ? options.tabBarIcon({ focused: isFocused, color, size: 22 }) : null}

          {/* Badge indicator */}
          {badge !== undefined && badge !== null && badge !== '' ? (
            <View
              style={{
                position: 'absolute',
                top: -5,
                right: -10,
                backgroundColor: colors.accent,
                borderRadius: 9,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: colors.card,
              }}
            >
              <Text style={{ color: colors.white, fontSize: 10, fontFamily: fonts.bold }}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={{
            fontSize: 11,
            fontFamily: isFocused ? fonts.bold : fonts.medium,
            color,
            marginTop: 4,
            letterSpacing: isFocused ? 0.2 : 0,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>

        {/* Active accent dot below the label */}
        <View
          style={{
            width: isFocused ? 14 : 0,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: isFocused ? colors.primary : 'transparent',
            marginTop: 2,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Animated bottom tab bar with dynamic safe area insets to completely
 * prevent Android system navigation / home pill overlap.
 */
export function AnimatedTabBar({ state, descriptors, navigation, insets }: AnimatedTabBarProps) {
  const hookInsets = useSafeAreaInsets();
  // Safe bottom padding: guarantees clearance over the Android home bar / iOS home indicator
  const bottomInset = Math.max(insets?.bottom ?? 0, hookInsets.bottom, Platform.OS === 'android' ? 18 : 12);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 8,
        paddingBottom: bottomInset,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        ...shadow.raised,
      }}
    >
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        if (!descriptor) return null;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            descriptor={descriptor}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textFaint,
  tabBarLabelStyle: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.2,
    marginBottom: Platform.OS === 'ios' ? 0 : 4,
  },
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sceneStyle: { backgroundColor: colors.bg },
} as const;

export const tabIcon = (Icon: LucideIcon) =>
  function TabIcon({ color, size, focused }: { color: import('react-native').ColorValue; size: number; focused?: boolean }) {
    return <Icon color={color as string} size={size} strokeWidth={focused ? 2.4 : 1.8} />;
  };
