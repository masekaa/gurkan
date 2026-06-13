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
  arrayRemove,
  arrayUnion,
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

import { httpsCallable } from 'firebase/functions';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';

import { db, functions, isFirebaseEnabled, isStorageEnabled, storage } from '@/lib/firebase';
import type {
  Appointment,
  AppointmentStatus,
  Business,
  BusinessCategory,
  Loyalty,
  Profile,
  Review,
  Service,
  UserRole,
} from '@/types';
import { defaultHours } from '@/lib/hours';
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

/** Discovery listing gate: approved AND an active paid subscription. */
const isListable = (b: Business) =>
  b.approved && b.subscriptionStatus === 'active';

const matchesTerm = (b: Business, term: string) =>
  term
    ? b.name.toLowerCase().includes(term) ||
      b.district.toLowerCase().includes(term)
    : true;

export async function listBusinesses(search = ''): Promise<Business[]> {
  const term = search.trim().toLowerCase();
  if (isFirebaseEnabled) {
    // No orderBy in the query: equality + orderBy on a different field would
    // require a Firestore composite index. We sort/gate client-side so the app
    // works against a freshly created database with zero index setup.
    const snap = await getDocs(
      query(
        collection(requireDb(), 'businesses'),
        where('approved', '==', true),
      ),
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Business)
      .filter((b) => isListable(b) && matchesTerm(b, term))
      .sort((a, b) => b.rating - a.rating);
  }
  return mock.businesses
    .filter((b) => isListable(b) && matchesTerm(b, term))
    .sort((a, b) => b.rating - a.rating);
}

/** Admin-only: every business including unapproved ones. */
export async function listAllBusinesses(): Promise<Business[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(collection(requireDb(), 'businesses'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Business)
      .sort((a, b) => Number(a.approved) - Number(b.approved));
  }
  return [...mock.businesses].sort((a, b) => Number(a.approved) - Number(b.approved));
}

/** Admin-only: every appointment across all businesses (most recent first). */
export async function listAllAppointments(): Promise<Appointment[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(collection(requireDb(), 'appointments'));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
    return Promise.all(
      rows
        .sort((a, b) => (a.datetime < b.datetime ? 1 : -1))
        .map(async (a) => ({
          ...a,
          business: (await getBusiness(a.businessId)) ?? undefined,
          service: await getService(a.serviceId),
        })),
    );
  }
  return mock.appointments
    .slice()
    .sort((a, b) => (a.datetime < b.datetime ? 1 : -1))
    .map(hydrate);
}

/** Admin-only: every user profile (most recent first). */
export async function listAllUsers(): Promise<Profile[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(collection(requireDb(), 'profiles'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Profile)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return [];
}

/**
 * Admin-only: delete a user's profile (and any businesses they own).
 * Note: app-level only — the Firebase Auth account can be removed solely
 * server-side (Admin SDK / Cloud Function).
 */
export async function deleteUser(userId: string): Promise<void> {
  if (isFirebaseEnabled) {
    const database = requireDb();
    const owned = await getDocs(
      query(collection(database, 'businesses'), where('ownerId', '==', userId)),
    );
    await Promise.all(owned.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(database, 'profiles', userId));
    return;
  }
  for (let i = mock.businesses.length - 1; i >= 0; i--) {
    if (mock.businesses[i].ownerId === userId) mock.businesses.splice(i, 1);
  }
}

/**
 * Admin-only: fully delete a user via the `adminDeleteUser` Cloud Function
 * (removes Auth account + profile + owned businesses). Falls back to the
 * client-side `deleteUser` (profile + businesses only, no Auth) when the
 * function is not deployed/available. Returns whether the Auth account was
 * removed so the UI can inform the admin.
 */
export async function adminDeleteUser(uid: string): Promise<{ authDeleted: boolean }> {
  if (isFirebaseEnabled && functions) {
    try {
      await httpsCallable(functions, 'adminDeleteUser')({ uid });
      return { authDeleted: true };
    } catch {
      // Cloud Function missing/unavailable → app-level cleanup as a fallback.
      await deleteUser(uid);
      return { authDeleted: false };
    }
  }
  await deleteUser(uid);
  return { authDeleted: false };
}

/** Admin-only: set a user's password via the `adminSetPassword` Cloud Function. */
export async function adminSetUserPassword(
  uid: string,
  newPassword: string,
): Promise<void> {
  if (!isFirebaseEnabled || !functions) {
    throw new Error('Bu işlem yalnızca Firebase + Cloud Functions ile çalışır.');
  }
  await httpsCallable(functions, 'adminSetPassword')({ uid, newPassword });
}

/** Admin-only: set a user's role (e.g. promote to admin). */
export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  if (isFirebaseEnabled) {
    await updateDoc(doc(requireDb(), 'profiles', userId), { role });
    return;
  }
  // Mock mode has no profiles collection.
}

