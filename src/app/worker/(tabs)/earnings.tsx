import { Info, Wallet } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Screen, SectionTitle } from '../../../components/Screen';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useMyBookings } from '../../../hooks/queries';
import { colors } from '../../../theme';
import { earned } from '../../../utils/booking';
import { formatDate, formatHours, hoursBetween, rupees } from '../../../utils/format';

/** Built from completed bookings. The app doesn't handle payments yet, so these are estimates of what organizers owe. */
export default function Earnings() {
  const q = useMyBookings('past');
  const done = useMemo(
    () => (q.data ?? []).filter((b) => b.status === 'completed').sort((a, b) => new Date(b.event.start_time).getTime() - new Date(a.event.start_time).getTime()),
    [q.data],
  );
  const now = new Date();
  const month = done.filter((b) => { const d = new Date(b.event.start_time); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const total = done.reduce((a, b) => a + earned(b), 0);
  const monthTotal = month.reduce((a, b) => a + earned(b), 0);
  const hours = done.reduce((a, b) => a + hoursBetween(b.event.start_time, b.event.end_time), 0);

  return (
    <Screen onRefresh={() => void q.refetch()} refreshing={q.isRefetching}>
      <Text variant="h1">Earnings</Text>
      {q.isPending ? <SkeletonList count={2} /> : q.isError ? <ErrorState message={q.error.message} onRetry={() => void q.refetch()} /> : (
        <>
          <View style={{ backgroundColor: colors.primary, borderRadius: 16, padding: 20, gap: 4 }}>
            <Text variant="small" color="#C7D2FE">Estimated total earned</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, lineHeight: 44, color: colors.white }} testID="earn-total">{rupees(total)}</Text>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 8 }}>
              <View><Text variant="caption" color="#C7D2FE">This month</Text><Text variant="bodyMedium" color={colors.white} testID="earn-month">{rupees(monthTotal)}</Text></View>
              <View><Text variant="caption" color="#C7D2FE">Shifts</Text><Text variant="bodyMedium" color={colors.white}>{done.length}</Text></View>
              <View><Text variant="caption" color="#C7D2FE">Hours</Text><Text variant="bodyMedium" color={colors.white}>{formatHours(hours)}</Text></View>
            </View>
          </View>
          <Button title="Withdraw · coming soon" variant="outline" disabled fullWidth icon={Wallet} />
          <Card style={{ backgroundColor: colors.infoSoft }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Info size={18} color="#0369A1" />
              <Text variant="small" color="#0369A1" style={{ flex: 1 }}>
                Pay is settled directly between you and the organizer. These numbers are what organizers listed for the shifts you completed.
              </Text>
            </View>
          </Card>
          <SectionTitle title="Completed shifts" />
          {done.length === 0 ? (
            <EmptyState icon={Wallet} title="No earnings yet" subtitle="Finish your first shift and it will show up here." />
          ) : (
            done.map((b) => (
              <Card key={b.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" numberOfLines={1}>{b.event.title}</Text>
                    <Text variant="small" muted>{b.shift.role_name} · {formatDate(b.event.start_time)}</Text>
                  </View>
                  <Text variant="h3" color={colors.successDark}>{rupees(b.shift.pay_amount)}</Text>
                </View>
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}
