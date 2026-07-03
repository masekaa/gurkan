import type {
  Appointment,
  Business,
  Employee,
  Loyalty,
  Review,
  Service,
} from '@/types';

/**
 * In-memory seed data used when Supabase is not configured. Businesses are set
 * in the pilot region (Bursa / Nilüfer) to match the launch plan. The arrays
 * below are mutated by the mock repository so bookings persist for the lifetime
 * of the running app session.
 */

export const MOCK_USER_ID = 'mock-user';

/** The business that a demo "İşletme" account manages. */
export const DEMO_BUSINESS_ID = 'b1';

const HOUR = 1000 * 60 * 60;
const now = Date.now();

export const businesses: Business[] = [
  {
    id: 'b1',
    name: 'Nilüfer Barber House',
    category: 'berber',
    about:
      'Nilüfer’in kalbinde modern erkek bakım deneyimi. Klasik tıraş ve saç tasarımı.',
    address: 'İhsaniye Mah. Kar Cad. No:12',
    district: 'Nilüfer / Bursa',
    phone: '+90 224 000 00 01',
    logoUrl: null,
    coverUrl: null,
    lat: 40.215,
    lng: 28.976,
    rating: 4.8,
    reviewCount: 214,
    approved: true,
    subscriptionStatus: 'active',
    openingTime: '09:00',
    closingTime: '21:00',
  },
  {
    id: 'b2',
    name: 'Altın Makas Erkek Kuaförü',
    category: 'berber',
    about: 'Mahallenin güvenilir berberi. Sıcak havlu sakak tıraşı uzmanı.',
    address: 'Beşevler Mah. Çiçek Sok. No:4',
    district: 'Nilüfer / Bursa',
    phone: '+90 224 000 00 02',
    logoUrl: null,
    coverUrl: null,
    lat: 40.223,
    lng: 29.008,
    rating: 4.6,
    reviewCount: 98,
    approved: true,
    subscriptionStatus: 'active',
    openingTime: '08:30',
    closingTime: '20:00',
  },
  {
    id: 'b3',
    name: 'Belle Güzellik Merkezi',
    category: 'guzellik_merkezi',
    about: 'Cilt bakımı, lazer epilasyon ve profesyonel makyaj hizmetleri.',
    address: 'Görükle Mah. Üniversite Cad. No:88',
    district: 'Nilüfer / Bursa',
    phone: '+90 224 000 00 03',
    logoUrl: null,
    coverUrl: null,
    lat: 40.2275,
    lng: 28.8585,
    rating: 4.9,
    reviewCount: 167,
    approved: true,
    subscriptionStatus: 'active',
    openingTime: '10:00',
    closingTime: '19:00',
  },
  {
    id: 'b4',
    name: 'Lina Kadın Kuaförü',
    category: 'kuafor',
    about: 'Saç boyama, ombre ve özel gün saç tasarımı.',
    address: 'Konak Mah. Lale Cad. No:21',
    district: 'Nilüfer / Bursa',
    phone: '+90 224 000 00 04',
    logoUrl: null,
    coverUrl: null,
    lat: 40.199,
    lng: 29.03,
    rating: 4.7,
    reviewCount: 142,
    approved: true,
    subscriptionStatus: 'active',
    openingTime: '09:30',
    closingTime: '20:30',
  },
];

export const services: Service[] = [
  { id: 's1', businessId: 'b1', name: 'Saç Kesimi', durationMin: 30, price: 350 },
  { id: 's2', businessId: 'b1', name: 'Sakal Tıraşı', durationMin: 20, price: 200 },
  { id: 's3', businessId: 'b1', name: 'Saç + Sakal', durationMin: 45, price: 500 },
  { id: 's4', businessId: 'b2', name: 'Saç Kesimi', durationMin: 30, price: 300 },
  { id: 's5', businessId: 'b2', name: 'Sıcak Havlu Sakal', durationMin: 25, price: 250 },
  { id: 's6', businessId: 'b3', name: 'Cilt Bakımı', durationMin: 60, price: 900 },
  { id: 's7', businessId: 'b3', name: 'Lazer Epilasyon (Bölge)', durationMin: 30, price: 700 },
  { id: 's8', businessId: 'b4', name: 'Saç Boyama', durationMin: 90, price: 1200 },
  { id: 's9', businessId: 'b4', name: 'Fön', durationMin: 30, price: 350 },
];

