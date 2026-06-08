import type {
  Appointment,
  Business,
  Loyalty,
  Service,
} from '@/types';

/**
 * In-memory seed data used when Supabase is not configured. Businesses are set
 * in the pilot region (Bursa / Nilüfer) to match the launch plan. The arrays
 * below are mutated by the mock repository so bookings persist for the lifetime
 * of the running app session.
 */

export const MOCK_USER_ID = 'mock-user';

export const businesses: Business[] = [
  {
    id: 'b1',
    name: 'Nilüfer Barber House',
    category: 'barber_shop',
    about:
      'Nilüfer’in kalbinde modern erkek bakım deneyimi. Klasik tıraş ve saç tasarımı.',
    address: 'İhsaniye Mah. Kar Cad. No:12',
    district: 'Nilüfer / Bursa',
    phone: '+90 224 000 00 01',
    logoUrl: null,
    coverUrl: null,
    rating: 4.8,
    reviewCount: 214,
    approved: true,
    openingTime: '09:00',
    closingTime: '21:00',
  },
  {
    id: 'b2',
    name: 'Altın Makas Erkek Kuaförü',
    category: 'erkek_berberi',
    about: 'Mahallenin güvenilir berberi. Sıcak havlu sakak tıraşı uzmanı.',
    address: 'Beşevler Mah. Çiçek Sok. No:4',
    district: 'Nilüfer / Bursa',
    phone: '+90 224 000 00 02',
    logoUrl: null,
    coverUrl: null,
    rating: 4.6,
    reviewCount: 98,
    approved: true,
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
    rating: 4.9,
    reviewCount: 167,
    approved: true,
    openingTime: '10:00',
    closingTime: '19:00',
  },
  {
    id: 'b4',
    name: 'Lina Kadın Kuaförü',
    category: 'kadin_kuaforu',
    about: 'Saç boyama, ombre ve özel gün saç tasarımı.',
    address: 'Konak Mah. Lale Cad. No:21',
    district: 'Nilüfer / Bursa',
    phone: '+90 224 000 00 04',
    logoUrl: null,
    coverUrl: null,
    rating: 4.7,
    reviewCount: 142,
    approved: true,
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

/** Mutable session stores. */
export const appointments: Appointment[] = [
  {
    id: 'a1',
    customerId: MOCK_USER_ID,
    businessId: 'b1',
    serviceId: 's3',
    datetime: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a0',
    customerId: MOCK_USER_ID,
    businessId: 'b2',
    serviceId: 's4',
    datetime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
];

export const loyalty: Loyalty[] = [
  { userId: MOCK_USER_ID, businessId: 'b1', points: 7, freeServices: 0 },
  { userId: MOCK_USER_ID, businessId: 'b2', points: 12, freeServices: 1 },
];
