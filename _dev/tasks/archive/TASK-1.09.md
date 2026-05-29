# TASK-1.09: CI PR pipeline (GitHub Actions: test + lint + typecheck)

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.04, TASK-1.08

---

## Hedef

GitHub Actions üzerinde her PR'da çalışan CI pipeline'ı kur — backend ve mobile workspace'leri **paralel job**'lar olarak çalışır: install (pnpm + cache) → prisma generate (backend) → typecheck → lint → test. Kırıksa merge bloke (branch protection rule). Bu task discuss-phase'deki "her PR'da test+lint+typecheck otomatik, kırıksa merge bloke" kararının uygulamasıdır.

---

## Bağlam

Discuss-phase'in tam CI/CD kararı: PR test+lint+typecheck otomatik (kırıksa merge bloke), main → staging auto-deploy (TASK-1.10), production manuel onayla deploy (Yakın 5). Bu task **PR pipeline**'a odaklanır; deploy webhook'u TASK-1.10'da. Prisma 7 tuzaklarından #1.c (`migrate dev` `generate` çalıştırmıyor) CI'da `pnpm install` sonrası explicit `db:generate` adımı şart.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §7 (CI/CD)
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → CI/CD; Araştırma → Dikkat Edilecekler #1 (Prisma 7 generate)
- `_dev/ILKELER.md` §"Kümülatif test altyapısı"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — CI pipeline yapısı + branch protection kararı

---

## Alt Görevler