/** Staff members (demo business b1 has two so the picker is exercised). */
export const employees: Employee[] = [
  { id: 'e1', businessId: 'b1', name: 'Kemal Usta', title: 'Berber', active: true },
  { id: 'e2', businessId: 'b1', name: 'Serkan', title: 'Berber', active: true },
];

/** Mutable session stores. */
export const appointments: Appointment[] = [
  // The demo customer's own appointments (seen on the customer side).
  {
    id: 'a1',
    customerId: MOCK_USER_ID,
    customerName: 'Sen',
    businessId: 'b1',
    serviceId: 's3',
    datetime: new Date(now + 26 * HOUR).toISOString(),
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a0',
    customerId: MOCK_USER_ID,
    customerName: 'Sen',
    businessId: 'b2',
    serviceId: 's4',
    datetime: new Date(now - 72 * HOUR).toISOString(),
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
  // Other customers' appointments at the demo business (seen on the business side).
  {
    id: 'a2',
    customerId: 'cust-2',
    customerName: 'Mehmet Yılmaz',
    businessId: DEMO_BUSINESS_ID,
    serviceId: 's1',
    datetime: new Date(now + 3 * HOUR).toISOString(),
    status: 'pending',
    createdAt: new Date(now - HOUR).toISOString(),
  },
  {
    id: 'a3',
    customerId: 'cust-3',
    customerName: 'Ali Vural',
    businessId: DEMO_BUSINESS_ID,
    serviceId: 's2',
    datetime: new Date(now + 5 * HOUR).toISOString(),
    status: 'pending',
    createdAt: new Date(now - 2 * HOUR).toISOString(),
  },
  {
    id: 'a4',
    customerId: 'cust-4',
    customerName: 'Caner Demir',
    businessId: DEMO_BUSINESS_ID,
    serviceId: 's3',
    datetime: new Date(now + 28 * HOUR).toISOString(),
    status: 'approved',
    createdAt: new Date(now - 5 * HOUR).toISOString(),
  },
  {
    id: 'a5',
    customerId: 'cust-5',
    customerName: 'Burak Şahin',
    businessId: DEMO_BUSINESS_ID,
    serviceId: 's1',
    datetime: new Date(now - 24 * HOUR).toISOString(),
    status: 'completed',
    createdAt: new Date(now - 48 * HOUR).toISOString(),
  },
  {
    id: 'a6',
    customerId: 'cust-6',
    customerName: 'Emre Koç',
    businessId: DEMO_BUSINESS_ID,
    serviceId: 's2',
    datetime: new Date(now - 30 * HOUR).toISOString(),
    status: 'cancelled',
    createdAt: new Date(now - 50 * HOUR).toISOString(),
  },
];

export const loyalty: Loyalty[] = [
  { userId: MOCK_USER_ID, businessId: 'b1', points: 7, freeServices: 0 },
  { userId: MOCK_USER_ID, businessId: 'b2', points: 12, freeServices: 1 },
];

export const reviews: Review[] = [
  {
    id: 'r1',
    businessId: 'b1',
    userId: 'cust-2',
    userName: 'Ahmet Yıldız',
    rating: 5,
    comment: 'Usta işini biliyor, çok memnun kaldım. Randevu tam saatinde başladı.',
    createdAt: new Date(now - 3 * 24 * HOUR).toISOString(),
  },
  {
    id: 'r2',
    businessId: 'b1',
    userId: 'cust-3',
    userName: 'Mehmet Demir',
    rating: 4,
    comment: 'Temiz ve hızlı. Fiyatlar gayet uygun.',
    createdAt: new Date(now - 8 * 24 * HOUR).toISOString(),
  },
  {
    id: 'r3',
    businessId: 'b2',
    userId: 'cust-4',
    userName: 'Zeynep Kaya',
    rating: 5,
    comment: 'Saç boyama harika oldu, kesinlikle tavsiye ederim.',
    createdAt: new Date(now - 5 * 24 * HOUR).toISOString(),
  },
];
