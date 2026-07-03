/** Domain model shared across the app, mirroring the Supabase schema. */

export type UserRole = 'user' | 'business' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  /** For business accounts: the business this account manages. */
  businessId?: string | null;
  /** Favorited business ids (customer). */
  favorites?: string[];
  /**
   * Admin-set: a suspended customer cannot create new appointments. Set when a
   * customer repeatedly no-shows (3+). Only an admin may toggle this.
   */
  suspended?: boolean;
}

/**
 * Business categories. The first five are the canonical, user-facing
 * categories shown in pickers and filters. The trailing three are LEGACY keys
 * retained only so businesses created before the category revamp still render
 * (their labels/styles map to the closest current category). Never offer the
 * legacy keys in new pickers.
 */
export type BusinessCategory =
  // Canonical (current)
  | 'berber'
  | 'kuafor'
  | 'guzellik_merkezi'
  | 'nail_art'
  | 'lazer_epilasyon'
  // Legacy (backward-compat display only)
  | 'erkek_berberi'
  | 'kadin_kuaforu'
  | 'barber_shop';

/** The current, user-facing categories (order shown in pickers/filters). */
export const CATEGORY_KEYS: BusinessCategory[] = [
  'berber',
  'kuafor',
  'guzellik_merkezi',
  'nail_art',
  'lazer_epilasyon',
];

export interface Business {
  id: string;
  /** Owner account (profiles.id). Set when a business registers. */
  ownerId?: string | null;
  name: string;
  category: BusinessCategory;
  about: string;
  address: string;
  district: string;
  /** Exact location the owner pinned on the map (for distance + directions). */
  lat?: number | null;
  lng?: number | null;
  phone: string;
  logoUrl: string | null;
  coverUrl: string | null;
  /** APPROVED gallery image URLs. Public — shown on the business detail page. */
  photos?: string[];
  /**
   * Photos uploaded by the owner awaiting admin moderation. Never shown to
   * customers; admin approval moves a URL from here into `photos`.
   */
  pendingPhotos?: string[];
  rating: number;
  reviewCount: number;
  approved: boolean;
  openingTime: string; // "09:00" — legacy fallback when `hours` is unset
  closingTime: string; // "20:00" — legacy fallback when `hours` is unset
  /** Per-weekday hours, indexed by Date.getDay() (0=Sun..6=Sat). */
  hours?: DayHours[];
  /** Booking slot interval in minutes (business-configurable). Default 30. */
  slotMinutes?: number;
  /** Hours before start within which a customer can no longer cancel. Default 2. */
  cancelWindowHours?: number;
  /**
   * LEGACY / unused. Listing is now FREE — a business is LISTED in discovery
   * solely when approved === true. These fields are retained only for backward
   * compatibility with existing documents and are not read anywhere.
   */
  subscriptionStatus?: SubscriptionStatus;
  subscriptionEnd?: string | null;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'none';

/** One weekday's working hours. */
export interface DayHours {
  open: string; // "09:00"
  close: string; // "20:00"
  closed: boolean;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  durationMin: number;
  price: number; // TRY
}

/**
 * A staff member of a business. When a business has one or more active
 * employees, customers pick which employee to book and each employee keeps an
 * independent schedule (slot locks are namespaced per employee). Businesses
 * with no employees behave exactly as before (business-level scheduling).
 */
export interface Employee {
  id: string;
  businessId: string;
  name: string;
  /** Optional role/title, e.g. "Berber", "Uzman". */
  title?: string;
  /** Inactive employees are hidden from booking but kept for history. */
  active: boolean;
}

export type AppointmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  /** Customer did not show up for an approved appointment. */
  | 'no_show';

export interface Appointment {
  id: string;
  customerId: string;
  businessId: string;
  /** Denormalised business owner uid — lets the owner query their inbox under strict rules. */
  businessOwnerId?: string | null;
  serviceId: string;
  /** Chosen employee (when the business has staff); null = business-level. */
  employeeId?: string | null;
  /** Denormalised employee name for the business/customer-side lists. */
  employeeName?: string | null;
  datetime: string; // ISO 8601
  status: AppointmentStatus;
  createdAt: string;
  /** Denormalised customer name for the business-side list. */
  customerName?: string;
  // Convenience joins (populated by the repository for display).
  business?: Business;
  service?: Service;
}

export interface Loyalty {
  userId: string;
  businessId: string;
  points: number;
  freeServices: number;
  business?: Business;
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  rating: number; // 1–5
  comment: string;
  createdAt: string; // ISO 8601
  /** Proves the author booked at this business (review eligibility). */
  appointmentId?: string;
}
