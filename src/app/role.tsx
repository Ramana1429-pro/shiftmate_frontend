import { useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, Users } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { colors, radius, shadow } from '../theme';

export default function RoleScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const options = [
    {
      role: 'worker' as const,
      icon: Briefcase,
      title: 'I want to work',
      body: 'Find and book part-time shifts at events near you.',
    },
    {
      role: 'organizer' as const,
      icon: Users,
      title: 'I need staff',
      body: 'Post an event, set the pay and get your team booked.',
    },
  ];

  const handleSelectRole = (role: 'worker' | 'organizer') => {
    if (session) {
      router.push({ pathname: '/profile-setup', params: { role } });
    } else {
      router.push({ pathname: '/signup', params: { role } });
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingTop: 20, gap: 18 }}>
      {!session ? (
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 }}
        >
          <ArrowLeft size={20} color={colors.text} />
          <Text variant="label">
            Back to Log in
          </Text>
        </Pressable>
      ) : null}

      <View style={{ gap: 6 }}>
        <Text variant="h1">How will you use ShiftMate?</Text>
        <Text muted>Select an option to create your account.</Text>
      </View>

      {options.map((o) => (
        <Pressable
          key={o.role}
          testID={`role-${o.role}`}
          onPress={() => handleSelectRole(o.role)}
          style={({ pressed }) => [
            {
              backgroundColor: colors.card,
              borderRadius: radius.card,
              padding: 20,
              gap: 12,
              borderWidth: 1.5,
              borderColor: pressed ? colors.primary : colors.border,
              opacity: pressed ? 0.9 : 1,
            },
            shadow.card,
          ]}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <o.icon size={26} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text variant="h3">{o.title}</Text>
          <Text muted>{o.body}</Text>
        </Pressable>
      ))}

      {session ? (
        <Button title="Log out" variant="ghost" onPress={() => void signOut()} />
      ) : (
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <Button
            title="Already have an account? Log in"
            variant="ghost"
            onPress={() => router.replace('/auth')}
          />
        </View>
      )}
    </Screen>
  );
}
