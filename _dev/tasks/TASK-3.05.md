# TASK-3.05: Nightly Streak Sıfırlama (BullMQ Repeatable Job)

**Durum:** ⬜ Bekliyor
**Modül:** M3 — Sürdürülebilirlik Motoru (`modules/M3-surdurulebilirlik-motoru.md`)
**Feature:** F3.1 — Telafi Penceresi + Streak Sıfırlama
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.03 ✅, TASK-3.04 ✅

---

## Hedef

Her gün 00:05 Europe/Istanbul'da çalışan BullMQ repeatable job yaz. Job: aktif programlı tüm üyeler için kaçırılan antrenman günlerini tespit eder, 48 saatlik telafi penceresi dolmuşsa streak'i sıfırlar ve `streakResetAt` set eder. Sıfırlama sonrası T+2 comeback delayed job'ı kuyruğa alır.

---

## Bağlam

Telafi penceresi kuralı (M3): planlı antrenman günü 23:59'da tamamlanmamışsa, ertesi gün 23:59'a kadar pencere açık. Pencere dolunca streak sıfırlanır. Bu gece yarısı sıfırlama, 00:05 çalışan job ile yakalanır. Job, "2 gün önce planlı antrenman varsa ve tamamlama yoksa" koşulunu kontrol eder.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M3-surdurulebilirlik-motoru.md` — F3.1 kabul kriterleri (telafi penceresi, streak sıfırlanma zamanı)
- `_dev/phases/PHASE-3.md` §Araştırma Bulguları — BullMQ entegrasyon mimarisi, `streakResetAt` şeması
- `backend/src/services/streak.service.ts` — mevcut streak servisi (re-aktivasyon mantığı)
- `backend/src/queue.ts` — kuyruğa job ekleme

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [ ] **1. `streak-reset.service.ts` Fonksiyonu**

  `backend/src/services/streak-reset.service.ts` (yeni dosya):

  ```ts
  export async function runNightlyStreakReset(prisma: PrismaClient): Promise<void>
  ```

  Mantık:
  - Aktif programı olan tüm üyeleri çek (program status `active`)
  - Her üye için:
    - 2 gün önceki planlanmış antrenman günlerini bul (`ProgramDay.dayOfWeek` eşleşmesi)
    - O güne ait `WorkoutCompletion` kaydı var mı? (scheduledDate bazında)
    - Kayıt yok + `lastActivityDate` 2+ gün önce → streak sıfırla:
      - `currentStreak = 0`, `streakResetAt = now()`
    - Sıfırlama olan üye → `notificationQueue`'ya `{ name: 'comeback-t2', data: { memberId }, delay: 2 * 24 * 60 * 60 * 1000 }` ekle
  - `streakResetAt` zaten set ama `currentStreak = 0` ise: tekrar sıfırlama yok (idempotent)

- [ ] **2. BullMQ Repeatable Job Kaydı**

  `backend/src/workers/notification.worker.ts` veya ayrı `backend/src/workers/streak-reset.worker.ts`:
  - Worker başlatılınca `notificationQueue.add('streak-reset-check', {}, { repeat: { pattern: '5 0 * * *', tz: 'Europe/Istanbul' } })` ile günlük job'ı kaydet
  - Job name: `'streak-reset-check'`
  - Job handler: `runNightlyStreakReset(prisma)` çağrısı

- [ ] **3. Worker Dispatcher'a Handler Ekle**

  `backend/src/workers/notification.worker.ts` → `switch (job.name)` case `'streak-reset-check'`:
  ```ts
  case 'streak-reset-check':
    await runNightlyStreakReset(prisma);
    break;
  ```

- [ ] **4. Test Yaz**

  `backend/src/services/streak-reset.service.test.ts` (yeni dosya):
  - Üyenin 2 gün önce planlı antrenmanı var, tamamlama yok → streak sıfırlandı
  - Tamamlama varsa → streak sıfırlanmadı
  - `currentStreak = 0` + `streakResetAt` set → ikinci çalıştırmada tekrar sıfırlama yok (idempotent)
  - Aktif programı olmayan üye → etkilenmedi
  - Dünkü planlı gün (< 48h) → etkilenmedi (telafi penceresi açık)
  - T+2 delayed job kuyruğa eklendi (mock queue veya test queue)
  - **[Gece yarısı geçişi]** Üye 23:58'de antrenman tamamladı → 00:05 nightly job'da `lastActivityDate` dün değil bugün, sıfırlanmaz

---

## Etkilenen Dosyalar

```
backend/src/services/
├── streak-reset.service.ts        # YENİ — nightly reset mantığı
└── streak-reset.service.test.ts   # YENİ — testler

backend/src/workers/
└── notification.worker.ts         # streak-reset-check handler + repeatable job kaydı
```

---

## Dikkat Noktaları

- "2 gün önce" Europe/Istanbul'a göre: gece yarısında çalışan job için `yesterday = today - 1` (planlı gün) ve `missedDay = today - 2` (telafi de geçti)
- `ProgramDay.dayOfWeek` (0=Pazar...6=Cumartesi) ile bugünün gün indeksini eşleştir — Prisma modeli kontrol et
- `isOneOff: true` olan günler (tek seferlik) → `specificDate`'e bak, `dayOfWeek` değil
- Repeatable job kayıt idempotency: BullMQ aynı `pattern + tz` ile aynı job'ı tekrar kaydederse duplicate üretmez — başlangıçta güvenli
- Streak zaten 0 ve `streakResetAt` set → tekrar sıfırlama yapma, T+2 job tekrar kuyruğa ekleme (idempotent kontrol)
- 30 üyeyle pilot için performans sorun değil; her üye için ayrı DB sorgu kabul edilebilir (N+1 dikkat — `Promise.all` veya batch query)

---

## Test Kriterleri

- [ ] Geçmiş planlı gün + eksik tamamlama → `StreakState.currentStreak = 0`, `streakResetAt` set
- [ ] Geçmiş planlı gün + tamamlama var → streak değişmedi
- [ ] Dünkü planlı gün → streak değişmedi (telafi penceresi açık)
- [ ] İkinci çalıştırma → idempotent (streak zaten 0, `streakResetAt` değişmedi)
- [ ] T+2 delayed job → sıfırlama olan üyeler için kuyruğa eklendi
- [ ] Aktif programsız üye → işlem yapılmadı
- [ ] 23:58'de antrenman yapan üye → 00:05 job'da sıfırlanmaz (gece yarısı geçişi)

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi

---

## Oturum Kayıtları

*(Task çalıştırılınca doldurulacak)*

---

**Oluşturulma:** 2026-05-31
