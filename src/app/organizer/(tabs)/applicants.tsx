import { useRouter } from 'expo-router';
import { Check, UserCheck, X } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { RatingStars } from '../../../components/RatingStars';
import { Screen } from '../../../components/Screen';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useToast } from '../../../components/Toast';
import { useApplicants, useManageBooking } from '../../../hooks/queries';
import { publicMediaUrl } from '../../../lib/supabase';
import { colors } from '../../../theme';
import { formatDate, formatTime, reliabilityScore } from '../../../utils/format';

export default function Applicants() {
  const router = useRouter();
  const toast = useToast();
  const { items, isPending, error, refetch } = useApplicants();
  const manage = useManageBooking();

  const act = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      await manage.mutateAsync({ bookingId, action });
      toast(action === 'accept' ? 'Worker confirmed' : 'Application declined');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong', 'error');
    }
  };

  return (
    <Screen onRefresh={() => void refetch()}>
      <Text variant="h1">Applicants</Text>
      <Text muted>Workers waiting for your approval on shifts that need it.</Text>
      {isPending ? <SkeletonList count={2} /> : error ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : items.length === 0 ? (
        <EmptyState icon={UserCheck} title="No one waiting" subtitle="When a worker applies to a shift that needs approval, they show up here." />
      ) : (
        items.map(({ booking: b, event }) => (
          <Card key={b.id} testID={`applicant-${b.id}`}>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Avatar name={b.worker.full_name} uri={publicMediaUrl(b.worker.photo_path)} size={48} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyMedium" style={{ fontFamily: 'Inter_600SemiBold' }} onPress={() => router.push(`/user/${b.worker.id}`)}>{b.worker.full_name}</Text>
                  <RatingStars value={b.worker.rating_avg} count={b.worker.rating_count} size={14} />
                  <Text variant="caption" muted>{b.worker.completed_shifts} shifts done{b.worker.city ? ` · ${b.worker.city}` : ''}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 12 }}>
                <Text variant="label">{b.role_name}</Text>
                <Text variant="small" muted>{event.title} · {formatDate(event.start_time)}, {formatTime(event.start_time)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Button title="Decline" variant="danger" icon={X} fullWidth onPress={() => act(b.id, 'reject')} testID={`reject-${b.id}`} /></View>
                <View style={{ flex: 1 }}><Button title="Accept" icon={Check} fullWidth onPress={() => act(b.id, 'accept')} testID={`accept-${b.id}`} /></View>
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
