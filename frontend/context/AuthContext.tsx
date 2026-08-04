/**
 * Auth + ZIP state.
 *
 * Real create-account + login against the backend (email = login identity,
 * displayName = shown name; passwords hashed server-side). No tokens/MFA and no
 * cross-restart session yet — the user logs in each launch.
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import { AuthUser, createAccount, login as loginApi } from '../data/api';

export type User = AuthUser;

interface AuthContextValue {
  user: User | null;
  signUp: (input: {
    displayName: string;
    email: string;
    password: string;
    zip: string;
  }) => Promise<User>;
  logIn: (input: { email: string; password: string }) => Promise<User>;
  logOut: () => void;
  updateZip: (zip: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signUp: async (input) => {
        const created = await createAccount(input);
        setUser(created);
        return created;
      },
      logIn: async (input) => {
        const loggedIn = await loginApi(input);
        setUser(loggedIn);
        return loggedIn;
      },
      logOut: () => setUser(null),
      updateZip: (zip) => setUser((prev) => (prev ? { ...prev, zip } : prev)),
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
