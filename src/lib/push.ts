import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { setPushToken } from '../api/users';

// Remote push notifications were removed from Expo Go on Android in SDK 53+.
// Statically importing 'expo-notifications' triggers an immediate crash at bundle evaluation time.
// We dynamically require the module only when running outside of Expo Go.
let Notifications: typeof import('expo-notifications') | null = null;

if (!isRunningInExpoGo()) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('expo-notifications could not be loaded:', e);
  }
}

// Show notifications even while the app is open.
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('Failed to set notification handler:', e);
  }
}

/**
 * Asks for permission, gets the Expo push token and saves it on the server.
 * Returns the token, or null when push is not possible (simulator, permission denied, Expo Go).
 * Needs an EAS project id in app.json: expo.extra.eas.projectId.
 */
export async function registerForPush(): Promise<string | null> {
  if (isRunningInExpoGo()) {
    return null;
  }

  if (!Notifications || !Device.isDevice) return null; // simulators cannot receive push

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('No EAS project id found, so push notifications are disabled.');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await setPushToken(token);
    return token;
  } catch (e) {
    console.warn('Failed to register for push notifications:', e);
    return null;
  }
}

