import { authedFetch } from './client';

import type { exerciseSchema } from '@alpfit/shared';
import type { z } from 'zod';

export type Exercise = z.infer<typeof exerciseSchema>;

export interface ExerciseListParams {
  search?: string;
  muscleGroup?: string;
}

export async function fetchExercises(params?: ExerciseListParams): Promise<Exercise[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.muscleGroup) qs.set('muscleGroup', params.muscleGroup);
  const query = qs.toString();
  const res = await authedFetch(`/exercises${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('fetchExercises failed');
  return res.json() as Promise<Exercise[]>;
}

export interface CreateExerciseInput {
  name: string;
  muscleGroup?: string;
  videoUrl?: string;
}

export async function createExercise(input: CreateExerciseInput): Promise<Exercise> {
  const res = await authedFetch('/exercises', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('createExercise failed');
  return res.json() as Promise<Exercise>;
}
