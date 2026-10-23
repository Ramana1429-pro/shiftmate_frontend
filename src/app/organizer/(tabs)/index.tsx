import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowRight, Building2, CalendarPlus, Radio, Settings, UserCheck, Users, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { useAuth } from '../../../auth/AuthProvider';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { EventCard } from '../../../components/EventCard';
import { Screen } from '../../../components/Screen';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useApplicants, useMyEvents } from '../../../hooks/queries';
import { publicMediaUrl } from '../../../lib/supabase';
import { colors, fonts, radius, shadow } from '../../../theme';
import { eventPhase } from '../../../utils/booking';
import { firstName } from '../../../utils/format';
import { useNow } from '../../../utils/useNow';

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const now = useNow();
  const q = useMyEvents();
  const applicants = useApplicants();

  // Animation values for dashboard cascade entry
  const [headerAnim] = useState(() => new Animated.Value(0));
  const [statAnim1] = useState(() => new Animated.Value(0));
  const [statAnim2] = useState(() => new Animated.Value(0));
  const [statAnim3] = useState(() => new Animated.Value(0));
  const [actionsAnim] = useState(() => new Animated.Value(0));
  const [contentAnim] = useState(() => new Animated.Value(0));

  // Run animations every time the user visits the dashboard tab
  useFocusEffect(
    useCallback(() => {
      headerAnim.setValue(0);
      statAnim1.setValue(0);
      statAnim2.setValue(0);
      statAnim3.setValue(0);
      actionsAnim.setValue(0);
      contentAnim.setValue(0);

      Animated.stagger(50, [
        Animated.timing(headerAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(statAnim1, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
        Animated.spring(statAnim2, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
        Animated.spring(statAnim3, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
        Animated.spring(actionsAnim, { toValue: 1, friction: 7, tension: 110, useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    }, [headerAnim, statAnim1, statAnim2, statAnim3, actionsAnim, contentAnim]),
  );

  const events = q.data?.items ?? [];
  const live = events.filter((e) => eventPhase(e, now) === 'live');
  const upcoming = events
    .filter((e) => eventPhase(e, now) === 'upcoming')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const booked = useMemo(
    () => [...live, ...upcoming].reduce((a, e) => a + e.shifts.reduce((s, x) => s + x.slots_filled, 0), 0),
    [live, upcoming],
  );

  return (
    <Screen
      onRefresh={() => {
        void q.refetch();
        void applicants.refetch();
      }}
      refreshing={q.isRefetching}
      contentStyle={{ gap: 16 }}
    >
      {/* Animated Header Profile Bar */}
      <Animated.View
        style={{
          opacity: headerAnim,
          transform: [
            {
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-10, 0],
              }),
            },
          ],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Avatar
              name={profile?.company_name ?? profile?.full_name ?? '?'}
              uri={publicMediaUrl(profile?.photo_path)}
              size={42}
            />
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="h2" style={{ fontSize: 17, fontFamily: fonts.bold }} numberOfLines={1} testID="greeting">
                Hi, {firstName(profile?.full_name ?? '')} 👋
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {profile?.company_name ? (
                  <>
                    <Building2 size={11} color={colors.textMuted} />
                    <Text variant="caption" muted numberOfLines={1} style={{ flex: 1, fontSize: 12 }}>
                      {profile.company_name}
                    </Text>
                  </>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.success }} />
                    <Text variant="caption" muted style={{ fontFamily: fonts.medium, fontSize: 11.5 }}>
                      Organizer Portal
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Quick Settings Icon */}
          <Pressable
            onPress={() => router.push('/organizer/(tabs)/profile')}
            style={({ pressed }) => [
              {
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.94 : 1 }],
                ...shadow.sm,
              },
            ]}
            hitSlop={8}
            accessibilityLabel="Profile settings"
          >
            <Settings size={18} color={colors.text} />
            {applicants.items.length > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: colors.accent,
                  borderWidth: 1.5,
                  borderColor: colors.white,
                }}
              />
            ) : null}
          </Pressable>
        </View>

        {/* Header Divider Line */}
        <View style={{ height: 1, backgroundColor: colors.border, marginTop: 12 }} />
      </Animated.View>

      {/* Modern 3-Column Metrics Row with Cascade Entrance */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Animated.View
          style={{
            flex: 1,
            transform: [
              {
                translateY: statAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          }}
        >
          <StatCard
            icon={Radio}
            tint={colors.success}
            soft={colors.successSoft}
            value={live.length}
            label="Live now"
            testID="stat-live"
            isLive={live.length > 0}
          />
        </Animated.View>

        <Animated.View
          style={{
            flex: 1,
            transform: [
              {
                translateY: statAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          }}
        >
          <StatCard
            icon={Users}
            tint={colors.primary}
            soft={colors.primarySoft}
            value={booked}
            label="Staff booked"
            testID="stat-booked"
          />
        </Animated.View>

        <Animated.View
          style={{
            flex: 1,
            transform: [
              {
                translateY: statAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          }}
        >
          <StatCard
            icon={UserCheck}
            tint={colors.accentDark}
            soft={colors.accentSoft}
            value={applicants.items.length}
            label="To approve"
            testID="stat-pending"
            onPress={() => router.push('/organizer/applicants' as never)}
            badge={applicants.items.length > 0 ? `${applicants.items.length}` : undefined}
          />
        </Animated.View>
      </View>

      {/* Hero Action Cards with Animated Spring Press Feedback */}
      <Animated.View
        style={{
          flexDirection: 'row',
          gap: 12,
          transform: [
            {
              translateY: actionsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
      >
        <ActionCard
          title="Create event"
          subtitle="Post shifts & hire"
          icon={CalendarPlus}
          backgroundColor={colors.primary}
          shadowStyle={shadow.glowPrimary}
          testID="create-event"
          onPress={() => router.push('/organizer/create')}
        />

        <ActionCard
          title="Urgent staff"
          subtitle="Fill within 24h"
          icon={Zap}
          backgroundColor={colors.accent}
          shadowStyle={shadow.glowAccent}
          testID="create-urgent"
          onPress={() => router.push({ pathname: '/organizer/create', params: { urgent: '1' } })}
        />
      </Animated.View>

      {/* Feed Content with Cascade Entry */}
      {q.isPending ? (
        <SkeletonList count={2} />
      ) : q.isError ? (
        <ErrorState message={q.error.message} onRetry={() => void q.refetch()} />
      ) : (
        <Animated.View
          style={{
            gap: 14,
            transform: [
              {
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          }}
        >
          {live.length > 0 ? (
            <View style={{ gap: 12, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <LivePulseDot />
                <Text variant="h3" style={{ fontSize: 18, fontFamily: fonts.bold }}>
                  Live right now
                </Text>
              </View>
              {live.map((e) => (
                <View key={e.id} style={{ gap: 8 }}>
                  <EventCard
                    event={e}
                    now={now}
                    showUrgent={false}
                    onPress={() => router.push(`/organizer/event/${e.id}`)}
                  />
                  <Button
                    title="Open live attendance"
                    variant="secondary"
                    fullWidth
                    onPress={() => router.push(`/organizer/attendance/${e.id}`)}
                    testID={`live-${e.id}`}
                  />
                </View>
              ))}
            </View>
          ) : null}

          {/* Section Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="h3" style={{ fontSize: 18, fontFamily: fonts.bold }}>
                Upcoming events
              </Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: radius.chip,
                  backgroundColor: colors.border,
                }}
              >
                <Text variant="caption" style={{ fontFamily: fonts.semibold, color: colors.textMuted }}>
                  {upcoming.length}
                </Text>
              </View>
            </View>

            {upcoming.length > 0 ? (
              <Pressable onPress={() => router.push('/organizer/events' as never)} hitSlop={8}>
                <Text variant="label" color={colors.primary} style={{ fontFamily: fonts.semibold }}>
                  See all
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Empty state or Event list */}
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No upcoming events"
              subtitle="Post your first event and workers nearby can book it right away."
              actionLabel="Create event"
              onAction={() => router.push('/organizer/create')}
            />
          ) : (
            upcoming
              .slice(0, 5)
              .map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  now={now}
                  showUrgent={false}
                  onPress={() => router.push(`/organizer/event/${e.id}`)}
                />
              ))
          )}
        </Animated.View>
      )}
    </Screen>
  );
}

/** Pulsing radar beacon for live shifts and indicators */
function LivePulseDot() {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.6],
  });

  const opacity = pulse.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.8, 0.3, 0],
  });

  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.success,
          opacity,
          transform: [{ scale }],
        }}
      />
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.success,
        }}
      />
    </View>
  );
}

