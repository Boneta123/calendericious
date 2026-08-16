/**
 * "Near me" toggle. No coordinates — the signal is whether a brand has a
 * specific street address. Admin-seeded chains have NO address and always show
 * when selected; user-added specific places DO have an address and appear only
 * when this is ON. So OFF = chains only, ON = chains + the local places.
 * Local/session state, applied client-side on top of the restaurant/vendor picker.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface NearMeValue {
  nearMe: boolean;
  toggleNearMe: () => void;
}

const Ctx = createContext<NearMeValue | undefined>(undefined);

export function NearMeProvider({ children }: { children: React.ReactNode }) {
  const [nearMe, setNearMe] = useState(false);
  const toggleNearMe = useCallback(() => setNearMe((v) => !v), []);
  const value = useMemo<NearMeValue>(() => ({ nearMe, toggleNearMe }), [nearMe, toggleNearMe]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNearMe(): NearMeValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNearMe must be used within a NearMeProvider');
  return ctx;
}
