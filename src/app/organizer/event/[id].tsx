import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Activity,
  Briefcase,
  Calendar,
  Check,
  MapPin,
  Phone,
  QrCode,
  Radio,
  Share2,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  UserCheck,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Animated, Linking, Pressable, Share, View } from 'react-native';

import type { EventBooking } from '../../../api/types';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { BookingStatusBadge } from '../../../components/BookingStatus';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useConfirm } from '../../../components/Confirm';
import { Footer, Header, Screen, SectionTitle } from '../../../components/Screen';
import { ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useToast } from '../../../components/Toast';
import { useCancelEvent, useEvent, useEventBookings, useManageBooking } from '../../../hooks/queries';
import { useLiveEvent } from '../../../hooks/useLiveEvent';
import { publicMediaUrl } from '../../../lib/supabase';
import { colors, fonts, radius, shadow } from '../../../theme';
import { eventPhase } from '../../../utils/booking';
import { eventLook } from '../../../utils/eventStyle';
import { formatDate, formatHours, formatTime, hoursBetween, rupees } from '../../../utils/format';
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

  const [processingId, setProcessingId] = useState<string | null>(null);

  // Entrance animations on screen focus
  const [contentTranslateY] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      contentTranslateY.setValue(14);
      Animated.spring(contentTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }, [contentTranslateY]),
  );

  if (ev.isPending) {
    return (
      <>
        <Header title="Manage event" />
        <Screen edges={['bottom']}>
          <SkeletonList count={3} />
        </Screen>
      </>
    );
  }

  if (ev.isError) {
    return (
      <>
        <Header title="Manage event" />
        <Screen edges={['bottom']}>
          <ErrorState message={ev.error.message} onRetry={() => void ev.refetch()} />
        </Screen>
      </>
    );
  }

  const e = ev.data;
  const phase = eventPhase(e, now);
  const look = eventLook(e.event_type);
  const EventIcon = look.icon;
  const workers = (bookings.data ?? []).filter((b) => SHOWN.includes(b.status));
  const total = e.shifts.reduce((a, s) => a + s.slots_total, 0);
  const filled = e.shifts.reduce((a, s) => a + s.slots_filled, 0);
  const totalBudget = e.shifts.reduce((a, s) => a + s.pay_amount * s.slots_total, 0);
  const remainingSlots = Math.max(0, total - filled);
  const staffingPercent = total > 0 ? Math.round((filled / total) * 100) : 0;

  const handleShare = async () => {
    try {
      await Share.share({
        title: e.title,
        message: `Join our team for "${e.title}" (${e.event_type ?? 'Event'})!\n📅 Date: ${formatDate(e.start_time)}, ${formatTime(e.start_time)} to ${formatTime(e.end_time)}\n📍 Location: ${[e.venue_name, e.city].filter(Boolean).join(', ') || 'In-app venue'}\n💰 Pay: Up to ${rupees(Math.max(...e.shifts.map((s) => s.pay_amount), 0))} / shift\n\nApply on ShiftMate: https://shiftmate.app/event/${e.id}`,
      });
    } catch {
      // User dismissed share dialog
    }
  };

  const act = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      setProcessingId(bookingId);
      await manage.mutateAsync({ bookingId, action });
      toast(action === 'accept' ? 'Worker confirmed & notified' : 'Application declined');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const doCancel = async () => {
    const ok = await confirm({
      title: 'Cancel this event?',
      message: `All ${filled} booked worker${filled === 1 ? '' : 's'} will be notified that the event has been cancelled. This action cannot be undone.`,
      confirmLabel: 'Cancel event',
      cancelLabel: 'Keep event',
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync(e.id);
      toast('Event cancelled');
      router.back();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not cancel the event', 'error');
    }
  };

  const phaseBadge = {
    upcoming: <Badge label="Upcoming" tone="primary" />,
    live: (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: colors.successSoft,
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderRadius: radius.chip,
        }}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
        <Text style={{ color: colors.successDark, fontSize: 11, fontFamily: fonts.bold }}>Live now</Text>
      </View>
    ),
    past: <Badge label="Ended" tone="neutral" />,
    cancelled: <Badge label="Cancelled" tone="danger" />,
  }[phase];

  return (
    <>
      <Header
        title="Manage event"
        subtitle={e.event_type ? `${e.event_type} · ${formatDate(e.start_time)}` : formatDate(e.start_time)}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 }}>
            {phase === 'live' ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: colors.successSoft,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: radius.chip,
                }}
              >
                <Radio size={12} color={colors.successDark} />
                <Text style={{ color: colors.successDark, fontFamily: fonts.bold, fontSize: 11.5 }}>
                  Live
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleShare}
              hitSlop={8}
              accessibilityLabel="Share event details"
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Share2 size={16} color={colors.text} />
            </Pressable>
          </View>
        }
      />
      {/* Header Divider Line */}
      <View style={{ height: 1, backgroundColor: colors.border }} />

      <Screen
        edges={['bottom']}
        contentStyle={{ paddingTop: 14, gap: 16 }}
        onRefresh={() => {
          void ev.refetch();
          void bookings.refetch();
        }}
        footer={
          phase === 'upcoming' || phase === 'live' ? (
            <Footer>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Live attendance"
                    icon={Activity}
                    fullWidth
                    onPress={() => router.push(`/organizer/attendance/${e.id}`)}
                    testID="open-attendance"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Venue QR"
                    icon={QrCode}
                    variant="secondary"
                    fullWidth
                    onPress={() => router.push(`/organizer/qr/${e.id}`)}
                    testID="open-qr"
                  />
                </View>
              </View>
              <Pressable
                onPress={doCancel}
                disabled={cancel.isPending}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  paddingVertical: 7,
                  opacity: pressed ? 0.7 : 1,
                })}
                testID="cancel-event"
              >
                <Text style={{ color: colors.danger, fontFamily: fonts.semibold, fontSize: 13.5 }}>
                  {cancel.isPending ? 'Cancelling event...' : 'Cancel this event'}
                </Text>
              </Pressable>
            </Footer>
          ) : null
        }
      >
        <Animated.View style={{ gap: 16, transform: [{ translateY: contentTranslateY }] }}>
          {/* Hero Event Overview Card */}
          <Card style={{ padding: 18, gap: 14 }}>
            {/* Top Title & Category Row */}
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: look.soft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EventIcon size={26} color={look.color} strokeWidth={2.2} />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {phaseBadge}
                  {e.event_type ? <Badge label={e.event_type} tone="neutral" /> : null}
                  {filled >= total && total > 0 ? <Badge label="Full Team" tone="success" /> : null}
                </View>

                <Text
                  variant="h2"
                  style={{ fontSize: 21, fontFamily: fonts.bold, color: colors.text }}
                  testID="event-title"
                >
                  {e.title}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Schedule & Venue Details */}
            <View style={{ gap: 12 }}>
              {/* Schedule */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text }}>
                    {formatDate(e.start_time)}
                  </Text>
                  <Text variant="caption" muted style={{ fontSize: 12 }}>
                    {formatTime(e.start_time)} to {formatTime(e.end_time)} · {formatHours(hoursBetween(e.start_time, e.end_time))}
                  </Text>
                </View>
              </View>

              {/* Venue Location */}
              <Pressable
                onPress={() => {
                  const query = encodeURIComponent([e.venue_name, e.address, e.city].filter(Boolean).join(', '));
                  if (query) void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin size={17} color={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text }} numberOfLines={1}>
                    {[e.venue_name, e.city].filter(Boolean).join(', ') || 'No venue specified'}
                  </Text>
                  {e.address ? (
                    <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 12 }}>
                      {e.address} · Tap for map ↗
                    </Text>
                  ) : (
                    <Text variant="caption" color={colors.primary} style={{ fontSize: 12, fontFamily: fonts.medium }}>
                      Open venue in Google Maps ↗
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>

            {/* Description if present */}
            {e.description ? (
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, gap: 4 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted, letterSpacing: 0.5 }}>
                  EVENT NOTES
                </Text>
                <Text variant="caption" muted style={{ lineHeight: 18, fontSize: 12.5, color: colors.text }}>
                  {e.description}
                </Text>
              </View>
            ) : null}

            {/* Overall Staffing Progress */}
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.text }}>
                  Overall Staffing
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 13,
                    color: filled >= total && total > 0 ? colors.successDark : colors.primaryDark,
                  }}
                >
                  {filled} of {total} slots filled ({staffingPercent}%)
                </Text>
              </View>

              {/* Progress Bar Track */}
              <View style={{ height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${Math.min(100, staffingPercent)}%`,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: filled >= total && total > 0 ? colors.success : colors.primary,
                  }}
                />
              </View>

              <Text variant="caption" muted style={{ fontSize: 11.5 }}>
                {remainingSlots > 0
                  ? `⚡ ${remainingSlots} worker slot${remainingSlots === 1 ? '' : 's'} remaining open for hire`
                  : '🎉 All slots have been completely filled! Team is ready.'}
              </Text>
            </View>
          </Card>

          {/* Quick Metrics Ribbon */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Stat 1: Staffed Slots */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.card,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: 'center',
                gap: 3,
                ...shadow.card,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Users size={13} color={colors.primary} />
                <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted }}>
                  Staffed
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.text }}>
                {filled} <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted }}>/ {total}</Text>
              </Text>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 10.5,
                  color: filled >= total && total > 0 ? colors.successDark : colors.textMuted,
                }}
              >
                {filled >= total && total > 0 ? 'Full team 🎉' : `${staffingPercent}% booked`}
              </Text>
            </View>

            {/* Stat 2: Active Positions */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.card,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: 'center',
                gap: 3,
                ...shadow.card,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Briefcase size={13} color="#2563EB" />
                <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted }}>
                  Roles
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.text }}>
                {e.shifts.length}
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 10.5, color: colors.textMuted }}>
                {e.shifts.length === 1 ? '1 position' : `${e.shifts.length} positions`}
              </Text>
            </View>

            {/* Stat 3: Est. Total Budget */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.card,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: 'center',
                gap: 3,
                ...shadow.card,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Wallet size={13} color="#059669" />
                <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted }}>
                  Budget
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.text }}>
                {rupees(totalBudget)}
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 10.5, color: colors.textMuted }}>
                Total payout
              </Text>
            </View>
          </View>

          {/* Roles & Shifts Section */}
          <View style={{ gap: 10 }}>
            <SectionTitle title={`Roles & Shifts (${e.shifts.length})`} />
            {e.shifts.map((s) => {
              const rolePercent = s.slots_total > 0 ? Math.round((s.slots_filled / s.slots_total) * 100) : 0;
              const roleRemaining = Math.max(0, s.slots_total - s.slots_filled);
              return (
                <Card key={s.id} style={{ padding: 16, gap: 12 }}>
                  {/* Role Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: colors.primarySoft,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Briefcase size={18} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={{ fontFamily: fonts.bold, fontSize: 15.5, color: colors.text }}>
                          {s.role_name}
                        </Text>
                        <Text variant="caption" muted style={{ fontSize: 11.5 }}>
                          {s.slots_filled} of {s.slots_total} slots filled
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: radius.chip,
                        backgroundColor: colors.primarySoft,
                      }}
                    >
                      <Text style={{ color: colors.primaryDark, fontFamily: fonts.bold, fontSize: 14 }}>
                        {rupees(s.pay_amount)}
                      </Text>
                    </View>
                  </View>

                  {/* Slot Progress Bar */}
                  <View style={{ gap: 4 }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                      <View
                        style={{
                          width: `${rolePercent}%`,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: roleRemaining === 0 ? colors.success : colors.primary,
                        }}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="caption" muted style={{ fontSize: 11 }}>
                        {roleRemaining === 0 ? 'Fully staffed' : `${roleRemaining} open slot${roleRemaining === 1 ? '' : 's'}`}
                      </Text>
                      <Text variant="caption" muted style={{ fontSize: 11, fontFamily: fonts.medium }}>
                        {rolePercent}%
                      </Text>
                    </View>
                  </View>

                  {/* Role Badges & Details */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    {!s.auto_confirm ? (
                      <Badge label="Manual Approval" tone="warning" icon={UserCheck} />
                    ) : (
                      <Badge label="Instant Book" tone="success" icon={Zap} />
                    )}
                    {s.dress_code ? (
                      <Badge label={s.dress_code} tone="neutral" icon={Shirt} />
                    ) : null}
                  </View>

                  {s.description ? (
                    <Text variant="caption" muted style={{ fontSize: 12, lineHeight: 17 }}>
                      {s.description}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
          </View>

          {/* Booked Workers Section */}
          <View style={{ gap: 10 }}>
            <SectionTitle title={`Workers (${workers.length})`} />
            {bookings.isPending ? (
              <SkeletonList count={2} />
            ) : bookings.isError ? (
              <ErrorState message={bookings.error.message} onRetry={() => void bookings.refetch()} />
            ) : workers.length === 0 ? (
              <Card style={{ padding: 24, alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 20,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 2,
                  }}
                >
                  <Users size={26} color={colors.primary} />
                </View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 16.5, color: colors.text }}>
                  No workers booked yet
                </Text>
                <Text muted center style={{ fontSize: 13, lineHeight: 19, maxWidth: 290 }}>
                  Your event is published and live in the shift feed. When workers apply or book, they will appear here with live check-in controls.
                </Text>

                {/* Feature Pills */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#F1F5F9',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: radius.chip,
                    }}
                  >
                    <Sparkles size={12} color={colors.primary} />
                    <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted }}>
                      Nearby Feed Live
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#F1F5F9',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: radius.chip,
                    }}
                  >
                    <ShieldCheck size={12} color={colors.success} />
                    <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted }}>
                      Verified Workers
                    </Text>
                  </View>
                </View>

                <View style={{ width: '100%', marginTop: 6 }}>
                  <Button
                    title="Share event invite"
                    icon={Share2}
                    variant="outline"
                    size="sm"
                    fullWidth
                    onPress={handleShare}
                  />
                </View>
              </Card>
            ) : (
              workers.map((b) => {
                const isBusy = processingId === b.id;
                return (
                  <Card key={b.id} testID={`worker-${b.id}`} style={{ padding: 14 }}>
                    <View style={{ gap: 12 }}>
                      {/* Worker Top Row */}
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <Avatar name={b.worker.full_name} uri={publicMediaUrl(b.worker.photo_path)} size={46} />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            variant="bodyMedium"
                            style={{ fontFamily: fonts.bold, fontSize: 15 }}
                            onPress={() => router.push(`/user/${b.worker.id}`)}
                            numberOfLines={1}
                          >
                            {b.worker.full_name}
                          </Text>
                          <Text variant="caption" muted style={{ fontSize: 12 }}>
                            {b.role_name}
                            {b.worker.rating_count ? ` · ★ ${b.worker.rating_avg.toFixed(1)}` : ' · New'}
                          </Text>
                        </View>
                        <BookingStatusBadge status={b.status} />
                      </View>

                      {/* Call Action if Confirmed & Phone available */}
                      {b.phone ? (
                        <Button
                          title={`Call ${b.phone}`}
                          icon={Phone}
                          variant="outline"
                          size="sm"
                          onPress={() => void Linking.openURL(`tel:${b.phone}`)}
                          testID={`call-${b.id}`}
                        />
                      ) : null}

                      {/* Applied Status Actions */}
                      {b.status === 'applied' ? (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Button
                              title="Decline"
                              icon={X}
                              variant="danger"
                              size="sm"
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
                              size="sm"
                              fullWidth
                              loading={isBusy}
                              disabled={isBusy}
                              onPress={() => act(b.id, 'accept')}
                              testID={`accept-${b.id}`}
                            />
                          </View>
                        </View>
                      ) : null}

                      {/* Completed Status Rating Action */}
                      {b.status === 'completed' ? (
                        <Button
                          title="Rate worker"
                          icon={Star}
                          variant="secondary"
                          size="sm"
                          onPress={() =>
                            router.push({
                              pathname: '/organizer/rate/[id]',
                              params: { id: b.id, name: b.worker.full_name },
                            })
                          }
                          testID={`rate-${b.id}`}
                        />
                      ) : null}
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </Animated.View>
      </Screen>
    </>
  );
}
