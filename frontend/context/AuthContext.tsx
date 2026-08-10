/**
 * Auth + birthday state.
 *
 * Real create-account + login against the backend (email = login identity,
 * displayName = shown name; passwords hashed server-side). Sessions: login/signup
 * store a bearer token in the device keychain; on launch we restore it, so the
 * user stays logged in across restarts. `initializing` is true until that
 * restore finishes (so the router doesn't flash the login screen).
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuthUser,
  createAccount,
  login as loginApi,
  logout as logoutApi,
  restoreSession,
  saveBirthday,
} from '../data/api';

export type User = AuthUser;

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signUp: (input: {
    displayName: string;
    email: string;
    password: string;
    birthday: string;
  }) => Promise<User>;
  logIn: (input: { email: string; password: string }) => Promise<User>;
  logOut: () => void;
  updateBirthday: (birthday: string) => void;
  updatePhoto: (photo: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore a saved session (token → user) once on launch.
  useEffect(() => {
    let active = true;
    restoreSession()
      .then((restored) => active && setUser(restored))
      .finally(() => active && setInitializing(false));
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
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
      logOut: () => {
        setUser(null); // snappy UI
        logoutApi(); // revoke server-side + clear token (best-effort)
      },
      updateBirthday: (birthday) => {
        setUser((prev) => {
          if (!prev) return prev;
          saveBirthday(prev.id, birthday).catch(() => {}); // best-effort persist
          return { ...prev, birthday };
        });
      },
      updatePhoto: (photo) =>
        setUser((prev) => (prev ? { ...prev, profilePhoto: photo } : prev)),
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
