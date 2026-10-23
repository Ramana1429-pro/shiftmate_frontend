import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, LogOut, MapPin, QrCode } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { QrScanner } from '../../../components/QrScanner';
import { Header, Screen } from '../../../components/Screen';
import { ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useToast } from '../../../components/Toast';
import { useCheckIn, useCheckOut, useMyBookings } from '../../../hooks/queries';
import { getCurrentCoords } from '../../../lib/location';
import { colors } from '../../../theme';
import { checkInOpensAt } from '../../../utils/booking';
import { formatTime } from '../../../utils/format';
import { openMaps } from '../../../utils/maps';
import { useNow } from '../../../utils/useNow';

export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const now = useNow(15000);
  const upcoming = useMyBookings('upcoming');
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [scanner, setScanner] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const b = upcoming.data?.find((x) => x.id === id);

  if (upcoming.isPending) return <><Header title="Check in" /><Screen edges={['bottom']}><SkeletonList count={1} /></Screen></>;
  if (upcoming.isError) return <><Header title="Check in" /><Screen edges={['bottom']}><ErrorState message={upcoming.error.message} onRetry={() => void upcoming.refetch()} /></Screen></>;
  if (!b) return <><Header title="Check in" /><Screen edges={['bottom']}><ErrorState message="This shift isn't active any more." onRetry={() => router.replace('/worker/shifts' as never)} /></Screen></>;

  const opens = checkInOpensAt(b.event.start_time);
  const tooEarly = now < opens;
  const done = b.status === 'checked_in';

  const doCheckIn = async () => {
    setProblem(null);
    setLocating(true);
    try {
      const c = await getCurrentCoords();
      await checkIn.mutateAsync({ bookingId: b.id, ...c, qr_token: qr ?? undefined });
      toast(b.event.start_time && new Date(b.event.start_time).getTime() + 15 * 60000 < Date.now() ? 'Checked in (marked late)' : 'You are checked in!');
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Could not check in');
    } finally {
      setLocating(false);
    }
  };

  const doCheckOut = async () => {
    try {
      await checkOut.mutateAsync(b.id);
      toast('Shift completed. Great work!');
      router.replace({ pathname: '/worker/rate/[bookingId]', params: { bookingId: b.id } } as never);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not check out', 'error');
    }
  };

  return (
    <>
      <Header title="Check in" subtitle={b.event.title} />
      <Screen edges={['bottom']} contentStyle={{ paddingTop: 8 }}>
        <Card>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 12 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: done ? colors.successSoft : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              {done ? <CheckCircle2 size={44} color={colors.success} /> : <MapPin size={40} color={colors.primary} />}
            </View>
            <Text variant="h2" center testID="checkin-state">{done ? "You're checked in" : tooEarly ? 'Check-in opens soon' : 'Are you at the venue?'}</Text>
            <Text muted center>
              {done
                ? `Checked in at ${b.checked_in_at ? formatTime(b.checked_in_at) : 'now'}${b.is_late ? ' (late)' : ''}. Tap Check out when your shift ends.`
                : tooEarly
                  ? `You can check in from ${formatTime(new Date(opens))}.`
                  : 'We use your phone location to confirm you are at the venue. You need to be within 200 metres.'}
            </Text>
          </View>
        </Card>

        {problem ? (
          <Card style={{ backgroundColor: colors.dangerSoft }}>
            <Text color={colors.dangerDark} testID="checkin-error">{problem}</Text>
          </Card>
        ) : null}

        {!done ? (
          <>
            <Button title="I've arrived · Check in" size="lg" fullWidth loading={locating || checkIn.isPending} disabled={tooEarly} icon={MapPin} onPress={doCheckIn} testID="do-checkin" />
            <Button
              title={qr ? 'QR code scanned ✓' : 'Scan venue QR code (optional)'}
              variant="outline"
              fullWidth
              icon={QrCode}
              disabled={tooEarly}
              onPress={() => setScanner(true)}
              testID="scan-qr"
            />
          </>
        ) : (
          <Button title="Check out · Shift done" size="lg" fullWidth variant="accent" icon={LogOut} loading={checkOut.isPending} onPress={doCheckOut} testID="do-checkout" />
        )}
        <Button title="Open venue in Maps" variant="ghost" fullWidth onPress={() => void openMaps(b.event.latitude, b.event.longitude, b.event.venue_name ?? b.event.title)} />
      </Screen>
      <QrScanner visible={scanner} onClose={() => setScanner(false)} onScanned={(v) => { setQr(v); setScanner(false); toast('QR code scanned'); }} />
    </>
  );
}
