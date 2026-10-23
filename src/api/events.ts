import { request } from './client';
import type {
  AppEvent,
  AttendanceRow,
  EventBooking,
  EventInput,
  EventPage,
  EventStatus,
  ListEventsParams,
} from './types';

// ----- workers and organizers -----

/** Open events that still have free slots. Pass lat and lng for "near me". */
export const listEvents = (params: ListEventsParams = {}, signal?: AbortSignal) =>
  request<EventPage>('/events', { query: { ...params }, signal });

export const getEvent = (eventId: string) => request<AppEvent>(`/events/${eventId}`);

// ----- organizer -----

export const createEvent = (body: EventInput) => request<AppEvent>('/events', { method: 'POST', body });

export const myEvents = (params: { status?: EventStatus; limit?: number; offset?: number } = {}) =>
  request<EventPage>('/events/mine', { query: { ...params } });

export const cancelEvent = (eventId: string) => request<AppEvent>(`/events/${eventId}/cancel`, { method: 'POST' });

/** Turn this value into a QR code and show it at the venue. */
export const getCheckinToken = (eventId: string) =>
  request<{ checkin_token: string }>(`/events/${eventId}/checkin-token`).then((r) => r.checkin_token);

/** Applicants and booked workers. A worker's phone number appears only once confirmed. */
export const getEventBookings = (eventId: string, status?: string) =>
  request<EventBooking[]>(`/events/${eventId}/bookings`, { query: { status } });

/** Live attendance: present, late, not_arrived, no_show, completed. */
export const getAttendance = (eventId: string) => request<AttendanceRow[]>(`/events/${eventId}/attendance`);
