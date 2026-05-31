/**
 * TASK-3.03 — Streak motoru servis testleri.
 *
 * processWorkoutCompletion senaryoları:
 *   - Normal tamamlama → currentStreak +1, maxStreak güncellendi
 *   - Aynı gün iki tamamlama → streak +2 (kümülatif)
 *   - Re-aktivasyon: streakResetAt set → tamamlama sonrası sıfırlandı, streak = 1
 *   - Re-aktivasyon: ptT7DismissedAt sıfırlanmadı (kalıcı — PRD kararı)
 *   - StreakState yoksa → upsert oluşturur, hata vermez
 *   - maxStreak asla azalmaz
 *   - [Gece yarısı] 23:58 Istanbul → lastActivityDate bugün
 *   - [Gece yarısı] 00:02 Istanbul → lastActivityDate yeni gün
 *
 * M3 §Teknik Notlar: "En yüksek test sıklığı + en katı kabul kriteri"
 * (ILKELER §En Yüksek Öncelikli Eksen #1)
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { processWorkoutCompletion } from './streak.service.js';

describe('TASK-3.03 — processWorkoutCompletion', () => {
  let testDb: TestDatabase;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    prisma = createPrismaClient(testDb.databaseUrl);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  beforeEach(async () => {
    // StreakState önce silinir — FK: StreakState.memberId → User.id (RESTRICT)
    await prisma.streakState.deleteMany();
    await prisma.user.deleteMany();
  });

  async function createMember(phone = '+905550000001') {
    return prisma.user.create({
      data: { phoneE164: phone, role: 'member', firstName: 'Test', lastName: 'Uye' },
    });
  }

  // ── Normal tamamlama ───────────────────────────────────────────────────────

  it('normal tamamlama → currentStreak +1, maxStreak güncellendi', async () => {
    const member = await createMember();
    // StreakState davet kabul akışında oluşturulmuş gibi manuel ekle
    await prisma.streakState.create({
      data: { memberId: member.id, currentStreak: 3, maxStreak: 5 },
    });

    await processWorkoutCompletion(prisma, member.id);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(4);
    expect(state.maxStreak).toBe(5); // max düşmemeli (5 > 4)
    expect(state.lastActivityDate).not.toBeNull();
  });

  // ── Aynı gün iki tamamlama ────────────────────────────────────────────────

  it('aynı gün iki tamamlama → streak +2 (kümülatif)', async () => {
    const member = await createMember();
    await prisma.streakState.create({
      data: { memberId: member.id, currentStreak: 0, maxStreak: 0 },
    });

    await processWorkoutCompletion(prisma, member.id);
    await processWorkoutCompletion(prisma, member.id);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(2);
    expect(state.maxStreak).toBe(2);
  });

  // ── Re-aktivasyon: T-flag'ler temizlendi ──────────────────────────────────

  it('re-aktivasyon: streakResetAt set → tamamlama sonrası sıfırlandı, streak = 1', async () => {
    const member = await createMember();
    const resetTime = new Date('2026-05-28T21:00:00.000Z');
    await prisma.streakState.create({
      data: {
        memberId: member.id,
        currentStreak: 0,
        maxStreak: 7,
        streakResetAt: resetTime,
        comebackT2SentAt: new Date('2026-05-30T09:00:00.000Z'),
        ptT7AlertedAt: new Date('2026-05-31T09:00:00.000Z'),
        t14FlaggedAt: null,
      },
    });

    await processWorkoutCompletion(prisma, member.id);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(1);
    expect(state.maxStreak).toBe(7); // max düşmemeli
    expect(state.streakResetAt).toBeNull();
    expect(state.comebackT2SentAt).toBeNull();
    expect(state.ptT7AlertedAt).toBeNull();
    expect(state.t14FlaggedAt).toBeNull();
  });

  // ── Re-aktivasyon: ptT7DismissedAt kalıcıdır ──────────────────────────────

  it('re-aktivasyon: ptT7DismissedAt sıfırlanmadı (PRD: "Okudum" kalıcı)', async () => {
    const member = await createMember();
    const dismissTime = new Date('2026-05-29T14:00:00.000Z');
    await prisma.streakState.create({
      data: {
        memberId: member.id,
        currentStreak: 0,
        maxStreak: 3,
        streakResetAt: new Date('2026-05-25T21:00:00.000Z'),
        ptT7DismissedAt: dismissTime,
      },
    });

    await processWorkoutCompletion(prisma, member.id);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.streakResetAt).toBeNull(); // temizlendi
    // ptT7DismissedAt KORUNMALI — yeni kopma = yeni ptT7AlertedAt (T+7 job'ı set eder)
    expect(state.ptT7DismissedAt?.toISOString()).toBe(dismissTime.toISOString());
  });

  // ── StreakState yokken upsert güvenlik ağı ─────────────────────────────────

  it('StreakState yokken → upsert oluşturur, hata vermez', async () => {
    const member = await createMember();
    // Kasıtlı olarak StreakState oluşturulmadı

    await expect(processWorkoutCompletion(prisma, member.id)).resolves.not.toThrow();

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(1);
    expect(state.maxStreak).toBe(1);
  });

  // ── maxStreak asla azalmaz ─────────────────────────────────────────────────

  it('maxStreak asla azalmaz — streak 1 iken eski max 5 korunur', async () => {
    const member = await createMember();
    await prisma.streakState.create({
      data: { memberId: member.id, currentStreak: 0, maxStreak: 5 },
    });

    await processWorkoutCompletion(prisma, member.id);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(1);
    expect(state.maxStreak).toBe(5); // 5 > 1, max korunmalı
  });

  // ── Gece yarısı geçişi — Istanbul timezone ────────────────────────────────

  describe('gece yarısı geçişi (Istanbul timezone)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('23:58 Istanbul → lastActivityDate bugün (31 Mayıs)', async () => {
      // 2026-05-31T20:58:00.000Z = Istanbul 23:58, 31 Mayıs (UTC+3)
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-05-31T20:58:00.000Z'));

      const member = await createMember();
      await processWorkoutCompletion(prisma, member.id);

      const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
      expect(state.lastActivityDate?.toISOString()).toBe('2026-05-31T00:00:00.000Z');
    });

    it('00:02 Istanbul → lastActivityDate yeni gün (1 Haziran)', async () => {
      // 2026-05-31T21:02:00.000Z = Istanbul 00:02, 1 Haziran (UTC+3)
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-05-31T21:02:00.000Z'));

      const member = await createMember('+905550000002');
      await processWorkoutCompletion(prisma, member.id);

      const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
      expect(state.lastActivityDate?.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    });
  });
});
