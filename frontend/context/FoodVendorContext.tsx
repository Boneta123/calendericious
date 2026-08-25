/**
 * Food-vendor selection + view mode. `foodVendorSelectedIds` is which vendors
 * the user follows (chosen in the picker), and `foodVendorMode` swaps the
 * calendar between restaurant deals and food-vendor deals. The selection is
 * HYDRATED from the logged-in user's saved `foodVendorIds` whenever the session
 * user changes (login AND app-relaunch restore), and saved to the server by the
 * profile picker — so it persists across logins.
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

interface FoodVendorValue {
  foodVendorSelectedIds: Set<string>;
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Replace the whole selection (e.g. hydrate from the logged-in user). */
  setAll: (ids: string[]) => void;
  foodVendorMode: boolean;
  setFoodVendorMode: (v: boolean) => void;
  toggleFoodVendorMode: () => void;
}

const Ctx = createContext<FoodVendorValue | undefined>(undefined);

export function FoodVendorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [foodVendorSelectedIds, setSelected] = useState<Set<string>>(new Set());
  const [foodVendorMode, setFoodVendorMode] = useState(false);

  // Hydrate from the user's saved selection when the session user changes.
  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    const uid = user?.id ?? null;
    if (uid === hydratedFor.current) return;
    hydratedFor.current = uid;
    setSelected(new Set(user?.foodVendorIds ?? []));
  }, [user?.id, user?.foodVendorIds]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const setAll = useCallback((ids: string[]) => setSelected(new Set(ids)), []);
  const toggleFoodVendorMode = useCallback(() => setFoodVendorMode((v) => !v), []);

  const value = useMemo<FoodVendorValue>(
    () => ({
      foodVendorSelectedIds,
      count: foodVendorSelectedIds.size,
      isSelected: (id) => foodVendorSelectedIds.has(id),
      toggle,
      setAll,
      foodVendorMode,
      setFoodVendorMode,
      toggleFoodVendorMode,
    }),
    [foodVendorSelectedIds, toggle, setAll, foodVendorMode, toggleFoodVendorMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFoodVendors(): FoodVendorValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFoodVendors must be used within a FoodVendorProvider');
  return ctx;
}
