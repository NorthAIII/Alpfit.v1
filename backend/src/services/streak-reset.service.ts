/**
 * Nightly streak sıfırlama servisi (TASK-3.05).
 *
 * runNightlyStreakReset: Her gün 00:05 Istanbul'da çalışır.
 * - Aktif programlı tüm üyeler için 2 gün önceki planlanmış antrenman günlerini kontrol eder.
 * - 48 saatlik telafi penceresi dolmuşsa ve tamamlama yoksa streak sıfırlar.
 * - Sıfırlama olan üyeler için comeback-t2 delayed job kuyruğa alır.
 * - İdempotent: currentStreak=0 + streakResetAt set ise tekrar sıfırlama yapılmaz.
 *
 * Timezone: Europe/Istanbul sabit (v1 TR pilot — PHASE-3 Araştırma Bulguları)
 */
import type { Queue } from 'bullmq';

import type { PrismaClient } from '../db/prisma.js';

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * "N gün önce" Istanbul takvim gününü UTC midnight olarak döner.
 * lastActivityDate ve scheduledDate ile aynı convention (UTC midnight = Istanbul takvim günü).
 * Turkey UTC+3 sabit (DST yok, 2016'dan beri).
 */
function getIstanbulMidnightDaysAgo(daysAgo: number): Date {
  const now = new Date();
  const target = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const istanbulDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(
    target,
  );
  return new Date(istanbulDate + 'T00:00:00.000Z');
}

export async function runNightlyStreakReset(prisma: PrismaClient, queue: Queue): Promise<void> {
  const missedDay = getIstanbulMidnightDaysAgo(2);
  const missedDayOfWeek = missedDay.getUTCDay(); // 0=Pazar…6=Cumartesi (JS convention)

  // Aktif programlı, kaçırılan güne uyan ProgramDay'i olan programları çek
  const programs = await prisma.program.findMany({
    where: { status: 'active' },
    select: {
      memberId: true,
      days: {
        where: {
          OR: [
            { isOneOff: false, dayOfWeek: missedDayOfWeek },
            { isOneOff: true, specificDate: missedDay },
          ],
        },
        select: { id: true },
      },
    },
  });

  // Yalnızca eşleşen günü olan programlar işlenir
  const relevant = programs.filter((p) => p.days.length > 0);
  if (relevant.length === 0) return;

  const memberIds = [...new Set(relevant.map((p) => p.memberId))];

  // Batch: kaçırılan gün için tamamlama kaydı olan üyeler
  const completions = await prisma.workoutCompletion.findMany({
    where: { memberId: { in: memberIds }, scheduledDate: missedDay },
    select: { memberId: true },
  });
  const completedSet = new Set(completions.map((c) => c.memberId));

  // Batch: ilgili üyelerin streak state'leri
  const states = await prisma.streakState.findMany({
    where: { memberId: { in: memberIds } },
    select: {
      memberId: true,
      currentStreak: true,
      streakResetAt: true,
      lastActivityDate: true,
    },
  });
  const stateMap = new Map(states.map((s) => [s.memberId, s]));

  const now = new Date();

  for (const memberId of memberIds) {
    // Kaçırılan gün için tamamlama varsa atla (telafi dahil — scheduledDate bazlı)
    if (completedSet.has(memberId)) continue;

    const state = stateMap.get(memberId);

    // İdempotent: streak zaten sıfırlanmışsa (currentStreak=0 + streakResetAt set) tekrar sıfırlama yok
    if (state && state.currentStreak === 0 && state.streakResetAt !== null) continue;

    // Son aktivite kaçırılan günden daha yeni ise atla
    // (dün geç tamamlama veya başka bir antrenman günü tamamlaması → telafi sayılır)
    if (state?.lastActivityDate && state.lastActivityDate >= missedDay) continue;

    // Streak sıfırla
    await prisma.streakState.upsert({
      where: { memberId },
      create: { memberId, currentStreak: 0, maxStreak: 0, streakResetAt: now },
      update: { currentStreak: 0, streakResetAt: now },
    });

    // T+2 comeback delayed job — handler TASK-3.09'da implement edilecek
    await queue.add('comeback-t2', { userId: memberId }, { delay: TWO_DAYS_MS });
  }
}
