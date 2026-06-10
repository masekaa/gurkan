/**
 * Altın100 — admin Cloud Functions.
 *
 * These run server-side with the Firebase Admin SDK so an admin can do things
 * the client SDK cannot: permanently delete a user's Auth account and set a
 * user's password. Every function verifies the caller is an admin by reading
 * their `profiles/{uid}.role` in Firestore.
 *
 * Deploy:  cd functions && npm install && npm run deploy
 * (Requires the Firebase project to be on the Blaze plan — free tier covers
 *  low usage. Functions deploy to us-central1 by default, matching the client's
 *  getFunctions(app) default region.)
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

const POINTS_PER_REWARD = 10;

/** Throw unless the caller's profile role is 'admin'. */
async function assertAdmin(uid: string | undefined): Promise<void> {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');
  }
  const snap = await getFirestore().doc(`profiles/${uid}`).get();
  if (!snap.exists || snap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Bu işlem yalnızca admin içindir.');
  }
}

/** Permanently delete a user: their owned businesses, profile, and Auth account. */
export const adminDeleteUser = onCall(async (req) => {
  await assertAdmin(req.auth?.uid);

  const targetUid = String(req.data?.uid ?? '');
  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'uid gerekli.');
  }
  if (targetUid === req.auth?.uid) {
    throw new HttpsError('failed-precondition', 'Kendini silemezsin.');
  }

  const db = getFirestore();
  const owned = await db
    .collection('businesses')
    .where('ownerId', '==', targetUid)
    .get();

  const batch = db.batch();
  owned.forEach((doc) => batch.delete(doc.ref));
  batch.delete(db.doc(`profiles/${targetUid}`));
  await batch.commit();

  // Remove the Auth account; ignore if it was already deleted.
  await getAuth()
    .deleteUser(targetUid)
    .catch(() => undefined);

  return { ok: true };
});

/** Set a user's password (admin-initiated). */
export const adminSetPassword = onCall(async (req) => {
  await assertAdmin(req.auth?.uid);

  const targetUid = String(req.data?.uid ?? '');
  const newPassword = String(req.data?.newPassword ?? '');
  if (!targetUid || !newPassword) {
    throw new HttpsError('invalid-argument', 'uid ve newPassword gerekli.');
  }
  if (newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'Şifre en az 6 karakter olmalı.');
  }

  await getAuth().updateUser(targetUid, { password: newPassword });
  return { ok: true };
});

/**
 * Grant a loyalty point when an appointment transitions to 'completed'.
 * Server-side so the `loyalty` collection stays client-write-protected.
 * Every POINTS_PER_REWARD points = 1 free service.
 */
export const onAppointmentCompleted = onDocumentUpdated(
  'appointments/{id}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) return;
    // Only on the transition into 'completed'.
    if (after.status !== 'completed' || before?.status === 'completed') return;

    const customerId = after.customerId as string | undefined;
    const businessId = after.businessId as string | undefined;
    if (!customerId || !businessId) return;

    const db = getFirestore();
    const ref = db.doc(`loyalty/${customerId}_${businessId}`);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const points = (snap.exists ? Number(snap.data()?.points ?? 0) : 0) + 1;
      tx.set(
        ref,
        {
          userId: customerId,
          businessId,
          points,
          freeServices: Math.floor(points / POINTS_PER_REWARD),
        },
        { merge: true },
      );
    });
  },
);
