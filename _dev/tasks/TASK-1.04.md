# TASK-1.04: Backend test altyapısı (Vitest + Testcontainers)

**Durum:** ⬜ Bekliyor
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

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
