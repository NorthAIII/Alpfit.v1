# TASK-3.02: M3+M4 Veritabanı Şeması — 4 Yeni Tablo

**Durum:** ✅ Tamamlandı
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

- [x] **1. Prisma Şemasına 4 Tablo Ekle**

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

- [x] **2. Migration Çalıştır**
  - `pnpm -F backend prisma migrate dev --name m3-m4-schema`
  - Migration SQL'ini kontrol et — StreakState için `memberId UNIQUE`, PushToken için `token UNIQUE`

- [x] **3. StreakState + NotificationPreference Seed — Davet Kabul**
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

- [x] Migration başarılı çalışıyor (`prisma migrate dev` hata yok)
- [x] `StreakState` tablosu oluştu, `memberId UNIQUE` constraint var (PRIMARY KEY)
- [x] `PushToken.token` UNIQUE constraint var
- [x] Davet kabul sonrası ilgili üye için `StreakState` satırı oluşuyor
- [x] Davet kabul sonrası `NotificationPreference` satırı oluşuyor (default değerlerle)
- [x] Aynı üye için ikinci davet kabul → upsert hata vermiyor (idempotent)
- [x] `pnpm -F backend test` — 234 test yeşil (invitations-accept testleri geçiyor)

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
- `schema.prisma`'ya 4 yeni model eklendi: `StreakState`, `PushToken`, `NotificationPreference`, `NotificationLog`
- `User` modeline 4 yeni `@relation` eklendi
- Migration çalıştırıldı (`20260531073951_m3_m4_schema`) — SQL doğrulandı
- `invitations-accept.ts` transaction'ına `streakState.upsert` + `notificationPreference.upsert` eklendi
- Test teardown FK sorunu: 2 test dosyasına yeni tabloların `deleteMany()` eklendi (`invitations-accept.test.ts`, `onboarding-flow.test.ts`)
- 234 test yeşil

---

**Oluşturulma:** 2026-05-31
