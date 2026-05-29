# TASK-1.03: Prisma 7 setup + adapter-pg + ilk migration + generate smoke check

**Durum:** ⬜ Bekliyor
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

- [ ] **1. Prisma 7 + adapter-pg kurulumu**
  - `pnpm -F @alpfit/backend add prisma@7 @prisma/client @prisma/adapter-pg pg`
  - Dev deps: `@types/pg`
  - `npx prisma init --datasource-provider postgresql --output ../node_modules/.prisma/client`
  - Dosya: `backend/package.json`, `backend/prisma/schema.prisma`

- [ ] **2. schema.prisma temel konfig**
  - `generator client { provider = "prisma-client-js", previewFeatures = ["driverAdapters"] }`
  - `datasource db { provider = "postgresql", url = env("DATABASE_URL") }`
  - **Henüz model yok** — boş init migration; 3 rol veri modeli TASK-1.13'te eklenir, KVKK tabloları TASK-1.14'te
  - Dosya: `backend/prisma/schema.prisma`

- [ ] **3. Prisma client wrapper (adapter-pg explicit)**
  - `backend/src/db/prisma.ts` — `PrismaClient` instance, `PrismaPg` adapter ile `DATABASE_URL`'den pool kurar
  - Singleton pattern (dev hot-reload'da çoklu client oluşmasın)
  - Dosya: `backend/src/db/prisma.ts`

- [ ] **4. İlk migration (boş schema)**
  - `pnpm -F @alpfit/backend exec prisma migrate dev --name init` (devcontainer'da Postgres 16 ayakta)
  - `prisma/migrations/0000000000000_init/migration.sql` — boş migration (sadece extension'lar veya hiçbir şey)
  - Migration commit edilir
  - Dosya: `backend/prisma/migrations/*`

- [ ] **5. dev + build script'lere explicit generate**
  - `backend/package.json` script'leri:
    - `"db:generate": "prisma generate"`
    - `"db:migrate:dev": "prisma migrate dev"`
    - `"db:migrate:deploy": "prisma migrate deploy"`
    - `"prebuild": "pnpm db:generate"` (build öncesi otomatik)
    - `"dev": "pnpm db:generate && tsx watch src/index.ts"` (dev start öncesi generate)
  - **Kritik:** `migrate dev`'in `generate` çalıştırmadığını biliyoruz; bu nedenle her dev start + her CI install sonrası explicit çalışır
  - Dosya: `backend/package.json`

- [ ] **6. Smoke check: app start + DB ping**
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

- [ ] `pnpm -F @alpfit/backend db:generate` çalışır ve `node_modules/.prisma/client` oluşur
- [ ] `pnpm -F @alpfit/backend db:migrate:dev` boş migration uygular
- [ ] `pnpm -F @alpfit/backend dev` başlar; `/healthz` → 200 + `{ status: 'ok', db: 'up' }`
- [ ] DB bağlantısı kopuk olduğunda (örn. yanlış `DATABASE_URL`) `/healthz` → 503 + `{ status: 'degraded', db: 'down' }`
- [ ] Migration dosyası git'e eklendi; ikinci kez `migrate dev` no-op
- [ ] `prisma generate` çağrılmadan `dev` script çalıştırılırsa otomatik tetiklendiği doğrulanır (script chain test)

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

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.03): set up prisma 7 with explicit adapter-pg and generate hooks`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Prisma 7 + adapter-pg + generate explicit kararı yazıldı

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
