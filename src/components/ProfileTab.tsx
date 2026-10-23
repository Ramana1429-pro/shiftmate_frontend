import { useRouter } from 'expo-router';
import { Eye, LogOut, Pencil, Settings } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { publicMediaUrl } from '../lib/supabase';
import { colors } from '../theme';
import { reliabilityScore } from '../utils/format';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Card } from './Card';
import { useConfirm } from './Confirm';
import { ListRow } from './ListRow';
import { RatingStars } from './RatingStars';
import { Screen } from './Screen';
import { Text } from './Text';

function Stat({ value, label, testID }: { value: string; label: string; testID?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text variant="h2" testID={testID}>{value}</Text>
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}

/** Profile tab for both roles. */
export function ProfileTab() {
  const router = useRouter();
  const confirm = useConfirm();
  const { profile, session, signOut } = useAuth();
  if (!profile) return null;
  const worker = profile.role === 'worker';

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 8 }}>
        <Avatar name={profile.full_name} uri={publicMediaUrl(profile.photo_path)} size={96} />
        <Text variant="h2" testID="profile-name">{profile.full_name}</Text>
        {!worker && profile.company_name ? <Text muted>{profile.company_name}</Text> : null}
        <Text variant="small" muted>{[profile.city, session?.user.email].filter(Boolean).join(' · ')}</Text>
        <RatingStars value={profile.rating_avg} count={profile.rating_count} size={16} />
        {profile.verified ? <Badge label="Verified" tone="success" /> : null}
      </View>

      {worker ? (
        <Card>
          <View style={{ flexDirection: 'row' }}>
            <Stat value={String(profile.completed_shifts)} label="Shifts done" testID="stat-done" />
            <Stat value={`${reliabilityScore(profile.late_cancellations, profile.no_shows)}%`} label="Reliability" testID="stat-reliability" />
            <Stat value={String(profile.late_cancellations + profile.no_shows)} label="Missed" />
          </View>
        </Card>
      ) : null}

      {worker && profile.skills?.length ? (
        <View style={{ gap: 8 }}>
          <Text variant="label">Skills</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {profile.skills.map((s) => <Badge key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} tone="primary" />)}
          </View>
        </View>
      ) : null}
      {profile.bio ? <Text muted>{profile.bio}</Text> : null}

      <Card padded={false}>
        <ListRow icon={Pencil} label="Edit profile" onPress={() => router.push('/edit-profile')} testID="edit-profile" />
        <ListRow icon={Eye} label="How others see me" onPress={() => router.push(`/user/${profile.id}`)} />
        <ListRow icon={Settings} label="Settings" onPress={() => router.push('/settings')} testID="settings" />
        <ListRow
          icon={LogOut}
          label="Log out"
          danger
          testID="logout"
          onPress={async () => {
            if (await confirm({ title: 'Log out?', message: 'You will need to log in again to see your shifts.', confirmLabel: 'Log out', destructive: true })) await signOut();
          }}
        />
      </Card>
    </Screen>
  );
}
