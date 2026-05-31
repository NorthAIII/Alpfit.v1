/**
 * Notification service testleri — TASK-3.08 (sendMorningReminders) + TASK-3.09 (sendComebackT2).
 *
 * sendMorningReminders senaryoları:
 *   - morningHour eşleşen, bugün planlı, reminder açık, token var → push sent, log sent
 *   - morningHour ≠ currentHour → push yok (farklı saat tercihli üye)
 *   - reminderEnabled: false → push yok, log skipped (reminder_disabled)
 *   - Token yok → push yok, log skipped (no_token)
 *   - Sessiz saat (mock) → push yok, log skipped (silent_hours)
 *   - Bugün planlı antrenman yok → push yok
 *   - Job geç başladı (minute > 30) → push yok, log yok
 *
 * sendComebackT2 senaryoları:
 *   - Normal akış: push gönderildi, comebackT2SentAt set, log sent
 *   - comebackT2SentAt önceden set → idempotency skip, push yok
 *   - currentStreak > 0 (re-aktivasyon) → skip, push yok
 *   - comebackEnabled: false → skip, log skipped (comeback_disabled)
 *   - Token yok → skip, log skipped (no_token)
 *   - Sessiz saat (mock) → yeniden zamanlandı, log skipped (silent_hours_rescheduled)
 *
 * M3 §Teknik Notlar: "En yüksek test sıklığı + en katı kabul kriteri"
 * (ILKELER §En Yüksek Öncelikli Eksen #1)
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Queue } from 'bullmq';

import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import type { PushChannel } from '../lib/push.js';
import { sendMorningReminders, sendComebackT2, sendComebackT7Pt, setT14Flag } from './notification.service.js';
import * as silentHoursModule from '../lib/silent-hours.js';

// Sabit test zamanı: 2026-06-01 09:00 Istanbul = 2026-06-01 06:00 UTC
// Istanbul UTC+3, Pazartesi (getDay() = 1)
const NOW_UTC = new Date('2026-06-01T06:00:00.000Z');
const TODAY_DOW = 1; // Pazartesi
const TODAY_MIDNIGHT = new Date('2026-06-01T00:00:00.000Z'); // Istanbul takvim günü convention

// Geç başlama zamanı: 09:35 Istanbul = 06:35 UTC (minute=35 > 30)
const NOW_UTC_LATE = new Date('2026-06-01T06:35:00.000Z');

function buildMockPushChannel(result: 'sent' | 'invalid_token' = 'sent'): {
  channel: PushChannel;
  sendSpy: ReturnType<typeof vi.fn>;
} {
  const sendSpy = vi.fn().mockResolvedValue(result);
  return { channel: { send: sendSpy }, sendSpy };
}

describe('TASK-3.08 — sendMorningReminders', () => {
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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW_UTC);

    // FK sırasıyla temizle
    await prisma.notificationLog.deleteMany();
    await prisma.pushToken.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.workoutCompletion.deleteMany();
    await prisma.streakState.deleteMany();
    await prisma.programDayExercise.deleteMany();
    await prisma.programDay.deleteMany();
    await prisma.program.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
        dayOfWeek: opts.dayOfWeek ?? TODAY_DOW,
        isOneOff: opts.isOneOff ?? false,
        specificDate: opts.specificDate ?? null,
        position: opts.position ?? 0,
      },
    });
  }

  async function createNotificationPref(
    memberId: string,
    opts: { morningHour?: number; reminderEnabled?: boolean } = {},
  ) {
    return prisma.notificationPreference.create({
      data: {
        memberId,
        morningHour: opts.morningHour ?? 9,
        reminderEnabled: opts.reminderEnabled ?? true,
      },
    });
  }

  async function createPushToken(userId: string, token = 'ExponentPushToken[test-token-1]') {
    return prisma.pushToken.create({
      data: { userId, token, platform: 'ios' },
    });
  }

  // ── Happy path ──────────────────────────────────────────────────────────────

  it('morningHour eşleşen, bugün planlı, reminder açık, token var → push gönderildi, log sent', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    await createProgramDay(program.id, { dayOfWeek: TODAY_DOW });
    await createNotificationPref(member.id, { morningHour: 9, reminderEnabled: true });
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel('sent');
    await sendMorningReminders(prisma, channel);

    expect(sendSpy).toHaveBeenCalledOnce();
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'ExponentPushToken[test-token-1]',
        title: 'Antrenman günün 💪',
        body: 'Planını gör ve başla →',
      }),
    );

    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('sent');
    expect(log!.jobType).toBe('morning-reminder');
  });

  // ── morningHour ≠ currentHour → push yok ─────────────────────────────────

  it('morningHour ≠ currentHour → push gönderilmedi (farklı saat tercihli üye)', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    await createProgramDay(program.id, { dayOfWeek: TODAY_DOW });
    await createNotificationPref(member.id, { morningHour: 10, reminderEnabled: true }); // 10, şu an 9
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel();
    await sendMorningReminders(prisma, channel);

    expect(sendSpy).not.toHaveBeenCalled();
    const logCount = await prisma.notificationLog.count({ where: { userId: member.id } });
    expect(logCount).toBe(0);
  });

  // ── reminderEnabled: false ─────────────────────────────────────────────────

  it('reminderEnabled: false → push yok, log skipped (reminder_disabled)', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    await createProgramDay(program.id, { dayOfWeek: TODAY_DOW });
    await createNotificationPref(member.id, { morningHour: 9, reminderEnabled: false });
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel();
    await sendMorningReminders(prisma, channel);

    expect(sendSpy).not.toHaveBeenCalled();
    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('skipped');
    expect(log!.meta).toMatchObject({ reason: 'reminder_disabled' });
  });

  // ── Token yok ────────────────────────────────────────────────────────────

  it('token yok → push yok, log skipped (no_token)', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    await createProgramDay(program.id, { dayOfWeek: TODAY_DOW });
    await createNotificationPref(member.id, { morningHour: 9, reminderEnabled: true });
    // push token yok

    const { channel, sendSpy } = buildMockPushChannel();
    await sendMorningReminders(prisma, channel);

    expect(sendSpy).not.toHaveBeenCalled();
    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('skipped');
    expect(log!.meta).toMatchObject({ reason: 'no_token' });
  });

  // ── Sessiz saat ─────────────────────────────────────────────────────────

  it('sessiz saatteyse → push yok, log skipped (silent_hours)', async () => {
    vi.spyOn(silentHoursModule, 'isInSilentHours').mockReturnValue(true);

    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    await createProgramDay(program.id, { dayOfWeek: TODAY_DOW });
    await createNotificationPref(member.id, { morningHour: 9, reminderEnabled: true });
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel();
    await sendMorningReminders(prisma, channel);

    expect(sendSpy).not.toHaveBeenCalled();
    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('skipped');
    expect(log!.meta).toMatchObject({ reason: 'silent_hours' });
  });

  // ── Bugün planlı antrenman yok ─────────────────────────────────────────

  it('bugün planlı antrenman yok → push gönderilmedi', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    // Salı (dayOfWeek=2) için antrenman, bugün Pazartesi (1)
    await createProgramDay(program.id, { dayOfWeek: 2 });
    await createNotificationPref(member.id, { morningHour: 9, reminderEnabled: true });
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel();
    await sendMorningReminders(prisma, channel);

    expect(sendSpy).not.toHaveBeenCalled();
    const logCount = await prisma.notificationLog.count({ where: { userId: member.id } });
    expect(logCount).toBe(0);
  });

  // ── Job geç başladı (minute > 30) ──────────────────────────────────────

  it('job 30 dakikadan geç başladı → o saat için skip (log yok)', async () => {
    vi.setSystemTime(NOW_UTC_LATE); // 09:35 Istanbul

    const trainer = await createTrainer();
    const member = await createMember();
    const program = await createActiveProgram(trainer.id, member.id);
    await createProgramDay(program.id, { dayOfWeek: TODAY_DOW });
    await createNotificationPref(member.id, { morningHour: 9, reminderEnabled: true });
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel();
    await sendMorningReminders(prisma, channel);

    expect(sendSpy).not.toHaveBeenCalled();
    const logCount = await prisma.notificationLog.count({ where: { userId: member.id } });
    expect(logCount).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TASK-3.09 — sendComebackT2
// ══════════════════════════════════════════════════════════════════════════════

describe('TASK-3.09 — sendComebackT2', () => {
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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW_UTC);

    await prisma.notificationLog.deleteMany();
    await prisma.pushToken.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.streakState.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Yardımcılar ──────────────────────────────────────────────────────────

  function buildMockQueue(): { queue: Queue; addSpy: ReturnType<typeof vi.fn> } {
    const addSpy = vi.fn().mockResolvedValue(undefined);
    return { queue: { add: addSpy } as unknown as Queue, addSpy };
  }

  async function createMember(phone = '+905550003000') {
    return prisma.user.create({
      data: { phoneE164: phone, role: 'member', firstName: 'Comeback', lastName: 'Test' },
    });
  }

  async function createStreakState(
    memberId: string,
    opts: { currentStreak?: number; comebackT2SentAt?: Date | null } = {},
  ) {
    return prisma.streakState.create({
      data: {
        memberId,
        currentStreak: opts.currentStreak ?? 0,
        maxStreak: 0,
        comebackT2SentAt: opts.comebackT2SentAt ?? null,
        streakResetAt: new Date(),
      },
    });
  }

  async function createPref(memberId: string, opts: { comebackEnabled?: boolean } = {}) {
    return prisma.notificationPreference.create({
      data: {
        memberId,
        comebackEnabled: opts.comebackEnabled ?? true,
      },
    });
  }

  async function createPushToken(userId: string, token = 'ExponentPushToken[comeback-token-1]') {
    return prisma.pushToken.create({ data: { userId, token, platform: 'ios' } });
  }

  // ── Normal akış ──────────────────────────────────────────────────────────

  it('normal akış: push gönderildi, comebackT2SentAt set, log sent', async () => {
    const member = await createMember();
    await createStreakState(member.id);
    await createPref(member.id);
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel('sent');
    const { queue } = buildMockQueue();
    await sendComebackT2(prisma, channel, queue, member.id);

    expect(sendSpy).toHaveBeenCalledOnce();
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'ExponentPushToken[comeback-token-1]',
        title: 'Yeni bir başlangıç!',
        body: 'Bugün yeni bir streak başlatabilirsin. 🔥',
      }),
    );

    const state = await prisma.streakState.findUnique({ where: { memberId: member.id } });
    expect(state?.comebackT2SentAt).not.toBeNull();

    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('sent');
    expect(log!.jobType).toBe('comeback-t2');
  });

  // ── Idempotency ──────────────────────────────────────────────────────────

  it('comebackT2SentAt önceden set → idempotency skip, push yok', async () => {
    const member = await createMember();
    await createStreakState(member.id, { comebackT2SentAt: new Date('2026-05-30T10:00:00.000Z') });
    await createPref(member.id);
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel();
    const { queue } = buildMockQueue();
    await sendComebackT2(prisma, channel, queue, member.id);

    expect(sendSpy).not.toHaveBeenCalled();
    const logCount = await prisma.notificationLog.count({ where: { userId: member.id } });
    expect(logCount).toBe(0);
  });

  // ── Re-aktivasyon ────────────────────────────────────────────────────────

  it('currentStreak > 0 (re-aktivasyon) → skip, push yok', async () => {
    const member = await createMember();
    await createStreakState(member.id, { currentStreak: 3 });
    await createPref(member.id);
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel();
    const { queue } = buildMockQueue();
    await sendComebackT2(prisma, channel, queue, member.id);

    expect(sendSpy).not.toHaveBeenCalled();
    const logCount = await prisma.notificationLog.count({ where: { userId: member.id } });
    expect(logCount).toBe(0);
  });

  // ── comebackEnabled: false ───────────────────────────────────────────────

  it('comebackEnabled: false → skip, log skipped (comeback_disabled)', async () => {
    const member = await createMember();
    await createStreakState(member.id);
    await createPref(member.id, { comebackEnabled: false });
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel();
    const { queue } = buildMockQueue();
    await sendComebackT2(prisma, channel, queue, member.id);

    expect(sendSpy).not.toHaveBeenCalled();
    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('skipped');
    expect(log!.meta).toMatchObject({ reason: 'comeback_disabled' });
  });

  // ── Token yok ────────────────────────────────────────────────────────────

  it('token yok → skip, log skipped (no_token)', async () => {
    const member = await createMember();
    await createStreakState(member.id);
    await createPref(member.id);
    // push token yok

    const { channel, sendSpy } = buildMockPushChannel();
    const { queue } = buildMockQueue();
    await sendComebackT2(prisma, channel, queue, member.id);

    expect(sendSpy).not.toHaveBeenCalled();
    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('skipped');
    expect(log!.meta).toMatchObject({ reason: 'no_token' });
  });

  // ── Sessiz saat ─────────────────────────────────────────────────────────

  it('sessiz saatteyse → yeniden zamanlandı, push yok, log skipped (silent_hours_rescheduled)', async () => {
    vi.spyOn(silentHoursModule, 'isInSilentHours').mockReturnValue(true);

    const member = await createMember();
    await createStreakState(member.id);
    await createPref(member.id);
    await createPushToken(member.id);

    const { channel, sendSpy } = buildMockPushChannel();
    const { queue, addSpy } = buildMockQueue();
    await sendComebackT2(prisma, channel, queue, member.id);

    expect(sendSpy).not.toHaveBeenCalled();
    expect(addSpy).toHaveBeenCalledOnce();
    expect(addSpy).toHaveBeenCalledWith(
      'comeback-t2',
      { userId: member.id },
      { delay: expect.any(Number) },
    );

    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('skipped');
    expect(log!.meta).toMatchObject({ reason: 'silent_hours_rescheduled' });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TASK-3.10 — sendComebackT7Pt
// ══════════════════════════════════════════════════════════════════════════════

describe('TASK-3.10 — sendComebackT7Pt', () => {
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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW_UTC);

    await prisma.notificationLog.deleteMany();
    await prisma.pushToken.deleteMany();
    await prisma.streakState.deleteMany();
    await prisma.trainerMember.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Yardımcılar ──────────────────────────────────────────────────────────

  async function createTrainer(phone = '+905550010000') {
    return prisma.user.create({
      data: { phoneE164: phone, role: 'trainer', firstName: 'PT', lastName: 'Test' },
    });
  }

  async function createMember(phone = '+905550020000') {
    return prisma.user.create({
      data: { phoneE164: phone, role: 'member', firstName: 'T7', lastName: 'Test' },
    });
  }

  async function linkTrainerMember(trainerId: string, memberId: string) {
    return prisma.trainerMember.create({ data: { trainerId, memberId } });
  }

  async function createStreakStateT7(
    memberId: string,
    opts: { currentStreak?: number; ptT7AlertedAt?: Date | null } = {},
  ) {
    return prisma.streakState.create({
      data: {
        memberId,
        currentStreak: opts.currentStreak ?? 0,
        maxStreak: 0,
        streakResetAt: new Date(),
        ptT7AlertedAt: opts.ptT7AlertedAt ?? null,
      },
    });
  }

  async function createTrainerPushToken(userId: string, token = 'ExponentPushToken[trainer-t7-1]') {
    return prisma.pushToken.create({ data: { userId, token, platform: 'ios' } });
  }

  // ── Normal akış ──────────────────────────────────────────────────────────

  it('normal akış: ptT7AlertedAt set, PT push gönderildi, log sent', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    await linkTrainerMember(trainer.id, member.id);
    await createStreakStateT7(member.id);
    await createTrainerPushToken(trainer.id);

    const { channel, sendSpy } = buildMockPushChannel('sent');
    await sendComebackT7Pt(prisma, channel, member.id);

    expect(sendSpy).toHaveBeenCalledOnce();
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'ExponentPushToken[trainer-t7-1]',
        title: 'Üye aktivitesi yok',
        body: '7 gündür aktif değil — manuel iletişim önerilir.',
      }),
    );

    const state = await prisma.streakState.findUnique({ where: { memberId: member.id } });
    expect(state?.ptT7AlertedAt).not.toBeNull();

    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('sent');
    expect(log!.jobType).toBe('comeback-t7-pt');
  });

  // ── Idempotency ──────────────────────────────────────────────────────────

  it('ptT7AlertedAt önceden set → idempotency skip, push yok', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    await linkTrainerMember(trainer.id, member.id);
    await createStreakStateT7(member.id, { ptT7AlertedAt: new Date('2026-05-28T10:00:00.000Z') });
    await createTrainerPushToken(trainer.id);

    const { channel, sendSpy } = buildMockPushChannel();
    await sendComebackT7Pt(prisma, channel, member.id);

    expect(sendSpy).not.toHaveBeenCalled();
    const logCount = await prisma.notificationLog.count({ where: { userId: member.id } });
    expect(logCount).toBe(0);
  });

  // ── Re-aktivasyon ────────────────────────────────────────────────────────

  it('currentStreak > 0 (re-aktivasyon) → skip, push yok', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    await linkTrainerMember(trainer.id, member.id);
    await createStreakStateT7(member.id, { currentStreak: 2 });
    await createTrainerPushToken(trainer.id);

    const { channel, sendSpy } = buildMockPushChannel();
    await sendComebackT7Pt(prisma, channel, member.id);

    expect(sendSpy).not.toHaveBeenCalled();
    const logCount = await prisma.notificationLog.count({ where: { userId: member.id } });
    expect(logCount).toBe(0);
  });

  // ── PT token yok ─────────────────────────────────────────────────────────

  it('PT token yok → ptT7AlertedAt set, push yok, log skipped (no_trainer_token)', async () => {
    const trainer = await createTrainer();
    const member = await createMember();
    await linkTrainerMember(trainer.id, member.id);
    await createStreakStateT7(member.id);
    // push token yok

    const { channel, sendSpy } = buildMockPushChannel();
    await sendComebackT7Pt(prisma, channel, member.id);

    expect(sendSpy).not.toHaveBeenCalled();

    const state = await prisma.streakState.findUnique({ where: { memberId: member.id } });
    expect(state?.ptT7AlertedAt).not.toBeNull();

    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('skipped');
    expect(log!.meta).toMatchObject({ reason: 'no_trainer_token' });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TASK-3.10 — setT14Flag
// ══════════════════════════════════════════════════════════════════════════════

describe('TASK-3.10 — setT14Flag', () => {
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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW_UTC);

    await prisma.notificationLog.deleteMany();
    await prisma.streakState.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Yardımcılar ──────────────────────────────────────────────────────────

  async function createMember(phone = '+905550030000') {
    return prisma.user.create({
      data: { phoneE164: phone, role: 'member', firstName: 'T14', lastName: 'Test' },
    });
  }

  async function createStreakStateT14(
    memberId: string,
    opts: { currentStreak?: number; t14FlaggedAt?: Date | null } = {},
  ) {
    return prisma.streakState.create({
      data: {
        memberId,
        currentStreak: opts.currentStreak ?? 0,
        maxStreak: 0,
        streakResetAt: new Date(),
        t14FlaggedAt: opts.t14FlaggedAt ?? null,
      },
    });
  }

  // ── Normal akış ──────────────────────────────────────────────────────────

  it('normal akış: t14FlaggedAt set, push yok, log sent', async () => {
    const member = await createMember();
    await createStreakStateT14(member.id);

    await setT14Flag(prisma, member.id);

    const state = await prisma.streakState.findUnique({ where: { memberId: member.id } });
    expect(state?.t14FlaggedAt).not.toBeNull();

    const log = await prisma.notificationLog.findFirst({ where: { userId: member.id } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('sent');
    expect(log!.jobType).toBe('t14-flag');
    expect(log!.meta).toMatchObject({ reason: 'flag_set' });
  });

  // ── Idempotency ──────────────────────────────────────────────────────────

  it('t14FlaggedAt önceden set → idempotency skip, log yok', async () => {
    const member = await createMember();
    await createStreakStateT14(member.id, { t14FlaggedAt: new Date('2026-05-28T10:00:00.000Z') });

    await setT14Flag(prisma, member.id);

    const logCount = await prisma.notificationLog.count({ where: { userId: member.id } });
    expect(logCount).toBe(0);
  });

  // ── Re-aktivasyon ────────────────────────────────────────────────────────

  it('currentStreak > 0 (re-aktivasyon) → skip, log yok', async () => {
    const member = await createMember();
    await createStreakStateT14(member.id, { currentStreak: 1 });

    await setT14Flag(prisma, member.id);

    const state = await prisma.streakState.findUnique({ where: { memberId: member.id } });
    expect(state?.t14FlaggedAt).toBeNull();
    const logCount = await prisma.notificationLog.count({ where: { userId: member.id } });
    expect(logCount).toBe(0);
  });
});
