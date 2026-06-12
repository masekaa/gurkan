import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import * as repo from '@/data/repository';
import { SlotTakenError } from '@/data/repository';
import { MOCK_USER_ID } from '@/data/mock';
import type { AppointmentStatus, Business, UserRole } from '@/types';

// Re-exported so screens can detect double-booking without importing the data
// layer directly (screens depend on the hooks/repository boundary only).
export { SlotTakenError };

/** Falls back to the mock user id so screens work before sign-in too. */
function useUserId() {
  const { profile } = useAuth();
  return profile?.id ?? MOCK_USER_ID;
}

export function useBusinesses(search = '') {
  return useQuery({
    queryKey: ['businesses', search],
    queryFn: () => repo.listBusinesses(search),
  });
}

export function useBusiness(id: string) {
  return useQuery({
    queryKey: ['business', id],
    queryFn: () => repo.getBusiness(id),
    enabled: Boolean(id),
  });
}

export function useServices(businessId: string) {
  return useQuery({
    queryKey: ['services', businessId],
    queryFn: () => repo.listServices(businessId),
    enabled: Boolean(businessId),
  });
}

export function useAppointments() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['appointments', userId],
    queryFn: () => repo.listAppointments(userId),
  });
}

export function useBusinessAppointments(ownerId?: string | null) {
  return useQuery({
    queryKey: ['businessAppointments', ownerId],
    queryFn: () => repo.listBusinessAppointments(ownerId as string),
    enabled: Boolean(ownerId),
  });
}

export function useLoyalty() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['loyalty', userId],
    queryFn: () => repo.listLoyalty(userId),
  });
}

export function useCreateAppointment() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      businessId: string;
      serviceId: string;
      datetime: string;
      durationMin?: number;
    }) => repo.createAppointment({ customerId: userId, ...input }),
    onSuccess: (appt) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['businessAppointments'] });
      qc.invalidateQueries({ queryKey: ['takenSlots', appt.businessId] });
    },
  });
}

/** Booked slot datetimes (ISO) for a business, to disable taken times. */
export function useTakenSlots(businessId: string) {
  return useQuery({
    queryKey: ['takenSlots', businessId],
    queryFn: () => repo.listTakenSlots(businessId),
    enabled: Boolean(businessId),
  });
}

export function useSeedSampleData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => repo.seedSampleData(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      repo.updateAppointmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['businessAppointments'] });
      qc.invalidateQueries({ queryKey: ['loyalty'] });
      qc.invalidateQueries({ queryKey: ['takenSlots'] });
    },
  });
}

// --- Business-side management (FR-2) ----------------------------------------

type ServiceInput = { name: string; durationMin: number; price: number };

export function useCreateService(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ServiceInput) =>
      repo.createService({ businessId, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', businessId] }),
  });
}

export function useUpdateService(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<ServiceInput>) =>
      repo.updateService(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', businessId] }),
  });
}

export function useDeleteService(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', businessId] }),
  });
}

export function useUpdateBusiness(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<Business, 'id'>>) =>
      repo.updateBusiness(businessId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business', businessId] });
      qc.invalidateQueries({ queryKey: ['businesses'] });
      qc.invalidateQueries({ queryKey: ['allBusinesses'] });
    },
  });
}

// --- Reviews ----------------------------------------------------------------

export function useReviews(businessId: string) {
  return useQuery({
    queryKey: ['reviews', businessId],
    queryFn: () => repo.listReviews(businessId),
    enabled: Boolean(businessId),
  });
}

export function useCreateReview(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      userId: string;
      userName: string;
      rating: number;
      comment: string;
    }) => repo.createReview({ businessId, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', businessId] }),
  });
}

// --- Admin ------------------------------------------------------------------

export function useAllBusinesses() {
  return useQuery({
    queryKey: ['allBusinesses'],
    queryFn: () => repo.listAllBusinesses(),
  });
}

export function useAllAppointments() {
  return useQuery({
    queryKey: ['allAppointments'],
    queryFn: () => repo.listAllAppointments(),
  });
}

export function useSetBusinessApproved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      repo.updateBusiness(id, { approved }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allBusinesses'] });
      qc.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: () => repo.listAllUsers(),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    // Full delete (Auth + profile + businesses) via Cloud Function, with a
    // client-side fallback when functions are not deployed.
    mutationFn: (id: string) => repo.adminDeleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allUsers'] });
      qc.invalidateQueries({ queryKey: ['allBusinesses'] });
      qc.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
}

export function useAdminSetPassword() {
  return useMutation({
    mutationFn: ({ uid, newPassword }: { uid: string; newPassword: string }) =>
      repo.adminSetUserPassword(uid, newPassword),
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: UserRole }) =>
      repo.setUserRole(uid, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['allUsers'] }),
  });
}

export function useDeleteBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteBusiness(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allBusinesses'] });
      qc.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
}

export function useSetSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      repo.setSubscription(id, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allBusinesses'] });
      qc.invalidateQueries({ queryKey: ['businesses'] });
      qc.invalidateQueries({ queryKey: ['business'] });
    },
  });
}
