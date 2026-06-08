# Altın100 — Firestore Data Model

All collections use **camelCase** field names so they map 1:1 to the TypeScript
types in `src/types/index.ts` (the repository spreads `{ id, ...doc.data() }`
with no renaming).

## `profiles/{uid}`
The document id is the Firebase Auth UID.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name |
| `email` | string | |
| `phone` | string \| null | |
| `role` | `'user' \| 'business' \| 'admin'` | Default `user` |
| `referralCode` | string | e.g. `ALTIN1234` |
| `createdAt` | string (ISO) | |

## `businesses/{id}`

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `category` | `erkek_berberi \| kadin_kuaforu \| guzellik_merkezi \| barber_shop` | |
| `about` | string | |
| `address` / `district` | string | |
| `phone` | string | |
| `logoUrl` / `coverUrl` | string \| null | Firebase Storage URLs |
| `rating` | number | Denormalised average |
| `reviewCount` | number | |
| `approved` | boolean | Admin gate; only `true` is publicly listed |
| `openingTime` / `closingTime` | string `"HH:MM"` | Drives booking slots |
| `ownerId` | string | Auth UID of the business owner |

## `services/{id}`

| Field | Type | Notes |
|---|---|---|
| `businessId` | string | FK → businesses |
| `name` | string | |
| `durationMin` | number | |
| `price` | number | TRY |

## `appointments/{id}`

| Field | Type | Notes |
|---|---|---|
| `customerId` | string | FK → profiles |
| `businessId` | string | FK → businesses |
| `serviceId` | string | FK → services |
| `datetime` | string (ISO) | |
| `status` | `pending \| approved \| rejected \| cancelled \| completed` | |
| `createdAt` | string (ISO) | |

## `loyalty/{id}`

| Field | Type | Notes |
|---|---|---|
| `userId` | string | FK → profiles |
| `businessId` | string | FK → businesses |
| `points` | number | +1 per completed appointment |
| `freeServices` | number | Granted every 10 points |

## `reviews/{id}`

| Field | Type | Notes |
|---|---|---|
| `businessId` | string | FK → businesses |
| `userId` | string | FK → profiles (review author) |
| `userName` | string | Denormalised for display |
| `rating` | number | 1–5 |
| `comment` | string | |
| `createdAt` | string (ISO) | |

Public read; a user creates/edits only their own review (see `firestore.rules`).

## `slots/{businessId__datetimeISO}`

Deterministic-id lock that prevents double-booking. Created atomically with the
appointment in a transaction; deleted when an appointment is cancelled/rejected.

| Field | Type | Notes |
|---|---|---|
| `businessId` | string | FK → businesses |
| `datetime` | string (ISO) | The reserved slot |
| `customerId` | string | FK → profiles |
| `appointmentId` | string | FK → appointments |

## Cloud Functions (recommended for v1)
- **onAppointmentCompleted** → increment `loyalty.points`; every 10th point grants a free service.
- **onAppointmentCreated / onStatusChanged** → send FCM push notifications.
- **scheduledReminders** (Pub/Sub cron) → 24h and 1h appointment reminders.
- **onReferralSignup** → +2 points to referrer, +1 to the new user.

These keep point/notification logic server-side so the `loyalty` collection can
stay write-protected from clients (see `firestore.rules`).
