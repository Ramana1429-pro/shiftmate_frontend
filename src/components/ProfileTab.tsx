import { useFocusEffect, useRouter } from 'expo-router';
import {
  Building2,
  CheckCircle2,
  Eye,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Settings,
  Star,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Animated, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { useMyEvents } from '../hooks/queries';
import { publicMediaUrl } from '../lib/supabase';
import { colors, fonts, radius, shadow } from '../theme';
import { eventPhase } from '../utils/booking';
import { reliabilityScore } from '../utils/format';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Card } from './Card';
import { useConfirm } from './Confirm';
import { ListRow } from './ListRow';
import { Screen } from './Screen';
import { Text } from './Text';

function StatItem({ value, label, testID }: { value: string | number; label: string; testID?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 2 }}>
      <Text variant="h2" testID={testID} style={{ fontFamily: fonts.bold, fontSize: 17, color: colors.text }}>
        {value}
      </Text>
      <Text variant="caption" muted style={{ fontFamily: fonts.medium, fontSize: 11 }}>
        {label}
      </Text>
    </View>
  );
}

/** Profile tab for both roles. */
export function ProfileTab() {
  const router = useRouter();
  const confirm = useConfirm();
  const { profile, session, signOut } = useAuth();
  const myEvents = useMyEvents();

  // Entrance animations on visit
  const [heroAnim] = useState(() => new Animated.Value(0));
  const [contentAnim] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      heroAnim.setValue(0);
      contentAnim.setValue(0);

      Animated.stagger(60, [
        Animated.spring(heroAnim, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }),
        Animated.spring(contentAnim, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }),
      ]).start();
    }, [heroAnim, contentAnim]),
  );

  if (!profile) return null;
  const worker = profile.role === 'worker';

  // Stats calculation
  const allEvents = myEvents.data?.items ?? [];
  const activeEventsCount = allEvents.filter((e) => eventPhase(e, Date.now()) !== 'past').length;

  return (
    <Screen contentStyle={{ gap: 16 }}>
      {/* Animated Hero Profile Card */}
      <Animated.View
        style={{
          transform: [
            {
              translateY: heroAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        }}
      >
        <Card style={{ padding: 14, gap: 10 }}>
          {/* Compact Top Row: Avatar on Left + Details on Right */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Avatar (compact 54px) with verified badge */}
            <View style={{ position: 'relative' }}>
              <Avatar name={profile.full_name} uri={publicMediaUrl(profile.photo_path)} size={54} />
              {profile.verified ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: colors.white,
                  }}
                >
                  <CheckCircle2 size={11} color={colors.white} strokeWidth={2.5} />
                </View>
              ) : null}
            </View>

            {/* Details Column */}
            <View style={{ flex: 1, gap: 3 }}>
              {/* Name & Role Pill */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <Text
                  variant="h2"
                  style={{ fontSize: 17, fontFamily: fonts.bold, color: colors.text, flex: 1 }}
                  testID="profile-name"
                  numberOfLines={1}
                >
                  {profile.full_name}
                </Text>

                {!worker ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3.5,
                      backgroundColor: colors.primarySoft,
                      paddingHorizontal: 8,
                      paddingVertical: 2.5,
                      borderRadius: radius.chip,
                    }}
                  >
                    <Building2 size={10.5} color={colors.primaryDark} />
                    <Text style={{ color: colors.primaryDark, fontFamily: fonts.semibold, fontSize: 10.5 }}>
                      {profile.company_name ? profile.company_name : 'Organizer'}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3.5,
                      backgroundColor: colors.accentSoft,
                      paddingHorizontal: 8,
                      paddingVertical: 2.5,
                      borderRadius: radius.chip,
                    }}
                  >
                    <Zap size={10.5} color={colors.accentDark} />
                    <Text style={{ color: colors.accentDark, fontFamily: fonts.semibold, fontSize: 10.5 }}>
                      Worker
                    </Text>
                  </View>
                )}
              </View>

              {/* Subtitle Row: City, Rating, Email inline */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {profile.city ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} color={colors.textMuted} />
                    <Text variant="caption" muted style={{ fontSize: 11.5 }}>
                      {profile.city}
                    </Text>
                  </View>
                ) : null}

                {/* Rating inline: Star + Number or New */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Star size={11} color={colors.accent} fill={profile.rating_avg > 0 ? colors.accent : 'transparent'} strokeWidth={1.8} />
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 11.5, color: colors.text }}>
                    {profile.rating_count === 0 || !profile.rating_avg ? 'New' : profile.rating_avg.toFixed(1)}
                  </Text>
                  {profile.rating_count > 0 ? (
                    <Text variant="caption" muted style={{ fontSize: 10.5 }}>
                      ({profile.rating_count})
                    </Text>
                  ) : null}
                </View>

                {session?.user.email ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Mail size={11} color={colors.textMuted} />
                    <Text variant="caption" muted style={{ fontSize: 11.5 }} numberOfLines={1}>
                      {session.user.email}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, width: '100%', backgroundColor: colors.border }} />

          {/* Compact Metrics Bar inside Card */}
          <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
            {worker ? (
              <>
                <StatItem value={profile.completed_shifts} label="Shifts done" testID="stat-done" />
                <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />
                <StatItem
                  value={`${reliabilityScore(profile.late_cancellations, profile.no_shows)}%`}
                  label="Reliability"
                  testID="stat-reliability"
                />
                <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />
                <StatItem value={profile.late_cancellations + profile.no_shows} label="Missed" />
              </>
            ) : (
              <>
                <StatItem value={allEvents.length} label="Total Events" testID="stat-events" />
                <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />
                <StatItem value={activeEventsCount} label="Active Events" testID="stat-active" />
                <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />
                <StatItem
                  value={profile.rating_avg > 0 ? profile.rating_avg.toFixed(1) : '5.0'}
                  label="Rating"
                />
              </>
            )}
          </View>
        </Card>
      </Animated.View>

      {/* Animated Action Menus */}
      <Animated.View
        style={{
          gap: 16,
          transform: [
            {
              translateY: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
      >
        {/* Worker Skills Section (if worker) */}
        {worker && profile.skills?.length ? (
          <View style={{ gap: 8 }}>
            <Text variant="caption" muted style={{ fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 0.6, marginLeft: 4 }}>
              SKILLS & SPECIALIZATIONS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {profile.skills.map((s) => (
                <Badge key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} tone="primary" />
              ))}
            </View>
          </View>
        ) : null}

        {/* Bio / About Section (if present) */}
        {profile.bio ? (
          <View style={{ gap: 6 }}>
            <Text variant="caption" muted style={{ fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 0.6, marginLeft: 4 }}>
              ABOUT
            </Text>
            <Card style={{ padding: 16 }}>
              <Text muted style={{ lineHeight: 22, fontSize: 13.5 }}>
                {profile.bio}
              </Text>
            </Card>
          </View>
        ) : null}

        {/* Account Menu Card */}
        <View style={{ gap: 6 }}>
          <Text variant="caption" muted style={{ fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 0.6, marginLeft: 4 }}>
            ACCOUNT & PREFERENCES
          </Text>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            <ListRow
              icon={Pencil}
              label="Edit profile"
              subtitle="Update name, bio, photo & contact"
              onPress={() => router.push('/edit-profile')}
              testID="edit-profile"
            />
            <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 68 }} />
            <ListRow
              icon={Eye}
              label="How others see me"
              subtitle="Preview your public profile & reviews"
              onPress={() => router.push(`/user/${profile.id}`)}
            />
            <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 68 }} />
            <ListRow
              icon={Settings}
              label="Settings"
              subtitle="App settings & notifications"
              onPress={() => router.push('/settings')}
              testID="settings"
            />
          </Card>
        </View>

        {/* Session / Log Out Card */}
        <View style={{ gap: 6 }}>
          <Text variant="caption" muted style={{ fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 0.6, marginLeft: 4 }}>
            SECURITY & SESSION
          </Text>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            <ListRow
              icon={LogOut}
              label="Log out"
              subtitle="Sign out of this device"
              danger
              testID="logout"
              onPress={async () => {
                if (
                  await confirm({
                    title: 'Log out?',
                    message: 'You will need to sign in again to access your account.',
                    confirmLabel: 'Log out',
                    destructive: true,
                  })
                ) {
                  await signOut();
                }
              }}
            />
          </Card>
        </View>
      </Animated.View>
    </Screen>
  );
}

