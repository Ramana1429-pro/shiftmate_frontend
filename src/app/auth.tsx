import { useRouter } from 'expo-router';
import { Lock, Mail, Sparkles, UserPlus, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { colors, radius } from '../theme';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, devLogin, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const e = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(e)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    try {
      await signIn(e, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setBusy(false);
    }
  };

  const handleDevLogin = async (role: 'organizer' | 'worker') => {
    setError(null);
    setBusy(true);
    try {
      await devLogin(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in with dev account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingTop: 32, gap: 20 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={32} color={colors.white} />
        </View>
        <Text variant="h1" center>
          Welcome back
        </Text>
        <Text muted center>
          Log in to see your shifts.
        </Text>
      </View>

      <Input
        label="Email"
        icon={Mail}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        testID="email"
      />
      <Input
        label="Password"
        icon={Lock}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        testID="password"
        onSubmitEditing={submit}
      />

      {error ? (
        <Text variant="small" color={colors.dangerDark} testID="auth-error">
          {error}
        </Text>
      ) : null}

      <Button title="Log in" size="lg" fullWidth loading={busy} onPress={submit} testID="auth-submit" />

      {/* Don't have an account -> Sign up */}
      <View style={{ alignItems: 'center', marginTop: 8, gap: 10 }}>
        <Text muted variant="small">
          Don't have an account?
        </Text>
        <Button
          title="Sign up"
          variant="secondary"
          icon={UserPlus}
          fullWidth
          onPress={() => router.push('/role')}
          testID="goto-signup"
        />
      </View>

      {(!isSupabaseConfigured || __DEV__) ? (
        <View style={{ marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderColor: colors.border, gap: 10 }}>
          <Text variant="caption" muted center style={{ letterSpacing: 0.5 }}>
            QUICK DEV LOGIN (1-CLICK)
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Organizer"
                icon={Zap}
                variant="secondary"
                size="sm"
                fullWidth
                loading={busy}
                onPress={() => handleDevLogin('organizer')}
                testID="dev-login-organizer"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Worker"
                icon={Zap}
                variant="secondary"
                size="sm"
                fullWidth
                loading={busy}
                onPress={() => handleDevLogin('worker')}
                testID="dev-login-worker"
              />
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
