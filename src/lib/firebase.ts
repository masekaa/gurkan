import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
// @ts-expect-error getReactNativePersistence is missing from the web typings but
// is exported by the package and required for RN session persistence.
import { getReactNativePersistence } from 'firebase/auth';
import {
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { Platform } from 'react-native';

import { env } from './env';

/**
 * Lazily initialise Firebase once, or expose `null` everywhere when the project
 * is not configured (mock mode). Auth uses AsyncStorage on native so sessions
 * survive app restarts; on web the SDK uses its default browser persistence.
 */

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let functionsInstance: Functions | null = null;

if (env.hasFirebase) {
  app = getApps().length ? getApp() : initializeApp(env.firebaseConfig);

  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
  } else {
    // initializeAuth must run exactly once; guard against Fast Refresh re-runs.
    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      authInstance = getAuth(app);
    }
  }

  dbInstance = getFirestore(app);
  functionsInstance = getFunctions(app);
}

export const firebaseApp = app;
export const auth = authInstance;
export const db = dbInstance;
export const functions = functionsInstance;
export const isFirebaseEnabled = app !== null;
