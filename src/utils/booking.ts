import type { BookingDetail, BookingStatus } from '../api/types';

export const ACTIVE_STATUSES: BookingStatus[] = ['applied', 'confirmed', 'checked_in'];

/** Must match the backend rules (constants.py). */
export const CHECKIN_OPENS_MIN_BEFORE = 60;
export const LATE_CANCEL_HOURS = 12;

const MIN = 60000;

export function checkInOpensAt(startIso: string) {
  return new Date(startIso).getTime() - CHECKIN_OPENS_MIN_BEFORE * MIN;
}

export function canCheckInNow(b: Pick<BookingDetail, 'status' | 'event'>, now: number) {
  return b.status === 'confirmed' && now >= checkInOpensAt(b.event.start_time) && now <= new Date(b.event.end_time).getTime();
}

export function isLateCancel(startIso: string, now: number) {
  return new Date(startIso).getTime() - now < LATE_CANCEL_HOURS * 3600 * 1000;
}

/** Estimated pay: only completed shifts count, and it is the pay the organizer listed (payments are settled outside the app). */
export function earned(b: BookingDetail) {
  return b.status === 'completed' ? b.shift.pay_amount : 0;
}

export type EventPhase = 'cancelled' | 'upcoming' | 'live' | 'past';

/** The backend never flips events to "completed" by itself, so Live and Past come from the clock. */
export function eventPhase(e: { status: string; start_time: string; end_time: string }, now: number): EventPhase {
  if (e.status === 'cancelled') return 'cancelled';
  if (now < new Date(e.start_time).getTime()) return 'upcoming';
  if (now <= new Date(e.end_time).getTime()) return 'live';
  return 'past';
}
