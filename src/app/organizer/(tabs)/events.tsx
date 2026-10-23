import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarCheck, CalendarPlus, Plus, Radio } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { Button } from '../../../components/Button';
import { EventCard } from '../../../components/EventCard';
import { Screen } from '../../../components/Screen';
import { Segmented } from '../../../components/Segmented';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useMyEvents } from '../../../hooks/queries';
import { colors, fonts, radius, shadow } from '../../../theme';
import { eventPhase } from '../../../utils/booking';
import { useNow } from '../../../utils/useNow';

type Tab = 'upcoming' | 'live' | 'past';

export default function OrganizerEvents() {
  const router = useRouter();
  const now = useNow();
  const q = useMyEvents();
  const [tab, setTab] = useState<Tab>('upcoming');

  // Animation values for tab transition & screen visit
  const [headerAnim] = useState(() => new Animated.Value(0));
  const [contentTranslateY] = useState(() => new Animated.Value(0));

  // Run animations whenever user visits the events tab
  useFocusEffect(
    useCallback(() => {
      headerAnim.setValue(0);
      contentTranslateY.setValue(14);

      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(contentTranslateY, { toValue: 0, friction: 7, tension: 120, useNativeDriver: true }),
      ]).start();
    }, [headerAnim, contentTranslateY]),
  );

  const all = q.data?.items ?? [];

  const counts = useMemo(() => {
    let upcoming = 0;
    let live = 0;
    let past = 0;
    for (const e of all) {
      const p = eventPhase(e, now);
      if (p === 'upcoming') upcoming++;
      else if (p === 'live') live++;
      else if (p === 'past' || p === 'cancelled') past++;
    }
    return { upcoming, live, past };
  }, [all, now]);

  const handleTabChange = (nextTab: Tab) => {
    if (nextTab === tab) return;
    Animated.timing(contentTranslateY, { toValue: 8, duration: 80, useNativeDriver: true }).start(() => {
      setTab(nextTab);
      Animated.spring(contentTranslateY, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }).start();
    });
  };

  const inTab = (e: (typeof all)[number]) => {
    const p = eventPhase(e, now);
    return tab === 'past' ? p === 'past' || p === 'cancelled' : p === tab;
  };

  const items = all.filter(inTab).sort((a, b) => {
    const d = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    return tab === 'past' ? -d : d;
  });

  return (
    <Screen onRefresh={() => void q.refetch()} refreshing={q.isRefetching} contentStyle={{ gap: 14 }}>
      {/* Animated Top Header Row with "+ New Event" Button */}
      <Animated.View
        style={{
          opacity: headerAnim,
          transform: [
            {
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
          <View style={{ gap: 2 }}>
            <Text variant="h1" style={{ fontSize: 22, fontFamily: fonts.bold }}>
              My events
            </Text>
            <Text variant="caption" muted style={{ fontSize: 12 }}>
              Manage schedules, staffing & live shifts
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/organizer/create')}
            testID="create-event-header"
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radius.button,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                ...shadow.glowPrimary,
              },
            ]}
          >
            <Plus size={16} color={colors.white} strokeWidth={2.5} />
            <Text style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 13 }}>
              New Event
            </Text>
          </Pressable>
        </View>

        {/* Header Divider Line */}
        <View style={{ height: 1, backgroundColor: colors.border, marginTop: 12 }} />
      </Animated.View>

      {/* Segmented Switcher with Animated Sliding Pill & Counts */}
      <Segmented
        value={tab}
        onChange={handleTabChange}
        options={[
          { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
          { value: 'live', label: 'Live', count: counts.live },
          { value: 'past', label: 'Past', count: counts.past },
        ]}
      />

      {/* Animated Content Area */}
      <Animated.View
        style={{
          gap: 14,
          transform: [{ translateY: contentTranslateY }],
        }}
      >
        {q.isPending ? (
          <SkeletonList count={3} />
        ) : q.isError ? (
          <ErrorState message={q.error.message} onRetry={() => void q.refetch()} />
        ) : items.length === 0 ? (
          <View style={{ gap: 14 }}>
            <EmptyState
              icon={tab === 'live' ? Radio : tab === 'past' ? CalendarCheck : CalendarPlus}
              title={
                tab === 'upcoming'
                  ? 'No upcoming events'
                  : tab === 'live'
                    ? 'No events live right now'
                    : 'No past events yet'
              }
              subtitle={
                tab === 'upcoming'
                  ? 'Create an event to start hiring verified workers nearby.'
                  : tab === 'live'
                    ? 'Events currently underway will appear here for live check-in and attendance.'
                    : 'Completed events and shift archives will be saved here.'
              }
              actionLabel={tab === 'upcoming' ? 'Create event' : undefined}
              onAction={tab === 'upcoming' ? () => router.push('/organizer/create') : undefined}
            />

            {/* Quick Organizer Tips for Empty Upcoming Tab */}
            {tab === 'upcoming' ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radius.card,
                  borderWidth: 0,
                  padding: 16,
                  gap: 12,
                  ...shadow.card,
                }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.text }}>
                  💡 Pro tips for hiring staff:
                </Text>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: colors.primarySoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={15} color={colors.primary} />
                    </View>
                    <Text variant="caption" muted style={{ flex: 1, fontSize: 12 }}>
                      Post shifts at least 24h early to get top-rated applicants first.
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: colors.accentSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Radio size={15} color={colors.accentDark} />
                    </View>
                    <Text variant="caption" muted style={{ flex: 1, fontSize: 12 }}>
                      Track worker arrivals in real time on the Live tab.
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {items.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                now={now}
                showUrgent={false}
                onPress={() => router.push(`/organizer/event/${e.id}`)}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </Screen>
  );
}
