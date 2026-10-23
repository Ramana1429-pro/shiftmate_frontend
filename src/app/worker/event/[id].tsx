import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Navigation, Shirt, ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { BookingStatusBadge } from '../../../components/BookingStatus';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useConfirm } from '../../../components/Confirm';
import { SlotsProgressBar } from '../../../components/ProgressBar';
import { RatingStars } from '../../../components/RatingStars';
import { Footer, Header, Screen } from '../../../components/Screen';
import { ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useToast } from '../../../components/Toast';
import { useBookShift, useCancelBooking, useEvent, useMyBookings, usePublicProfile } from '../../../hooks/queries';
import { useLiveEvent } from '../../../hooks/useLiveEvent';
import { publicMediaUrl } from '../../../lib/supabase';
import { colors } from '../../../theme';
import { ACTIVE_STATUSES, canCheckInNow, checkInOpensAt, isLateCancel } from '../../../utils/booking';
import { eventLook } from '../../../utils/eventStyle';
import { formatDate, formatHours, formatTime, hoursBetween, rupees } from '../../../utils/format';
import { openMaps } from '../../../utils/maps';
import { useNow } from '../../../utils/useNow';

export default function WorkerEventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const now = useNow(15000);
  const event = useEvent(id);
  const organizer = usePublicProfile(event.data?.organizer_id);
  const upcoming = useMyBookings('upcoming');
  const book = useBookShift();
  const cancel = useCancelBooking();
  const [selected, setSelected] = useState<string | null>(null);
  useLiveEvent(id);

  if (event.isPending) {
    return (
      <>
        <Header title="Event" />
        <Screen edges={['bottom']}><SkeletonList count={2} /></Screen>
      </>
    );
  }
  if (event.isError) {
    return (
      <>
        <Header title="Event" />
        <Screen edges={['bottom']}><ErrorState message={event.error.message} onRetry={() => void event.refetch()} /></Screen>
      </>
    );
  }

  const e = event.data;
  const look = eventLook(e.event_type);
  const Icon = look.icon;
  const mine = (upcoming.data ?? []).find((b) => b.event.id === e.id && ACTIVE_STATUSES.includes(b.status));
  const ended = new Date(e.end_time).getTime() < now;
  const closed = e.status === 'cancelled' || ended;
  const openShifts = e.shifts.filter((s) => s.slots_left > 0);
  const chosen = e.shifts.find((s) => s.id === (selected ?? openShifts[0]?.id));

  const doBook = async () => {
    if (!chosen) return;
    try {
      const b = await book.mutateAsync(chosen.id);
      if (b.status === 'confirmed') router.replace({ pathname: '/worker/confirmed', params: { bookingId: b.id } } as never);
      else toast('Applied! You will see it in My shifts once the organizer accepts.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not book this shift', 'error');
    }
  };

  const doCancel = async () => {
    if (!mine) return;
    const late = isLateCancel(mine.event.start_time, now);
    const ok = await confirm({
      title: 'Cancel this shift?',
      message: late
        ? 'The event starts in less than 12 hours. This counts as a late cancellation and lowers your reliability score.'
        : 'Your slot will be given to another worker.',
      confirmLabel: 'Yes, cancel',
      cancelLabel: 'Keep shift',
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync(mine.id);
      toast('Shift cancelled');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not cancel', 'error');
    }
  };

  let footer: React.ReactNode = null;
  if (mine) {
    footer = (
      <Footer>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="label">Your booking · {mine.shift.role_name}</Text>
          <BookingStatusBadge status={mine.status} />
        </View>
        {mine.status === 'confirmed' && !canCheckInNow(mine, now) ? (
          <Text variant="caption" muted>Check-in opens at {formatTime(new Date(checkInOpensAt(mine.event.start_time)))}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button title="Cancel shift" variant="danger" fullWidth loading={cancel.isPending} onPress={doCancel} testID="cancel-shift" />
          </View>
          {canCheckInNow(mine, now) ? (
            <View style={{ flex: 1 }}>
              <Button title="Check in" fullWidth onPress={() => router.push(`/worker/check-in/${mine.id}` as never)} testID="go-checkin" />
            </View>
          ) : null}
        </View>
      </Footer>
    );
  } else if (!closed && chosen) {
    footer = (
      <Footer>
        <Button
          title={chosen.auto_confirm ? `Book this shift · ${rupees(chosen.pay_amount)}` : `Apply · ${rupees(chosen.pay_amount)}`}
          size="lg"
          fullWidth
          loading={book.isPending}
          onPress={doBook}
          testID="book-shift"
        />
        {!chosen.auto_confirm ? <Text variant="caption" muted center>The organizer reviews applications and confirms you.</Text> : null}
      </Footer>
    );
  } else if (closed) {
    footer = (
      <Footer>
        <Button title={e.status === 'cancelled' ? 'Event cancelled' : 'This event has ended'} disabled fullWidth variant="outline" />
      </Footer>
    );
  } else {
    footer = (
      <Footer>
        <Button title="All slots are filled" disabled fullWidth variant="outline" testID="all-filled" />
      </Footer>
    );
  }

  return (
    <>
      <Header title="Event details" />
      <Screen edges={['bottom']} footer={footer} contentStyle={{ paddingTop: 0 }}>
        <View style={{ height: 120, borderRadius: 16, backgroundColor: look.soft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={52} color={look.color} strokeWidth={1.5} />
        </View>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {e.event_type ? <Badge label={e.event_type} tone="primary" /> : null}
            {e.status === 'cancelled' ? <Badge label="Cancelled" tone="danger" /> : null}
          </View>
          <Text variant="h1" testID="event-title">{e.title}</Text>
        </View>

        <Card>
          <View style={{ gap: 14 }}>
            <Row icon={Calendar} text={formatDate(e.start_time)} />
            <Row icon={Clock} text={`${formatTime(e.start_time)} to ${formatTime(e.end_time)}  ·  ${formatHours(hoursBetween(e.start_time, e.end_time))}`} />
            <Row icon={MapPin} text={[e.venue_name, e.address, e.city].filter(Boolean).join(', ') || 'See map'} sub={e.distance_km != null ? `${e.distance_km} km from you` : undefined} />
            <Button title="Open in Maps" icon={Navigation} variant="secondary" size="sm" onPress={() => void openMaps(e.latitude, e.longitude, e.venue_name ?? e.title)} testID="open-maps" />
          </View>
        </Card>

        {organizer.data ? (
          <Card onPress={() => router.push(`/user/${organizer.data!.id}` as never)} testID="organizer-card">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={organizer.data.company_name ?? organizer.data.full_name} uri={publicMediaUrl(organizer.data.photo_path)} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="caption" muted>Posted by</Text>
                <Text variant="bodyMedium" numberOfLines={1}>{organizer.data.company_name ?? organizer.data.full_name}</Text>
                <RatingStars value={organizer.data.rating_avg} count={organizer.data.rating_count} size={14} />
              </View>
              {organizer.data.verified ? <ShieldCheck size={20} color={colors.success} /> : null}
            </View>
          </Card>
        ) : null}

        {e.description ? (
          <View style={{ gap: 6 }}>
            <Text variant="h3">About this event</Text>
            <Text muted>{e.description}</Text>
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <Text variant="h3">Roles and pay</Text>
          {e.shifts.map((s) => {
            const full = s.slots_left <= 0;
            const isSel = !mine && !closed && !full && s.id === chosen?.id;
            const isMine = mine?.shift.id === s.id;
            return (
              <Pressable
                key={s.id}
                testID={`shift-${s.role_name}`}
                disabled={full || !!mine || closed}
                onPress={() => setSelected(s.id)}
                style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 2, borderColor: isSel || isMine ? colors.primary : colors.border, opacity: full && !isMine ? 0.6 : 1 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="bodyMedium" style={{ fontFamily: 'Inter_600SemiBold' }}>{s.role_name}</Text>
                  <Text variant="h3" color={colors.primary}>{rupees(s.pay_amount)}</Text>
                </View>
                {s.description ? <Text variant="small" muted>{s.description}</Text> : null}
                {s.dress_code ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Shirt size={14} color={colors.textMuted} />
                    <Text variant="small" muted>{s.dress_code}</Text>
                  </View>
                ) : null}
                <SlotsProgressBar filled={s.slots_filled} total={s.slots_total} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {full ? <Badge label="Full" tone="neutral" /> : null}
                  {!s.auto_confirm ? <Badge label="Approval needed" tone="warning" /> : <Badge label="Instant booking" tone="success" />}
                  {isMine ? <Badge label="Your role" tone="primary" /> : null}
                </View>
              </Pressable>
            );
          })}
          <Text variant="caption" muted>Pay is per worker for the whole shift and is settled directly with the organizer.</Text>
        </View>
      </Screen>
    </>
  );
}

function Row({ icon: Icon, text, sub }: { icon: typeof Calendar; text: string; sub?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <Icon size={18} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text>{text}</Text>
        {sub ? <Text variant="small" muted>{sub}</Text> : null}
      </View>
    </View>
  );
}
