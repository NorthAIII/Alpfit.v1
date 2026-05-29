# TASK-1.09: CI PR pipeline (GitHub Actions: test + lint + typecheck)

**Durum:** ⬜ Bekliyor
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

- [ ] **1. Workflow dosyası iskelet**
  - `.github/workflows/ci.yml` — trigger: `pull_request` (tüm dallar) + `push` (main)
  - Concurrency: aynı PR'a yeni commit gelirse eski run cancel olur (`concurrency.group: ${{ github.workflow }}-${{ github.ref }}`)
  - Job matrix: `backend`, `mobile` (paralel)
  - Dosya: `.github/workflows/ci.yml`

- [ ] **2. Setup adımları (her job'da paylaşılan)**
  - `actions/checkout@v4`
  - `actions/setup-node@v4` (Node 22, cache: pnpm)
  - `pnpm/action-setup@v4` (pnpm sürümü `package.json` packageManager'dan)
  - `pnpm install --frozen-lockfile` (lockfile uyumsuzluğunda FAIL — reproducibility garantisi)

- [ ] **3. Backend job adımları**
  - Service: `postgres:16` (Testcontainers da var ama doğrudan Postgres erişim de gerekebilir — opsiyonel)
  - **Aslında Testcontainers** kullanılacak; Docker-in-Docker GitHub runners'da hazır, ek service gerek yok
  - `pnpm -F @alpfit/backend db:generate` (Prisma 7 tuzak #1.c mitigation)
  - `pnpm -F @alpfit/backend typecheck`
  - `pnpm -F @alpfit/backend lint`
  - `pnpm -F @alpfit/backend test`
  - Test output coverage artifact upload (`actions/upload-artifact@v4` — `backend/coverage/lcov.info`)

- [ ] **4. Mobile job adımları**
  - `pnpm -F @alpfit/mobile typecheck`
  - `pnpm -F @alpfit/mobile lint`
  - `pnpm -F @alpfit/mobile test`
  - Test output coverage artifact upload (`mobile/coverage/lcov.info`)
  - **EAS Build burada YOK** — Yakın 5'te eklenir (faz dışı)

- [ ] **5. Shared job (locale util test)**
  - `pnpm -F @alpfit/shared typecheck`
  - `pnpm -F @alpfit/shared lint`
  - `pnpm -F @alpfit/shared test`
  - Üçüncü paralel job

- [ ] **6. Branch protection rule (dokümantasyon)**
  - Repo Settings → Branches → main: require status checks (backend, mobile, shared CI jobs) to pass before merge
  - **Manuel adım:** Bu repo Settings ayarı task'ta dokümante edilir, ama `gh` CLI ile (`gh api repos/:owner/:repo/branches/main/protection`) script olarak da yazılabilir
  - Dosya: `.github/CI-SETUP.md` — manuel branch protection ve kullanıcı adımları rehberi
  - **Karar noktası:** Branch protection'ı script ile mi yoksa manuel UI mı? Kullanıcıya sor.

- [ ] **7. PR template (opsiyonel ama yararlı)**
  - `.github/PULL_REQUEST_TEMPLATE.md` — task numarası referansı, test plan checklist
  - Dosya: `.github/PULL_REQUEST_TEMPLATE.md`

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

- [ ] PR açıldığında CI tetiklenir, 3 paralel job (backend, mobile, shared) çalışır
- [ ] Bir typecheck hatası eklenirse CI FAIL eder, ilgili job kırmızı görünür
- [ ] Bir lint hatası eklenirse CI FAIL eder
- [ ] Bir test failure eklenirse CI FAIL eder
- [ ] Coverage artifact PR sonunda indirilebilir
- [ ] Lockfile değişikliği commit edilmeden bir paket eklenirse `--frozen-lockfile` ile FAIL eder
- [ ] Tüm yeşilse PR merge edilebilir (branch protection devreye girdikten sonra)
- [ ] Concurrency: aynı PR'a 2 commit yan yana push edilirse eski run cancel olur

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

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