/**
 * Admin-only: grant or revoke a business's listing subscription. (Real billing
 * runs through the payment webhook server-side; this is for admin/comp/testing.)
 */
export async function setSubscription(
  businessId: string,
  active: boolean,
): Promise<void> {
  const patch = active
    ? {
        subscriptionStatus: 'active' as const,
        subscriptionEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      }
    : { subscriptionStatus: 'none' as const, subscriptionEnd: null };
  if (isFirebaseEnabled) {
    await updateDoc(doc(requireDb(), 'businesses', businessId), patch);
    return;
  }
  const b = mock.businesses.find((x) => x.id === businessId);
  if (b) Object.assign(b, patch);
}

/** Admin-only: delete a business. */
export async function deleteBusiness(businessId: string): Promise<void> {
  if (isFirebaseEnabled) {
    await deleteDoc(doc(requireDb(), 'businesses', businessId));
    return;
  }
  const i = mock.businesses.findIndex((b) => b.id === businessId);
  if (i >= 0) mock.businesses.splice(i, 1);
}

export async function getBusiness(id: string): Promise<Business | null> {
  if (isFirebaseEnabled) {
    const snap = await getDoc(doc(requireDb(), 'businesses', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Business) : null;
  }
  return mock.businesses.find((b) => b.id === id) ?? null;
}

/** Fetch several businesses by id (e.g. favorites); skips unreadable/missing. */
export async function getBusinessesByIds(ids: string[]): Promise<Business[]> {
  if (ids.length === 0) return [];
  const results = await Promise.all(
    ids.map((id) => getBusiness(id).catch(() => null)),
  );
  return results.filter((b): b is Business => b != null);
}

/**
 * Create a business owned by `ownerId`. Starts unapproved so it stays hidden
 * from the public Keşfet feed until an admin approves it.
 */
export async function createBusiness(input: {
  ownerId: string;
  name: string;
  category: BusinessCategory;
  district?: string;
  phone?: string;
}): Promise<string> {
  const data: Omit<Business, 'id'> = {
    ownerId: input.ownerId,
    name: input.name,
    category: input.category,
    about: '',
    address: '',
    district: input.district ?? '',
    phone: input.phone ?? '',
    logoUrl: null,
    coverUrl: null,
    rating: 0,
    reviewCount: 0,
    approved: false,
    openingTime: '09:00',
    closingTime: '20:00',
    hours: defaultHours(),
    slotMinutes: 30,
    cancelWindowHours: 2,
    subscriptionStatus: 'none',
    subscriptionEnd: null,
  };
  if (isFirebaseEnabled) {
    const ref = await addDoc(collection(requireDb(), 'businesses'), data);
    return ref.id;
  }
  const id = uid('b');
  mock.businesses.push({ id, ...data });
  return id;
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

/** Thrown when Cloud Storage isn't provisioned for the project yet. */
export class StorageDisabledError extends Error {
  constructor() {
    super('storage-disabled');
    this.name = 'StorageDisabledError';
  }
}

/**
 * Upload a local image to Storage and queue it for admin moderation by adding
 * the URL to `pendingPhotos` (NOT `photos`). It stays invisible to customers
 * until an admin approves it. Returns the new URL. In mock mode the local URI
 * is queued directly so the moderation flow still works during development.
 */
export async function addBusinessPhoto(
  businessId: string,
  localUri: string,
): Promise<string> {
  if (isFirebaseEnabled) {
    if (!isStorageEnabled || !storage) throw new StorageDisabledError();
    const res = await fetch(localUri);
    const blob = await res.blob();
    const current = await getBusiness(businessId);
    // Deterministic-ish name without Date.now(): derive from total count + size.
    const count = (current?.photos?.length ?? 0) + (current?.pendingPhotos?.length ?? 0);
    const key = `businesses/${businessId}/photo_${count}_${blob.size}.jpg`;
    const r = storageRef(storage, key);
    await uploadBytes(r, blob);
    const url = await getDownloadURL(r);
    await updateDoc(doc(requireDb(), 'businesses', businessId), {
      pendingPhotos: arrayUnion(url),
    });
    return url;
  }
  const b = mock.businesses.find((x) => x.id === businessId);
  if (b) b.pendingPhotos = [...(b.pendingPhotos ?? []), localUri];
  return localUri;
}

async function deleteStorageObject(url: string): Promise<void> {
  if (!isStorageEnabled || !storage) return;
  try {
    await deleteObject(storageRef(storage, url));
  } catch {
    // Object may already be gone, or url may not map to a ref — the array
    // entry is what matters and the caller removes that.
  }
}

/**
 * Owner (or admin) removes a still-pending photo before it's reviewed. Deletes
 * the underlying Storage object too.
 */
export async function removePendingPhoto(businessId: string, url: string): Promise<void> {
  if (isFirebaseEnabled) {
    await updateDoc(doc(requireDb(), 'businesses', businessId), {
      pendingPhotos: arrayRemove(url),
    });
    await deleteStorageObject(url);
    return;
  }
  const b = mock.businesses.find((x) => x.id === businessId);
  if (b) b.pendingPhotos = (b.pendingPhotos ?? []).filter((p) => p !== url);
}

/** ADMIN: approve a pending photo — moves it from `pendingPhotos` to `photos`. */
export async function approveBusinessPhoto(businessId: string, url: string): Promise<void> {
  if (isFirebaseEnabled) {
    await updateDoc(doc(requireDb(), 'businesses', businessId), {
      pendingPhotos: arrayRemove(url),
      photos: arrayUnion(url),
    });
    return;
  }
  const b = mock.businesses.find((x) => x.id === businessId);
  if (b) {
    b.pendingPhotos = (b.pendingPhotos ?? []).filter((p) => p !== url);
    if (!(b.photos ?? []).includes(url)) b.photos = [...(b.photos ?? []), url];
  }
}

/** ADMIN: reject a pending photo — removes it without publishing. */
export async function rejectBusinessPhoto(businessId: string, url: string): Promise<void> {
  return removePendingPhoto(businessId, url);
}

/** ADMIN: take down an already-approved (public) photo. */
export async function removeApprovedPhoto(businessId: string, url: string): Promise<void> {
  if (isFirebaseEnabled) {
    await updateDoc(doc(requireDb(), 'businesses', businessId), {
      photos: arrayRemove(url),
    });
    await deleteStorageObject(url);
    return;
  }
  const b = mock.businesses.find((x) => x.id === businessId);
  if (b) b.photos = (b.photos ?? []).filter((p) => p !== url);
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
  ownerId: string,
): Promise<Appointment[]> {
  if (isFirebaseEnabled) {
    // Query by businessOwnerId so the rule (read if businessOwnerId == auth.uid)
    // permits the whole list query for the owner.
    const snap = await getDocs(
      query(
        collection(requireDb(), 'appointments'),
        where('businessOwnerId', '==', ownerId),
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
    .filter((a) => a.businessOwnerId === ownerId)
    .sort((a, b) => (a.datetime < b.datetime ? 1 : -1))
    .map(hydrate);
}

export async function createAppointment(input: {
  customerId: string;
  businessId: string;
  serviceId: string;
  datetime: string;
  /** Service length in minutes; stored on the lock for overlap-aware availability. */
  durationMin?: number;
}): Promise<Appointment> {
  const { durationMin = 30, ...appointmentFields } = input;
  // Denormalise the business owner so the owner can query their inbox under
  // strict rules (read allowed when businessOwnerId == auth.uid).
  const business = await getBusiness(input.businessId);
  const base = {
    ...appointmentFields,
    businessOwnerId: business?.ownerId ?? null,
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
        businessOwnerId: business?.ownerId ?? null,
        appointmentId: apptRef.id,
        durationMin,
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
export type TakenSlot = { datetime: string; durationMin: number };

export async function listTakenSlots(businessId: string): Promise<TakenSlot[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(
      query(collection(requireDb(), 'slots'), where('businessId', '==', businessId)),
    );
    return snap.docs.map((d) => {
      const data = d.data() as { datetime: string; durationMin?: number };
      return { datetime: data.datetime, durationMin: data.durationMin ?? 30 };
    });
  }
  return mock.appointments
    .filter((a) => a.businessId === businessId && isActiveStatus(a.status))
    .map((a) => ({
      datetime: a.datetime,
      durationMin: mock.services.find((s) => s.id === a.serviceId)?.durationMin ?? 30,
    }));
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
// Reviews
// ---------------------------------------------------------------------------

export async function listReviews(businessId: string): Promise<Review[]> {
  if (isFirebaseEnabled) {
    const snap = await getDocs(
      query(collection(requireDb(), 'reviews'), where('businessId', '==', businessId)),
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Review)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return mock.reviews
    .filter((r) => r.businessId === businessId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createReview(input: {
  businessId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  appointmentId: string;
}): Promise<Review> {
  const base = { ...input, createdAt: new Date().toISOString() };
  if (isFirebaseEnabled) {
    const ref = await addDoc(collection(requireDb(), 'reviews'), base);
    return { id: ref.id, ...base };
  }
  const review: Review = { id: uid('r'), ...base };
  mock.reviews.unshift(review);
  return review;
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
  for (const { id, ...data } of mock.reviews) {
    batch.set(doc(database, 'reviews', id), data, { merge: true });
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
