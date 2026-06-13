import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { LatLng } from '@/lib/geo';

type Status = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

type LocationValue = {
  coords: LatLng | null;
  status: Status;
  /** Request the device location (prompts once). Resolves to coords or null. */
  request: () => Promise<LatLng | null>;
};

const Ctx = createContext<LocationValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const inFlight = useRef<Promise<LatLng | null> | null>(null);

  const request = useCallback(async (): Promise<LatLng | null> => {
    if (coords) return coords;
    if (inFlight.current) return inFlight.current;
    const p = (async () => {
      setStatus('loading');
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          setStatus('denied');
          return null;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setStatus('granted');
        return c;
      } catch {
        setStatus('error');
        return null;
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = p;
    return p;
  }, [coords]);

  const value = useMemo(() => ({ coords, status, request }), [coords, status, request]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserLocation(): LocationValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUserLocation must be used within LocationProvider');
  return v;
}
