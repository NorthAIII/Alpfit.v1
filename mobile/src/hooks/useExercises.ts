import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createExercise, fetchExercises } from '../api/exercises';

import { useDebounce } from './useDebounce';

import type { CreateExerciseInput, ExerciseListParams } from '../api/exercises';

export type { Exercise } from '../api/exercises';

interface UseExercisesParams {
  search?: string;
  muscleGroup?: string;
}

export function useExercises(params?: UseExercisesParams) {
  const debouncedSearch = useDebounce(params?.search ?? '', 300);

  const queryParams: ExerciseListParams = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(params?.muscleGroup !== undefined ? { muscleGroup: params.muscleGroup } : {}),
  };

  return useQuery({
    queryKey: ['exercises', queryParams],
    queryFn: () => fetchExercises(queryParams),
    staleTime: 10 * 60 * 1000, // 10 dk — egzersiz listesi sık değişmez
  });
}

export function useAddExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExerciseInput) => createExercise(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}
