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
}

export type BusinessCategory =
  | 'erkek_berberi'
  | 'kadin_kuaforu'
  | 'guzellik_merkezi'
  | 'barber_shop';

export interface Business {
  id: string;
  /** Owner account (profiles.id). Set when a business registers. */
  ownerId?: string | null;
  name: string;
  category: BusinessCategory;
  about: string;
  address: string;
  district: string;
  phone: string;
  logoUrl: string | null;
  coverUrl: string | null;
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
   * Listing subscription (paid monthly). Only admin / the payment webhook may
   * write these — never the business owner. A business is LISTED in discovery
   * when approved === true AND subscriptionStatus === 'active'.
   */
  subscriptionStatus?: SubscriptionStatus;
  /** Current paid period end (ISO). */
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

export type AppointmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface Appointment {
  id: string;
  customerId: string;
  businessId: string;
  /** Denormalised business owner uid — lets the owner query their inbox under strict rules. */
  businessOwnerId?: string | null;
  serviceId: string;
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
