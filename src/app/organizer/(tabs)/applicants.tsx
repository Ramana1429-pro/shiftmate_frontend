import { useFocusEffect, useRouter } from 'expo-router';
import {
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Animated, View } from 'react-native';

import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { RatingStars } from '../../../components/RatingStars';
import { Screen } from '../../../components/Screen';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useToast } from '../../../components/Toast';
import { useApplicants, useManageBooking } from '../../../hooks/queries';
import { publicMediaUrl } from '../../../lib/supabase';
import { colors, fonts, radius, shadow } from '../../../theme';
import { formatDate, formatTime, rupees } from '../../../utils/format';

export default function Applicants() {
  const router = useRouter();
  const toast = useToast();
  const { items, isPending, error, refetch } = useApplicants();
  const manage = useManageBooking();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Animation values for tab visit
  const [headerAnim] = useState(() => new Animated.Value(0));
  const [contentTranslateY] = useState(() => new Animated.Value(0));

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

  const act = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      setProcessingId(bookingId);
      await manage.mutateAsync({ bookingId, action });
      toast(action === 'accept' ? 'Worker confirmed & notified' : 'Application declined');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isPending} contentStyle={{ gap: 14 }}>
      {/* Animated Top Header Row */}
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
              Applicants
            </Text>
            <Text variant="caption" muted style={{ fontSize: 12 }}>
              Workers waiting for your approval on shifts
            </Text>
          </View>

          {items.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.accentSoft,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.chip,
                borderWidth: 1,
                borderColor: colors.accent + '30',
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentDark }} />
              <Text style={{ color: colors.accentDark, fontFamily: fonts.bold, fontSize: 12 }}>
                {items.length} waiting
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.successSoft,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: radius.chip,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
              <Text style={{ color: colors.successDark, fontFamily: fonts.bold, fontSize: 11.5 }}>
                All clear
              </Text>
            </View>
          )}
        </View>

        {/* Header Divider Line */}
        <View style={{ height: 1, backgroundColor: colors.border, marginTop: 12 }} />
      </Animated.View>

      {/* Animated Content Area */}
      <Animated.View
        style={{
          gap: 14,
          transform: [{ translateY: contentTranslateY }],
        }}
      >
        {isPending ? (
          <SkeletonList count={3} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        ) : items.length === 0 ? (
          <View style={{ gap: 14 }}>
            <EmptyState
              icon={UserCheck}
              title="No pending applicants"
              subtitle="When a worker applies to your shifts that require approval, they will show up here immediately."
              actionLabel="View my events"
              onAction={() => router.push('/organizer/events')}
            />

            {/* Quick Hiring Guide Card */}
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
                💡 How worker review works:
              </Text>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: colors.successSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={15} color={colors.successDark} />
                  </View>
                  <Text variant="caption" muted style={{ flex: 1, fontSize: 12 }}>
                    Review ratings, completed shifts, and past reliability before confirming.
                  </Text>
                </View>

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
                    <Zap size={15} color={colors.primary} />
                  </View>
                  <Text variant="caption" muted style={{ flex: 1, fontSize: 12 }}>
                    Accepted workers get instant app alerts and calendar shift sync.
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
                    <Sparkles size={15} color={colors.accentDark} />
                  </View>
                  <Text variant="caption" muted style={{ flex: 1, fontSize: 12 }}>
                    Want faster bookings? Enable "Auto-confirm" on shifts to let verified staff book immediately.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {items.map(({ booking: b, event }) => {
              const matchedShift = event.shifts.find((s) => s.id === b.shift_id);
              const isBusy = processingId === b.id;

              return (
                <Card key={b.id} testID={`applicant-${b.id}`} style={{ padding: 16 }}>
                  <View style={{ gap: 14 }}>
                    {/* Worker Info Row */}
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <Avatar name={b.worker.full_name} uri={publicMediaUrl(b.worker.photo_path)} size={50} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text
                            variant="bodyMedium"
                            style={{ fontFamily: fonts.bold, fontSize: 15.5 }}
                            onPress={() => router.push(`/user/${b.worker.id}`)}
                          >
                            {b.worker.full_name}
                          </Text>
                          <Badge label="Applied" tone="warning" />
                        </View>
                        <RatingStars value={b.worker.rating_avg} count={b.worker.rating_count} size={13} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {b.worker.city ? (
                            <>
                              <MapPin size={11} color={colors.textMuted} />
                              <Text variant="caption" muted style={{ fontSize: 11.5 }}>
                                {b.worker.city} ·{' '}
                              </Text>
                            </>
                          ) : null}
                          <Text variant="caption" muted style={{ fontSize: 11.5 }}>
                            {b.worker.completed_shifts} shifts done
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Shift & Event Details Box */}
                    <View
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 14,
                        padding: 12,
                        gap: 4,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Briefcase size={14} color={colors.primary} />
                          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.text }}>
                            {b.role_name}
                          </Text>
                        </View>
                        {matchedShift ? (
                          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.primaryDark }}>
                            {rupees(matchedShift.pay_amount)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} color={colors.textMuted} />
                        <Text variant="caption" muted style={{ fontSize: 12 }}>
                          {event.title} · {formatDate(event.start_time)}, {formatTime(event.start_time)}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Button
                          title="Decline"
                          variant="danger"
                          icon={X}
                          fullWidth
                          loading={isBusy}
                          disabled={isBusy}
                          onPress={() => act(b.id, 'reject')}
                          testID={`reject-${b.id}`}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          title="Accept"
                          icon={Check}
                          fullWidth
                          loading={isBusy}
                          disabled={isBusy}
                          onPress={() => act(b.id, 'accept')}
                          testID={`accept-${b.id}`}
                        />
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </Animated.View>
    </Screen>
  );
}

