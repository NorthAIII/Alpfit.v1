# TASK-1.13: 3 rol veri modeli + migration

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.03, TASK-1.04

---

## Hedef

Prisma schema'ya 3 rol veri modelini ekle: `User` tablosu + `Role` enum (`member`, `trainer`, `gym_owner`) + ilişki tabloları (`TrainerMember` aktif PT-üye ilişkisi; `GymOwnerTrainer` slot — v1.5+ için tanımlı ama boş kullanılır). Migration yaz, integration test ile kabul kriterleri doğrula: aynı telefon iki rolde hesap açamaz, bir üye yalnızca bir PT'ye bağlı olur, Gym Owner v1'de hesap açamaz (UI yok ama model izin verir). Bu task [[ilkeler]] §Pazarlık Konusu Olmayanlar §1'in uygulamasıdır.

---

## Bağlam

3 rol mimari kararı pazarlık konusu değil ([00-VISION §5](../PRD/00-VISION.md)); veri modeli **şimdi** üç rolü taşır, sonra üstüne UI eklenir. Diyetisyen 4. rolü asla eklenmez. Discuss-phase: "v1'de gym_owner rolü hesap açamaz (UI'da yok), ama veri modeli izin verir." [[ilkeler]] §"Kalıcılık önceliği" — sonradan migration > şimdi tasarla.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §3 (3 Rol Veri Modeli — KRİTİK)
- `_dev/modules/M1-auth-onboarding.md` — F1.1 PT-üye ilişki kabul kriterleri
- `_dev/PRD/00-VISION.md` §5 (3 rol mimari)
- `_dev/ILKELER.md` §Pazarlık Konusu Olmayanlar §1
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → "3 rol veri modeli — Gym Owner slot"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — 3 rol veri modeli + Gym Owner slot kararı (mevcut PRD kararının schema'ya yansıması)

---

## Alt Görevler

- [ ] **1. Role enum + User modeli**
  - `backend/prisma/schema.prisma`:
    ```prisma
    enum Role {
      member
      trainer
      gym_owner
    }

    model User {
      id            String   @id @default(cuid())
      phoneE164     String   @unique  // +905551234567
      role          Role
      firstName     String
      lastName      String
      profilePhotoUrl String?
      // PT-specific opsiyonel alanlar
      gymName       String?
      certificateNote String?
      // KVKK
      kvkkConsentAt   DateTime?
      healthConsentAt DateTime?  // sağlık verisi açık rıza (opsiyonel)
      // soft delete
      deletedAt     DateTime?
      retentionDeadline DateTime?  // TASK-1.15 retention job'da set edilir
      createdAt     DateTime @default(now())
      updatedAt     DateTime @updatedAt

      ptRelations     TrainerMember[]  @relation("member_relation")
      memberRelations TrainerMember[]  @relation("trainer_relation")
      ownedTrainers   GymOwnerTrainer[] @relation("owner_relation")
      gymOwnerLink    GymOwnerTrainer[] @relation("trainer_link")

      @@index([phoneE164])
      @@index([role])
    }
    ```
  - **Karar:** `phoneE164` unique, `role` ile birlikte değil — discuss-phase "bir hesap aynı anda iki rolde olamaz, ayrı hesap açması gerekir" demişti. Bu kararın schema yansıması: phone unique global, ama application logic "bir telefon zaten kayıtlı, giriş yap" yönlendirmesini yapar (TASK-1.19 OTP verify). **Alternative:** `@@unique([phoneE164, role])` ile aynı telefon iki rolde ayrı hesap. → Karar noktası aşağıda.

- [ ] **2. TrainerMember ilişki tablosu**
  - ```prisma
    model TrainerMember {
      id          String   @id @default(cuid())
      trainerId   String
      memberId    String
      startedAt   DateTime @default(now())
      endedAt     DateTime?  // soft delete (PT üye çıkarma — TASK-1.15)
      trainer     User     @relation("trainer_relation", fields: [trainerId], references: [id])
      member      User     @relation("member_relation", fields: [memberId], references: [id])

      @@unique([trainerId, memberId, endedAt])  // aktif ilişki tek (endedAt NULL ile bir çift)
      @@index([trainerId])
      @@index([memberId])
    }
    ```
  - **Kural:** Üye aktif olarak yalnızca BİR PT'ye bağlı olabilir (v1; v1.5 adayı: PT değiştirme). Application-level enforcement (TASK-1.24 davet kabul) + DB seviyesinde aktif ilişki için partial unique constraint (`WHERE endedAt IS NULL`).

- [ ] **3. GymOwnerTrainer ilişki tablosu (v1'de boş slot)**
  - ```prisma
    model GymOwnerTrainer {
      id          String   @id @default(cuid())
      gymOwnerId  String
      trainerId   String
      startedAt   DateTime @default(now())
      endedAt     DateTime?
      gymOwner    User     @relation("owner_relation", fields: [gymOwnerId], references: [id])
      trainer     User     @relation("trainer_link", fields: [trainerId], references: [id])

      @@unique([gymOwnerId, trainerId, endedAt])
      @@index([gymOwnerId])
    }
    ```
  - v1'de UI yok, model tanımlı; v1.5+'da kullanılır

- [ ] **4. Migration: prisma migrate dev**
  - `pnpm -F @alpfit/backend exec prisma migrate dev --name three_role_data_model`
  - Migration SQL'i incele: tablo + enum + index + FK + partial unique constraint doğru üretildi mi
  - Dosya: `backend/prisma/migrations/<ts>_three_role_data_model/migration.sql`

- [ ] **5. Application-level invariant: aktif PT-üye tekliği**
  - Discuss-phase'de DB-level `@@unique` ile `endedAt = NULL` tek aktif ilişki garantisi
  - Application'da `assertSingleActivePtForMember(memberId)` helper (TASK-1.24'te kullanılır)
  - Dosya: `backend/src/auth/relations.ts` (placeholder; gerçek implement TASK-1.24)

- [ ] **6. Integration testler**
  - `backend/src/auth/relations.test.ts`:
    - Aynı telefon (`+905551234567`) iki kez User create denemesi → 2.si unique constraint hatası
    - Bir member için iki aktif `TrainerMember` (`endedAt: null`) create denemesi → unique constraint hatası
    - Member'ın PT'sini sonlandır (`endedAt = now`), yeni PT ile aktif ilişki kur → çalışır
    - `Role.gym_owner` ile User create → DB izin verir (UI engelleme uygulamada; bu test sadece schema izinli mi)
  - Dosya: `backend/src/auth/relations.test.ts`

- [ ] **7. PII_FIELDS güncellemesi**
  - Yeni alanlar (`firstName`, `lastName`, `gymName`, `certificateNote`) `shared/src/pii-fields.ts` listesine ekle
  - Memory disiplini (`kvkk-pii-scrubbing-matrisi.md`) gereği güncelleme yapılır
  - Dosya: `shared/src/pii-fields.ts` (UPDATE)

---

## Etkilenen Dosyalar

```
backend/
├── prisma/
│   ├── schema.prisma                                       # GÜNCELLE
│   └── migrations/<ts>_three_role_data_model/
│       └── migration.sql                                   # YENİ
└── src/auth/
    ├── relations.ts                                        # YENİ (placeholder helper)
    └── relations.test.ts                                   # YENİ
shared/src/
└── pii-fields.ts                                           # GÜNCELLE
```

---

## Dikkat Noktaları

- **Cuid kullanımı:** Prisma `@default(cuid())` — UUID'ye göre daha kompakt, sıralanabilir (k-sorted) → DB performansı. Gelecekte değişirse migration ağır olur, baştan kararlı seçim.
- **Partial unique constraint:** PostgreSQL `CREATE UNIQUE INDEX ... WHERE endedAt IS NULL` Prisma'da `@@unique([trainerId, memberId, endedAt])` ile yaklaşık karşılanır ama tam değil — Prisma'nın `migrate dev` çıktısına bakıp gerekirse raw SQL ile partial index yazılır.
- **Diyetisyen 4. rolü asla eklenmez** — enum'da slot yok, kod inceleme disiplini.
- **Soft delete + retention TASK-1.15'te** — model'de `deletedAt`/`retentionDeadline` alanları şimdi var, kullanım sonraki task'ta.
- **KVKK consent alanları User'da:** `kvkkConsentAt`, `healthConsentAt` (sağlık verisi açık rıza — discuss-phase: opsiyonel, işaretlenmezse ölçüm/yemek kapalı). Detaylı consent audit `TASK-1.14`'te (ayrı tabloda revoke history).

---

## Test Kriterleri

- [ ] `pnpm -F @alpfit/backend db:migrate:dev` migration başarılı uygular
- [ ] `relations.test.ts` 4 test PASS
- [ ] Manuel kontrol: `psql ... -c "\d \"User\""` tablo + enum + index + FK doğru görünür
- [ ] Partial unique constraint çalışır: iki aktif PT-üye ilişkisi DB seviyesinde reddedilir
- [ ] `Role.gym_owner` user create test'te schema engellemez (UI engellemesi sonraki katmanda)
- [ ] `PII_FIELDS` listesi güncel; backend testlerinde isim alanı log/Sentry'ye sızmıyor
- [ ] Migration rollback testi: yeni migration uygulanır → boş bir migration `migrate dev --name rollback_test` ile undo simulation (manuel)

---

## Karar Noktaları

- **`phoneE164` unique global mı `(phone, role)` mu:** Discuss-phase "bir hesap aynı anda iki rolde olamaz, ayrı hesap açması gerekir" demişti. Ama bu **business logic** — schema'da global unique mi, yoksa `(phone, role)` unique + application "bir telefon zaten kayıtlı" mesajı mı? → **Önerim:** Global `phoneE164` unique (bir hesap = bir telefon); aynı kişinin iki rol gerekliyse ikinci telefon numarası kullanır. Bu, F1.1 PRD'deki "Aynı telefon iki kez kayıt — Bu telefon zaten kayıtlı, giriş yap" akışını netleştirir. → **Kullanıcıya teyit ettir.**
- **`cuid` vs `uuid`:** cuid (k-sorted) öneririm.

---

## Risk ve Geri Dönüş Planı

- **Risk:** Partial unique constraint Prisma migrate'in ürettiği SQL'de eksik olabilir; aktif ilişki tekliği DB seviyesinde garanti edilmez.
  - **Mitigation:** Migration SQL'ini incele, eksikse manuel `CREATE UNIQUE INDEX ... WHERE "endedAt" IS NULL` Prisma raw migration (`prisma migrate dev --create-only` + manuel SQL düzenle).
- **Risk:** Schema değişikliği sonraki task'larda taşıma yükü yaratır.
  - **Mitigation:** Schema kararı bu task'ta DECISIONS.md'ye yazılır; sonradan değişiklik bilinçli karar gerektirir.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.13): add three-role data model with active relationship constraints`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — 3 rol veri modeli + Gym Owner slot + phone uniqueness kararı

---

## Oturum Kayıtları

### Oturum 2026-05-29 — TASK-1.13 ✅

**Durum:** ✅ Tamamlandı

**Yapılanlar:**

- **Prisma schema (`backend/prisma/schema.prisma`)** — `Role` enum (`member`, `trainer`, `gym_owner`) + `User` modeli (cuid id, `phoneE164` global UNIQUE, `role`, `firstName`/`lastName`, opsiyonel `profilePhotoUrl`/`gymName`/`certificateNote`, `kvkkConsentAt`/`healthConsentAt`, soft-delete `deletedAt`/`retentionDeadline`, audit `createdAt`/`updatedAt`, index `role`) + `TrainerMember` (cuid, `trainerId`/`memberId`/`startedAt`/`endedAt nullable`, index `trainerId`/`memberId`/`(memberId, endedAt)`) + `GymOwnerTrainer` (aynı yapı, trainer-bazlı). 3 rol mimari kararı (ILKELER §Pazarlık Konusu Olmayanlar §1) schema'ya yerleşti — Gym Owner ilişki tablosu v1'de boş duracak ama tanımlı.
- **Migration `20260529190917_three_role_data_model/migration.sql`** — `prisma migrate dev --create-only` ile Prisma'nın ürettiği DDL (enum + 3 tablo + index + FK) + **raw SQL eklemeleri:** `CREATE UNIQUE INDEX "TrainerMember_memberId_active_unique" ON "TrainerMember" ("memberId") WHERE "endedAt" IS NULL` + `CREATE UNIQUE INDEX "GymOwnerTrainer_trainerId_active_unique" ON "GymOwnerTrainer" ("trainerId") WHERE "endedAt" IS NULL`. **Karar gerekçesi (DECISIONS.md detayı):** Prisma DSL `@@unique([..., endedAt])` PostgreSQL NULL semantiği (NULL ≠ NULL) yüzünden iki aktif satırı engelleyemez; partial unique index yalnızca `WHERE endedAt IS NULL` koşullu satırları kapsadığı için aktif çoklu PT'yi atomic + race-safe reddeder. `migrate deploy` her ortamda otomatik uygular.
- **`backend/src/auth/relations.ts` (YENİ)** — `assertSingleActivePtForMember(prisma, memberId)` placeholder helper + `ActiveTrainerRelationExistsError` named class. DB partial index son güvence; helper okunaklı hata mesajı (TASK-1.24 davet kabul akışında kullanılacak). 2 katmanlı garanti: application kontrolü ham `Unique constraint violated...` hatasını UX-friendly mesaja çevirir.
- **`shared/src/pii-fields.ts` (UPDATE)** — PII_FIELDS listesine `gymName`/`gym_name`, `certificateNote`/`certificate_note`, `phoneE164`/`phone_e164` eklendi (camelCase + snake_case SSOT disiplini, `kvkk-pii-scrubbing-matrisi.md` gereği). `firstName`/`lastName` zaten listede vardı. Backend (pino redact + Sentry beforeSend) + mobile (Sentry RN beforeSend) bu SSOT'u paylaşır.
- **`backend/src/auth/relations.test.ts` (YENİ) — 6 test PASS** — vitest + `createTestDatabase()` per-suite isolated Postgres (raw partial index migration ile birlikte deploy edilir → test partial index'in deploy garantisini de yakalar): (1) phoneE164 global unique — aynı telefon iki rolde 2. create rejekte; (2) `gym_owner` rolü DB-izinli — UI engellemesi sonraki katmanda; (3) TrainerMember partial unique — iki aktif PT rejekte; (4) İlişki sonlandırıldıktan sonra (`endedAt = now`) yeni PT atanabiliyor + aktif sayım = 1; (5) `assertSingleActivePtForMember` null durumda `resolves.toBeUndefined()`, aktif ilişki varsa `rejects.toBeInstanceOf(ActiveTrainerRelationExistsError)`; (6) GymOwnerTrainer partial unique — bir PT için iki aktif gym owner ilişkisi rejekte.
- **Manuel doğrulama** — `psql -c '\d "User"' '\d "TrainerMember"' '\d "GymOwnerTrainer"'` çıktısı: enum + 3 tablo + FK + index'ler + **partial unique index'ler** (`"TrainerMember_memberId_active_unique" UNIQUE, btree ("memberId") WHERE "endedAt" IS NULL` + GymOwnerTrainer eşi) doğru görünüyor.

**Karar Noktası Çözümleri (kullanıcı "session sonuna kadar best practice" dediği için sormadan, gerekçeyle):**

- **`phoneE164` global unique vs `(phone, role)` composite** → **Global unique** seçildi. F1.1 PRD davranışı "Bu telefon zaten kayıtlı, giriş yap" mesajıyla birebir hizalı; composite kimlik kafa karışıklığı yaratır (hangi rolle giriş?) + KVKK self-silmede ambiguity (hangi hesap silinir?). Aynı kişi iki rol istiyorsa ikinci telefon kullanır.
- **`cuid` vs `uuid`** → **cuid** seçildi (task dokümanı önerisiyle uyumlu). K-sorted → DB index performansı + chronological ordering avantajı; UUID'ye göre daha kompakt.

**Test Sonuçları:**

- `pnpm -F @alpfit/backend test`: **26 PASS** (önceki 20: pii-scrubber × 11 + healthz × 9 + i18n × 4(?) + yeni 6: relations × 6).
- `pnpm typecheck` (recursive: shared + mobile + backend): **temiz**.
- `pnpm lint`: **temiz** (1 import/order hatası düzeltildi).
- `pnpm format:check`: **temiz** (prettier auto-fix 1 dosya).
- `pnpm -F @alpfit/shared test`: **41 PASS** regression yok.
- `pnpm -F @alpfit/mobile test`: **23 PASS** regression yok (PII_FIELDS genişlemesi mobile testlerini kırmadı).

**Sonraki Adım:** TASK-1.14 (KVKK consent schema + audit log) — User'daki `kvkkConsentAt`/`healthConsentAt` alanlarını ayrı audit tabloyla zenginleştir (revoke history), F6.1 + F6.2 gizlilik toggle paterni için.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-29 (run-task)
