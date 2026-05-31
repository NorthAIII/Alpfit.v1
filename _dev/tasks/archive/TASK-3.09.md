# TASK-3.09: Comeback T+2 Push Bildirimi (BullMQ Delayed Job)

**Durum:** ✅ Tamamlandı
**Modül:** M3 — Sürdürülebilirlik Motoru (`modules/M3-surdurulebilirlik-motoru.md`)
**Feature:** F3.1 — Comeback T+2 (üye nazik dokunuş)
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.04 ✅, TASK-3.05 ✅

---

## Hedef

Streak sıfırlandıktan 2 gün sonra üyeye "Bugün yeni bir streak başlatabilirsin." push bildirimi gönderen delayed BullMQ job handler'ını yaz. Job idempotent, tek seferlik (re-aktivasyon öncesi bir kez), sessiz saat farkında. TASK-3.05 bu job'ı kuyruğa zaten ekliyor; bu task handler'ı implement eder.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M3-surdurulebilirlik-motoru.md` — F3.1 comeback T+2 kabul kriterleri (tek seferlik, re-aktivasyon atla)
- `_dev/phases/PHASE-3.md` §Araştırma Bulguları — T+2 delayed job
- `backend/src/services/notification.service.ts` — mevcut sendMorningReminders (yeni handler buraya eklenir)
- `backend/src/lib/silent-hours.ts` — sessiz saat util

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [x] **1. T+2 Job Handler Yaz**

  `backend/src/services/notification.service.ts` → `sendComebackT2` fonksiyonu ekle:

  ```ts
  export async function sendComebackT2(
    prisma: PrismaClient,
    pushChannel: PushChannel,
    memberId: string,
  ): Promise<void>
  ```

  Mantık:
  - `StreakState` oku → `comebackT2SentAt` set mi? → evet: skip (idempotent, zaten gönderildi)
  - `currentStreak > 0`? → üye re-aktive olmuş, skip
  - `comebackEnabled` NotificationPreference → false: skip (log: `skipped`)
  - Push tokenları → yok: skip (log: `skipped`)
  - **Sessiz saat:** `isInSilentHours()` → true → ertele (comeback sessiz saatte ertelenir, ertesi gün 09:00)
    - `notificationQueue.add('comeback-t2', { memberId }, { delay: msUntilTomorrowMorning(9) })`
    - Log: `skipped (silent_hours, rescheduled)`
  - Push gönder: başlık `"Yeni bir başlangıç!"`, body `"Bugün yeni bir streak başlatabilirsin. 🔥"`
  - `comebackT2SentAt = now()` → StreakState güncelle
  - `NotificationLog` yaz: `status: 'sent'`

- [x] **2. Worker Dispatcher'a Handler Ekle**

  `backend/src/workers/notification.worker.ts` → `case 'comeback-t2'`:
  ```ts
  case 'comeback-t2':
    await sendComebackT2(prisma, expoAdapter, job.data.memberId);
    break;
  ```

- [x] **3. Test Yaz**

  `backend/src/services/notification.service.test.ts` → T+2 testler:
  - Normal akış: push gönderildi, `comebackT2SentAt` set, log `sent`
  - `comebackT2SentAt` zaten set → skip (idempotent)
  - `currentStreak > 0` (re-aktivasyon) → skip
  - `comebackEnabled: false` → skip
  - Token yok → skip
  - Sessiz saatte (mocked) → yeniden zamanlandı, log `skipped (silent_hours, rescheduled)`

---

## Etkilenen Dosyalar

```
backend/src/services/
└── notification.service.ts       # sendComebackT2 eklendi + testler

backend/src/workers/
└── notification.worker.ts        # comeback-t2 case eklendi
```

---

## Dikkat Noktaları

- T+2 tek seferlik: `comebackT2SentAt` set olduktan sonra bir daha gönderilmez — idempotency garantisi kritik
- Re-aktivasyon kontrolü: job kuyruğa girerken üye zaten antrenman yapmış olabilir (`currentStreak > 0`) → skip
- Sessiz saat comeback farklı davranır (reminder'dan farklı): **ertelenir** ertesi gün 09:00'a (iptal değil)
- T+2 = 48 saat delay; TASK-3.05 bunu kuyruğa `{ delay: 2 * 24 * 60 * 60 * 1000 }` ile ekler
- `job.data.memberId` var olduğunu varsay; yoksa log error + skip
- Bildirim içeriğinde üye adı yok (M4 gizlilik kuralı)

---

## Test Kriterleri

- [x] Push gönderildi, `comebackT2SentAt` set, NotificationLog `sent`
- [x] `comebackT2SentAt` önceden set → skip, push yok
- [x] `currentStreak > 0` → skip, push yok
- [x] `comebackEnabled: false` → skip
- [x] Sessiz saat (mocked) → rescheduled, push yok
- [x] Token yok → skip

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-31
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `notification.service.ts`: `sendComebackT2(prisma, pushChannel, queue, memberId)` eklendi — idempotency (comebackT2SentAt), re-aktivasyon skip, comebackEnabled:false skip, no_token skip, sessiz saat ertele (queue.add), push gönder, StreakState güncelle, NotificationLog.
- `notification.worker.ts`: `comeback-t2` case eski `isInSilentHours + moveToDelayed + not-implemented` stub'ı kaldırıldı, `sendComebackT2(prisma, expoAdapter, internalQueue, userId)` çağrısına dönüştürüldü. `sendComebackT2` import'u eklendi.
- `notification.service.test.ts`: 6 yeni T+2 testi (normal akış, idempotency, re-aktivasyon, comeback_disabled, no_token, silent_hours_rescheduled). 290 → 296 yeşil.

**Not:** `sendComebackT2` task dokümanındaki imzaya `queue: Queue` parametresi eklendi — sessiz saat reschedule için gerekli; task doc'ta imza basitleştirilmişti.

---

**Oluşturulma:** 2026-05-31
