# TASK-1.03: Prisma 7 setup + adapter-pg + ilk migration + generate smoke check

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.02

---

## Hedef

Backend'e Prisma 7 ORM'i kur (ESM + Rust-free yeni mimari), `@prisma/adapter-pg` ile Postgres adapter'ını explicit bağla, "init" migration'ı çalıştır (boş schema; gerçek tablolar sonraki task'larda eklenecek), `prisma generate`'in dev + CI script'lerine eklendiğini smoke check ile doğrula. Bu task **Prisma 7'nin Kasım 2025 release'inin 3 tuzağına özel olarak hizalanır** (Araştırma §Dikkat Edilecekler #1).

---

## Bağlam

Research-phase Prisma 7 seçti — graph-tabanlı migration KVKK + kümülatif test için en güvenli; en geniş docs solo dev için kritik. Ama Prisma 7 Kasım 2025'te ESM + Rust-free'ye geçti; 3 tuzak araştırmada işaretlendi: (a) monorepo'da ayrı tsconfig şart (TASK-1.01'de zaten ayrı), (b) `@prisma/adapter-pg` explicit kurulum şart, (c) `migrate dev` / `db push` artık `prisma generate` çalıştırmıyor — dev + CI script'lerinde explicit `generate` adımı şart. Bu task araştırmada işaretlenen **"ilk task'lerden biri: Prisma 7 setup smoke check"** mitigation'ının kendisidir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §1 (Build), §6 (Test altyapısı kümülatif)
- `_dev/phases/PHASE-1.md` — Araştırma → ORM kararı + Dikkat Edilecekler #1 (Prisma 7 tuzakları)
- `_dev/ILKELER.md` §"Kalıcılık önceliği" + §"Kümülatif test altyapısı"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Prisma 7 ESM + adapter-pg explicit kurulum + generate-on-migrate kararı

---

## Alt Görevler

- [x] **1. Prisma 7 + adapter-pg kurulumu**
  - `pnpm -F @alpfit/backend add prisma@7 @prisma/client @prisma/adapter-pg pg`
  - Dev deps: `@types/pg`
  - `npx prisma init --datasource-provider postgresql --output ../node_modules/.prisma/client`
  - Dosya: `backend/package.json`, `backend/prisma/schema.prisma`

- [x] **2. schema.prisma temel konfig**
  - `generator client { provider = "prisma-client-js", previewFeatures = ["driverAdapters"] }`
  - `datasource db { provider = "postgresql", url = env("DATABASE_URL") }`
  - **Henüz model yok** — boş init migration; 3 rol veri modeli TASK-1.13'te eklenir, KVKK tabloları TASK-1.14'te
  - Dosya: `backend/prisma/schema.prisma`

