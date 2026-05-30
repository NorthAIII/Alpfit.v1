import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createProgram, fetchMemberActiveProgram } from '../api/programs';

export type { Program } from '../api/programs';

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
