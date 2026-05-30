import type { z } from 'zod';

import type { programSchema } from '@alpfit/shared';

import { authedFetch } from './client';

export type Program = z.infer<typeof programSchema>;

export type PatchExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  notes?: string;
  position: number;
};

export type PatchDay = {
  dayOfWeek: number;
  position: number;
  exercises: PatchExercise[];
};

/** GET /members/:memberId/program — üyenin aktif programı (trainer view). 404 → null. */
export async function fetchMemberActiveProgram(memberId: string): Promise<Program | null> {
  const res = await authedFetch(`/members/${memberId}/program`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('fetchMemberActiveProgram failed');
  return res.json() as Promise<Program>;
}

/** POST /programs — yeni draft program (trainer). */
export async function createProgram(memberId: string): Promise<Program> {
  const res = await authedFetch('/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId }),
  });
  if (!res.ok) throw new Error('createProgram failed');
  return res.json() as Promise<Program>;
}

/** PATCH /programs/:id — auto-save (tam yapı gönderilir, 1sn debounce client'te). */
export async function patchProgram(programId: string, days: PatchDay[]): Promise<void> {
  const res = await authedFetch(`/programs/${programId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
  });
  if (!res.ok) throw new Error('patchProgram failed');
}

/** POST /programs/:id/publish — taslaktan aktife alır, üye görür. */
export async function publishProgram(programId: string): Promise<Program> {
  const res = await authedFetch(`/programs/${programId}/publish`, { method: 'POST' });
  if (!res.ok) throw new Error('publishProgram failed');
  return res.json() as Promise<Program>;
}

/** GET /me/program — üyenin kendi aktif programı (member view). 404 → null. */
export async function fetchMyActiveProgram(): Promise<Program | null> {
  const res = await authedFetch('/me/program');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('fetchMyActiveProgram failed');
  return res.json() as Promise<Program>;
}

/** POST /programs/:id/copy — hedef üyeye yeni draft oluşturur. */
export async function copyProgramToMember(
  programId: string,
  targetMemberId: string,
): Promise<Program> {
  const res = await authedFetch(`/programs/${programId}/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetMemberId }),
  });
  if (!res.ok) throw new Error('copyProgram failed');
  return res.json() as Promise<Program>;
}

/** GET /programs/:id — tam program (trainer kendi | üye kendi). Arşivlenmiş dahil. 404 → null. */
export async function fetchProgramById(programId: string): Promise<Program | null> {
  const res = await authedFetch(`/programs/${programId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchProgramById: ${res.status}`);
  return res.json() as Promise<Program>;
}
