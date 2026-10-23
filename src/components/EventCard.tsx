import { Clock, MapPin, Zap } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import type { AppEvent } from '../api/types';
import { colors } from '../theme';
import { eventLook } from '../utils/eventStyle';
import { countdown, formatDate, formatTime, rupees } from '../utils/format';
import { Badge } from './Badge';
import { Card } from './Card';
import { SlotsProgressBar } from './ProgressBar';
import { Text } from './Text';

/** Event tile used on the worker home feed and the organizer's events list. */
export function EventCard({
  event,
  now,
  onPress,
  showUrgent = true,
}: {
  event: AppEvent;
  now: number;
  onPress: () => void;
  showUrgent?: boolean;
}) {
  const look = eventLook(event.event_type);
  const Icon = look.icon;
  const msLeft = new Date(event.start_time).getTime() - now;
  const urgent = showUrgent && msLeft > 0 && msLeft < 24 * 3600 * 1000;
  const total = event.shifts.reduce((a, s) => a + s.slots_total, 0);
  const filled = event.shifts.reduce((a, s) => a + s.slots_filled, 0);
  const top = [...event.shifts].sort((a, b) => b.pay_amount - a.pay_amount)[0];
  const more = event.shifts.length - 1;

  return (
    <Card onPress={onPress} testID={`event-${event.id}`} style={{ padding: 18 }}>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            backgroundColor: look.soft,
            borderWidth: 1,
            borderColor: look.color + '25',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={26} color={look.color} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text variant="h3" style={{ flex: 1, fontSize: 16, fontFamily: 'Inter_700Bold' }} numberOfLines={1}>
              {event.title}
            </Text>
            {urgent ? <Badge label="Urgent" tone="warning" icon={Zap} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={13} color={colors.textMuted} />
            <Text variant="small" muted style={{ fontSize: 13 }}>
              {formatDate(event.start_time)} · {formatTime(event.start_time)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color={colors.textMuted} />
            <Text variant="small" muted numberOfLines={1} style={{ flex: 1, fontSize: 13 }}>
              {[event.venue_name, event.city].filter(Boolean).join(', ') || 'Location on map'}
              {event.distance_km != null ? `  ·  ${event.distance_km} km` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text variant="bodyMedium" style={{ fontFamily: 'Inter_700Bold', color: colors.primary, fontSize: 16 }}>
            {top ? rupees(top.pay_amount) : ''}
          </Text>
          <Text variant="small" muted>
            {top ? `· ${top.role_name}` : ''}
            {more > 0 ? `  (+${more} more)` : ''}
          </Text>
        </View>
        {urgent ? (
          <Text variant="caption" color={colors.accentDark} style={{ fontFamily: 'Inter_600SemiBold' }}>
            Starts in {countdown(msLeft)}
          </Text>
        ) : null}
      </View>
      <View style={{ marginTop: 10 }}>
        <SlotsProgressBar filled={filled} total={total} />
      </View>
    </Card>
  );
}
