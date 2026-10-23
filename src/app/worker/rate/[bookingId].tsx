import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { ApiError } from '../../../api/client';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { RatingStars } from '../../../components/RatingStars';
import { Footer, Header, Screen } from '../../../components/Screen';
import { Text } from '../../../components/Text';
import { useToast } from '../../../components/Toast';
import { useMyBookings, usePublicProfile, useRateBooking } from '../../../hooks/queries';
import { publicMediaUrl } from '../../../lib/supabase';

export default function RateOrganizer() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const toast = useToast();
  const past = useMyBookings('past');
  const b = past.data?.find((x) => x.id === bookingId);
  const org = usePublicProfile(b?.event.organizer_id);
  const rate = useRateBooking();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  const submit = async () => {
    if (!score) return toast('Tap a star to rate', 'error');
    try {
      await rate.mutateAsync({ bookingId: bookingId!, score: score as 1 | 2 | 3 | 4 | 5, comment: comment.trim() || null });
      toast('Thanks for your feedback!');
      router.replace('/worker/shifts' as never);
    } catch (e) {
      if (e instanceof ApiError && e.isConflict) {
        toast('You have already rated this shift');
        router.replace('/worker/shifts' as never);
      } else toast(e instanceof Error ? e.message : 'Could not send rating', 'error');
    }
  };

  const name = org.data?.company_name ?? org.data?.full_name ?? 'the organizer';
  return (
    <>
      <Header title="Rate your experience" />
      <Screen
        edges={['bottom']}
        footer={<Footer><Button title="Submit rating" size="lg" fullWidth loading={rate.isPending} onPress={submit} testID="submit-rating" /><Button title="Skip" variant="ghost" fullWidth onPress={() => router.replace('/worker/shifts' as never)} /></Footer>}
      >
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 16 }}>
          <Avatar name={name} uri={publicMediaUrl(org.data?.photo_path)} size={80} />
          <Text variant="h2" center>How was {name}?</Text>
          {b ? <Text muted center>{b.event.title}</Text> : null}
          <RatingStars value={score} onChange={setScore} size={40} />
        </View>
        <Input label="Comment (optional)" value={comment} onChangeText={setComment} placeholder="Was it well organised? Was the pay on time?" multiline testID="comment" />
      </Screen>
    </>
  );
}
