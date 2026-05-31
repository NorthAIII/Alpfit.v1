/**
 * Notification service — sabah reminder (TASK-3.08) + comeback T+2 push (TASK-3.09).
 *
 * sendMorningReminders: Saatlik BullMQ repeatable job'dan çağrılır. Şu anki
 * Istanbul saatini morningHour olarak ayarlamış, bugün planlı antrenmanı olan
 * üyelere push bildirim gönderir. Sessiz saat / token yok / reminder disabled
 * durumları per-member NotificationLog kaydıyla skip edilir.
 *
 * sendComebackT2: Streak sıfırlandıktan 2 gün sonra çağrılır (delayed BullMQ job).
 * Üyeye "Bugün yeni bir streak başlatabilirsin." push gönderir. Tek seferlik
 * (comebackT2SentAt idempotency), re-aktivasyon skip, sessiz saatte ertele.
 */
import type { Queue } from 'bullmq';
import type { PrismaClient } from '../db/prisma.js';
import type { PushChannel } from '../lib/push.js';
import { isInSilentHours, msUntilTomorrowMorning } from '../lib/silent-hours.js';

const TZ = 'Europe/Istanbul';

/** Istanbul'daki şu anki saat, dakika ve haftanın gününü döner. */
function getIstanbulNow(): { hour: number; minute: number; dayOfWeek: number } {
  const str = new Date().toLocaleString('sv-SE', { timeZone: TZ });
  const d = new Date(str);
  return { hour: d.getHours(), minute: d.getMinutes(), dayOfWeek: d.getDay() };
}

/**
 * Istanbul takvim günü bazlı UTC midnight'ı döner.
 * ProgramDay.specificDate ve WorkoutCompletion.scheduledDate ile aynı convention.
 */
function getIstanbulTodayMidnight(): Date {
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
  return new Date(dateStr + 'T00:00:00.000Z');
}

export async function sendMorningReminders(
  prisma: PrismaClient,
  pushChannel: PushChannel,
): Promise<void> {
  const { hour: currentHour, minute: currentMinute, dayOfWeek } = getIstanbulNow();

  // Saatlik job 30 dakikadan geç başladıysa o saati atla — geç hatırlatma kafa karıştırıcı
  if (currentMinute > 30) return;

  const todayMidnight = getIstanbulTodayMidnight();

  // Bugün planlı antrenmanı olan aktif program sahiplerini bul
  const programs = await prisma.program.findMany({
    where: { status: 'active' },
    select: {
      memberId: true,
      days: {
        where: {
          OR: [
            { isOneOff: false, dayOfWeek },
            { isOneOff: true, specificDate: todayMidnight },
          ],
        },
        select: { id: true },
      },
    },
  });

  const membersWithWorkoutToday = [
    ...new Set(programs.filter((p) => p.days.length > 0).map((p) => p.memberId)),
  ];
  if (membersWithWorkoutToday.length === 0) return;

  // Bu saat için reminder tercihli üyeleri bul (reminderEnabled: false dahil — per-member log)
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      memberId: { in: membersWithWorkoutToday },
      morningHour: currentHour,
    },
    select: { memberId: true, reminderEnabled: true },
  });
  if (prefs.length === 0) return;

  // Push tokenlarını önceden getir (batch)
  const targetIds = prefs.map((p) => p.memberId);
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: targetIds } },
    select: { userId: true, token: true },
  });

  const tokensByMember = new Map<string, string[]>();
  for (const t of tokens) {
    const list = tokensByMember.get(t.userId) ?? [];
    list.push(t.token);
    tokensByMember.set(t.userId, list);
  }

  for (const pref of prefs) {
    const { memberId } = pref;

    // Reminder devre dışı
    if (!pref.reminderEnabled) {
      await prisma.notificationLog.create({
        data: { userId: memberId, jobType: 'morning-reminder', status: 'skipped', meta: { reason: 'reminder_disabled' } },
      });
      continue;
    }

    // Sessiz saat — ertelenmez, iptal (M4 kuralı)
    if (isInSilentHours()) {
      await prisma.notificationLog.create({
        data: { userId: memberId, jobType: 'morning-reminder', status: 'skipped', meta: { reason: 'silent_hours' } },
      });
      continue;
    }

    // Token yok — push gönderilemez
    const memberTokens = tokensByMember.get(memberId) ?? [];
    if (memberTokens.length === 0) {
      await prisma.notificationLog.create({
        data: { userId: memberId, jobType: 'morning-reminder', status: 'skipped', meta: { reason: 'no_token' } },
      });
      continue;
    }

    // Tüm cihazlara push gönder (çoklu cihaz desteği)
    let sent = false;
    for (const token of memberTokens) {
      const result = await pushChannel.send({
        token,
        title: 'Antrenman günün 💪',
        body: 'Planını gör ve başla →',
      });
      if (result === 'sent') sent = true;
      // 'invalid_token' → ExpoPushAdapter token'ı DB'den zaten siler (TASK-3.04)
    }

    await prisma.notificationLog.create({
      data: { userId: memberId, jobType: 'morning-reminder', status: sent ? 'sent' : 'failed' },
    });
  }
}

