/**
 * Food-vendor selection + view mode. Mirrors the (removed) rewards pattern:
 * `foodVendorSelectedIds` is which vendors the user follows (chosen in the
 * picker), and `foodVendorMode` swaps the calendar between restaurant deals and
 * food-vendor deals. Local/session state — not persisted.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface FoodVendorValue {
  foodVendorSelectedIds: Set<string>;
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  foodVendorMode: boolean;
  setFoodVendorMode: (v: boolean) => void;
  toggleFoodVendorMode: () => void;
}

const Ctx = createContext<FoodVendorValue | undefined>(undefined);

export function FoodVendorProvider({ children }: { children: React.ReactNode }) {
  const [foodVendorSelectedIds, setSelected] = useState<Set<string>>(new Set());
  const [foodVendorMode, setFoodVendorMode] = useState(false);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const toggleFoodVendorMode = useCallback(() => setFoodVendorMode((v) => !v), []);

  const value = useMemo<FoodVendorValue>(
    () => ({
      foodVendorSelectedIds,
      count: foodVendorSelectedIds.size,
      isSelected: (id) => foodVendorSelectedIds.has(id),
      toggle,
      foodVendorMode,
      setFoodVendorMode,
      toggleFoodVendorMode,
    }),
    [foodVendorSelectedIds, toggle, foodVendorMode, toggleFoodVendorMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFoodVendors(): FoodVendorValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFoodVendors must be used within a FoodVendorProvider');
  return ctx;
}
