/**
 * Streak motoru servisi (TASK-3.03).
 *
 * processWorkoutCompletion: Üye antrenman tamamladığında StreakState'i günceller.
 * - currentStreak +1, maxStreak güncellenir
 * - Re-aktivasyon durumunda T-flag'leri temizler (ptT7DismissedAt hariç — kalıcıdır)
 * - Motor hatası tamamlama kaydını engellemez; çağıran try/catch ile sarar
 *
 * Timezone: Europe/Istanbul sabit (v1 TR pilot — PHASE-3 Araştırma Bulguları)
 */
import type { PrismaClient } from '../db/prisma.js';

/**
 * Istanbul saat dilimine göre bugünün başlangıcını (UTC midnight) döner.
 * lastActivityDate DB alanında gün tutarlılığı için kullanılır.
 */
function getTodayInIstanbul(): Date {
  const now = new Date();
  // 'en-CA' formatı YYYY-MM-DD verir — timezone'a göre doğru takvim gününü alır
  const istanbulDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(now);
  return new Date(istanbulDate + 'T00:00:00.000Z');
}

export async function processWorkoutCompletion(
  prisma: PrismaClient,
  memberId: string,
): Promise<void> {
  const today = getTodayInIstanbul();

  await prisma.$transaction(async (tx) => {
    // Güvenlik ağı: davet kabul akışında oluşturulmuş olmalı; yoksa upsert yarar
    const state = await tx.streakState.upsert({
      where: { memberId },
      create: { memberId, currentStreak: 0, maxStreak: 0 },
      update: {},
    });

    const newStreak = state.currentStreak + 1;
    const newMax = Math.max(state.maxStreak, newStreak);
    const isReactivation = state.streakResetAt !== null;

    await tx.streakState.update({
      where: { memberId },
      data: {
        currentStreak: newStreak,
        maxStreak: newMax,
        lastActivityDate: today,
        ...(isReactivation && {
          streakResetAt: null,
          comebackT2SentAt: null,
          ptT7AlertedAt: null,
          t14FlaggedAt: null,
          // ptT7DismissedAt SIFIRLANMAZ — PRD kararı: "Okudum" kalıcıdır.
          // Yeni kopma = yeni ptT7AlertedAt (T+7 job'ı tarafından set edilir).
        }),
      },
    });
  });
}
