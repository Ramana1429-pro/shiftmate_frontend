import { Linking, Platform } from 'react-native';

/** Opens the venue in the phone's maps app (or Google Maps on the web). */
export function openMaps(latitude: number, longitude: number, label?: string) {
  const q = label ? encodeURIComponent(label) : `${latitude},${longitude}`;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${q}`
      : Platform.OS === 'android'
        ? `geo:${latitude},${longitude}?q=${latitude},${longitude}(${q})`
        : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  return Linking.openURL(url);
}
