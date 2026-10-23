import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, Lock, Mail, MapPin, Phone, User as UserIcon, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { Role } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { colors, radius } from '../theme';

export default function SignupScreen() {
  const router = useRouter();
  const { role: paramRole } = useLocalSearchParams<{ role?: string }>();
  const role: Role = paramRole === 'organizer' ? 'organizer' : 'worker';

  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWorker = role === 'worker';

  const submit = async () => {
    setError(null);
    const name = fullName.trim();
    const mail = email.trim();
    const pass = password;
    const ph = phone.trim();
    const c = city.trim();

    if (name.length < 2) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setError('Please enter a valid email address.');
    if (pass.length < 6) return setError('Password must be at least 6 characters.');
    if (isWorker && ph.replace(/\D/g, '').length < 10) {
      return setError('Please enter a valid 10-digit phone number so organizers can contact you.');
    }

    setBusy(true);
    try {
      await signUp({
        email: mail,
        password: pass,
        role,
        full_name: name,
        phone: ph || null,
        city: c || null,
      });
      // Once signed up successfully, RootStack will automatically navigate to /worker or /organizer
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingTop: 16, gap: 16 }}>
      <Pressable
        onPress={() => router.back()}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 }}
      >
        <ArrowLeft size={20} color={colors.text} />
        <Text variant="label">
          Change Role
        </Text>
      </Pressable>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radius.chip,
              backgroundColor: colors.primarySoft,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isWorker ? (
              <Briefcase size={14} color={colors.primary} />
            ) : (
              <Users size={14} color={colors.primary} />
            )}
            <Text variant="label" color={colors.primary}>
              {isWorker ? 'Worker' : 'Organizer'}
            </Text>
          </View>
        </View>

        <Text variant="h1">
          {isWorker ? 'Create Worker Account' : 'Create Organizer Account'}
        </Text>
        <Text muted>
          {isWorker
            ? 'Sign up to find and book shifts at events near you.'
            : 'Sign up to post events and find verified staff.'}
        </Text>
      </View>

      <Input
        label="Full Name"
        icon={UserIcon}
        value={fullName}
        onChangeText={setFullName}
        placeholder="e.g. John Doe"
        autoCapitalize="words"
        testID="signup-name"
      />

      <Input
        label="Email"
        icon={Mail}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        testID="signup-email"
      />

      <Input
        label="Password"
        icon={Lock}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        testID="signup-password"
      />

      <Input
        label={isWorker ? 'Phone Number (Required)' : 'Phone Number (Optional)'}
        icon={Phone}
        value={phone}
        onChangeText={setPhone}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        testID="signup-phone"
      />

      <Input
        label="City"
        icon={MapPin}
        value={city}
        onChangeText={setCity}
        placeholder="e.g. Coimbatore"
        autoCapitalize="words"
        testID="signup-city"
      />

      {error ? (
        <Text variant="small" color={colors.dangerDark} testID="signup-error">
          {error}
        </Text>
      ) : null}

      <Button
        title="Create Account"
        size="lg"
        fullWidth
        loading={busy}
        onPress={submit}
        testID="signup-submit"
      />

      <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 16 }}>
        <Button
          title="Already have an account? Log in"
          variant="ghost"
          onPress={() => router.replace('/auth')}
        />
      </View>
    </Screen>
  );
}
