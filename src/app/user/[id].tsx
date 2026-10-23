import { useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { RatingStars } from '../../components/RatingStars';
import { Header, Screen } from '../../components/Screen';
import { ErrorState, SkeletonList } from '../../components/States';
import { Text } from '../../components/Text';
import { usePublicProfile } from '../../hooks/queries';
import { publicMediaUrl } from '../../lib/supabase';

/** What other people see about a user. No phone number here. */
export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = usePublicProfile(id);
  const u = q.data;
  return (
    <>
      <Header title="Profile" />
      <Screen edges={['bottom']}>
        {q.isPending ? <SkeletonList count={1} /> : q.isError ? <ErrorState message={q.error.message} onRetry={() => void q.refetch()} /> : u ? (
          <>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Avatar name={u.company_name ?? u.full_name} uri={publicMediaUrl(u.photo_path)} size={96} />
              <Text variant="h2" testID="public-name">{u.company_name ?? u.full_name}</Text>
              {u.company_name ? <Text muted>{u.full_name}</Text> : null}
              {u.city ? <Text variant="small" muted>{u.city}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Badge label={u.role === 'organizer' ? 'Organizer' : 'Worker'} tone="primary" />
                {u.verified ? <Badge label="Verified" tone="success" icon={ShieldCheck} /> : null}
              </View>
            </View>
            <Card>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <RatingStars value={u.rating_avg} count={u.rating_count} />
                  <Text variant="caption" muted>Rating</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                  <Text variant="h3">{u.completed_shifts}</Text>
                  <Text variant="caption" muted>{u.role === 'worker' ? 'Shifts done' : 'Events completed'}</Text>
                </View>
              </View>
            </Card>
          </>
        ) : null}
      </Screen>
    </>
  );
}
