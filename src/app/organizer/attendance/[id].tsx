import { useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import type { AttendanceRow } from '../../../api/types';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { attendanceLook } from '../../../components/BookingStatus';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useConfirm } from '../../../components/Confirm';
import { Header, Screen } from '../../../components/Screen';
import { EmptyState, ErrorState, SkeletonList } from '../../../components/States';
import { Text } from '../../../components/Text';
import { useToast } from '../../../components/Toast';
import { useAttendance, useEvent, useManageBooking } from '../../../hooks/queries';
import { publicMediaUrl } from '../../../lib/supabase';
import { colors } from '../../../theme';
import { formatTime } from '../../../utils/format';

const ORDER: Record<string, number> = { not_arrived: 0, late: 1, present: 2, pending: 3, completed: 4, no_show: 5, cancelled: 6 };

/** Live view of who has arrived. Refreshes itself every 20 seconds. */
export default function Attendance() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const confirm = useConfirm();
  const ev = useEvent(id);
  const q = useAttendance(id);
  const manage = useManageBooking();

  const rows = (q.data ?? []).filter((r) => r.attendance !== 'cancelled').sort((a, b) => (ORDER[a.attendance] ?? 9) - (ORDER[b.attendance] ?? 9));
  const count = (...s: string[]) => rows.filter((r) => s.includes(r.attendance)).length;

  const noShow = async (r: AttendanceRow) => {
    const ok = await confirm({ title: `Mark ${r.worker.full_name} as no-show?`, message: 'Their slot opens up for others and it counts against their reliability.', confirmLabel: 'Mark no-show', destructive: true });
    if (!ok) return;
    try {
      await manage.mutateAsync({ bookingId: r.booking_id, action: 'no-show' });
      toast('Marked as no-show');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not mark no-show', 'error');
    }
  };

  return (
    <>
      <Header title="Live attendance" subtitle={ev.data?.title} />
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <Screen edges={['bottom']} contentStyle={{ paddingTop: 16, gap: 14 }} onRefresh={() => void q.refetch()} refreshing={q.isRefetching}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Summary label="Present" value={count('present', 'late', 'completed')} color={colors.successDark} bg={colors.successSoft} testID="sum-present" />
          <Summary label="Not arrived" value={count('not_arrived')} color={colors.accentDark} bg={colors.accentSoft} testID="sum-missing" />
          <Summary label="Late" value={count('late')} color={colors.dangerDark} bg={colors.dangerSoft} testID="sum-late" />
        </View>
        <Text variant="caption" muted>Updates automatically every 20 seconds.</Text>
        {q.isPending ? <SkeletonList count={3} /> : q.isError ? <ErrorState message={q.error.message} onRetry={() => void q.refetch()} /> : rows.length === 0 ? (
          <EmptyState icon={Users} title="No workers yet" subtitle="Confirmed workers appear here with their check-in status." />
        ) : (
          rows.map((r) => {
            const look = attendanceLook[r.attendance];
            return (
              <Card key={r.booking_id} testID={`att-${r.booking_id}`}>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <Avatar name={r.worker.full_name} uri={publicMediaUrl(r.worker.photo_path)} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" numberOfLines={1}>{r.worker.full_name}</Text>
                      <Text variant="small" muted>{r.role_name}{r.checked_in_at ? ` · in at ${formatTime(r.checked_in_at)}` : ''}</Text>
                    </View>
                    <Badge label={look.label} tone={look.tone} />
                  </View>
                  {r.attendance === 'not_arrived' || r.attendance === 'late' ? (
                    r.attendance === 'not_arrived' ? <Button title="Mark no-show" variant="danger" size="sm" onPress={() => noShow(r)} testID={`noshow-${r.booking_id}`} /> : null
                  ) : null}
                </View>
              </Card>
            );
          })
        )}
      </Screen>
    </>
  );
}

function Summary({ label, value, color, bg, testID }: { label: string; value: number; color: string; bg: string; testID: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 16, padding: 14, gap: 2 }}>
      <Text variant="h2" color={color} testID={testID}>{value}</Text>
      <Text variant="caption" color={color}>{label}</Text>
    </View>
  );
}
