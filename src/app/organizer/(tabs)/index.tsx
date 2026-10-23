import { useRouter } from 'expo-router';
import { CalendarPlus, Radio, UserCheck, Users, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { useAuth } from '../../../auth/AuthProvider';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { EventCard } from '../../../components/EventCard';
import { Screen, SectionTitle } from '../../../components/Screen';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useApplicants, useMyEvents } from '../../../hooks/queries';
import { publicMediaUrl } from '../../../lib/supabase';
import { colors } from '../../../theme';
import { eventPhase } from '../../../utils/booking';
import { firstName } from '../../../utils/format';
import { useNow } from '../../../utils/useNow';

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const now = useNow();
  const q = useMyEvents();
  const applicants = useApplicants();

  const events = q.data?.items ?? [];
  const live = events.filter((e) => eventPhase(e, now) === 'live');
  const upcoming = events.filter((e) => eventPhase(e, now) === 'upcoming').sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const booked = useMemo(() => [...live, ...upcoming].reduce((a, e) => a + e.shifts.reduce((s, x) => s + x.slots_filled, 0), 0), [live, upcoming]);

  return (
    <Screen onRefresh={() => { void q.refetch(); void applicants.refetch(); }} refreshing={q.isRefetching}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={profile?.company_name ?? profile?.full_name ?? '?'} uri={publicMediaUrl(profile?.photo_path)} size={48} />
        <View style={{ flex: 1 }}>
          <Text variant="h2" testID="greeting">Hi, {firstName(profile?.full_name ?? '')} 👋</Text>
          <Text variant="small" muted>{profile?.company_name}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat icon={Radio} tint={colors.success} soft={colors.successSoft} value={live.length} label="Live now" testID="stat-live" />
        <Stat icon={Users} tint={colors.primary} soft={colors.primarySoft} value={booked} label="Workers booked" testID="stat-booked" />
        <Stat icon={UserCheck} tint={colors.accentDark} soft={colors.accentSoft} value={applicants.items.length} label="To approve" testID="stat-pending" onPress={() => router.push('/organizer/applicants' as never)} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="Create event" icon={CalendarPlus} fullWidth onPress={() => router.push('/organizer/create')} testID="create-event" />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Urgent staff" icon={Zap} variant="accent" fullWidth onPress={() => router.push({ pathname: '/organizer/create', params: { urgent: '1' } })} testID="create-urgent" />
        </View>
      </View>

      {q.isPending ? <SkeletonList count={2} /> : q.isError ? <ErrorState message={q.error.message} onRetry={() => void q.refetch()} /> : (
        <>
          {live.length > 0 ? (
            <>
              <SectionTitle title="Live now" />
              {live.map((e) => (
                <View key={e.id} style={{ gap: 8 }}>
                  <EventCard event={e} now={now} showUrgent={false} onPress={() => router.push(`/organizer/event/${e.id}`)} />
                  <Button title="Open live attendance" variant="secondary" fullWidth onPress={() => router.push(`/organizer/attendance/${e.id}`)} testID={`live-${e.id}`} />
                </View>
              ))}
            </>
          ) : null}
          <SectionTitle title="Upcoming events" action={upcoming.length ? 'See all' : undefined} onAction={() => router.push('/organizer/events' as never)} />
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarPlus} title="No upcoming events" subtitle="Post your first event and workers nearby can book it right away." actionLabel="Create event" onAction={() => router.push('/organizer/create')} />
          ) : (
            upcoming.slice(0, 5).map((e) => <EventCard key={e.id} event={e} now={now} showUrgent={false} onPress={() => router.push(`/organizer/event/${e.id}`)} />)
          )}
        </>
      )}
    </Screen>
  );
}

function Stat({ icon: Icon, tint, soft, value, label, testID, onPress }: { icon: typeof Users; tint: string; soft: string; value: number; label: string; testID: string; onPress?: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Card onPress={onPress} testID={`${testID}-card`}>
        <View style={{ gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color={tint} />
          </View>
          <Text variant="h2" testID={testID}>{value}</Text>
          <Text variant="caption" muted>{label}</Text>
        </View>
      </Card>
    </View>
  );
}
