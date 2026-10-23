import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import * as bookings from '../api/bookings';
import * as events from '../api/events';
import type {
  BookingWhen,
  EventInput,
  EventStatus,
  ListEventsParams,
  RatingInput,
} from '../api/types';
import { getPublicProfile } from '../api/users';

/** Query keys in one place, so invalidation never misses a screen. */
export const qk = {
  events: (params: ListEventsParams) => ['events', params] as const,
  event: (id: string) => ['event', id] as const,
  myEvents: (status?: EventStatus) => ['myEvents', status ?? 'all'] as const,
  bookings: (when: BookingWhen) => ['bookings', when] as const,
  eventBookings: (id: string, status?: string) => ['eventBookings', id, status ?? 'all'] as const,
  attendance: (id: string) => ['attendance', id] as const,
  user: (id: string) => ['user', id] as const,
};

// ---------------------------------------------------------------- queries

/** Home feed. Scroll to the end and call fetchNextPage(). */
export function useEventFeed(params: Omit<ListEventsParams, 'offset'> = {}, enabled = true) {
  const limit = params.limit ?? 20;
  return useInfiniteQuery({
    queryKey: qk.events({ ...params, limit }),
    queryFn: ({ pageParam, signal }) => events.listEvents({ ...params, limit, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.items.length < limit ? undefined : last.offset + limit),
    enabled,
  });
}

export const useEvent = (eventId: string | undefined) =>
  useQuery({ queryKey: qk.event(eventId ?? ''), queryFn: () => events.getEvent(eventId!), enabled: !!eventId });

export const useMyEvents = (status?: EventStatus) =>
  useQuery({ queryKey: qk.myEvents(status), queryFn: () => events.myEvents({ status }) });

export const useMyBookings = (when: BookingWhen) =>
  useQuery({ queryKey: qk.bookings(when), queryFn: () => bookings.myBookings(when) });

export const useEventBookings = (eventId: string | undefined, status?: string) =>
  useQuery({
    queryKey: qk.eventBookings(eventId ?? '', status),
    queryFn: () => events.getEventBookings(eventId!, status),
    enabled: !!eventId,
  });

/** Live attendance screen. Refreshes itself every 20 seconds while the screen is open. */
export const useAttendance = (eventId: string | undefined, pollMs = 20000) =>
  useQuery({
    queryKey: qk.attendance(eventId ?? ''),
    queryFn: () => events.getAttendance(eventId!),
    enabled: !!eventId,
    refetchInterval: pollMs,
  });

export const usePublicProfile = (userId: string | undefined) =>
  useQuery({ queryKey: qk.user(userId ?? ''), queryFn: () => getPublicProfile(userId!), enabled: !!userId });

// -------------------------------------------------------------- mutations
// Each one refreshes the lists it affects. Use `mutation.error?.message` to show errors.

function useRefresh() {
  const qc = useQueryClient();
  return (...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

export function useBookShift() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (shiftId: string) => bookings.bookShift(shiftId),
    onSettled: () => refresh('events', 'event', 'bookings'),
  });
}

export function useCancelBooking() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (bookingId: string) => bookings.cancelBooking(bookingId),
    onSettled: () => refresh('events', 'event', 'bookings', 'user'),
  });
}

export function useCheckIn() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { bookingId: string; latitude: number; longitude: number; qr_token?: string }) =>
      bookings.checkIn(v.bookingId, { latitude: v.latitude, longitude: v.longitude, qr_token: v.qr_token }),
    onSettled: () => refresh('bookings', 'attendance'),
  });
}

export function useCheckOut() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (bookingId: string) => bookings.checkOut(bookingId),
    onSettled: () => refresh('bookings', 'attendance'),
  });
}

export function useRateBooking() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { bookingId: string } & RatingInput) =>
      bookings.rateBooking(v.bookingId, { score: v.score, comment: v.comment }),
    onSettled: () => refresh('user', 'bookings'),
  });
}

export function useCreateEvent() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: EventInput) => events.createEvent(body),
    onSettled: () => refresh('myEvents', 'events'),
  });
}

export function useCancelEvent() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (eventId: string) => events.cancelEvent(eventId),
    onSettled: () => refresh('myEvents', 'event', 'events', 'eventBookings', 'attendance'),
  });
}

/** Accept, reject or mark a no-show. */
export function useManageBooking() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { bookingId: string; action: 'accept' | 'reject' | 'no-show' }) =>
      v.action === 'accept'
        ? bookings.acceptBooking(v.bookingId)
        : v.action === 'reject'
          ? bookings.rejectBooking(v.bookingId)
          : bookings.markNoShow(v.bookingId),
    onSettled: () => refresh('eventBookings', 'attendance', 'event', 'events'),
  });
}

/**
 * Everyone waiting for approval, across all of the organizer's current events.
 * (The backend lists applicants per event, so this fans out one request per event that needs approval.)
 */
export function useApplicants() {
  const mine = useMyEvents('open');
  const candidates = (mine.data?.items ?? []).filter(
    (e) => new Date(e.end_time).getTime() > Date.now() && e.shifts.some((s) => !s.auto_confirm),
  );
  const results = useQueries({
    queries: candidates.map((e) => ({
      queryKey: qk.eventBookings(e.id, 'applied'),
      queryFn: () => events.getEventBookings(e.id, 'applied'),
    })),
  });
  const items = results.flatMap((r, i) => (r.data ?? []).map((b) => ({ booking: b, event: candidates[i]! })));
  return {
    items,
    isPending: mine.isPending || results.some((r) => r.isPending),
    error: mine.error ?? results.find((r) => r.error)?.error ?? null,
    refetch: async () => {
      await mine.refetch();
      await Promise.all(results.map((r) => r.refetch()));
    },
  };
}
