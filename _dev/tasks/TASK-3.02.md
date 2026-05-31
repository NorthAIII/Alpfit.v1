# TASK-3.02: M3+M4 Veritabanı Şeması — 4 Yeni Tablo

**Durum:** ⬜ Bekliyor
**Modül:** M3 + M4 (`modules/M3-surdurulebilirlik-motoru.md`, `modules/M4-bildirim-altyapisi.md`)
**Feature:** F3.1 + F4.1 (altyapı)
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.01 ✅

---

## Hedef

Faz 3'ün tüm servislerinin ihtiyaç duyduğu 4 tabloyu (`StreakState`, `PushToken`, `NotificationPreference`, `NotificationLog`) Prisma şemasına ekle ve migration çalıştır. Üye davet kabul ettiğinde `StreakState` + `NotificationPreference` satırları otomatik oluşsun; bu sayede motor ilk antrenman tamamlamada hazır bulunur.

---

## Bağlam

Araştırma bulgularından: `StreakState` streak cache + T-sayaç state'i tutar; `PushToken` cihaz token yönetimi; `NotificationPreference` reminder saati + kategori aç/kapa; `NotificationLog` idempotent gönderim kontrolü. `StreakState` satırı **üye davet kabul ettiğinde** (onboarding) oluşmazsa motor broken çalışır — bu upsert garantisi bu task'ta kurulur.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-3.md` §Araştırma Bulguları — tablo şemaları ve StreakState kritik alanları
- `_dev/modules/M3-surdurulebilirlik-motoru.md` — motor hesaplama mantığı (şema tasarımını etkiler)
- `_dev/modules/M4-bildirim-altyapisi.md` — token ve preference gereksinimleri
- `backend/src/routes/invitations-accept.ts` — StreakState seed noktası

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [ ] **1. Prisma Şemasına 4 Tablo Ekle**

  `backend/prisma/schema.prisma`'ya aşağıdaki modelleri ekle:

  **StreakState** (üye başına 1 satır, unique):
  ```
  memberId           String   @unique
  currentStreak      Int      @default(0)
  maxStreak          Int      @default(0)
  lastActivityDate   DateTime?
  streakResetAt      DateTime?   -- sıfırlanma zamanı = T sayaçlarının başlangıcı
  comebackT2SentAt   DateTime?
  ptT7AlertedAt      DateTime?
  t14FlaggedAt       DateTime?
  ptT7DismissedAt    DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  member             User @relation(...)
  ```

  **PushToken** (üye/PT başına N cihaz):
  ```
  id         String   @id @default(cuid())
  userId     String
  token      String   @unique
  platform   String   -- "ios" | "android"
  createdAt  DateTime @default(now())
  user       User @relation(...)
  @@index([userId])
  ```

  **NotificationPreference** (üye başına 1 satır, unique):
  ```
  memberId          String   @unique
  reminderEnabled   Boolean  @default(true)
  comebackEnabled   Boolean  @default(true)
  systemEnabled     Boolean  @default(true)
  morningHour       Int      @default(9)   -- 0-23 arası
  morningMinute     Int      @default(0)   -- 0-59 arası
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  member            User @relation(...)
  ```

  **NotificationLog** (gönderilen bildirim kaydı):
  ```
  id         String   @id @default(cuid())
  userId     String
  jobType    String   -- "morning-reminder" | "comeback-t2" | "comeback-t7-pt" | "t14-flag"
  sentAt     DateTime @default(now())
  status     String   -- "sent" | "failed" | "skipped"
  meta       Json?    -- hata detayı veya skip nedeni
  user       User @relation(...)
  @@index([userId, jobType, sentAt])
  ```

  User modeline yeni `@relation` alanlarını ekle.

- [ ] **2. Migration Çalıştır**
  - `pnpm -F backend prisma migrate dev --name m3-m4-schema`
  - Migration SQL'ini kontrol et — StreakState için `memberId UNIQUE`, PushToken için `token UNIQUE`

- [ ] **3. StreakState + NotificationPreference Seed — Davet Kabul**
  - `backend/src/routes/invitations-accept.ts` veya ilgili servis → başarılı davet kabul akışı sonunda:
    ```ts
    // StreakState satırı (upsert — idempotent)
    await prisma.streakState.upsert({
      where: { memberId },
      create: { memberId },
      update: {},
    });
    // NotificationPreference satırı (upsert — idempotent)
    await prisma.notificationPreference.upsert({
      where: { memberId },
      create: { memberId },
      update: {},
    });
    ```
  - Bu iki upsert mevcut transaction içine alınır veya aynı DB çağrısında yapılır

---

## Etkilenen Dosyalar

```
backend/prisma/
├── schema.prisma            # 4 yeni model + User ilişkileri
└── migrations/              # yeni migration klasörü

backend/src/routes/
└── invitations-accept.ts    # StreakState + NotificationPreference seed
```

---

## Dikkat Noktaları

- `StreakState.memberId` → `User.id` foreign key (member rolü), `@unique` zorunlu
- `PushToken.token` `@unique` — aynı token'ı iki kez kaydetme (cihaz değişiminde güncelle değil sil+ekle)
- `NotificationPreference.morningHour` 0-23, `morningMinute` 0-59 — DB constraint veya application validation
- Davet kabul upsert'leri idempotent olmalı — aynı üye iki kez kabul ederse (edge case) hata vermemeli
- KVKK: `NotificationLog.meta` alanına PII yazmak yasak (üye adı, telefon vb.) — yalnızca teknik meta (hata kodu, job ID)
- `_dev/memory/kvkk-pii-scrubbing-matrisi.md` → yeni alanlar varsa `pii-fields.ts`'e ekle (`token`, `meta` — token hassas mı? Expo token PII değil, ama backend saklaması secure olmalı)

---

## Test Kriterleri

- [ ] Migration başarılı çalışıyor (`prisma migrate dev` hata yok)
- [ ] `StreakState` tablosu oluştu, `memberId UNIQUE` constraint var
- [ ] `PushToken.token` UNIQUE constraint var
- [ ] Davet kabul sonrası ilgili üye için `StreakState` satırı oluşuyor
- [ ] Davet kabul sonrası `NotificationPreference` satırı oluşuyor (default değerlerle)
- [ ] Aynı üye için ikinci davet kabul → upsert hata vermiyor (idempotent)
- [ ] `pnpm -F backend test` — mevcut testler kırılmadı (invitations-accept testleri geçiyor)

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
