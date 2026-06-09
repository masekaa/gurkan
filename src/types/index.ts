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
  openingTime: string; // "09:00"
  closingTime: string; // "20:00"
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
}