- [x] **3. Prisma client wrapper (adapter-pg explicit)**
  - `backend/src/db/prisma.ts` — `PrismaClient` instance, `PrismaPg` adapter ile `DATABASE_URL`'den pool kurar
  - Singleton pattern (dev hot-reload'da çoklu client oluşmasın)
  - Dosya: `backend/src/db/prisma.ts`

- [x] **4. İlk migration (boş schema)**
  - `pnpm -F @alpfit/backend exec prisma migrate dev --name init` (devcontainer'da Postgres 16 ayakta)
  - `prisma/migrations/0000000000000_init/migration.sql` — boş migration (sadece extension'lar veya hiçbir şey)
  - Migration commit edilir
  - Dosya: `backend/prisma/migrations/*`

- [x] **5. dev + build script'lere explicit generate**
  - `backend/package.json` script'leri:
    - `"db:generate": "prisma generate"`
    - `"db:migrate:dev": "prisma migrate dev"`
    - `"db:migrate:deploy": "prisma migrate deploy"`
    - `"prebuild": "pnpm db:generate"` (build öncesi otomatik)
    - `"dev": "pnpm db:generate && tsx watch src/index.ts"` (dev start öncesi generate)
  - **Kritik:** `migrate dev`'in `generate` çalıştırmadığını biliyoruz; bu nedenle her dev start + her CI install sonrası explicit çalışır
  - Dosya: `backend/package.json`

- [x] **6. Smoke check: app start + DB ping**
  - `backend/src/db/ping.ts` — `prisma.$queryRaw\`SELECT 1\`` health check
  - `/healthz` endpoint'ini extend et: DB ping başarısızsa 503 döner (`{ status: 'degraded', db: 'down' }`)
  - Dosya: `backend/src/db/ping.ts`, `backend/src/routes/healthz.ts` (UPDATE)

---

## Etkilenen Dosyalar

```
backend/
├── package.json                          # GÜNCELLE (deps + scripts)
├── prisma/
│   ├── schema.prisma                     # YENİ (boş model)
│   └── migrations/
│       └── 0000000000000_init/
│           └── migration.sql             # YENİ
└── src/
    ├── db/
    │   ├── prisma.ts                     # YENİ (client + adapter-pg)
    │   └── ping.ts                       # YENİ
    └── routes/
        └── healthz.ts                    # GÜNCELLE (DB ping)
```

---

## Dikkat Noktaları

- **Prisma 7 ESM tuzağı (Araştırma §Tuzaklar #1.a):** `backend/tsconfig.json` zaten `moduleResolution NodeNext` (TASK-1.01); Prisma 7 ESM client bunu gerektirir.
- **adapter-pg explicit (Araştırma §Tuzaklar #1.b):** `PrismaClient` instantiation'ında `new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) })` şeklinde explicit verilir; eksikse runtime'da kırılır.
- **generate-on-migrate kalktı (Araştırma §Tuzaklar #1.c):** `db:generate` script'i her zaman explicit çağrılır; CI'da (TASK-1.09) `pnpm install && pnpm -F backend db:generate` zinciri kurulur. Bu task'ta script tanımı yapılır; CI'a entegrasyon TASK-1.09'da.
- **Devcontainer Postgres 16** ayakta olduğu için `migrate dev` local'de hemen çalışır; staging/prod migration'ı TASK-1.10'da (Coolify) ayrı pipeline ile yönetilir.

---

## Test Kriterleri

- [x] `pnpm -F @alpfit/backend db:generate` çalışır ve `backend/src/generated/prisma/` oluşur (yeni `prisma-client` generator output)
- [x] `pnpm -F @alpfit/backend db:migrate:dev` boş `_init` migration uygular (`--create-only` ile yaratıldı, sonra apply)
- [x] `pnpm -F @alpfit/backend dev` başlar; `/healthz` → 200 + `{ status: 'ok', db: 'up', ... }`
- [x] DB bağlantısı kopuk (yanlış host) → `/healthz` → 503 + `{ status: 'degraded', db: 'down', ... }`
- [x] Migration dosyası git'e eklendi; ikinci kez `migrate dev` no-op ("Already in sync")
- [x] `src/generated/prisma` silindi → `pnpm build` çalıştırıldı → `prebuild` script'i `db:generate`'i otomatik tetikledi, build başarıyla tamamlandı

---

## Karar Noktaları

- **Singleton pattern dev hot-reload:** Standart Prisma docs pattern'i (`globalThis.prisma`) kullanılabilir; ya da factory + container DI. → Standart docs pattern öneririm (sade, solo dev için bakım maliyeti düşük).

---

## Risk ve Geri Dönüş Planı

- **Risk:** Prisma 7 `@prisma/adapter-pg` API'sinin kasım 2025 release'inden sonra hâlâ değişebilir olması (preview feature).
  - **Mitigation:** Adapter import'u tek noktada (`backend/src/db/prisma.ts`); değişirse tek dosyada yamanır. Prisma changelog kontrol et task çalıştırılırken.
- **Risk:** Boş migration commit'i sonradan ilk model migration'ı ile çakışabilir (Prisma migration drift).
  - **Mitigation:** Boş init'in dosya adı timestamp'i en eski olduğu için sıralama bozulmaz; ama gerekirse TASK-1.13'te bu migration'a model eklenebilir (squash etmeyiz, üzerine yeni migration yazılır).

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı (`feat(TASK-1.03): set up prisma 7 with explicit adapter-pg and generate hooks`)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi
- [x] PHASE-1.md task tablosu güncellendi
- [x] DECISIONS.md — Prisma 7 setup detayı (yeni `prisma-client` generator + prisma.config.ts + singleton+factory + generate hooks) yazıldı

---

## Oturum Kayıtları

### Oturum 2026-05-29 ✅ Tamamlandı

**Yapılanlar:**
- Prisma 7.8.0 + `@prisma/client` 7.8.0 + `@prisma/adapter-pg` 7.8.0 + `pg` 8.21.0 + `@types/pg` (dev) backend workspace'e kuruldu (`backend/package.json` deps güncel).
- `pnpm exec prisma init --datasource-provider postgresql` ile `backend/prisma/schema.prisma` + `backend/prisma.config.ts` + `backend/.gitignore` (generated path + `.env`) doğdu. Placeholder `backend/.env` silindi (devcontainer zaten `DATABASE_URL` export ediyor); `backend/.env.example` korundu.
- `schema.prisma`: **yeni `prisma-client` generator** (Prisma 7 default, ESM-first, output `src/generated/prisma`) + `datasource db { provider = "postgresql" }`. URL `prisma.config.ts` ve runtime'da adapter üzerinden geliyor; schema'da `url = env(...)` yok (DI temizliği).
- `prisma.config.ts`: `dotenv/config` import'u kaldırıldı (devcontainer env-var bazlı, `.env` dosyası yok); `defineConfig({ schema, migrations.path, datasource.url })` kaldı.
- `backend/src/db/prisma.ts`: `createPrismaClient(databaseUrl)` factory + `getPrisma(databaseUrl)` singleton (`globalThis.__alpfitPrisma` cache) + `PrismaPg(databaseUrl)` adapter wiring. Adapter constructor `string | pg.Pool | pg.PoolConfig` kabul ediyor — connection string direkt geçiyor (research §1.b mitigation: explicit).
- `backend/src/db/ping.ts`: `pingDatabase(prisma)` → `prisma.$queryRaw\`SELECT 1\`` try/catch → boolean.
- `backend/src/server.ts`: `BuildServerOptions`'a opsiyonel `prisma?: PrismaClient` eklendi (test/inject için); `app.decorate('prisma', prisma)` + Fastify module augmentation tip beyanı.
- `backend/src/routes/healthz.ts`: `app.prisma` üzerinden `pingDatabase` çağırıyor; `db:up` → 200, `db:down` → 503 + `{ status: 'degraded', db: 'down', ... }`.
- `backend/package.json` scripts: `db:generate`, `db:migrate:dev`, `db:migrate:deploy` eklendi; `predev`/`prebuild`/`pretypecheck` zincirleri `pnpm db:generate`'i çağırıyor (research §1.c mitigation: generate-on-migrate kalktığı için explicit).
- İlk migration: `pnpm exec prisma migrate dev --name init --create-only` (boş schema'da auto-create no-op çünkü Prisma 7 fark görmüyor; `--create-only` boş migration yarattı), sonra `pnpm exec prisma migrate dev` ile apply → `backend/prisma/migrations/20260529115611_init/migration.sql` ("-- This is an empty migration.") + `_prisma_migrations` tablosunda kayıt.
- ESLint flat config: `**/generated/**` ignore eklendi. `.prettierignore`: `**/generated/**` eklendi (auto-generated Prisma client formatlanmıyor).

**Sapma — Task Doc vs. Prisma 7 gerçeği:**
- Task doc `provider = "prisma-client-js"` + `previewFeatures = ["driverAdapters"]` + output `../node_modules/.prisma/client` öngörüyordu. Prisma 7'de gerçek default: yeni `prisma-client` generator + `src/generated/prisma` output; `driverAdapters` artık preview değil — flag gerekmiyor.
- Task doc'ta olmayan ek dosyalar: `prisma.config.ts` (v7 standardı, config'in schema'dan ayrışması), auto-generated `backend/.gitignore`.
- Karar `AskUserQuestion` ile kullanıcıya soruldu (CLAUDE.md feedback: mimari/paket kararı onaysız değişmez). Kullanıcı: **yeni `prisma-client` generator** + **`prisma.config.ts` korunur, placeholder `.env` silinir** (her ikisi de "Recommended" işaretliydi).

**Test Sonuçları (Test Kriterleri ✅):**
- `pnpm db:generate` → `backend/src/generated/prisma` ✓
- `pnpm db:migrate:dev` → boş `_init` migration apply ✓
- `pnpm dev` (PORT=3711, JWT secrets inline) → `curl /healthz` 200 + `{"status":"ok","db":"up","timestamp":"...","version":"0.0.0"}` ✓
- `node dist/index.js` (PORT=3712, bozuk `DATABASE_URL=postgres://...@nonexistent-host:5432/dev`) → `curl /healthz` 503 + `{"status":"degraded","db":"down",...}` ✓
- İkinci `pnpm db:migrate:dev` → "Already in sync" (no-op) ✓
- `rm -rf src/generated && pnpm build` → `prebuild` zinciri `db:generate`'i otomatik tetikledi, build başarı ✓
- `pnpm typecheck` ✓, `pnpm lint` ✓, `pnpm format:check` ✓ (generated/ ignore'lu)

**Karar Noktası (Singleton):** Task doc'ta "Standart docs pattern (`globalThis.prisma`)" önerilmişti — aynen uygulandı, prefix `__alpfitPrisma` (paket çakışmasına karşı).

**Notlar:**
- Devcontainer aslında Postgres **17** (task notu "16" diyor; `docker-compose.yml: postgres:17-alpine`). 17 ile Prisma 7 sorunsuz; doküman drift'i.
- Backend env loader `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` zorunlu (zod). Devcontainer bunları set etmiyor — dev/test başlatırken inline geçmek gerekti. Bu task'ın işi değil; TASK-1.20 öncesi DX iyileştirme adayı (örn. devcontainer env defaults veya `.env.development.example`).

**Etkilenen Dosyalar:**
- YENİ: `backend/prisma.config.ts`, `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260529115611_init/migration.sql`, `backend/prisma/migrations/migration_lock.toml`, `backend/.gitignore`, `backend/src/db/prisma.ts`, `backend/src/db/ping.ts`
- GÜNCELLE: `backend/package.json`, `backend/src/server.ts`, `backend/src/routes/healthz.ts`, `eslint.config.mjs`, `.prettierignore`, `pnpm-lock.yaml`

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-29
