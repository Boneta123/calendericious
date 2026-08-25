/**
 * Which restaurants the user has chosen to follow (drives the calendar filter).
 * The set is HYDRATED from the logged-in user's saved `restaurantIds` whenever
 * the session's user changes — on explicit login AND on app-relaunch session
 * restore — so the selection persists across logins. Edits are saved to the
 * server by the profile picker (see profile.tsx).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';

interface RestaurantSelectionValue {
  selectedIds: Set<string>;
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  add: (id: string) => void;
  /** Replace the whole selection (e.g. hydrate from the logged-in user). */
  setAll: (ids: string[]) => void;
}

const Ctx = createContext<RestaurantSelectionValue | undefined>(undefined);

export function RestaurantSelectionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Hydrate from the user's saved selection when the SESSION USER changes (login,
  // restore, logout) — keyed on the id so in-session edits aren't clobbered.
  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    const uid = user?.id ?? null;
    if (uid === hydratedFor.current) return;
    hydratedFor.current = uid;
    setSelectedIds(new Set(user?.restaurantIds ?? []));
  }, [user?.id, user?.restaurantIds]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const add = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const setAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const value = useMemo<RestaurantSelectionValue>(
    () => ({
      selectedIds,
      count: selectedIds.size,
      isSelected: (id) => selectedIds.has(id),
      toggle,
      add,
      setAll,
    }),
    [selectedIds, toggle, add, setAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRestaurantSelection(): RestaurantSelectionValue {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error('useRestaurantSelection must be used within a RestaurantSelectionProvider');
  return ctx;
}
