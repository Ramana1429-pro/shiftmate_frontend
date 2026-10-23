import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { useAuth } from '../auth/AuthProvider';
import { ProfileForm } from '../components/ProfileForm';
import { Header, Screen } from '../components/Screen';
import { Text } from '../components/Text';
import type { Role } from '../api/types';

export default function ProfileSetup() {
  const { role: param } = useLocalSearchParams<{ role?: string }>();
  const role: Role = param === 'organizer' ? 'organizer' : 'worker';
  const { saveProfile } = useAuth();
  return (
    <>
      <Header title={role === 'worker' ? 'Set up your profile' : 'Set up your company'} />
      <Screen edges={['bottom']} contentStyle={{ paddingTop: 0 }}>
        <Text muted>{role === 'worker' ? 'Organizers use this to decide who to book.' : 'Workers see this before they apply.'}</Text>
        <ProfileForm role={role} submitLabel="Continue" onSubmit={async (input) => void (await saveProfile(input))} />
      </Screen>
    </>
  );
}