/** Action card with tactile spring touch feedback */
function ActionCard({
  title,
  subtitle,
  icon: Icon,
  backgroundColor,
  shadowStyle,
  testID,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: typeof CalendarPlus;
  backgroundColor: string;
  shadowStyle: object;
  testID: string;
  onPress: () => void;
}) {
  const [scale] = useState(() => new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        testID={testID}
        style={{
          backgroundColor,
          borderRadius: 16,
          padding: 16,
          borderWidth: 0,
          justifyContent: 'space-between',
          minHeight: 96,
          ...shadowStyle,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} color={colors.white} strokeWidth={2.2} />
          </View>
          <ArrowRight size={16} color="rgba(255,255,255,0.75)" />
        </View>
        <View style={{ gap: 2, marginTop: 12 }}>
          <Text style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 16 }}>{title}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: fonts.regular, fontSize: 12 }}>
            {subtitle}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function StatCard({
  icon: Icon,
  tint,
  soft,
  value,
  label,
  testID,
  onPress,
  isLive,
  badge,
}: {
  icon: typeof Users;
  tint: string;
  soft: string;
  value: number;
  label: string;
  testID: string;
  onPress?: () => void;
  isLive?: boolean;
  badge?: string;
}) {
  const [valScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(valScale, { toValue: 1.14, duration: 90, useNativeDriver: true }),
      Animated.spring(valScale, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }),
    ]).start();
  }, [value, valScale]);

  return (
    <View style={{ flex: 1 }}>
      <Card
        onPress={onPress}
        testID={`${testID}-card`}
        padded={false}
        style={{
          padding: 14,
          borderRadius: 16,
          borderWidth: 0,
        }}
      >
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: soft,
                borderWidth: 1,
                borderColor: tint + '25',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={18} color={tint} strokeWidth={2} />
            </View>
            {isLive ? <LivePulseDot /> : null}
            {badge ? (
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 10,
                  backgroundColor: colors.accent,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 10, fontFamily: fonts.bold }}>{badge}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ gap: 1 }}>
            <Animated.View style={{ transform: [{ scale: valScale }] }}>
              <Text
                variant="h2"
                testID={testID}
                style={{ fontSize: 24, fontFamily: fonts.bold, color: colors.text }}
              >
                {value}
              </Text>
            </Animated.View>
            <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 11, fontFamily: fonts.medium }}>
              {label}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

