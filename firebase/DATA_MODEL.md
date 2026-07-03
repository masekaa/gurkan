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
| `suspended` | boolean | Admin-set; a suspended customer cannot create appointments (set after repeated no-shows). Only an admin may toggle it. |
| `createdAt` | string (ISO) | |

## `businesses/{id}`

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `category` | `berber \| kuafor \| guzellik_merkezi \| nail_art \| lazer_epilasyon` (legacy: `erkek_berberi \| kadin_kuaforu \| barber_shop`) | |
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

## `employees/{id}`

Per-business staff. When a business has one or more `active` employees, customers
pick one at booking and each keeps an independent schedule (slot locks are
namespaced per employee). Public read; owning business / admin writes.

| Field | Type | Notes |
|---|---|---|
| `businessId` | string | FK → businesses |
| `name` | string | |
| `title` | string | Optional role, e.g. "Berber" |
| `active` | boolean | Inactive staff are hidden from booking |

## `appointments/{id}`

| Field | Type | Notes |
|---|---|---|
| `customerId` | string | FK → profiles (booking customer) |
| `businessId` | string | FK → businesses |
| `businessOwnerId` | string\|null | Denormalised `businesses.ownerId`; the business owner queries their inbox by this field (strict rules) |
| `serviceId` | string | FK → services |
| `employeeId` | string\|null | Chosen employee (FK → employees); null = business-level |
| `employeeName` | string\|null | Denormalised employee name for lists |
| `datetime` | string (ISO) | |
| `status` | `pending \| approved \| rejected \| cancelled \| completed \| no_show` | `no_show` = customer didn't show up |
| `createdAt` | string (ISO) | |

Access: a user reads appointments where `customerId == uid`; a business owner
reads where `businessOwnerId == uid`; admins read all (see `firestore.rules`).

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

## `slots/{businessId__datetimeISO}` or `{businessId__employeeId__datetimeISO}`

Deterministic-id lock that prevents double-booking. Created atomically with the
appointment in a transaction; deleted when an appointment is
cancelled/rejected/no-show, and re-created when a rejection is undone. When an
employee is chosen the id is namespaced per employee so two staff can hold the
same time.

| Field | Type | Notes |
|---|---|---|
| `businessId` | string | FK → businesses |
| `datetime` | string (ISO) | The reserved slot start |
| `employeeId` | string\|null | The employee the slot belongs to (null = business-level) |
| `customerId` | string | FK → profiles |
| `businessOwnerId` | string\|null | Denormalised owner; lets the business free the lock on reject |
| `appointmentId` | string | FK → appointments |
| `durationMin` | number | Service length; used for overlap-aware availability |

## Cloud Functions (recommended for v1)
- **onAppointmentCompleted** → increment `loyalty.points`; every 10th point grants a free service.
- **onAppointmentCreated / onStatusChanged** → send FCM push notifications.
- **scheduledReminders** (Pub/Sub cron) → 24h and 1h appointment reminders.
- **onReferralSignup** → +2 points to referrer, +1 to the new user.

These keep point/notification logic server-side so the `loyalty` collection can
stay write-protected from clients (see `firestore.rules`).
