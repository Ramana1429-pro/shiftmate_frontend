import { useRouter } from 'expo-router';
import React from 'react';

import { useAuth } from '../auth/AuthProvider';
import { ProfileForm } from '../components/ProfileForm';
import { Header, Screen } from '../components/Screen';
import { useToast } from '../components/Toast';

export default function EditProfile() {
  const router = useRouter();
  const toast = useToast();
  const { profile, saveProfile } = useAuth();
  if (!profile) return null;
  return (
    <>
      <Header title="Edit profile" />
      <Screen edges={['bottom']} contentStyle={{ paddingTop: 0 }}>
        <ProfileForm
          role={profile.role}
          initial={profile}
          submitLabel="Save changes"
          onSubmit={async (input) => {
            await saveProfile(input);
            toast('Profile updated');
            router.back();
          }}
        />
      </Screen>
    </>
  );
}
