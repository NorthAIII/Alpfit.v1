import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authedFetch } from '../api/client';
import {
  copyProgramToMember,
  createProgram,
  fetchMemberActiveProgram,
  publishProgram,
} from '../api/programs';

export type { Program } from '../api/programs';

// --- Trainer members (kopyalama modalı için) ---

export interface TrainerMemberItem {
  id: string;
  firstName: string;
  lastName: string;
}

async function fetchTrainerMembers(): Promise<TrainerMemberItem[]> {
  const res = await authedFetch('/trainers/me/members');
  if (!res.ok) throw new Error('fetchTrainerMembers failed');
  return res.json() as Promise<TrainerMemberItem[]>;
}

/** GET /trainers/me/members — PT'nin üye listesi (kopyalama modalı için). */
export function useTrainerMembers() {
  return useQuery({
    queryKey: ['trainer-members'],
    queryFn: fetchTrainerMembers,
    staleTime: 60 * 1000,
  });
}

// --- Mevcut hooklar ---

/** GET /members/:memberId/program — staleTime 30s (PT view taze tutulur). */
export function useTrainerMemberProgram(memberId: string) {
  return useQuery({
    queryKey: ['member-program', memberId],
    queryFn: () => fetchMemberActiveProgram(memberId),
    staleTime: 30 * 1000,
  });
}

interface UseCreateProgramOptions {
  memberId: string;
  onSuccess: (programId: string) => void;
}

/** POST /programs — başarıda cache invalidate + onSuccess(programId) çağrılır. */
export function useCreateProgram({ memberId, onSuccess }: UseCreateProgramOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createProgram(memberId),
    onSuccess: (program) => {
      void queryClient.invalidateQueries({ queryKey: ['member-program', memberId] });
      onSuccess(program.id);
    },
  });
}

// --- Yeni hooklar (TASK-2.09) ---

interface UsePublishProgramOptions {
  programId: string;
  memberId: string;
  onSuccess?: () => void;
}

/** POST /programs/:id/publish — üyenin görmeye başlaması için explicit kaydet. */
export function usePublishProgram({ programId, memberId, onSuccess }: UsePublishProgramOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => publishProgram(programId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['member-program', memberId] });
      onSuccess?.();
    },
  });
}

/** POST /programs/:id/copy — başka üyeye yeni draft oluşturur. */
export function useCopyProgram() {
  return useMutation({
    mutationFn: ({ programId, targetMemberId }: { programId: string; targetMemberId: string }) =>
      copyProgramToMember(programId, targetMemberId),
  });
}
