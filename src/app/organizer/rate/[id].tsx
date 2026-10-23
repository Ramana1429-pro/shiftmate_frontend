import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { ApiError } from '../../../api/client';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { RatingStars } from '../../../components/RatingStars';
import { Footer, Header, Screen } from '../../../components/Screen';
import { Text } from '../../../components/Text';
import { useToast } from '../../../components/Toast';
import { useRateBooking } from '../../../hooks/queries';

export default function RateWorker() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const toast = useToast();
  const rate = useRateBooking();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  const submit = async () => {
    if (!score) return toast('Tap a star to rate', 'error');
    try {
      await rate.mutateAsync({ bookingId: id!, score: score as 1 | 2 | 3 | 4 | 5, comment: comment.trim() || null });
      toast('Rating sent');
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.isConflict) {
        toast('You have already rated this worker');
        router.back();
      } else toast(e instanceof Error ? e.message : 'Could not send rating', 'error');
    }
  };

  return (
    <>
      <Header title="Rate worker" />
      <Screen edges={['bottom']} footer={<Footer><Button title="Submit rating" size="lg" fullWidth loading={rate.isPending} onPress={submit} testID="submit-rating" /></Footer>}>
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 16 }}>
          <Text variant="h2" center>How was {name ?? 'this worker'}?</Text>
          <RatingStars value={score} onChange={setScore} size={40} />
        </View>
        <Input label="Comment (optional)" value={comment} onChangeText={setComment} placeholder="Punctual? Polite? Would you hire them again?" multiline testID="comment" />
      </Screen>
    </>
  );
}
