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
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { auth, db, isFirebaseEnabled } from '@/lib/firebase';
import { createBusiness } from '@/data/repository';
import { DEMO_BUSINESS_ID, MOCK_USER_ID } from '@/data/mock';
import type { BusinessCategory, Profile, UserRole } from '@/types';

interface AuthState {
  loading: boolean;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    accountType?: UserRole;
    businessName?: string;
    businessCategory?: BusinessCategory;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  /** Switch the current account between customer and business mode. */
  setRole: (role: UserRole) => Promise<void>;
  /** Update editable profile fields (name / phone). */
  updateProfile: (patch: { name?: string; phone?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const MOCK_KEY = 'altin100.mockProfile';

function makeReferralCode() {
  return 'ALTIN' + Math.floor(1000 + Math.random() * 9000).toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  // True while signUp() is writing the profile, to suppress the auth listener.
  const signingUp = useRef(false);

  useEffect(() => {
    let active = true;

    if (isFirebaseEnabled && auth) {
      const unsub = onAuthStateChanged(auth, async (user) => {
        // During signUp() we write the profile (with the chosen role) ourselves;
        // skip the listener so it doesn't race and create a default 'user' doc.
        if (signingUp.current) {
          if (active) setLoading(false);
          return;
        }
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
      async signUp({ name, email, phone, password, accountType, businessName, businessCategory }) {
        const isBiz = accountType === 'business' && !!businessName?.trim();
        signingUp.current = true;
        try {
          if (isFirebaseEnabled && auth && db) {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await fbUpdateProfile(cred.user, { displayName: name });
            const uid = cred.user.uid;
            const businessId = isBiz
              ? await createBusiness({
                  ownerId: uid,
                  name: businessName!.trim(),
                  category: businessCategory ?? 'erkek_berberi',
                  phone,
                })
              : null;
            // Write the full profile explicitly (the auth listener is suppressed
            // via signingUp so it can't race and create a default 'user' doc).
            const profile: Profile = {
              id: uid,
              name,
              email,
              phone: phone || null,
              role: isBiz ? 'business' : 'user',
              referralCode: makeReferralCode(),
              createdAt: new Date().toISOString(),
              businessId,
            };
            const { id, ...data } = profile;
            await setDoc(doc(db, 'profiles', uid), data);
            setProfile(profile);
            return;
          }
          // Mock mode
          const businessId = isBiz
            ? await createBusiness({
                ownerId: MOCK_USER_ID,
                name: businessName!.trim(),
                category: businessCategory ?? 'erkek_berberi',
                phone,
              })
            : null;
          await persistMock(
            mockProfile({
              name,
              email,
              phone,
              role: isBiz ? 'business' : 'user',
              businessId,
            }),
          );
        } finally {
          signingUp.current = false;
        }
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
        // Preserve an existing business link (a real owner keeps their own
        // business); a pure demo user gets the sample business the first time
        // they enter business mode.
        const businessId =
          profile.businessId ?? (role === 'business' ? DEMO_BUSINESS_ID : null);
        const next: Profile = { ...profile, role, businessId };
        if (isFirebaseEnabled && db) {
          await updateDoc(doc(db, 'profiles', profile.id), { role, businessId });
          setProfile(next);
          return;
        }
        await persistMock(next);
      },
      async updateProfile(patch) {
        if (!profile) return;
        const next: Profile = { ...profile, ...patch };
        if (isFirebaseEnabled && db) {
          await updateDoc(doc(db, 'profiles', profile.id), patch);
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
  role?: UserRole;
  businessId?: string | null;
}): Profile {
  return {
    id: MOCK_USER_ID,
    name: seed.name || 'Misafir',
    email: seed.email,
    phone: seed.phone ?? null,
    role: seed.role ?? 'user',
    referralCode: makeReferralCode(),
    createdAt: new Date().toISOString(),
    businessId: seed.businessId ?? null,
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
