import { useRouter } from 'expo-router';
import { CalendarX, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';

import type { BookingDetail, BookingWhen } from '../../../api/types';
import { BookingStatusBadge } from '../../../components/BookingStatus';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import { Segmented } from '../../../components/Segmented';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useMyBookings } from '../../../hooks/queries';
import { colors } from '../../../theme';
import { canCheckInNow } from '../../../utils/booking';
import { formatDate, formatTime, rupees } from '../../../utils/format';
import { useNow } from '../../../utils/useNow';

export default function MyShifts() {
  const router = useRouter();
  const now = useNow(15000);
  const [when, setWhen] = useState<BookingWhen>('upcoming');
  const q = useMyBookings(when);
  const items = [...(q.data ?? [])].sort((a, b) => {
    const d = new Date(a.event.start_time).getTime() - new Date(b.event.start_time).getTime();
    return when === 'upcoming' ? d : -d;
  });

  return (
    <Screen onRefresh={() => void q.refetch()} refreshing={q.isRefetching}>
      <Text variant="h1">My shifts</Text>
      <Segmented
        value={when}
        onChange={setWhen}
        options={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
      />
      {q.isPending ? (
        <SkeletonList count={3} />
      ) : q.isError ? (
        <ErrorState message={q.error.message} onRetry={() => void q.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={when === 'upcoming' ? 'No upcoming shifts' : when === 'past' ? 'Nothing completed yet' : 'No cancelled shifts'}
          subtitle={when === 'upcoming' ? 'Find a shift on the Home tab and book it.' : undefined}
          actionLabel={when === 'upcoming' ? 'Find shifts' : undefined}
          onAction={() => router.push('/worker' as never)}
        />
      ) : (
        items.map((b) => <ShiftCard key={b.id} b={b} now={now} when={when} />)
      )}
    </Screen>
  );
}

function ShiftCard({ b, now, when }: { b: BookingDetail; now: number; when: BookingWhen }) {
  const router = useRouter();
  return (
    <Card onPress={() => router.push(`/worker/event/${b.event.id}` as never)} testID={`booking-${b.id}`}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <Text variant="bodyMedium" style={{ flex: 1, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>{b.event.title}</Text>
          <BookingStatusBadge status={b.status} />
        </View>
        <Text variant="small" muted>{formatDate(b.event.start_time)} · {formatTime(b.event.start_time)} to {formatTime(b.event.end_time)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MapPin size={13} color={colors.textMuted} />
          <Text variant="small" muted numberOfLines={1} style={{ flex: 1 }}>{[b.event.venue_name, b.event.city].filter(Boolean).join(', ')}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="bodyMedium">{b.shift.role_name}</Text>
          <Text variant="bodyMedium" color={colors.primary}>{rupees(b.shift.pay_amount)}</Text>
        </View>
        {when === 'upcoming' && (canCheckInNow(b, now) || b.status === 'checked_in') ? (
          <Button
            title={b.status === 'checked_in' ? 'Checked in · manage' : 'Check in'}
            fullWidth
            onPress={() => router.push(`/worker/check-in/${b.id}` as never)}
            testID={`checkin-${b.id}`}
          />
        ) : null}
        {when === 'past' && b.status === 'completed' ? (
          <Button title="Rate organizer" variant="secondary" fullWidth onPress={() => router.push(`/worker/rate/${b.id}` as never)} testID={`rate-${b.id}`} />
        ) : null}
      </View>
    </Card>
  );
}
