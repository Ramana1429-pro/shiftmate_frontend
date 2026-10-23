import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from '@tanstack/react-query';

import { getCheckinToken } from '../../../api/events';
import { Card } from '../../../components/Card';
import { Header, Screen } from '../../../components/Screen';
import { ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useEvent } from '../../../hooks/queries';
import { colors } from '../../../theme';

/** Show this at the venue entrance. Workers can scan it when they check in, as extra proof they are on site. */
export default function VenueQr() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ev = useEvent(id);
  const q = useQuery({ queryKey: ['checkin-token', id], queryFn: () => getCheckinToken(id!), enabled: !!id, staleTime: Infinity });
  return (
    <>
      <Header title="Venue QR code" subtitle={ev.data?.title} />
      <Screen edges={['bottom']} contentStyle={{ paddingTop: 8 }}>
        {q.isPending ? <SkeletonList count={1} /> : q.isError ? <ErrorState message={q.error.message} onRetry={() => void q.refetch()} /> : (
          <Card>
            <View style={{ alignItems: 'center', gap: 16, paddingVertical: 16 }} testID="qr-card">
              <View style={{ padding: 16, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                <QRCode value={q.data} size={220} color={colors.text} backgroundColor={colors.white} />
              </View>
              <Text variant="h3" center>Scan to check in</Text>
              <Text muted center>
                Keep this at the entrance. Workers scan it in the app when they arrive. GPS still decides whether they are on site, the QR code is extra proof.
              </Text>
            </View>
          </Card>
        )}
      </Screen>
    </>
  );
}
