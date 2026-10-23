import { CheckCircle2, Clock, LogIn, ShieldX, XCircle } from 'lucide-react-native';
import React from 'react';

import type { AttendanceState, BookingStatus as Status } from '../api/types';
import { Badge, type Tone } from './Badge';

const map: Record<Status, { label: string; tone: Tone; icon: typeof Clock }> = {
  applied: { label: 'Waiting for approval', tone: 'warning', icon: Clock },
  confirmed: { label: 'Confirmed', tone: 'success', icon: CheckCircle2 },
  checked_in: { label: 'Checked in', tone: 'primary', icon: LogIn },
  completed: { label: 'Completed', tone: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', tone: 'neutral', icon: XCircle },
  rejected: { label: 'Declined', tone: 'danger', icon: XCircle },
  no_show: { label: 'No-show', tone: 'danger', icon: ShieldX },
};

export function BookingStatusBadge({ status }: { status: Status }) {
  const m = map[status];
  return <Badge label={m.label} tone={m.tone} icon={m.icon} />;
}

export const attendanceLook: Record<AttendanceState, { label: string; tone: Tone }> = {
  present: { label: 'Present', tone: 'success' },
  late: { label: 'Late', tone: 'warning' },
  not_arrived: { label: 'Not arrived yet', tone: 'neutral' },
  no_show: { label: 'No-show', tone: 'danger' },
  completed: { label: 'Done', tone: 'primary' },
  pending: { label: 'Waiting for approval', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};
