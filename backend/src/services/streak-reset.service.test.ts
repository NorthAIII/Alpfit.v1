/**
 * TASK-3.05 — Nightly streak sıfırlama servis testleri.
 *
 * runNightlyStreakReset senaryoları:
 *   - Planlı gün + tamamlama yok → streak sıfırlandı, T+2 kuyruğa eklendi
 *   - Planlı gün + tamamlama var → streak değişmedi, kuyruk boş
 *   - Dünkü planlı gün (48h < geçmedi) → streak değişmedi (telafi penceresi açık)
 *   - İdempotent: currentStreak=0 + streakResetAt set → ikinci çalıştırmada değişmedi
 *   - Aktif programsız üye → etkilenmedi
 *   - T+2 delayed job → sıfırlama olan üyeler için kuyruğa eklendi
 *   - [Gece yarısı] 23:58'de antrenman yapan üye → 00:05 job'da sıfırlanmaz
 *
 * M3 §Teknik Notlar: "En yüksek test sıklığı + en katı kabul kriteri"
 * (ILKELER §En Yüksek Öncelikli Eksen #1)
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import { runNightlyStreakReset } from './streak-reset.service.js';

// Sabit test zamanı: 2026-06-04 00:05 Istanbul = 2026-06-03 21:05 UTC
// missedDay = 2 gün önce Istanbul = 2026-06-02 = Tuesday (dayOfWeek=2)
const NOW_UTC = new Date('2026-06-03T21:05:00.000Z');
const MISSED_DAY = new Date('2026-06-02T00:00:00.000Z'); // Salı
const MISSED_DOW = MISSED_DAY.getUTCDay(); // 2

// 1 gün önce Istanbul: 2026-06-03 (Çarşamba) — telafi penceresi hâlâ açık
const YESTERDAY = new Date('2026-06-03T00:00:00.000Z');
const YESTERDAY_DOW = YESTERDAY.getUTCDay(); // 3

describe('TASK-3.05 — runNightlyStreakReset', () => {
  let testDb: TestDatabase;
  let prisma: PrismaClient;
  let mockQueue: { add: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    testDb = await createTestDatabase();
    prisma = createPrismaClient(testDb.databaseUrl);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await dropTestDatabase(testDb.databaseName);
  });

  beforeEach(async () => {
    mockQueue = { add: vi.fn().mockResolvedValue(undefined) };
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW_UTC);

    // FK sırasıyla temizle
    await prisma.workoutCompletion.deleteMany();
    await prisma.streakState.deleteMany();
    await prisma.programDayExercise.deleteMany();
    await prisma.programDay.deleteMany();
    await prisma.program.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Yardımcı fonksiyonlar ──────────────────────────────────────────────────

  async function createTrainer(phone = '+905550001000') {
    return prisma.user.create({
      data: { phoneE164: phone, role: 'trainer', firstName: 'Trainer', lastName: 'Test' },
    });
  }

  async function createMember(phone = '+905550002000') {
    return prisma.user.create({
      data: { phoneE164: phone, role: 'member', firstName: 'Member', lastName: 'Test' },
    });
  }

  async function createActiveProgram(trainerId: string, memberId: string) {
    return prisma.program.create({
      data: { trainerId, memberId, status: 'active' },
    });
  }

  async function createProgramDay(
    programId: string,
    opts: { dayOfWeek?: number; isOneOff?: boolean; specificDate?: Date; position?: number } = {},
  ) {
    return prisma.programDay.create({
      data: {
        programId,
        dayOfWeek: opts.dayOfWeek ?? MISSED_DOW,
        isOneOff: opts.isOneOff ?? false,
        specificDate: opts.specificDate ?? null,
        position: opts.position ?? 0,
      },
    });
  }

  async function createStreakState(
    memberId: string,
    opts: {
      currentStreak?: number;
      maxStreak?: number;
      streakResetAt?: Date | null;
      lastActivityDate?: Date | null;
    } = {},
  ) {
    return prisma.streakState.create({
      data: {
        memberId,
        currentStreak: opts.currentStreak ?? 3,
        maxStreak: opts.maxStreak ?? 5,
        streakResetAt: opts.streakResetAt ?? null,
        lastActivityDate: opts.lastActivityDate ?? null,
      },
    });
  }

  // ── Planlı gün + tamamlama yok → sıfırlandı ──────────────────────────────

  it('planlı gün + tamamlama yok → streak sıfırlandı, T+2 kuyruğa eklendi', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    await createProgramDay(program.id, { dayOfWeek: MISSED_DOW });
    await createStreakState(member.id, { currentStreak: 4, lastActivityDate: null });

    await runNightlyStreakReset(prisma, mockQueue as any);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(0);
    expect(state.streakResetAt).not.toBeNull();

    expect(mockQueue.add).toHaveBeenCalledOnce();
    expect(mockQueue.add).toHaveBeenCalledWith(
      'comeback-t2',
      { userId: member.id },
      expect.objectContaining({ delay: expect.any(Number) }),
    );
  });

  // ── Tamamlama varsa → streak değişmedi ───────────────────────────────────

  it('tamamlama varsa → streak değişmedi, kuyruk boş', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    const day = await createProgramDay(program.id, { dayOfWeek: MISSED_DOW });
    await createStreakState(member.id, { currentStreak: 4 });

    // Kaçırılan gün için tamamlama kaydı var
    await prisma.workoutCompletion.create({
      data: {
        memberId: member.id,
        programDayId: day.id,
        scheduledDate: MISSED_DAY,
        completedAt: MISSED_DAY,
      },
    });

    await runNightlyStreakReset(prisma, mockQueue as any);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(4); // değişmedi
    expect(state.streakResetAt).toBeNull();
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  // ── Dünkü planlı gün → telafi penceresi açık, etkilenmedi ────────────────

  it('dünkü planlı gün (< 48h) → streak değişmedi (telafi penceresi açık)', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    // Dün (Çarşamba) için planlı gün — job sadece Salı (missedDay) bakıyor
    await createProgramDay(program.id, { dayOfWeek: YESTERDAY_DOW });
    await createStreakState(member.id, { currentStreak: 3 });

    await runNightlyStreakReset(prisma, mockQueue as any);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(3); // değişmedi — dünkü gün scope dışında
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  // ── İdempotent: streak zaten sıfır → tekrar sıfırlama yok ────────────────

  it('currentStreak=0 + streakResetAt set → ikinci çalıştırmada idempotent', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    await createProgramDay(program.id, { dayOfWeek: MISSED_DOW });
    const previousResetTime = new Date('2026-06-02T00:05:00.000Z'); // önceki çalıştırma
    await createStreakState(member.id, {
      currentStreak: 0,
      streakResetAt: previousResetTime,
      lastActivityDate: null,
    });

    await runNightlyStreakReset(prisma, mockQueue as any);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(0);
    // streakResetAt değişmedi — önceki değer korundu
    expect(state.streakResetAt?.toISOString()).toBe(previousResetTime.toISOString());
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  // ── Aktif programsız üye → etkilenmedi ───────────────────────────────────

  it('aktif programsız üye → etkilenmedi', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    // program yok
    await createStreakState(member.id, { currentStreak: 5, lastActivityDate: null });

    await runNightlyStreakReset(prisma, mockQueue as any);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    expect(state.currentStreak).toBe(5); // değişmedi
    expect(mockQueue.add).not.toHaveBeenCalled();

    // Trainer ve member referans için
    void trainer;
  });

  // ── T+2 job delay doğrulaması ─────────────────────────────────────────────

  it('T+2 delayed job → sıfırlama olan üyeler için kuyruğa eklendi', async () => {
    const trainer = await createTrainer();
    const member1 = await createMember('+905550002001');
    const member2 = await createMember('+905550002002');
    const program1 = await createActiveProgram(trainer.id, member1.id);
    const program2 = await createActiveProgram(trainer.id, member2.id);
    await createProgramDay(program1.id, { dayOfWeek: MISSED_DOW });
    await createProgramDay(program2.id, { dayOfWeek: MISSED_DOW });
    // member1: tamamlama yok → sıfırlanacak
    // member2: tamamlama var → sıfırlanmayacak
    const day2 = await prisma.programDay.findFirstOrThrow({ where: { programId: program2.id } });
    await prisma.workoutCompletion.create({
      data: {
        memberId: member2.id,
        programDayId: day2.id,
        scheduledDate: MISSED_DAY,
        completedAt: MISSED_DAY,
      },
    });
    await createStreakState(member1.id, { currentStreak: 3, lastActivityDate: null });
    await createStreakState(member2.id, { currentStreak: 4 });

    await runNightlyStreakReset(prisma, mockQueue as any);

    // Sadece member1 için T+2 kuyruğa eklendi
    expect(mockQueue.add).toHaveBeenCalledOnce();
    expect(mockQueue.add).toHaveBeenCalledWith('comeback-t2', { userId: member1.id }, expect.anything());
  });

  // ── Gece yarısı geçişi ────────────────────────────────────────────────────

  it('[Gece yarısı] 23:58 Istanbul antrenman yapan üye → 00:05 job\'da sıfırlanmaz', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    await createProgramDay(program.id, { dayOfWeek: MISSED_DOW });

    // Üye dün 23:58 Istanbul'da antrenman yaptı → lastActivityDate = dün (June 3)
    // processWorkoutCompletion Istanbul takvim gününü kullanır: 23:58 Istanbul = June 3
    await createStreakState(member.id, {
      currentStreak: 3,
      lastActivityDate: YESTERDAY, // 2026-06-03T00:00:00.000Z
    });

    await runNightlyStreakReset(prisma, mockQueue as any);

    const state = await prisma.streakState.findUniqueOrThrow({ where: { memberId: member.id } });
    // lastActivityDate (June 3) >= missedDay (June 2) → skip → sıfırlanmaz
    expect(state.currentStreak).toBe(3);
    expect(state.streakResetAt).toBeNull();
    expect(mockQueue.add).not.toHaveBeenCalled();
  });
});
