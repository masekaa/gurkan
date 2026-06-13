/** Geographic helpers: distance math and formatting. No external deps. */

export type LatLng = { lat: number; lng: number };

/** Default map center when a business hasn't pinned a location yet (Bursa). */
export const DEFAULT_CENTER: LatLng = { lat: 40.1885, lng: 29.061 };

export function hasLocation(b: {
  lat?: number | null;
  lng?: number | null;
}): b is { lat: number; lng: number } {
  return typeof b.lat === 'number' && typeof b.lng === 'number';
}

/** Great-circle distance between two points in kilometres (Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth radius, km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Human-friendly distance: "350 m", "1.2 km", "14 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
