/**
 * Data access layer. Every screen talks to these functions and never to
 * Firebase directly, so the same UI works against either the live backend or
 * the in-memory mock. When `isFirebaseEnabled` is false we read/write the seed
 * arrays from `./mock`.
 *
 * Firestore documents use camelCase field names that match the domain types in
 * `@/types`, so mapping is a simple `{ id, ...data }` spread.
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';

import { db, isFirebaseEnabled } from '@/lib/firebase';
import type {
  Appointment,
  AppointmentStatus,
  Business,
  Loyalty,
  Service,
} from '@/types';
import * as mock from './mock';

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Narrowing helper so TypeScript trusts `db` inside the Firebase branches. */
function requireDb(): Firestore {
  if (!db) throw new Error('Firebase is not configured');
  return db;
}

// ---------------------------------------------------------------------------
// Businesses
// ---------------------------------------------------------------------------

export async function listBusinesses(search = ''): Promise<Business[]> {
  const term = search.trim().toLowerCase();
  if (isFirebaseEnabled) {
    const snap = await getDocs(
      query(
        collection(requireDb(), 'businesses'),
        where('approved', '==', true),
        orderBy('rating', 'desc'),
      ),
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Business)
      .filter((b) =>
        term
          ? b.name.toLowerCase().includes(term) ||
            b.district.toLowerCase().includes(term)
          : true,
      );
  }
  return mock.businesses
    .filter((b) => b.approved)
    .filter((b) =>
      term
        ? b.name.toLowerCase().includes(term) ||
          b.district.toLowerCase().includes(term)
        : true,
    )
    .sort((a, b) => b.rating - a.rating);
}

export async function getBusiness(id: string): Promise<Business | null> {
  if (isFirebaseEnabled) {
    const snap = await getDoc(doc(requireDb(), 'businesses', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Business) : null;
  }
  return mock.businesses.find((b) => b.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export async function listServices(businessId: string): Promise<Service[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(
      query(
        collection(requireDb(), 'services'),
        where('businessId', '==', businessId),
        orderBy('price'),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Service);
  }
  return mock.services.filter((s) => s.businessId === businessId);
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function listAppointments(
  customerId: string,
): Promise<Appointment[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(
      query(
        collection(requireDb(), 'appointments'),
        where('customerId', '==', customerId),
        orderBy('datetime', 'desc'),
      ),
    );
    const rows = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Appointment,
    );
    // Hydrate joins (Firestore has no server-side joins).
    return Promise.all(
      rows.map(async (a) => ({
        ...a,
        business: (await getBusiness(a.businessId)) ?? undefined,
        service: await getService(a.serviceId),
      })),
    );
  }
  return mock.appointments
    .filter((a) => a.customerId === customerId)
    .sort((a, b) => (a.datetime < b.datetime ? 1 : -1))
    .map(hydrate);
}

export async function createAppointment(input: {
  customerId: string;
  businessId: string;
  serviceId: string;
  datetime: string;
}): Promise<Appointment> {
  const base = {
    ...input,
    status: 'pending' as AppointmentStatus,
    createdAt: new Date().toISOString(),
  };
  if (isFirebaseEnabled) {
    const ref = await addDoc(collection(requireDb(), 'appointments'), base);
    return { id: ref.id, ...base };
  }
  const appt: Appointment = { id: uid('a'), ...base };
  mock.appointments.unshift(appt);
  return hydrate(appt);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<void> {
  if (isFirebaseEnabled) {
    await updateDoc(doc(requireDb(), 'appointments', id), { status });
    return;
  }
  const appt = mock.appointments.find((a) => a.id === id);
  if (appt) appt.status = status;
}

// ---------------------------------------------------------------------------
// Loyalty
// ---------------------------------------------------------------------------

export async function listLoyalty(userId: string): Promise<Loyalty[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(
      query(
        collection(requireDb(), 'loyalty'),
        where('userId', '==', userId),
      ),
    );
    const rows = snap.docs.map((d) => d.data() as Loyalty);
    return Promise.all(
      rows.map(async (l) => ({
        ...l,
        business: (await getBusiness(l.businessId)) ?? undefined,
      })),
    );
  }
  return mock.loyalty
    .filter((l) => l.userId === userId)
    .map((l) => ({
      ...l,
      business: mock.businesses.find((b) => b.id === l.businessId),
    }));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getService(id: string): Promise<Service | undefined> {
  if (isFirebaseEnabled) {
    const snap = await getDoc(doc(requireDb(), 'services', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Service) : undefined;
  }
  return mock.services.find((s) => s.id === id);
}

function hydrate(a: Appointment): Appointment {
  return {
    ...a,
    business: mock.businesses.find((b) => b.id === a.businessId),
    service: mock.services.find((s) => s.id === a.serviceId),
  };
}
