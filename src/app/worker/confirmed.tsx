import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Check, Clock, MapPin } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Footer, Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { useMyBookings } from '../../hooks/queries';
import { colors } from '../../theme';
import { checkInOpensAt } from '../../utils/booking';
import { formatDate, formatTime, rupees } from '../../utils/format';

export default function Confirmed() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { data } = useMyBookings('upcoming');
  const b = data?.find((x) => x.id === bookingId);

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={{ paddingTop: 48, alignItems: 'stretch' }}
      footer={
        <Footer>
          <Button title="View my shifts" size="lg" fullWidth onPress={() => router.replace('/worker/shifts' as never)} testID="view-shifts" />
          <Button title="Back to home" variant="ghost" fullWidth onPress={() => router.replace('/worker' as never)} testID="back-home" />
        </Footer>
      }
    >
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={36} color={colors.white} strokeWidth={3} />
          </View>
        </View>
        <Text variant="h1" center testID="confirmed-title">You're booked!</Text>
        <Text muted center>The organizer has been told you're coming.</Text>
      </View>
      {b ? (
        <Card>
          <View style={{ gap: 14 }}>
            <View>
              <Text variant="h3">{b.event.title}</Text>
              <Text muted>{b.shift.role_name} · {rupees(b.shift.pay_amount)}</Text>
            </View>
            <Line icon={Calendar} text={formatDate(b.event.start_time)} />
            <Line icon={Clock} text={`${formatTime(b.event.start_time)} to ${formatTime(b.event.end_time)}`} />
            <Line icon={MapPin} text={[b.event.venue_name, b.event.address, b.event.city].filter(Boolean).join(', ') || 'See map'} />
            <Text variant="small" color={colors.accentDark}>
              Check-in opens at {formatTime(new Date(checkInOpensAt(b.event.start_time)))}. Open the app at the venue and tap Check in.
            </Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function Line({ icon: Icon, text }: { icon: typeof Calendar; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Icon size={16} color={colors.primary} />
      <Text style={{ flex: 1 }}>{text}</Text>
    </View>
  );
}
