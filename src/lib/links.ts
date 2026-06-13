import { Linking, Platform } from 'react-native';

/**
 * Deep links that work today without any map SDK or API key: directions open in
 * the device's native maps app (Apple Maps on iOS, Google Maps elsewhere/web),
 * and phone numbers open the dialer.
 */
export async function openDirections(query: string): Promise<void> {
  const q = encodeURIComponent(query.replace(/\n/g, ', ').trim());
  if (!q) return;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`;
  try {
    await Linking.openURL(url);
  } catch {
    // No maps handler available — fail quietly rather than crash the screen.
  }
}

export async function callPhone(phone: string): Promise<void> {
  const num = phone.replace(/[^0-9+]/g, '');
  if (!num) return;
  try {
    await Linking.openURL(`tel:${num}`);
  } catch {
    // No dialer (e.g. desktop web) — ignore.
  }
}
