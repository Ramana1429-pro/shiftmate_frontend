import { request } from './client';
import type { Booking, BookingDetail, BookingWhen, CheckinInput, Rating, RatingInput } from './types';

// ----- worker -----

/** Books the shift (or applies, when the shift needs approval). 409 means full, overlapping or already booked. */
export const bookShift = (shiftId: string) => request<Booking>(`/shifts/${shiftId}/book`, { method: 'POST' });

export const myBookings = (when: BookingWhen = 'upcoming', params: { limit?: number; offset?: number } = {}) =>
  request<BookingDetail[]>('/bookings/mine', { query: { when, ...params } });

export const cancelBooking = (bookingId: string) =>
  request<Booking>(`/bookings/${bookingId}/cancel`, { method: 'POST' });

/** The server checks you are within about 200 m of the venue and inside the check-in window. */
export const checkIn = (bookingId: string, body: CheckinInput) =>
  request<Booking>(`/bookings/${bookingId}/check-in`, { method: 'POST', body });

export const checkOut = (bookingId: string) => request<Booking>(`/bookings/${bookingId}/check-out`, { method: 'POST' });

// ----- organizer -----

export const acceptBooking = (bookingId: string) =>
  request<Booking>(`/bookings/${bookingId}/accept`, { method: 'POST' });

export const rejectBooking = (bookingId: string) =>
  request<Booking>(`/bookings/${bookingId}/reject`, { method: 'POST' });

/** Allowed 15 minutes after the start. Frees the slot so a replacement can book it. */
export const markNoShow = (bookingId: string) => request<Booking>(`/bookings/${bookingId}/no-show`, { method: 'POST' });

// ----- both -----

/** After a completed shift: the worker rates the organizer and the organizer rates the worker. */
export const rateBooking = (bookingId: string, body: RatingInput) =>
  request<Rating>(`/bookings/${bookingId}/rate`, { method: 'POST', body });
