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
import { createHash, randomInt } from 'crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

initializeApp();

// Secrets (set with `firebase functions:secrets:set <NAME>`):
const TWILIO_ACCOUNT_SID = defineSecret('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = defineSecret('TWILIO_AUTH_TOKEN');
const TWILIO_FROM = defineSecret('TWILIO_FROM'); // E.164 sender, e.g. +1...
const GMAIL_USER = defineSecret('GMAIL_USER'); // full gmail address
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD'); // 16-char app password

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
  if (
    newPassword.length < 8 ||
    !/[a-zçğıiöşü]/.test(newPassword) ||
    !/[A-ZÇĞIİÖŞÜ]/.test(newPassword) ||
    !/[0-9]/.test(newPassword)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Şifre en az 8 karakter olmalı ve büyük harf, küçük harf ve rakam içermeli.',
    );
  }

  await getAuth().updateUser(targetUid, { password: newPassword });
  return { ok: true };
});

// ---------------------------------------------------------------------------
// Contact-change verification (email / phone) with cross-channel OTP.
//   - Change EMAIL  -> code sent to the user's current PHONE via Twilio SMS.
//   - Change PHONE  -> code sent to the user's current EMAIL via Gmail SMTP.
// Codes are hashed, single-doc per user, expire in 10 min, max 5 attempts.
// ---------------------------------------------------------------------------

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Normalise a Turkish phone to E.164 (+90…) for Twilio. */
function toE164TR(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d.length >= 11 ? d : null;
  const digits = d.replace(/\D/g, '');
  if (digits.length === 10) return `+90${digits}`; // 5xxxxxxxxx
  if (digits.length === 11 && digits.startsWith('0')) return `+90${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('90')) return `+${digits}`;
  return null;
}

const hashCode = (code: string, uid: string) =>
  createHash('sha256').update(`${uid}:${code}`).digest('hex');

async function sendSms(to: string, body: string): Promise<void> {
  const client = twilio(TWILIO_ACCOUNT_SID.value(), TWILIO_AUTH_TOKEN.value());
  await client.messages.create({ from: TWILIO_FROM.value(), to, body });
}

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER.value(), pass: GMAIL_APP_PASSWORD.value() },
  });
  await transporter.sendMail({
    from: `İyiKiRandevu <${GMAIL_USER.value()}>`,
    to,
    subject,
    text,
  });
}

/**
 * Step 1: request a verification code for changing email or phone. The code is
 * delivered to the OTHER channel (email change -> SMS to phone; phone change ->
 * email to current address).
 */
export const requestContactChange = onCall(
  {
    secrets: [
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_FROM,
      GMAIL_USER,
      GMAIL_APP_PASSWORD,
    ],
  },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');

    const field = String(req.data?.field ?? '');
    const newValue = String(req.data?.newValue ?? '').trim();
    if (field !== 'email' && field !== 'phone') {
      throw new HttpsError('invalid-argument', 'Geçersiz alan.');
    }

    const db = getFirestore();
    const profileSnap = await db.doc(`profiles/${uid}`).get();
    const profile = profileSnap.data() ?? {};
    const authUser = await getAuth().getUser(uid);

    // Validate the new value and pick the delivery channel/target.
    let channel: 'sms' | 'email';
    let target: string;
    if (field === 'email') {
      if (!isEmail(newValue)) throw new HttpsError('invalid-argument', 'Geçerli bir e-posta gir.');
      const phone = toE164TR(String(profile.phone ?? ''));
      if (!phone) {
        throw new HttpsError(
          'failed-precondition',
          'Doğrulama için kayıtlı geçerli bir telefon gerekiyor.',
        );
      }
      channel = 'sms';
      target = phone;
    } else {
      const phone = toE164TR(newValue);
      if (!phone) throw new HttpsError('invalid-argument', 'Geçerli bir telefon numarası gir.');
      const email = authUser.email;
      if (!email) throw new HttpsError('failed-precondition', 'Kayıtlı e-posta bulunamadı.');
      channel = 'email';
      target = email;
    }

    const ref = db.doc(`verifications/${uid}`);
    const existing = await ref.get();
    const now = Date.now();
    if (existing.exists && now - Number(existing.data()?.sentAt ?? 0) < RESEND_COOLDOWN_MS) {
      throw new HttpsError('resource-exhausted', 'Çok sık denedin, biraz bekle.');
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await ref.set({
      field,
      newValue: field === 'phone' ? toE164TR(newValue) : newValue,
      channel,
      codeHash: hashCode(code, uid),
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      sentAt: now,
    });

    const msg = `İyiKiRandevu doğrulama kodun: ${code}. 10 dakika geçerli.`;
    if (channel === 'sms') await sendSms(target, msg);
    else await sendEmail(target, 'İyiKiRandevu doğrulama kodu', msg);

    // Return only a masked hint of where the code went (never the code).
    const masked =
      channel === 'sms'
        ? `${target.slice(0, 3)}•••••${target.slice(-2)}`
        : target.replace(/^(.).*(@.*)$/, '$1•••$2');
    return { ok: true, channel, target: masked };
  },
);

/** Step 2: verify the code and apply the email/phone change. */
export const confirmContactChange = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');
  const code = String(req.data?.code ?? '').trim();
  if (!/^\d{6}$/.test(code)) throw new HttpsError('invalid-argument', 'Kod 6 haneli olmalı.');

  const db = getFirestore();
  const ref = db.doc(`verifications/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Aktif bir doğrulama yok.');
  const v = snap.data() as {
    field: 'email' | 'phone';
    newValue: string;
    codeHash: string;
    expiresAt: number;
    attempts: number;
  };

  if (Date.now() > v.expiresAt) {
    await ref.delete();
    throw new HttpsError('deadline-exceeded', 'Kodun süresi doldu, tekrar iste.');
  }
  if (v.attempts >= MAX_ATTEMPTS) {
    await ref.delete();
    throw new HttpsError('resource-exhausted', 'Çok fazla hatalı deneme, tekrar iste.');
  }
  if (hashCode(code, uid) !== v.codeHash) {
    await ref.update({ attempts: v.attempts + 1 });
    throw new HttpsError('invalid-argument', 'Kod hatalı.');
  }

  // Apply the change.
  if (v.field === 'email') {
    try {
      await getAuth().updateUser(uid, { email: v.newValue });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'Bu e-posta zaten kullanımda.');
      }
      throw new HttpsError('internal', 'E-posta güncellenemedi.');
    }
    await db.doc(`profiles/${uid}`).update({ email: v.newValue });
  } else {
    await db.doc(`profiles/${uid}`).update({ phone: v.newValue });
  }
  await ref.delete();
  return { ok: true, field: v.field, newValue: v.newValue };
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
