/**
 * "Near me" toggle + device location + adjustable radius. When ON we ask for the
 * device's location and reveal user-added LOCAL spots within `radiusMi` (10/25/50)
 * of it. Admin chains (no address/coords) are never distance-filtered — they show
 * by selection instead. Local/session state, applied client-side on top of the
 * restaurant/vendor picker.
 */

import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

export const NEAR_ME_RADIUS_OPTIONS = [10, 25, 50] as const;
export const NEAR_ME_RADIUS_DEFAULT = 25;

interface NearMeValue {
  nearMe: boolean;
  coords: { lat: number; lng: number } | null;
  radiusMi: number;
  toggleNearMe: () => void;
  setRadiusMi: (mi: number) => void;
}

const Ctx = createContext<NearMeValue | undefined>(undefined);

export function NearMeProvider({ children }: { children: React.ReactNode }) {
  const { user, updateNearMeRadius } = useAuth();
  const [nearMe, setNearMe] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusMi, setRadiusState] = useState<number>(NEAR_ME_RADIUS_DEFAULT);

  // Restore the saved radius when a user's session loads (login / app launch).
  useEffect(() => {
    if (typeof user?.nearMeRadius === 'number') setRadiusState(user.nearMeRadius);
  }, [user?.nearMeRadius]);

  // Change the radius AND persist it to the user's account (so it follows them).
  const setRadiusMi = useCallback(
    (mi: number) => {
      setRadiusState(mi);
      updateNearMeRadius(mi);
    },
    [updateNearMeRadius],
  );

  const toggleNearMe = useCallback(async () => {
    const next = !nearMe;
    setNearMe(next);
    // On turning ON (first time), grab the device location for the radius filter.
    if (next && !coords) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {
        /* no location — local spots simply won't appear until coords resolve */
      }
    }
  }, [nearMe, coords]);

  const value = useMemo<NearMeValue>(
    () => ({ nearMe, coords, radiusMi, toggleNearMe, setRadiusMi }),
    [nearMe, coords, radiusMi, toggleNearMe, setRadiusMi],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNearMe(): NearMeValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNearMe must be used within a NearMeProvider');
  return ctx;
}
