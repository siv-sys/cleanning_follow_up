import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/database.types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  /** True until the initial session (and its profile) has been resolved. */
  loading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    // Keep this callback synchronous: calling Supabase from inside it can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const loadProfile = useCallback(async (id: string | null) => {
    if (!id) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    setProfileLoading(true);
    // The role shown in the UI is read from the database, never from the JWT
    // metadata (which users can edit). RLS still enforces every permission.
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    setProfileLoading(false);
    if (error) {
      setProfile(null);
      setProfileError(error.message);
    } else if (!data) {
      setProfile(null);
      setProfileError('Your profile was not found. Ask an administrator to check your account.');
    } else {
      setProfile(data);
      setProfileError(null);
    }
  }, []);

  useEffect(() => {
    void loadProfile(userId);
  }, [userId, loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(userId), [loadProfile, userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading: !sessionReady || profileLoading || (Boolean(userId) && !profile && !profileError),
      profileError,
      refreshProfile,
      signOut,
    }),
    [session, profile, sessionReady, profileLoading, userId, profileError, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
