import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { auth, db, isFirebaseEnabled } from '@/lib/firebase';
import { DEMO_BUSINESS_ID, MOCK_USER_ID } from '@/data/mock';
import type { Profile, UserRole } from '@/types';

interface AuthState {
  loading: boolean;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  /** Switch the current account between customer and business mode. */
  setRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const MOCK_KEY = 'altin100.mockProfile';

function makeReferralCode() {
  return 'ALTIN' + Math.floor(1000 + Math.random() * 9000).toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;

    if (isFirebaseEnabled && auth) {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const p = await loadOrCreateProfile(user.uid, {
            name: user.displayName ?? 'Misafir',
            email: user.email ?? '',
            phone: user.phoneNumber,
          });
          if (active) setProfile(p);
        } else if (active) {
          setProfile(null);
        }
        if (active) setLoading(false);
      });
      return () => {
        active = false;
        unsub();
      };
    }

    // Mock mode: restore persisted profile.
    void AsyncStorage.getItem(MOCK_KEY).then((raw) => {
      if (active && raw) setProfile(JSON.parse(raw));
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function persistMock(p: Profile | null) {
    if (p) await AsyncStorage.setItem(MOCK_KEY, JSON.stringify(p));
    else await AsyncStorage.removeItem(MOCK_KEY);
    setProfile(p);
  }

  const value = useMemo<AuthState>(
    () => ({
      loading,
      profile,
      async signIn(email, password) {
        if (isFirebaseEnabled && auth) {
          await signInWithEmailAndPassword(auth, email, password);
          return;
        }
        await persistMock(mockProfile({ email, name: email.split('@')[0] }));
      },
      async signUp({ name, email, phone, password }) {
        if (isFirebaseEnabled && auth) {
          const cred = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          await fbUpdateProfile(cred.user, { displayName: name });
          await loadOrCreateProfile(cred.user.uid, { name, email, phone });
          return;
        }
        await persistMock(mockProfile({ name, email, phone }));
      },
      async signOut() {
        if (isFirebaseEnabled && auth) {
          await fbSignOut(auth);
          setProfile(null);
          return;
        }
        await persistMock(null);
      },
      async setRole(role) {
        if (!profile) return;
        const businessId = role === 'business' ? DEMO_BUSINESS_ID : null;
        const next: Profile = { ...profile, role, businessId };
        if (isFirebaseEnabled && db) {
          await updateDoc(doc(db, 'profiles', profile.id), { role, businessId });
          setProfile(next);
          return;
        }
        await persistMock(next);
      },
    }),
    [loading, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Read the user's profile doc, creating it on first sign-in. */
async function loadOrCreateProfile(
  uid: string,
  seed: { name: string; email: string; phone?: string | null },
): Promise<Profile> {
  if (!db) return mockProfile(seed);
  const ref = doc(db, 'profiles', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: uid, ...(snap.data() as Omit<Profile, 'id'>) };
  }
  const profile: Profile = {
    id: uid,
    name: seed.name,
    email: seed.email,
    phone: seed.phone ?? null,
    role: 'user',
    referralCode: makeReferralCode(),
    createdAt: new Date().toISOString(),
  };
  const { id, ...data } = profile;
  await setDoc(ref, data);
  return profile;
}

function mockProfile(seed: {
  name?: string;
  email: string;
  phone?: string | null;
}): Profile {
  return {
    id: MOCK_USER_ID,
    name: seed.name || 'Misafir',
    email: seed.email,
    phone: seed.phone ?? null,
    role: 'user',
    referralCode: makeReferralCode(),
    createdAt: new Date().toISOString(),
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
