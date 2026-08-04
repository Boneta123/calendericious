/**
 * Which restaurants the user has chosen to follow. Only these will show in the
 * calendar later (that filtering is NOT wired yet — this just stores the set).
 *
 * Phase 1: in-memory only, no persistence. // TODO: backend
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
