import { useLocalSearchParams, useRouter } from 'expo-router';
import { Activity, Calendar, Check, MapPin, Phone, QrCode, Star, X } from 'lucide-react-native';
import React from 'react';
import { Linking, View } from 'react-native';

import type { EventBooking } from '../../../api/types';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { BookingStatusBadge } from '../../../components/BookingStatus';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useConfirm } from '../../../components/Confirm';
import { SlotsProgressBar } from '../../../components/ProgressBar';
import { Footer, Header, Screen, SectionTitle } from '../../../components/Screen';
import { ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useToast } from '../../../components/Toast';
import { useCancelEvent, useEvent, useEventBookings, useManageBooking } from '../../../hooks/queries';
import { useLiveEvent } from '../../../hooks/useLiveEvent';
import { publicMediaUrl } from '../../../lib/supabase';
import { colors } from '../../../theme';
import { eventPhase } from '../../../utils/booking';
import { formatDate, formatTime, rupees } from '../../../utils/format';
import { useNow } from '../../../utils/useNow';

const SHOWN: EventBooking['status'][] = ['applied', 'confirmed', 'checked_in', 'completed', 'no_show'];

export default function OrganizerEventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const now = useNow(15000);
  const ev = useEvent(id);
  const bookings = useEventBookings(id);
  const manage = useManageBooking();
  const cancel = useCancelEvent();
  useLiveEvent(id);

  if (ev.isPending) return <><Header title="Event" /><Screen edges={['bottom']}><SkeletonList count={2} /></Screen></>;
  if (ev.isError) return <><Header title="Event" /><Screen edges={['bottom']}><ErrorState message={ev.error.message} onRetry={() => void ev.refetch()} /></Screen></>;

  const e = ev.data;
  const phase = eventPhase(e, now);
  const workers = (bookings.data ?? []).filter((b) => SHOWN.includes(b.status));
  const total = e.shifts.reduce((a, s) => a + s.slots_total, 0);
  const filled = e.shifts.reduce((a, s) => a + s.slots_filled, 0);

  const act = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      await manage.mutateAsync({ bookingId, action });
      toast(action === 'accept' ? 'Worker confirmed' : 'Application declined');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    }
  };

  const doCancel = async () => {
    const ok = await confirm({
      title: 'Cancel this event?',
      message: `All ${filled} booked worker${filled === 1 ? '' : 's'} will be told the event is cancelled. This can't be undone.`,
      confirmLabel: 'Cancel event',
      cancelLabel: 'Keep event',
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync(e.id);
      toast('Event cancelled');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not cancel the event', 'error');
    }
  };

  const phaseBadge = { upcoming: <Badge label="Upcoming" tone="primary" />, live: <Badge label="Live now" tone="success" />, past: <Badge label="Ended" tone="neutral" />, cancelled: <Badge label="Cancelled" tone="danger" /> }[phase];

  return (
    <>
      <Header title="Manage event" />
      <Screen
        edges={['bottom']}
        contentStyle={{ paddingTop: 0 }}
        onRefresh={() => { void ev.refetch(); void bookings.refetch(); }}
        footer={
          phase === 'upcoming' || phase === 'live' ? (
            <Footer>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Button title="Live attendance" icon={Activity} fullWidth onPress={() => router.push(`/organizer/attendance/${e.id}`)} testID="open-attendance" /></View>
                <View style={{ flex: 1 }}><Button title="Venue QR" icon={QrCode} variant="secondary" fullWidth onPress={() => router.push(`/organizer/qr/${e.id}`)} testID="open-qr" /></View>
              </View>
              <Button title="Cancel event" variant="ghost" fullWidth loading={cancel.isPending} onPress={doCancel} testID="cancel-event" />
            </Footer>
          ) : null
        }
      >
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>{phaseBadge}{e.event_type ? <Badge label={e.event_type} tone="neutral" /> : null}</View>
          <Text variant="h1" testID="event-title">{e.title}</Text>
        </View>
        <Card>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Calendar size={16} color={colors.primary} /><Text>{formatDate(e.start_time)} · {formatTime(e.start_time)} to {formatTime(e.end_time)}</Text></View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><MapPin size={16} color={colors.primary} /><Text style={{ flex: 1 }}>{[e.venue_name, e.city].filter(Boolean).join(', ') || 'See map'}</Text></View>
            <SlotsProgressBar filled={filled} total={total} />
          </View>
        </Card>

        <SectionTitle title="Roles" />
        {e.shifts.map((s) => (
          <Card key={s.id}>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodyMedium" style={{ fontFamily: 'Inter_600SemiBold' }}>{s.role_name}</Text>
                <Text variant="bodyMedium" color={colors.primary}>{rupees(s.pay_amount)}</Text>
              </View>
              <SlotsProgressBar filled={s.slots_filled} total={s.slots_total} />
              {!s.auto_confirm ? <Badge label="Approval needed" tone="warning" /> : null}
            </View>
          </Card>
        ))}

        <SectionTitle title={`Workers (${workers.length})`} />
        {bookings.isPending ? <SkeletonList count={1} /> : bookings.isError ? <ErrorState message={bookings.error.message} onRetry={() => void bookings.refetch()} /> : workers.length === 0 ? (
          <Text muted>No one has booked yet. Workers nearby can see this event.</Text>
        ) : (
          workers.map((b) => (
            <Card key={b.id} testID={`worker-${b.id}`}>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Avatar name={b.worker.full_name} uri={publicMediaUrl(b.worker.photo_path)} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" onPress={() => router.push(`/user/${b.worker.id}`)} numberOfLines={1}>{b.worker.full_name}</Text>
                    <Text variant="small" muted>{b.role_name}{b.worker.rating_count ? ` · ★ ${b.worker.rating_avg.toFixed(1)}` : ' · New'}</Text>
                  </View>
                  <BookingStatusBadge status={b.status} />
                </View>
                {b.phone ? (
                  <Button title={`Call ${b.phone}`} icon={Phone} variant="outline" size="sm" onPress={() => void Linking.openURL(`tel:${b.phone}`)} testID={`call-${b.id}`} />
                ) : null}
                {b.status === 'applied' ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><Button title="Decline" icon={X} variant="danger" size="sm" fullWidth onPress={() => act(b.id, 'reject')} testID={`reject-${b.id}`} /></View>
                    <View style={{ flex: 1 }}><Button title="Accept" icon={Check} size="sm" fullWidth onPress={() => act(b.id, 'accept')} testID={`accept-${b.id}`} /></View>
                  </View>
                ) : null}
                {b.status === 'completed' ? (
                  <Button
                    title="Rate worker"
                    icon={Star}
                    variant="secondary"
                    size="sm"
                    onPress={() => router.push({ pathname: '/organizer/rate/[id]', params: { id: b.id, name: b.worker.full_name } })}
                    testID={`rate-${b.id}`}
                  />
                ) : null}
              </View>
            </Card>
          ))
        )}
      </Screen>
    </>
  );
}
