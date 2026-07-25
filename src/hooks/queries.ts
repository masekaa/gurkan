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

export function useFavoriteBusinesses(ids: string[]) {
  return useQuery({
    queryKey: ['favorites', [...ids].sort()],
    queryFn: () => repo.getBusinessesByIds(ids),
    enabled: ids.length > 0,
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
      employeeId?: string | null;
      employeeName?: string | null;
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
      qc.invalidateQueries({ queryKey: ['employeeAppointments'] });
      qc.invalidateQueries({ queryKey: ['loyalty'] });
      qc.invalidateQueries({ queryKey: ['takenSlots'] });
    },
  });
}

/** Undo an approve/reject — move an appointment back to pending. */
export function useRevertAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.revertAppointmentToPending(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['businessAppointments'] });
      qc.invalidateQueries({ queryKey: ['employeeAppointments'] });
      qc.invalidateQueries({ queryKey: ['takenSlots'] });
    },
  });
}

// --- Employees (per-business staff) -----------------------------------------

export function useEmployees(businessId: string) {
  return useQuery({
    queryKey: ['employees', businessId],
    queryFn: () => repo.listEmployees(businessId),
    enabled: Boolean(businessId),
  });
}

export function useCreateEmployee(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; title?: string }) =>
      repo.createEmployee({ businessId, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees', businessId] }),
  });
}

export function useUpdateEmployee(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; name?: string; title?: string; active?: boolean }) =>
      repo.updateEmployee(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees', businessId] }),
  });
}

export function useDeleteEmployee(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees', businessId] }),
  });
}

/** A single employee record (e.g. an employee account checking its approval). */
export function useEmployeeById(id?: string | null) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => repo.getEmployee(id as string),
    enabled: Boolean(id),
  });
}

/** Business approves/rejects a self-registered employee join request. */
export function useApproveEmployee(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.approveEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees', businessId] });
      qc.invalidateQueries({ queryKey: ['employee'] });
    },
  });
}

export function useRejectEmployee(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.rejectEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees', businessId] });
      qc.invalidateQueries({ queryKey: ['employee'] });
    },
  });
}

/** Appointments assigned to the signed-in employee account. */
export function useEmployeeAppointments(employeeUserId?: string | null) {
  return useQuery({
    queryKey: ['employeeAppointments', employeeUserId],
    queryFn: () => repo.listEmployeeAppointments(employeeUserId as string),
    enabled: Boolean(employeeUserId),
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

function invalidateBusiness(qc: ReturnType<typeof useQueryClient>, businessId: string) {
  qc.invalidateQueries({ queryKey: ['business', businessId] });
  qc.invalidateQueries({ queryKey: ['businesses'] });
  qc.invalidateQueries({ queryKey: ['allBusinesses'] });
}

/** Owner uploads a photo → queued for admin moderation (pendingPhotos). */
export function useAddBusinessPhoto(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (localUri: string) => repo.addBusinessPhoto(businessId, localUri),
    onSuccess: () => invalidateBusiness(qc, businessId),
  });
}

/** Owner cancels a still-pending photo. */
export function useRemovePendingPhoto(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => repo.removePendingPhoto(businessId, url),
    onSuccess: () => invalidateBusiness(qc, businessId),
  });
}

/** Admin: approve a pending photo (moves it into the public gallery). */
export function useApproveBusinessPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ businessId, url }: { businessId: string; url: string }) =>
      repo.approveBusinessPhoto(businessId, url),
    onSuccess: (_d, { businessId }) => invalidateBusiness(qc, businessId),
  });
}

/** Admin: reject a pending photo (deletes it without publishing). */
export function useRejectBusinessPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ businessId, url }: { businessId: string; url: string }) =>
      repo.rejectBusinessPhoto(businessId, url),
    onSuccess: (_d, { businessId }) => invalidateBusiness(qc, businessId),
  });
}

/** Admin: take down an already-approved photo. */
export function useRemoveApprovedPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ businessId, url }: { businessId: string; url: string }) =>
      repo.removeApprovedPhoto(businessId, url),
    onSuccess: (_d, { businessId }) => invalidateBusiness(qc, businessId),
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
      appointmentId: string;
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

// --- Contact change (email/phone) with cross-channel OTP ---------------------

export function useRequestContactChange() {
  return useMutation({
    mutationFn: ({ field, newValue }: { field: 'email' | 'phone'; newValue: string }) =>
      repo.requestContactChange(field, newValue),
  });
}

export function useConfirmContactChange() {
  return useMutation({
    mutationFn: (code: string) => repo.confirmContactChange(code),
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

/** Admin: suspend/unsuspend a customer (blocks their new bookings). */
export function useSetUserSuspended() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, suspended }: { uid: string; suspended: boolean }) =>
      repo.setUserSuspended(uid, suspended),
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

