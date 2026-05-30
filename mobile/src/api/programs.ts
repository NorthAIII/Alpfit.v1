import type { z } from 'zod';

import type { programSchema } from '@alpfit/shared';

import { authedFetch } from './client';

export type Program = z.infer<typeof programSchema>;

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
