import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiError, configureApiAuth } from '../api/client';
import { devLoginWithApi, loginWithApi, signupWithApi, type SignupIn } from '../api/auth';
import { getMe, saveProfile as saveProfileRequest } from '../api/users';
import type { ProfileInput, Role, User } from '../api/types';
import { registerForPush } from '../lib/push';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface AuthState {
  /** true until the stored session and profile have been checked */
  loading: boolean;
  session: Session | null;
  /** The profile from our own database. null until onboarding is done. */
  profile: User | null;
  /** Logged in, but no profile yet: show the "I want to work / I need staff" onboarding */
  needsProfile: boolean;
  /** Set when the profile could not be loaded (server asleep, no connection) */
  error: string | null;
  isSupabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (body: SignupIn) => Promise<void>;
  signInWithDevToken: (token: string) => Promise<void>;
  devLogin: (role: Role) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (input: ProfileInput) => Promise<User>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function makeMockSession(token: string): Session {
  return {
    access_token: token,
    token_type: 'bearer',
    expires_in: 3600 * 24 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
    refresh_token: '',
    user: {
      id: 'auth-user',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  } as unknown as Session;
}

/**
 * Wrap the app like this (QueryClientProvider must be outside):
 *
 *   <QueryClientProvider client={queryClient}>
 *     <AuthProvider>
 *       <RootNavigator />
 *     </AuthProvider>
 *   </QueryClientProvider>
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tell the API client where to get the token from.
  useEffect(() => {
    configureApiAuth({
      getToken: async () => {
        const auth = await AsyncStorage.getItem('@shiftmate/auth_token');
        if (auth) return auth;
        const dev = await AsyncStorage.getItem('@shiftmate/dev_token');
        if (dev) return dev;
        if (isSupabaseConfigured) {
          return (await supabase.auth.getSession()).data.session?.access_token ?? null;
        }
        return null;
      },
      refreshToken: async () => {
        const auth = await AsyncStorage.getItem('@shiftmate/auth_token');
        if (auth) return auth;
        const dev = await AsyncStorage.getItem('@shiftmate/dev_token');
        if (dev) return dev;
        if (isSupabaseConfigured) {
          return (await supabase.auth.refreshSession()).data.session?.access_token ?? null;
        }
        return null;
      },
      onSignedOut: () => {
        void AsyncStorage.removeItem('@shiftmate/auth_token');
        void AsyncStorage.removeItem('@shiftmate/dev_token');
        if (isSupabaseConfigured) {
          void supabase.auth.signOut().catch(() => {});
        }
      },
    });
  }, []);

  const loadProfile = useCallback(async () => {
    setError(null);
    try {
      setProfile(await getMe());
      setNeedsProfile(false);
    } catch (e) {
      if (e instanceof ApiError && e.isForbidden) {
        setProfile(null);
        setNeedsProfile(true); // logged in, no profile yet
      } else {
        setError(e instanceof Error ? e.message : 'Could not load your profile');
      }
    }
  }, []);

  // Follow the session (backend auth token, dev token, or Supabase session).
  useEffect(() => {
    let active = true;

    AsyncStorage.getItem('@shiftmate/auth_token')
      .then(async (storedAuth) => {
        if (!active) return;
        if (storedAuth) {
          setSession(makeMockSession(storedAuth));
          await loadProfile();
          if (active) setLoading(false);
          return;
        }

        const storedDev = await AsyncStorage.getItem('@shiftmate/dev_token');
        if (storedDev) {
          setSession(makeMockSession(storedDev));
          await loadProfile();
          if (active) setLoading(false);
          return;
        }

        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (!active) return;
          setSession(data.session);
          if (data.session) await loadProfile();
        }
        if (active) setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    let unsubscribe = () => {};
    if (isSupabaseConfigured) {
      const { data: sub } = supabase.auth.onAuthStateChange(async (event, next) => {
        const storedAuth = await AsyncStorage.getItem('@shiftmate/auth_token');
        const storedDev = await AsyncStorage.getItem('@shiftmate/dev_token');
        if (storedAuth || storedDev) return;
        setSession(next);
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setNeedsProfile(false);
          queryClient.clear();
        } else if (event === 'SIGNED_IN') {
          void loadProfile();
        }
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadProfile, queryClient]);

  // Register for push notifications once the profile exists.
  useEffect(() => {
    if (profile) registerForPush().catch((e) => console.warn('push registration failed', e));
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      profile,
      needsProfile,
      error,
      isSupabaseConfigured,
      signIn: async (email, password) => {
        const res = await loginWithApi({ email, password });
        await AsyncStorage.setItem('@shiftmate/auth_token', res.access_token);
        setSession(makeMockSession(res.access_token));
        await loadProfile();
      },
      signUp: async (body: SignupIn) => {
        const res = await signupWithApi(body);
        await AsyncStorage.setItem('@shiftmate/auth_token', res.access_token);
        setSession(makeMockSession(res.access_token));
        await loadProfile();
      },
      devLogin: async (role: Role) => {
        const res = await devLoginWithApi({ role });
        await AsyncStorage.setItem('@shiftmate/auth_token', res.access_token);
        setSession(makeMockSession(res.access_token));
        await loadProfile();
      },
      signInWithDevToken: async (token: string) => {
        await AsyncStorage.setItem('@shiftmate/auth_token', token);
        setSession(makeMockSession(token));
        await loadProfile();
      },
      signOut: async () => {
        await AsyncStorage.removeItem('@shiftmate/auth_token');
        await AsyncStorage.removeItem('@shiftmate/dev_token');
        setSession(null);
        setProfile(null);
        setNeedsProfile(false);
        queryClient.clear();
        if (isSupabaseConfigured) {
          await supabase.auth.signOut().catch(() => {});
        }
      },
      saveProfile: async (input) => {
        const saved = await saveProfileRequest(input);
        setProfile(saved);
        setNeedsProfile(false);
        return saved;
      },
      refreshProfile: loadProfile,
    }),
    [loading, session, profile, needsProfile, error, loadProfile, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