/**
 * Streak sıfırlandıktan T+2 gün sonra üyeye comeback push bildirimi gönderir.
 *
 * İdempotent (comebackT2SentAt kontrolü), re-aktivasyon skip, sessiz saatte
 * erteler (iptal etmez — ertesi gün 09:00 Istanbul için yeni delayed job).
 */
export async function sendComebackT2(
  prisma: PrismaClient,
  pushChannel: PushChannel,
  queue: Queue,
  memberId: string,
): Promise<void> {
  const state = await prisma.streakState.findUnique({
    where: { memberId },
    select: { comebackT2SentAt: true, currentStreak: true },
  });

  // Idempotency: zaten gönderildi
  if (state?.comebackT2SentAt != null) return;

  // Re-aktivasyon: üye antrenman yapmış, streak sıfırdan yükseldi
  if ((state?.currentStreak ?? 0) > 0) return;

  // Comeback bildirimi tercihi
  const pref = await prisma.notificationPreference.findUnique({
    where: { memberId },
    select: { comebackEnabled: true },
  });
  if (pref?.comebackEnabled === false) {
    await prisma.notificationLog.create({
      data: { userId: memberId, jobType: 'comeback-t2', status: 'skipped', meta: { reason: 'comeback_disabled' } },
    });
    return;
  }

  // Push token yok
  const tokenRows = await prisma.pushToken.findMany({
    where: { userId: memberId },
    select: { token: true },
  });
  if (tokenRows.length === 0) {
    await prisma.notificationLog.create({
      data: { userId: memberId, jobType: 'comeback-t2', status: 'skipped', meta: { reason: 'no_token' } },
    });
    return;
  }

  // Sessiz saat: ertele (iptal değil — comeback ertelenir, reminder ertelen mez)
  if (isInSilentHours()) {
    await queue.add('comeback-t2', { userId: memberId }, { delay: msUntilTomorrowMorning(9) });
    await prisma.notificationLog.create({
      data: { userId: memberId, jobType: 'comeback-t2', status: 'skipped', meta: { reason: 'silent_hours_rescheduled' } },
    });
    return;
  }

  // Push gönder (çoklu cihaz desteği)
  let sent = false;
  for (const { token } of tokenRows) {
    const result = await pushChannel.send({
      token,
      title: 'Yeni bir başlangıç!',
      body: 'Bugün yeni bir streak başlatabilirsin. 🔥',
    });
    if (result === 'sent') sent = true;
  }

  // comebackT2SentAt'ı işaretle — idempotency garantisi
  await prisma.streakState.update({
    where: { memberId },
    data: { comebackT2SentAt: new Date() },
  });

  await prisma.notificationLog.create({
    data: { userId: memberId, jobType: 'comeback-t2', status: sent ? 'sent' : 'failed' },
  });
}
