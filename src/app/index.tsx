import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { colors } from '../theme';

import { SEEN_INTRO_KEY } from '../lib/flags';

/** Entry gate: sends the user to the right place for their state. */
export default function Gate() {
  const { loading, session, profile, needsProfile, error, refreshProfile, signOut } = useAuth();
  const [seenIntro, setSeenIntro] = useState<boolean | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SEEN_INTRO_KEY)
      .then((v) => setSeenIntro(v === '1'))
      .catch(() => setSeenIntro(true));
  }, []);

  if (loading || seenIntro === null) return <Splash />;
  if (!session) return <Redirect href={seenIntro ? '/auth' : '/intro'} />;
  if (needsProfile) return <Redirect href="/role" />;
  if (profile) return <Redirect href={profile.role === 'organizer' ? '/organizer' : '/worker'} />;

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text variant="h2" center>
          Couldn't load your account
        </Text>
        <Text muted center>
          {error}
        </Text>
        <Button
          title="Try again"
          loading={retrying}
          onPress={async () => {
            setRetrying(true);
            await refreshProfile();
            setRetrying(false);
          }}
          testID="retry-profile"
        />
        <Button title="Log out" variant="ghost" onPress={() => void signOut()} />
      </View>
    );
  }
  return <Splash />;
}

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={36} color={colors.white} />
      </View>
      <Text variant="h2" color={colors.white}>
        ShiftMate
      </Text>
      <ActivityIndicator color={colors.white} />
    </View>
  );
}
