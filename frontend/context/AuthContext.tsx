/**
 * Auth + ZIP state for DealDay.
 *
 * Phase 1: purely in-memory. `signUp` / `logIn` just set the current user in
 * React state — there is NO real authentication and NO persistence. When the
 * backend arrives, swap the bodies of these functions; the surface stays the
 * same.
 */

import React, { createContext, useContext, useMemo, useState } from 'react';

export interface User {
  email: string;
  displayName: string;
  zip: string;
}

interface AuthContextValue {
  user: User | null;
  signUp: (input: { email: string; password: string; displayName: string; zip: string }) => void;
  logIn: (input: { email: string; password: string }) => void;
  logOut: () => void;
  updateZip: (zip: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signUp: ({ email, displayName, zip }) => {
        // TODO: backend — create account. Password is accepted but not stored.
        setUser({ email, displayName, zip });
      },
      logIn: ({ email }) => {
        // TODO: backend — verify credentials. For now, sign in with a
        // placeholder profile so the flow is walkable end to end.
        setUser({
          email,
          displayName: email.split('@')[0] || 'Friend',
          zip: '10001',
        });
      },
      logOut: () => setUser(null),
      updateZip: (zip) =>
        setUser((prev) => (prev ? { ...prev, zip } : prev)),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
