import AsyncStorage from '@react-native-async-storage/async-storage';

/** Storage key for the one-time onboarding flow. */
export const ONBOARDING_SEEN_KEY = 'altin100:onboarding-seen';

/** Resolves true once the user has completed (or skipped) onboarding. */
export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === '1';
  } catch {
    // On storage failure, don't trap the user in onboarding forever.
    return true;
  }
}
