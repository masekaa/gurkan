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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
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

/** Thrown when a slot is already booked (double-booking prevention, FR-3.5). */
export class SlotTakenError extends Error {
  constructor() {
    super('Bu saat dolu.');
    this.name = 'SlotTakenError';
  }
}

/** Appointment statuses that occupy a slot (others free it for re-booking). */
const ACTIVE_STATUSES: AppointmentStatus[] = ['pending', 'approved', 'completed'];
const isActiveStatus = (s: AppointmentStatus) => ACTIVE_STATUSES.includes(s);

/**
 * Deterministic id for a slot lock so a booking can atomically claim a
 * (business, datetime) pair via a transaction — no Cloud Function required.
 */
const slotId = (businessId: string, datetime: string) =>
  `${businessId}__${datetime}`;

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
    // No orderBy in the query: equality + orderBy on a different field would
    // require a Firestore composite index. We sort client-side instead so the
    // app works against a freshly created database with zero index setup.
    const snap = await getDocs(
      query(
        collection(requireDb(), 'businesses'),
        where('approved', '==', true),
      ),
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Business)
      .sort((a, b) => b.rating - a.rating)
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

/** Update editable business profile fields (owner-managed). */
export async function updateBusiness(
  id: string,
  patch: Partial<Omit<Business, 'id'>>,
): Promise<void> {
  if (isFirebaseEnabled) {
    await updateDoc(doc(requireDb(), 'businesses', id), patch);
    return;
  }
  const b = mock.businesses.find((x) => x.id === id);
  if (b) Object.assign(b, patch);
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
      ),
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Service)
      .sort((a, b) => a.price - b.price);
  }
  return mock.services.filter((s) => s.businessId === businessId);
}

export async function createService(input: {
  businessId: string;
  name: string;
  durationMin: number;
  price: number;
}): Promise<Service> {
  if (isFirebaseEnabled) {
    const ref = await addDoc(collection(requireDb(), 'services'), input);
    return { id: ref.id, ...input };
  }
  const service: Service = { id: uid('s'), ...input };
  mock.services.push(service);
  return service;
}

export async function updateService(
  id: string,
  patch: Partial<Omit<Service, 'id' | 'businessId'>>,
): Promise<void> {
  if (isFirebaseEnabled) {
    await updateDoc(doc(requireDb(), 'services', id), patch);
    return;
  }
  const s = mock.services.find((x) => x.id === id);
  if (s) Object.assign(s, patch);
}

export async function deleteService(id: string): Promise<void> {
  if (isFirebaseEnabled) {
    await deleteDoc(doc(requireDb(), 'services', id));
    return;
  }
  const i = mock.services.findIndex((x) => x.id === id);
  if (i >= 0) mock.services.splice(i, 1);
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
      ),
    );
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Appointment)
      .sort((a, b) => (a.datetime < b.datetime ? 1 : -1));
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

/** Appointments belonging to a business (the business-owner inbox). */
export async function listBusinessAppointments(
  businessId: string,
): Promise<Appointment[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(
      query(
        collection(requireDb(), 'appointments'),
        where('businessId', '==', businessId),
      ),
    );
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Appointment)
      .sort((a, b) => (a.datetime < b.datetime ? 1 : -1));
    return Promise.all(
      rows.map(async (a) => ({ ...a, service: await getService(a.serviceId) })),
    );
  }
  return mock.appointments
    .filter((a) => a.businessId === businessId)
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
    const database = requireDb();
    const lockRef = doc(database, 'slots', slotId(input.businessId, input.datetime));
    const apptRef = doc(collection(database, 'appointments'));
    // Atomically claim the slot and create the appointment. If the lock already
    // exists the transaction aborts, so two clients cannot take the same time.
    await runTransaction(database, async (tx) => {
      const existing = await tx.get(lockRef);
      if (existing.exists()) throw new SlotTakenError();
      tx.set(lockRef, {
        businessId: input.businessId,
        datetime: input.datetime,
        customerId: input.customerId,
        appointmentId: apptRef.id,
      });
      tx.set(apptRef, base);
    });
    return { id: apptRef.id, ...base };
  }
  // Mock mode: reject if an active appointment already occupies the slot.
  const taken = mock.appointments.some(
    (a) =>
      a.businessId === input.businessId &&
      a.datetime === input.datetime &&
      isActiveStatus(a.status),
  );
  if (taken) throw new SlotTakenError();
  const appt: Appointment = { id: uid('a'), ...base };
  mock.appointments.unshift(appt);
  return hydrate(appt);
}

/** Booked slot datetimes (ISO) for a business, used to disable taken times. */
export async function listTakenSlots(businessId: string): Promise<string[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(
      query(collection(requireDb(), 'slots'), where('businessId', '==', businessId)),
    );
    return snap.docs.map((d) => (d.data() as { datetime: string }).datetime);
  }
  return mock.appointments
    .filter((a) => a.businessId === businessId && isActiveStatus(a.status))
    .map((a) => a.datetime);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<void> {
  if (isFirebaseEnabled) {
    const database = requireDb();
    await updateDoc(doc(database, 'appointments', id), { status });
    // Free the slot lock so a cancelled/rejected time becomes bookable again.
    if (status === 'cancelled' || status === 'rejected') {
      const snap = await getDoc(doc(database, 'appointments', id));
      const a = snap.data() as { businessId?: string; datetime?: string } | undefined;
      if (a?.businessId && a.datetime) {
        await deleteDoc(doc(database, 'slots', slotId(a.businessId, a.datetime))).catch(
          () => undefined,
        );
      }
    }
    return;
  }
  const appt = mock.appointments.find((a) => a.id === id);
  if (!appt) return;
  appt.status = status;
  // In mock mode, completing an appointment grants a loyalty point (in
  // production this is a Cloud Function so clients cannot forge points).
  if (status === 'completed') grantLoyaltyPoint(appt.customerId, appt.businessId);
}

/** Mock-only: +1 point per completed visit; every 10 points → 1 free service. */
function grantLoyaltyPoint(userId: string, businessId: string) {
  let record = mock.loyalty.find(
    (l) => l.userId === userId && l.businessId === businessId,
  );
  if (!record) {
    record = { userId, businessId, points: 0, freeServices: 0 };
    mock.loyalty.push(record);
  }
  record.points += 1;
  if (record.points > 0 && record.points % 10 === 0) record.freeServices += 1;
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

// ---------------------------------------------------------------------------
// Seeding (bootstrap an empty Firestore from inside the app)
// ---------------------------------------------------------------------------

/**
 * Writes the sample businesses & services into Firestore. Used by the "örnek
 * veri yükle" button on the empty Keşfet state so a fresh project can be
 * populated without any local tooling. No-op in mock mode (data already exists).
 */
export async function seedSampleData(): Promise<void> {
  if (!isFirebaseEnabled) return;
  const database = requireDb();
  const batch = writeBatch(database);
  for (const { id, ...data } of mock.businesses) {
    batch.set(doc(database, 'businesses', id), data, { merge: true });
  }
  for (const { id, ...data } of mock.services) {
    batch.set(doc(database, 'services', id), data, { merge: true });
  }
  await batch.commit();
}

function hydrate(a: Appointment): Appointment {
  return {
    ...a,
    business: mock.businesses.find((b) => b.id === a.businessId),
    service: mock.services.find((s) => s.id === a.serviceId),
  };
}
