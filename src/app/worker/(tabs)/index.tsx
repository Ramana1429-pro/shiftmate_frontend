import { useRouter } from 'expo-router';
import { CalendarX, Navigation, Search, SlidersHorizontal, Zap } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppEvent } from '../../../api/types';
import { useAuth } from '../../../auth/AuthProvider';
import { Avatar } from '../../../components/Avatar';
import { BottomSheet } from '../../../components/BottomSheet';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { EventCard } from '../../../components/EventCard';
import { Input } from '../../../components/Input';
import { SectionTitle } from '../../../components/Screen';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { DateStrip } from '../../../components/TimeAndDate';
import { useEventFeed } from '../../../hooks/queries';
import { useCoords } from '../../../hooks/useCoords';
import { publicMediaUrl } from '../../../lib/supabase';
import { colors, GUTTER } from '../../../theme';
import { eventLook, EVENT_TYPES } from '../../../utils/eventStyle';
import { addDays, countdown, firstName, formatTime, isSameDay, rupees, startOfDay } from '../../../utils/format';
import { useNow } from '../../../utils/useNow';

interface Filters {
  day: Date | null;
  radius: number | null;
  minPay: number;
  type: string | null;
}
const NO_FILTERS: Filters = { day: null, radius: null, minPay: 0, type: null };

