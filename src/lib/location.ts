import * as Location from 'expo-location';

import { checkIn } from '../api/bookings';
import type { Booking } from '../api/types';

export interface Coords {
  latitude: number;
  longitude: number;
}

/** Asks for permission if needed, then returns the current position. */
export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is needed to find shifts near you and to check in.');
  }
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

/** "I've arrived": reads the GPS position and checks in. Pass the scanned QR value if you have one. */
export async function checkInHere(bookingId: string, qrToken?: string): Promise<Booking> {
  const coords = await getCurrentCoords();
  return checkIn(bookingId, { ...coords, qr_token: qrToken });
}
