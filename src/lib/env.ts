/**
 * Environment configuration.
 *
 * Firebase config is read from EXPO_PUBLIC_* variables so it is inlined at
 * build time on every platform (web, iOS, Android). When the config is absent
 * the app transparently falls back to an in-memory mock backend, which lets the
 * skeleton run with zero setup. See README for wiring a real Firebase project.
 */

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() ?? '',
};

export const env = {
  firebaseConfig,
  /** True only when the essential Firebase credentials are present. */
  hasFirebase: Boolean(firebaseConfig.apiKey && firebaseConfig.projectId),
} as const;
