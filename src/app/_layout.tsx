import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../auth/AuthProvider';
import { ConfirmProvider } from '../components/Confirm';
import { ToastProvider } from '../components/Toast';
import { colors } from '../theme';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { session, profile, needsProfile } = useAuth();
  const signedIn = !!session;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="role" />
      <Stack.Screen name="signup" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="intro" />
        <Stack.Screen name="auth" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && needsProfile}>
        <Stack.Screen name="profile-setup" />
      </Stack.Protected>
      <Stack.Protected guard={profile?.role === 'worker'}>
        <Stack.Screen name="worker" />
      </Stack.Protected>
      <Stack.Protected guard={profile?.role === 'organizer'}>
        <Stack.Screen name="organizer" />
      </Stack.Protected>
      <Stack.Protected guard={!!profile}>
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="settings" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <StatusBar style="dark" />
              <RootStack />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
