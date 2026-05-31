# TASK-3.03: Streak Motoru — Antrenman Tamamlama Servisi

**Durum:** ⬜ Bekliyor
**Modül:** M3 — Sürdürülebilirlik Motoru (`modules/M3-surdurulebilirlik-motoru.md`)
**Feature:** F3.1 — Streak + Telafi + Comeback
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.02 ✅

---

## Hedef

`processWorkoutCompletion(prisma, memberId)` servis fonksiyonunu yaz ve `POST /workout-completions` endpoint'ine bağla. Fonksiyon: streak'i günceller (+1, maxStreak), re-aktivasyon durumunda T-flag'leri temizler. Bu fonksiyon Faz 3'ün kalbidir — `ILKELER §Eksen #1` gereği en yüksek test kapsamıyla yazılır.

---

## Bağlam

`POST /workout-completions` şu an yalnızca `WorkoutCompletion` kaydı yazar; `StreakState` güncelleme yok. Bu task, motor'u tamamlama akışına entegre eder. Telafi penceresi kontrolü (`isLate` flag'i) zaten M2'de mevcut — bu task onu motor tarafında da doğru yansıtır.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M3-surdurulebilirlik-motoru.md` — F3.1 kabul kriterleri + edge case'ler
- `_dev/phases/PHASE-3.md` §Araştırma Bulguları — StreakState şeması ve hibrit motor kararı
- `backend/src/routes/workout-completions.ts` — entegrasyon noktası
- `backend/src/services/workout-completion.service.ts` — mevcut tamamlama servisi

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [ ] **1. `streak.service.ts` Oluştur**

  `backend/src/services/streak.service.ts` (yeni dosya):

  ```ts
  export async function processWorkoutCompletion(
    prisma: PrismaClient,
    memberId: string,
  ): Promise<void>
  ```

  İçerik:
  - `StreakState` satırını bul (yoksa `upsert` ile oluştur — güvenlik ağı)
  - `currentStreak++`, `maxStreak = Math.max(maxStreak, currentStreak)`, `lastActivityDate = today`
  - **Re-aktivasyon kontrolü:** `streakResetAt` set mi? Eğer evet → re-aktivasyon:
    - `streakResetAt = null`
    - `comebackT2SentAt = null`
    - `ptT7AlertedAt = null`
    - `t14FlaggedAt = null`
    - `ptT7DismissedAt` sıfırlanmaz (PRD: "Okudum" kalıcıdır; yeni kopma = yeni `ptT7AlertedAt`)
  - StreakState'i tek `update` ile yaz (atomic)

- [ ] **2. Çoklu Antrenman Aynı Gün Edge Case**
  - Aynı gün birden fazla antrenman tamamlanabilir (+2 streak M3 kabul kriteri)
  - `lastActivityDate` günü zaten eşitse: streak yine +1 (her tamamlama = +1)
  - Not: `today` = Europe/Istanbul saat dilimine göre mevcut gün

- [ ] **3. `workout-completions.ts` Route'una Bağla**
  - `POST /workout-completions` handler'ında `completeWorkout` başarıyla döndükten sonra (`kind === 'ok'`):
    ```ts
    await processWorkoutCompletion(app.prisma, claims.sub);
    ```
  - Hata olursa: log at, HTTP yanıtını 200 olarak gönder (motor hatası üyenin tamamlama kaydını engellemez)

- [ ] **4. Test Yaz**

  `backend/src/services/streak.service.test.ts` (yeni dosya):
  - Normal tamamlama → `currentStreak` +1, `maxStreak` güncellendi
  - İkinci tamamlama aynı gün → streak +2 (kümülatif)
  - Re-aktivasyon: `streakResetAt` set → tamamlama sonrası sıfırlandı, `currentStreak` = 1
  - Re-aktivasyon: `ptT7DismissedAt` sıfırlanmadı (kalıcı)
  - StreakState yoksa → upsert oluşturur, hata vermez
  - `maxStreak` asla azalmaz (önceki max 5, şimdiki streak 1 → max hâlâ 5)
  - **[Gece yarısı geçişi]** `jest.useFakeTimers` ile saat 23:58 Istanbul → tamamlama bugüne ait (`lastActivityDate` = bugün)
  - **[Gece yarısı geçişi]** Saat 00:02 Istanbul → tamamlama yeni güne ait (`lastActivityDate` = yeni gün)

---

## Etkilenen Dosyalar

```
backend/src/services/
├── streak.service.ts         # YENİ — processWorkoutCompletion
└── streak.service.test.ts    # YENİ — test suite

backend/src/routes/
└── workout-completions.ts    # processWorkoutCompletion çağrısı eklendi
```

---

## Dikkat Noktaları

- Motor hatası üyenin tamamlama kaydını **engellemez** — `try/catch` ile sarılır, hata loglanır (Sentry)
- `today` Europe/Istanbul saat dilimine göre: `new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })` veya `date-fns-tz` ile hesapla
- `processWorkoutCompletion` → void return; HTTP yanıtı mevcut `completeWorkout` result'ından gelir
- StreakState `upsert` garantisi: TASK-3.02'de davet kabul'da oluşturuluyor, ama buradaki güvenlik ağı de kalır
- `ptT7DismissedAt` sıfırlanmaz — PRD kararı: "Okudum" kalıcıdır, yeni kopma = yeni `ptT7AlertedAt` set edilmesi gerekir (T+7 job'ı yapar)
- **Test bu modülün en yüksek önceliği** ([[ilkeler]] §En Yüksek Öncelikli Eksen #1)

---

## Test Kriterleri

- [ ] `POST /workout-completions` başarılı → `StreakState.currentStreak` +1 arttı (integration test veya service test)
- [ ] İki farklı antrenman aynı gün → streak +2
- [ ] `streakResetAt` set üye antrenman yaparsa → `streakResetAt = null`, T-flag'ler temizlendi
- [ ] `ptT7DismissedAt` re-aktivasyon sonrası hâlâ set (sıfırlanmadı)
- [ ] Motor throw etse bile `POST /workout-completions` 200 döner (log kaydı var)
- [ ] 23:58 Istanbul → `lastActivityDate` bugün (gece yarısı geçişi)
- [ ] 00:02 Istanbul → `lastActivityDate` yeni gün (gece yarısı geçişi)
- [ ] Tüm yeni testler + mevcut `workout-completions.test.ts` testleri yeşil

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
