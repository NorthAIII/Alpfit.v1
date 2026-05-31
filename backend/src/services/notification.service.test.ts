/**
 * TASK-3.08 — Sabah reminder push servisi testleri.
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
 * M3 §Teknik Notlar: "En yüksek test sıklığı + en katı kabul kriteri"
 * (ILKELER §En Yüksek Öncelikli Eksen #1)
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaClient, type PrismaClient } from '../db/prisma.js';
import { createTestDatabase, dropTestDatabase, type TestDatabase } from '../../test/db.js';
import type { PushChannel } from '../lib/push.js';
import { sendMorningReminders } from './notification.service.js';
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
