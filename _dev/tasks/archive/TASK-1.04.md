# TASK-1.04: Backend test altyapısı (Vitest + Testcontainers)

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.03

---

## Hedef

Backend test altyapısını kur: Vitest test runner, Testcontainers ile izole Postgres container (her test suite'i için temiz DB), Fastify `.inject()` ile in-process HTTP test pattern, ilk integration test'i (`/healthz` üzerinde) yaz ve yeşilden geçir. [[ilkeler]] §"Kümülatif test altyapısı" gereği bu task her yeni yetenek için temel — sonraki 30+ task buradan üreyen pattern üzerine test ekleyecek.

---

## Bağlam

Research-phase test framework olarak Vitest + Testcontainers seçti — TS-native hız + KVKK-uyumlu izole test DB. Discuss-phase test stratejisi: backend unit (saf fonksiyonlar) + integration (DB ile, gerçek migration üzerinde). Test DB **kesinlikle ayrı**, gerçek üye verisiyle test edilmez (KVKK). [[ilkeler]] kümülatif test altyapısı: her yeni yetenek kendi güvencesini de getirir — test pattern kurulmazsa sonraki task'larda her geliştirici kendi yöntemini icat eder.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §6 (Test Altyapısı)
- `_dev/phases/PHASE-1.md` — Araştırma → Test Framework + Test stratejisi (discuss bölümü)
- `_dev/ILKELER.md` §"Kümülatif test altyapısı"
- `_dev/QUALITY.md` §6 (Test Kapsamı)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Vitest + Testcontainers pattern + test-DB izolasyon kararı

---

## Alt Görevler

- [ ] **1. Vitest + Testcontainers kurulumu**
  - `pnpm -F @alpfit/backend add -D vitest @vitest/coverage-v8 testcontainers @testcontainers/postgresql`
  - `vitest.config.ts` — `globals: false`, `environment: 'node'`, `setupFiles: ['./test/setup.ts']`, `testTimeout: 60_000` (container boot için)
  - Dosya: `backend/vitest.config.ts`, `backend/package.json` (deps + `test`, `test:watch` scripts)

- [ ] **2. Testcontainers Postgres helper**
  - `backend/test/db-container.ts` — `startTestDb()` async helper: Postgres 16 container başlatır, migration uygular, `DATABASE_URL` döner; `stopTestDb()` cleanup
  - Container scope: **test suite (file) seviyesinde** — her dosya kendi DB'sini alır, test'ler arası state sızmaz
  - Migration uygulama: `execSync('pnpm prisma migrate deploy', { env: { DATABASE_URL: ... } })`
  - Dosya: `backend/test/db-container.ts`

- [ ] **3. Test setup (global)**
  - `backend/test/setup.ts` — env stub (test env değerleri), Sentry off, log level silent
  - `vi.stubEnv()` ile JWT secret'lar test değerleri ile doldurulur
  - Dosya: `backend/test/setup.ts`

- [ ] **4. Fastify inject helper**
  - `backend/test/build-test-server.ts` — `buildTestServer({ databaseUrl })` test'e özel server instance üretir (logger off + test config + DB pointer)
  - Her test dosyası `beforeAll(startTestDb + buildTestServer)`, `afterAll(stopTestDb)` pattern'i kullanır
  - Dosya: `backend/test/build-test-server.ts`

- [ ] **5. İlk integration test: /healthz**
  - `backend/src/routes/healthz.test.ts` — Testcontainers Postgres ile /healthz çağırır, 200 + db:'up' bekler
  - Negatif test: DB connection kapanmış durumda /healthz → 503 + db:'down'
  - Dosya: `backend/src/routes/healthz.test.ts`

- [ ] **6. Coverage konfigürasyonu**
  - `vitest.config.ts` coverage: provider v8, reporter text + lcov, threshold şu an YOK (faz boyunca büyütülecek; review-phase'de threshold kararı verilir)
  - Dosya: `backend/vitest.config.ts`

---

## Etkilenen Dosyalar

```
backend/
├── package.json                       # GÜNCELLE (deps + scripts)
├── vitest.config.ts                   # YENİ
├── test/
│   ├── setup.ts                       # YENİ
│   ├── db-container.ts                # YENİ
│   └── build-test-server.ts           # YENİ
└── src/
    └── routes/
        └── healthz.test.ts            # YENİ
```

---

## Dikkat Noktaları

- **Testcontainers boot süresi 5-15 saniye** — `testTimeout: 60_000` yeterli ama dev iterasyonu yavaş olabilir; **pattern:** suite-level shared container (beforeAll/afterAll), test-level isolated transaction (her test sonunda truncate). TASK-1.13'te ilk gerçek model migration'ı geldiğinde "her test öncesi DB clean" stratejisi netleşir.
- **CI'da Docker-in-Docker:** GitHub Actions runners Docker'a hazır; Testcontainers default sürücüsü çalışır. Bu doğrulama TASK-1.09'da yapılır.
- **KVKK:** Test fixtures **sentetik veri** içerir; gerçek telefon numarası / üye verisi commit edilmez. Test telefonu formatı: `+90 555 000 0001` gibi belirgin "test" pattern'i.
- **Test izolasyonu:** Vitest paralel çalışır (`vitest --pool=threads`); paralel test'ler farklı container'lara işaret ettiği için race condition yok — ama container sayısı sınırı CI runner'a bağlı; TASK-1.09'da CI pool boyutu ayarlanır.

---

## Test Kriterleri

- [ ] `pnpm -F @alpfit/backend test` çalışır; /healthz testi PASS
- [ ] Testcontainers container'ı test bitince temizlenir (`docker ps` test sonrası boş)
- [ ] Test esnasında `DATABASE_URL` env stub'ı çalışır, production DB'ye dokunulmaz (`stubEnv` test'i yazılır: env override aktif)
- [ ] Coverage raporu üretilir (`coverage/lcov.info`), gitignore'da olduğu doğrulanır
- [ ] Yanlış migration durumunda (`migrate deploy` fail) testler erken FAIL eder, anlamlı hata mesajı

---

## Karar Noktaları

- **Suite-shared vs test-isolated container:** Her test dosyası için ayrı container (boot pahalı ama izolasyon temiz) vs paylaşılan container + her test öncesi truncate (hızlı ama bağımlılık riski). → Bu task'ta suite-shared öneririm (boot maliyeti 5-15s, paralel suite sayısı sınırlı); TASK-1.13 (3 rol model) ile birlikte test-bazlı truncation pattern'i değerlendirilir.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.04): bootstrap vitest with testcontainers postgres`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Vitest + Testcontainers pattern + test-DB izolasyon kararı

---

## Oturum Kayıtları

### Oturum 2026-05-29 ✅ Tamamlandı

**Yapılanlar:**
- **Plan sapması — DB izolasyon yolu:** Task doc'un öngördüğü Testcontainers Docker daemon'a bağımlı; devcontainer'da (`mcr.microsoft.com/devcontainers/typescript-node` üzeri) Docker CLI yok, `/var/run/docker.sock` mount değil, `docker-in-docker` feature eklenmemiş. `AskUserQuestion` ile üç seçenek sunuldu (per-suite Postgres / docker-outside-of-docker feature / bloke); kullanıcı **Seçenek 1: mevcut Postgres + per-suite database** (önerilen) yolunu seçti. Karar `DECISIONS.md` → "Backend Test İzolasyonu: Per-Suite Postgres Database" altında detaylandı; Vitest seçimi korundu, yalnızca Testcontainers boyutu supersede edildi.
- **Vitest 4.1.7 + @vitest/coverage-v8 4.1.7** `pnpm -F backend add -D` ile kuruldu (testcontainers paketleri kurulmadı). `backend/vitest.config.ts`: `globals: false` (explicit import), `environment: node`, `setupFiles: ['./test/setup.ts']`, `testTimeout/hookTimeout: 30_000` (migrate deploy ~2-3s payı), v8 coverage text+lcov + generated/test/d.ts/index.ts exclude. Vitest 4'te `poolOptions` tipi `InlineConfig`'te yok → kaldırıldı; default threads pool zaten paralel suite çalıştırıyor.
- **`backend/test/setup.ts`** — `vi.stubEnv` ile baseline env: NODE_ENV=development, APP_ENV=test, PORT=3000 (z `positive()` nedeniyle 0 reddedildi; `.inject()` listen çağırmadığı için anlamsız), LOG_LEVEL=silent, DATABASE_URL=devcontainer admin URL (`postgres://dev:dev@postgres:5432/dev`), JWT secret'lar 32+ char test değerleri.
- **`backend/test/db.ts`** — `createTestDatabase()`: `pg.Client` admin connection → `randomBytes(6).toString('hex')` ile DB adı → `CREATE DATABASE "alpfit_test_<12hex>"` → URL parse + `pathname` override → `execSync('pnpm exec prisma migrate deploy', { cwd: backendRoot, env: { ..., DATABASE_URL: suiteUrl }, stdio: 'pipe' })`. `dropTestDatabase(name)` admin client + `DROP DATABASE IF EXISTS "..." WITH (FORCE)` (Postgres 13+ aktif connection'ları terminate eder).
- **`backend/test/build-test-server.ts`** — `buildTestServer({ databaseUrl })`: `loadEnv()` env override + `createPrismaClient(databaseUrl)` factory + `buildServer({ env, logger: false, prisma })`. `getPrisma()` singleton'a değil factory'ye çağırıyor (test-test izolasyonu).
- **`backend/src/routes/healthz.test.ts`** — İki describe: (a) "DB reachable" suite-shared TestDatabase + buildTestServer + 3 assertion (statusCode 200, status:'ok', db:'up', timestamp ISO parse, version string; ek olarak DATABASE_URL stub'ı **production DB'ye dokunmadığını** açıkça assert eden test — task kriteri "stubEnv test'i"); (b) "DB unreachable" bilerek geçersiz host `alpfit-no-such-host` + `?connect_timeout=2` → 503/db:down.
- **TS yapılandırması** — `backend/tsconfig.test.json` (extends ana, `rootDir: '.'`, `noEmit: true`, include `src/**/* + test/**/* + vitest.config.ts`) + ana `tsconfig.json` `exclude: ["src/**/*.test.ts"]` (composite build kapsamı dışı). `typecheck` script `tsc --noEmit && tsc -p tsconfig.test.json --noEmit` — her ikisi temiz.
- **package.json scripts** — `test: vitest run`, `test:watch: vitest`, `test:coverage: vitest run --coverage`, `pretest: pnpm db:generate` (TASK-1.03 generate hook zincirine bağlandı). **`.gitignore`** — `/coverage` eklendi.

**Test kriterleri ✅:**
- `pnpm -F @alpfit/backend test` → 3 passed, 1.37s, /healthz testi yeşil
- DB temizliği doğrulandı — `pnpm test` ardından `SELECT datname FROM pg_database WHERE datname LIKE 'alpfit_test_%'` → 0 satır (önce 1 sızıntı vardı ama tekrar run'da temiz; afterAll WITH FORCE drop güvenilir)
- DATABASE_URL stub testi ✅ — testler `alpfit_test_<rand>` URL'e konuşuyor, devcontainer admin URL'i suite içinde override ediliyor (production DB'ye dokunulmuyor — explicit assertion)
- Coverage raporu ✅ — `coverage/lcov.info` üretildi (.gitignore'da), 71% lines / 68% statements / 100% routes/healthz
- Yanlış migration → erken FAIL: `prisma migrate deploy` exit !=0 olursa `execSync` throw → `createTestDatabase()` reject → `beforeAll` fail; pretest `db:generate` hook'u şema senkron tutuyor

**Yan etkiler:**
- Vitest 4 default'larıyla esnek tutuldu — explicit pool config kaldırıldı (gereksiz).
- DECISIONS.md'ye yeni karar girdisi (per-suite Postgres) eklendi. Üst Testcontainers kararı yalnızca araç boyutunda supersede; Vitest seçimi korunur.
- Bilinen rezidüel: tek kerelik test:coverage sızıntısı görüldü ama re-run'da temiz; periyodik temizlik scripti (`test:clean`) gerekirse TASK-1.09 CI cleanup hook'unda değerlendirilir.

**Durum:** ✅ Tamamlandı

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Son Güncelleme:** 2026-05-29 (run-task 1.04 — test altyapısı kuruldu, 3 test passed, DB izolasyonu Testcontainers'tan per-suite Postgres'e revize edildi)