export default function WorkerHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const now = useNow();
  const { coords, status, refresh: refreshCoords } = useCoords();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [search, setSearch] = useState('');

  const today = startOfDay(new Date());
  const params = useMemo(
    () => ({
      lat: coords?.latitude,
      lng: coords?.longitude,
      radius_km: coords ? (filters.radius ?? 50) : undefined,
      date_from: filters.day ? startOfDay(filters.day) : undefined,
      date_to: filters.day ? addDays(startOfDay(filters.day), 1) : undefined,
      min_pay: filters.minPay || undefined,
    }),
    [coords, filters],
  );
  // Wait for the location lookup so the first request is already sorted by distance.
  const feed = useEventFeed(params, status !== 'loading');

  const all: AppEvent[] = useMemo(() => feed.data?.pages.flatMap((p) => p.items) ?? [], [feed.data]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((e) => {
      if (new Date(e.end_time).getTime() < now) return false;
      if (filters.type && (e.event_type ?? '').toLowerCase() !== filters.type.toLowerCase()) return false;
      if (!q) return true;
      return [e.title, e.venue_name, e.city, e.event_type, ...e.shifts.map((s) => s.role_name)].some((f) => (f ?? '').toLowerCase().includes(q));
    });
  }, [all, search, filters.type, now]);

  const filtersActive = !!(filters.day || filters.radius || filters.minPay || filters.type || search);
  const urgent = useMemo(
    () => visible.filter((e) => { const ms = new Date(e.start_time).getTime() - now; return ms > 0 && ms < 24 * 3600 * 1000 && e.shifts.some((s) => s.slots_left > 0); }),
    [visible, now],
  );

  const isDay = (n: number) => !!filters.day && isSameDay(filters.day, addDays(today, n));
  const toggle = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const filterCount = [filters.day, filters.radius, filters.minPay, filters.type].filter(Boolean).length;

  const header = (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={profile?.full_name ?? '?'} uri={publicMediaUrl(profile?.photo_path)} size={48} />
        <View style={{ flex: 1 }}>
          <Text variant="h2" testID="greeting">Hi, {firstName(profile?.full_name ?? '')} 👋</Text>
          <Pressable onPress={refreshCoords} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} testID="location-chip">
            <Navigation size={13} color={colors.primary} />
            <Text variant="small" color={colors.primary}>
              {status === 'ok' ? `Near you${profile?.city ? ` · ${profile.city}` : ''}` : status === 'loading' ? 'Finding your location…' : 'Location off · tap to retry'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Input icon={Search} value={search} onChangeText={setSearch} placeholder="Search events, roles, venues" testID="search" />
        </View>
        <Pressable
          onPress={() => { setDraft(filters); setSheet(true); }}
          testID="open-filters"
          accessibilityLabel="Filters"
          style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: filterCount ? colors.primary : colors.card, borderWidth: 1, borderColor: filterCount ? colors.primary : colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}
        >
          <SlidersHorizontal size={20} color={filterCount ? colors.white : colors.text} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label="All" selected={!filtersActive} onPress={() => { setFilters(NO_FILTERS); setSearch(''); }} testID="chip-all" />
        <Chip label="Today" selected={isDay(0)} onPress={() => toggle({ day: isDay(0) ? null : today })} testID="chip-today" />
        <Chip label="Tomorrow" selected={isDay(1)} onPress={() => toggle({ day: isDay(1) ? null : addDays(today, 1) })} testID="chip-tomorrow" />
        {coords ? <Chip label="Nearby" selected={filters.radius === 5} onPress={() => toggle({ radius: filters.radius === 5 ? null : 5 })} testID="chip-nearby" /> : null}
        <Chip label="High pay" selected={filters.minPay === 1000} onPress={() => toggle({ minPay: filters.minPay === 1000 ? 0 : 1000 })} testID="chip-highpay" />
      </ScrollView>

      {!filtersActive && urgent.length > 0 ? (
        <View style={{ gap: 12 }}>
          <SectionTitle title="Starting soon" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} style={{ marginHorizontal: -GUTTER }} testID="urgent-list">
            <View style={{ width: GUTTER - 12 }} />
            {urgent.map((e) => <UrgentCard key={e.id} event={e} now={now} onPress={() => router.push(`/worker/event/${e.id}` as never)} />)}
            <View style={{ width: GUTTER - 12 }} />
          </ScrollView>
        </View>
      ) : null}
      <SectionTitle title={coords && !filters.day ? 'Shifts near you' : 'Available shifts'} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <FlatList
        data={feed.isPending || (feed.isError && !feed.data) ? [] : visible}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: GUTTER, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshing={feed.isRefetching && !feed.isFetchingNextPage}
        onRefresh={() => { void feed.refetch(); }}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage(); }}
        ListHeaderComponent={header}
        renderItem={({ item }) => <EventCard event={item} now={now} onPress={() => router.push(`/worker/event/${item.id}` as never)} />}
        ListEmptyComponent={
          feed.isPending ? <SkeletonList count={3} /> : feed.isError ? (
            <ErrorState message={feed.error.message} onRetry={() => void feed.refetch()} />
          ) : (
            <EmptyState
              icon={CalendarX}
              title={filtersActive ? 'No shifts match' : 'No shifts yet'}
              subtitle={filtersActive ? 'Try clearing a filter or searching something else.' : 'New events are posted every day. Pull down to refresh.'}
              actionLabel={filtersActive ? 'Clear filters' : undefined}
              onAction={() => { setFilters(NO_FILTERS); setSearch(''); }}
            />
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <SkeletonList count={1} /> : null}
      />

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Filters">
        <View style={{ gap: 20 }}>
          <View style={{ gap: 8 }}>
            <Text variant="label">Date</Text>
            <DateStrip value={draft.day ?? new Date(0)} onChange={(d) => setDraft({ ...draft, day: draft.day && isSameDay(draft.day, d) ? null : d })} days={14} />
          </View>
          {coords ? (
            <View style={{ gap: 8 }}>
              <Text variant="label">Distance</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[5, 10, 25, 50].map((r) => (
                  <Chip key={r} label={`${r} km`} selected={draft.radius === r} onPress={() => setDraft({ ...draft, radius: draft.radius === r ? null : r })} testID={`radius-${r}`} />
                ))}
              </View>
            </View>
          ) : null}
          <View style={{ gap: 8 }}>
            <Text variant="label">Minimum pay per shift</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[0, 500, 800, 1000, 1500].map((p) => (
                <Chip key={p} label={p === 0 ? 'Any' : `${rupees(p)}+`} selected={draft.minPay === p} onPress={() => setDraft({ ...draft, minPay: p })} testID={`pay-${p}`} />
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="label">Event type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {EVENT_TYPES.map((t) => (
                <Chip key={t} label={t} selected={draft.type === t} onPress={() => setDraft({ ...draft, type: draft.type === t ? null : t })} testID={`type-${t.toLowerCase().replace(/ /g, '-')}`} />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button title="Reset" variant="outline" fullWidth onPress={() => setDraft(NO_FILTERS)} testID="filters-reset" />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Show shifts" fullWidth onPress={() => { setFilters(draft); setSheet(false); }} testID="filters-apply" />
            </View>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function UrgentCard({ event, now, onPress }: { event: AppEvent; now: number; onPress: () => void }) {
  const look = eventLook(event.event_type);
  const Icon = look.icon;
  const top = [...event.shifts].sort((a, b) => b.pay_amount - a.pay_amount)[0];
  return (
    <Card onPress={onPress} testID={`urgent-${event.id}`} style={{ width: 240, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: '#FDE68A' }}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} color={look.color} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Zap size={14} color={colors.accentDark} />
            <Text variant="label" color={colors.accentDark}>In {countdown(new Date(event.start_time).getTime() - now)}</Text>
          </View>
        </View>
        <Text variant="bodyMedium" numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>{event.title}</Text>
        <Text variant="small" muted numberOfLines={1}>{formatTime(event.start_time)} · {event.venue_name ?? event.city ?? ''}{event.distance_km != null ? ` · ${event.distance_km} km` : ''}</Text>
        {top ? <Text variant="bodyMedium" color={colors.accentDark}>{top.role_name} · {rupees(top.pay_amount)}</Text> : null}
      </View>
    </Card>
  );
}
