import { useRouter } from 'expo-router';
import { CalendarPlus } from 'lucide-react-native';
import React, { useState } from 'react';

import { Button } from '../../../components/Button';
import { EventCard } from '../../../components/EventCard';
import { Screen } from '../../../components/Screen';
import { Segmented } from '../../../components/Segmented';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useMyEvents } from '../../../hooks/queries';
import { eventPhase } from '../../../utils/booking';
import { useNow } from '../../../utils/useNow';

type Tab = 'upcoming' | 'live' | 'past';

export default function OrganizerEvents() {
  const router = useRouter();
  const now = useNow();
  const q = useMyEvents();
  const [tab, setTab] = useState<Tab>('upcoming');

  const all = q.data?.items ?? [];
  const inTab = (e: (typeof all)[number]) => {
    const p = eventPhase(e, now);
    return tab === 'past' ? p === 'past' || p === 'cancelled' : p === tab;
  };
  const items = all.filter(inTab).sort((a, b) => {
    const d = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    return tab === 'past' ? -d : d;
  });

  return (
    <Screen onRefresh={() => void q.refetch()} refreshing={q.isRefetching}>
      <Text variant="h1">My events</Text>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'live', label: 'Live' },
          { value: 'past', label: 'Past' },
        ]}
      />
      {q.isPending ? <SkeletonList count={3} /> : q.isError ? <ErrorState message={q.error.message} onRetry={() => void q.refetch()} /> : items.length === 0 ? (
        <EmptyState icon={CalendarPlus} title={`No ${tab} events`} subtitle={tab === 'upcoming' ? 'Create an event to start hiring.' : undefined} actionLabel={tab === 'upcoming' ? 'Create event' : undefined} onAction={() => router.push('/organizer/create')} />
      ) : (
        items.map((e) => <EventCard key={e.id} event={e} now={now} showUrgent={false} onPress={() => router.push(`/organizer/event/${e.id}`)} />)
      )}
      <Button title="Create event" icon={CalendarPlus} variant="secondary" fullWidth onPress={() => router.push('/organizer/create')} testID="create-event-2" />
    </Screen>
  );
}
