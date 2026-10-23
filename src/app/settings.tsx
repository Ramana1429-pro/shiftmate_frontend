import Constants from 'expo-constants';
import { Info, LogOut, Mail, ShieldCheck } from 'lucide-react-native';
import React from 'react';

import { useAuth } from '../auth/AuthProvider';
import { Card } from '../components/Card';
import { useConfirm } from '../components/Confirm';
import { ListRow } from '../components/ListRow';
import { Header, Screen } from '../components/Screen';
import { Text } from '../components/Text';

export default function SettingsScreen() {
  const { session, profile, signOut } = useAuth();
  const confirm = useConfirm();
  return (
    <>
      <Header title="Settings" />
      <Screen edges={['bottom']} contentStyle={{ paddingTop: 0 }}>
        <Card padded={false}>
          <ListRow icon={Mail} label="Email" value={session?.user.email ?? ''} />
          <ListRow icon={ShieldCheck} label="Account type" value={profile?.role === 'organizer' ? 'Organizer' : 'Worker'} />
          <ListRow icon={Info} label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
        </Card>
        <Text variant="caption" muted>
          Your phone number is shared with an organizer only after they confirm you for their shift. Your location is used only to find shifts and to check you in.
        </Text>
        <Card padded={false}>
          <ListRow
            icon={LogOut}
            label="Log out"
            danger
            onPress={async () => {
              if (await confirm({ title: 'Log out?', message: 'You will need to log in again.', confirmLabel: 'Log out', destructive: true })) await signOut();
            }}
          />
        </Card>
      </Screen>
    </>
  );
}
