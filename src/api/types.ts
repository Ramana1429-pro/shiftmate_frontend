// Types that mirror the FastAPI response models. Dates are ISO strings.

export type Role = 'worker' | 'organizer';
export type EventStatus = 'open' | 'cancelled' | 'completed';
export type BookingStatus =
  | 'applied'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'checked_in'
  | 'completed'
  | 'no_show';
export type AttendanceState =
  | 'present'
  | 'late'
  | 'not_arrived'
  | 'no_show'
  | 'completed'
  | 'pending'
  | 'cancelled';
export type UploadBucket = 'public-media' | 'private-docs';

// ---------- users ----------
export interface ProfileInput {
  role: Role;
  full_name: string;
  phone?: string | null;
  city?: string | null;
  bio?: string | null;
  photo_path?: string | null;
  skills?: string[] | null;
  company_name?: string | null;
}

export interface User {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
  city: string | null;
  bio: string | null;
  photo_path: string | null;
  skills: string[] | null;
  company_name: string | null;
  rating_avg: number;
  rating_count: number;
  completed_shifts: number;
  late_cancellations: number;
  no_shows: number;
  verified: boolean;
}

/** What other users can see. No phone number. */
export interface PublicUser {
  id: string;
  role: Role;
  full_name: string;
  city: string | null;
  photo_path: string | null;
  company_name: string | null;
  rating_avg: number;
  rating_count: number;
  completed_shifts: number;
  verified: boolean;
}

// ---------- events and shifts ----------
export interface ShiftInput {
  role_name: string;
  description?: string | null;
  dress_code?: string | null;
  /** Rupees per worker for the whole shift */
  pay_amount: number;
  slots_total: number;
  /** false = the organizer must accept each worker */
  auto_confirm?: boolean;
}

export interface EventInput {
  title: string;
  description?: string | null;
  event_type?: string | null;
  venue_name?: string | null;
  address?: string | null;
  city?: string | null;
  latitude: number;
  longitude: number;
  /** ISO string with a timezone, e.g. new Date(...).toISOString() */
  start_time: string;
  end_time: string;
  shifts: ShiftInput[];
}

export interface Shift {
  id: string;
  role_name: string;
  description: string | null;
  dress_code: string | null;
  pay_amount: number;
  slots_total: number;
  slots_filled: number;
  slots_left: number;
  auto_confirm: boolean;
}

export interface AppEvent {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  start_time: string;
  end_time: string;
  status: EventStatus;
  shifts: Shift[];
  /** Only set when you searched with lat and lng */
  distance_km: number | null;
}

export interface EventPage {
  items: AppEvent[];
  limit: number;
  offset: number;
}

export interface ListEventsParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  city?: string;
  date_from?: Date | string;
  date_to?: Date | string;
  min_pay?: number;
  limit?: number;
  offset?: number;
}

// ---------- bookings ----------
export interface Booking {
  id: string;
  shift_id: string;
  worker_id: string;
  status: BookingStatus;
  applied_at: string;
  cancelled_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  is_late: boolean;
  checkin_method: 'gps' | 'gps+qr' | null;
}

export interface EventBrief {
  id: string;
  organizer_id: string;
  title: string;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  start_time: string;
  end_time: string;
  status: EventStatus;
}

export interface BookingDetail extends Booking {
  shift: Shift;
  event: EventBrief;
}

export type BookingWhen = 'upcoming' | 'past' | 'cancelled';

export interface CheckinInput {
  latitude: number;
  longitude: number;
  /** Value scanned from the organizer's venue QR code (optional extra proof) */
  qr_token?: string;
}

export interface EventBooking extends Booking {
  worker: PublicUser;
  role_name: string;
  /** Only present for confirmed workers */
  phone: string | null;
}

export interface AttendanceRow {
  booking_id: string;
  worker: PublicUser;
  role_name: string;
  status: BookingStatus;
  checked_in_at: string | null;
  is_late: boolean;
  attendance: AttendanceState;
}

// ---------- ratings and uploads ----------
export interface RatingInput {
  score: 1 | 2 | 3 | 4 | 5;
  comment?: string | null;
}

export interface Rating {
  id: string;
  booking_id: string;
  rater_id: string;
  ratee_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface SignedUpload {
  upload_url: string;
  path: string;
  bucket: UploadBucket;
}