- [x] **1. Workflow dosyası iskelet** — `.github/workflows/ci.yml` (trigger `pull_request` + `push:main`, concurrency `${{ github.workflow }}-${{ github.ref }}` + `cancel-in-progress: true`).
- [x] **2. Setup adımları (her job'da paylaşılan)** — `actions/checkout@v4` → `pnpm/action-setup@v4` (versiyon `packageManager: pnpm@10.11.0` field'ından) → `actions/setup-node@v4` (`node-version: '22'`, `cache: pnpm`) → `pnpm install --frozen-lockfile`.
- [x] **3. Backend job** — `container.image: node:22-bookworm` + `services.postgres` (`postgres:17-alpine`, env `dev/dev/dev`, pg_isready health check), `env.DATABASE_URL: postgres://dev:dev@postgres:5432/dev`. Adımlar: `db:generate` (Prisma 7 tuzak #1.c explicit mitigation) → `typecheck` → `test:coverage` → coverage artifact upload (`backend/coverage/lcov.info`). Testcontainers değil — TASK-1.04 DECISIONS'taki per-suite Postgres patern'ine bağlı (service container).
- [x] **4. Mobile job** — `ubuntu-latest`, service yok. Adımlar: `pnpm -F @alpfit/mobile typecheck` → `test:coverage` → coverage artifact (`mobile/coverage/lcov.info`). EAS Build Yakın 5'te.
- [x] **5. Shared job (locale util test)** — `ubuntu-latest`, service yok. `typecheck` → `test:coverage` → coverage artifact (`shared/coverage/lcov.info`). Üçüncü paralel job.
- [x] **5+. Quality job (lint + format)** — Task doc'taki 3-job şeması root lint için per-workspace lint script gerektirirdi (drift riski); 4. paralel `quality` job'ı `pnpm lint` + `pnpm format:check` koşar. Detay: DECISIONS 2026-05-29 §"CI PR Pipeline".
- [x] **6. Branch protection rule (dokümantasyon)** — Kullanıcı `AskUserQuestion` ile manuel UI + rehber dokümanı seçti (CLAUDE.md feedback §"Varsayım Yok"). `.github/CI-SETUP.md` Settings → Branches → Add rule adım-adım rehber + status check isim listesi (`Lint & Format`, `Shared (typecheck + test)`, `Mobile (typecheck + test)`, `Backend (db:generate + typecheck + test)`) + "Require branches up to date" + "Do not allow bypassing" + kasten kırık PR ile koruma doğrulama smoke testi.
- [x] **7. PR template** — `.github/PULL_REQUEST_TEMPLATE.md` özet + task/modül/faz bağlantısı + değişiklik türü checklist (6 commit prefix) + test planı checklist + DevFlow doküman güncellemeleri + KVKK/gizlilik checklist.

---

## Etkilenen Dosyalar

```
.github/
├── workflows/
│   └── ci.yml                     # YENİ
├── CI-SETUP.md                    # YENİ (branch protection rehberi)
└── PULL_REQUEST_TEMPLATE.md       # YENİ
```

---

## Dikkat Noktaları

- **pnpm cache GitHub Actions setup-node@v4** native destek var (`cache: 'pnpm'`); pnpm-lock.yaml hash'i ile cache key
- **Testcontainers + GitHub runners:** Docker default'ta var; testler 5-15s container boot ek süresi getirir. Bu kabul edilebilir; matrix paralelliği ile total CI süresi ~3-5 dakika.
- **`--frozen-lockfile` kritik** — lockfile değişikliği kasıtlı olmalı (dependency bump task'i). Sessiz drift CI fail eder.
- **Secret management CI'da yok şu an** — TASK-1.10'da Coolify deploy webhook secret eklenir; bu task'ta secrets repository setting'inde tutulur (`.env.example` referansı yeterli).
- **macOS runner yok** — iOS build EAS Cloud'da (Yakın 5); CI'da Android emulator smoke YOK (Maestro Yakın 5'te).
- **Test paralelliği:** Vitest paralel test'leri Testcontainers ile çakışırsa pool size düşürülür (`--pool-options.threads.singleThread=true` son çare).

---

## Test Kriterleri

Workflow GitHub'da çalışan bir mekanizma; kabul kriterleri lokalde "simüle edilebilir kadar" doğrulandı + workflow YAML semantik olarak parse edildi. Gerçek PR-time tetikleme repo remote'a push edildikten sonra ilk PR'da bir kez gözlemlenir.

- [x] Workflow YAML semantik geçerli — `js-yaml` ile load edildi (`jobs: quality, shared, mobile, backend`).
- [x] Lokalde her CI komutu yeşil — `pnpm lint` ✓, `pnpm format:check` ✓ (CI-SETUP.md prettier-format'a hizalandı), `pnpm typecheck` recursive ✓ (shared + mobile + backend pretypecheck shared build + db:generate dahil), `pnpm -F @alpfit/{shared,mobile,backend} test:coverage` ✓.
- [x] Coverage path'leri doğru — Vitest config'leri `reporter: ['text', 'lcov']` + `reportsDirectory: './coverage'` (backend + shared); Jest config `coverageDirectory: <rootDir>/coverage` (mobile). Artifact upload `if-no-files-found: ignore` ile boot-fail durumunda silently skip.
- [x] `--frozen-lockfile` koruması — pnpm v10 default davranışı, root `package.json` `packageManager: pnpm@10.11.0` pin'i ile uyumlu; ilk install adımında lockfile drift FAIL.
- [x] Concurrency: `${{ github.workflow }}-${{ github.ref }}` + `cancel-in-progress: true` workflow header'da.
- [ ] Gerçek PR'da CI run gözlemi (repo remote'a push edildikten sonra, kullanıcı manuel doğrular).
- [ ] Branch protection devrede + kasten kırık PR ile koruma smoke (CI-SETUP.md'deki doğrulama adımı).

---

## Karar Noktaları

- **Branch protection nasıl set edilir:** (a) `gh` CLI ile script (`.github/CI-SETUP.sh`), (b) UI'dan manuel + rehber doküman. → Manuel + rehber öneririm (tek seferlik ayar, kullanıcının repo admin olduğunun doğrulaması var); script seçilirse gh token gerekir.
- **CodeQL / dependency scan:** GitHub Actions ücretsiz, kuralım mı? → Bu task kapsam dışı (Yakın 5 launch öncesi review-phase'de değerlendirilir).

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.09): add github actions ci pipeline for pr checks`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — CI pipeline + branch protection kararı

---

## Oturum Kayıtları

### Oturum 2026-05-29

**Durum:** ✅ Tamamlandı

**Yapılanlar:**

- `.github/workflows/ci.yml` — 4 paralel job (`quality` / `shared` / `mobile` / `backend`). Trigger `pull_request` (tüm dallar) + `push:main`. Concurrency `${{ github.workflow }}-${{ github.ref }}` + `cancel-in-progress: true`. Setup zinciri: checkout → pnpm/action-setup → setup-node (v22, cache pnpm) → `pnpm install --frozen-lockfile`. Backend job `node:22-bookworm` container + `postgres:17-alpine` service hostname `postgres` (devcontainer paterni birebir; `backend/test/setup.ts` stub URL'i değişmeden çalışır). Explicit `db:generate` adımı Prisma 7 tuzak #1.c mitigation'ı. Her test job'unda coverage upload (`actions/upload-artifact@v4` `if: always()` + `if-no-files-found: ignore`).
- `.github/CI-SETUP.md` — CI pipeline yapısı + manuel branch protection rehberi (Settings → Branches → Add rule; status check isim listesi; "Require branches up to date" + "Do not allow bypassing"; doğrulama smoke testi). Kullanıcı `AskUserQuestion` ile manuel + rehber dokümanı seçti (gh CLI script yerine — repo henüz remote'a push edilmedi).
- `.github/PULL_REQUEST_TEMPLATE.md` — özet + task/modül/faz bağlantısı + commit prefix checklist + test planı + DevFlow doküman güncellemeleri + KVKK/gizlilik checklist (sağlık verisi dokunan PR'larda zorunlu).
- Lokalde tüm CI komutları yeşil: `pnpm lint` ✓, `pnpm format:check` ✓ (CI-SETUP.md prettier-format'a hizalandı), `pnpm typecheck` recursive ✓ (3 paket; backend pretypecheck shared build + db:generate dahil), `pnpm -F @alpfit/{shared,mobile,backend} test:coverage` 3'ü de ✓. Workflow YAML semantik geçerli (`js-yaml` ile load edildi: `jobs: quality, shared, mobile, backend`).
- DECISIONS.md'ye "CI PR Pipeline: 4 Paralel Job + Job-Container Postgres + Manuel Branch Protection" girdisi eklendi (job kesim seçeneği analizi + job-container vs host runner + branch protection method seçimi + tamamlayıcı uygulama kararları + risk/mitigation).

**Önemli Sapmalar (task doc'tan):**

- Task doc 3 paralel job (backend+mobile+shared) öngörüyordu; root lint için workspace-başına lint script gerektiğinden 4. job (`quality` — root lint+format:check) eklendi. Sebep + tradeoff DECISIONS'ta.
- Task doc backend için "Testcontainers" diyor; TASK-1.04 DECISIONS'ta per-suite Postgres database paterni Testcontainers'ı supersede etmişti. CI bu paterni takip ediyor — service container `postgres:17-alpine` (16 değil — devcontainer ile aynı majör).
- Branch protection script (`.github/CI-SETUP.sh`) yazılmadı; manuel UI + rehber seçildi (repo henüz remote'a push edilmediği için `gh` script anlamsız).

**Kalan İşler:** Yok — task tamamlandı. Sonraki adım: TASK-1.10 (Coolify staging deploy webhook) yeni oturumda.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-29 (run-task)
