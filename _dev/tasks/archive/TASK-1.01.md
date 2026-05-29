# TASK-1.01: Monorepo iskeleti

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** Yok (faz ilk task'i)

---

## Hedef

Repo'nun temel iskeletini kur: pnpm workspaces tabanlı monorepo (`mobile/`, `backend/`, `shared/`), TypeScript baseline tsconfig, ESLint + Prettier toolchain, root `package.json` script'leri. Faz boyunca tüm task'ların üstüne kurulacağı **boş ama tutarlı** zemini hazırla; bu task sonunda `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm format` komutları repo köklerinde çalışıyor olmalı.

---

## Bağlam

Discuss-phase'de monorepo kararı verildi (tek geliştirici → atomic PR'lar, paylaşılan tip tanımları, tek CI). Research-phase pnpm workspaces seçti (disk verimli + monorepo yerleşik). Bu task hem M0 hem M1'in çalışma ortamını açıyor — kararsız bir tsconfig veya lint kuralı sonraki 33 task'a bulaşacağı için **kalıcı** kurulur ([[ilkeler]] §"Kalıcılık önceliği").

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §1 (Repo İskeleti & Build)
- `_dev/phases/PHASE-1.md` — Araştırma Bulguları → Mobile/Backend stack + Paket yöneticisi kararları
- `_dev/ILKELER.md` §Temel İlkeler (Kalıcılık önceliği)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-1.md` — Task Listesi tablosu (durum + commit)
- `CLAUDE.md` — Dokunulmazlar bölümüne `pnpm-workspace.yaml`, `tsconfig.base.json`, kök `package.json` eklenir (kurulan iskeleti yanlışlıkla silmemek için)

---

## Alt Görevler

- [x] **1. pnpm workspaces konfigürasyonu**
  - `pnpm-workspace.yaml` oluştur (`packages: ['mobile', 'backend', 'shared']`)
  - Kök `package.json`: `"private": true`, `"packageManager": "pnpm@<lock-edilmiş>"`, workspace script'leri (`typecheck`, `lint`, `format`, `test`)
  - Node `engines: ">=22"`
  - Dosya: `package.json`, `pnpm-workspace.yaml`, `.nvmrc` (22 LTS)

- [x] **2. TypeScript baseline**
  - `tsconfig.base.json` (root) — strict, target ES2022, moduleResolution NodeNext, paths alias (`@shared/*` → `shared/src/*`)
  - `mobile/tsconfig.json`, `backend/tsconfig.json`, `shared/tsconfig.json` base'i extend eder
  - Dosya: `tsconfig.base.json`, `*/tsconfig.json`

- [x] **3. ESLint + Prettier toolchain**
  - ESLint flat config (eslint.config.js) — TypeScript, import order, no-restricted-syntax slot'u (toLowerCase yasağı sonraki task'ta eklenir)
  - Prettier config (`.prettierrc`) + `.prettierignore`
  - `pnpm lint` + `pnpm format` script'leri çalışır
  - Dosya: `eslint.config.js`, `.prettierrc`, `.prettierignore`

- [x] **4. shared/ paket iskelet**
  - `shared/package.json` — `name: "@alpfit/shared"`, sadece TypeScript export
  - `shared/src/index.ts` — boş re-export entry point
  - Dosya: `shared/package.json`, `shared/src/index.ts`

- [x] **5. mobile/ ve backend/ klasör placeholder'ları**
  - `mobile/package.json` + `mobile/src/.gitkeep` (içeriği sonraki task'larda dolar — şimdilik boş paket)
  - `backend/package.json` + `backend/src/.gitkeep`
  - Bu task'ta uygulama kodu yok, sadece tsconfig + lint çalışsın diye iskelet
  - Dosya: `mobile/package.json`, `backend/package.json`

- [x] **6. .gitignore + .editorconfig**
  - `node_modules/`, `dist/`, `.env*` (örnek hariç), `*.log`, OS dosyaları
  - `.editorconfig` (LF, 2-space indent, utf-8)
  - Dosya: `.gitignore`, `.editorconfig`

---

## Etkilenen Dosyalar

```
/
├── package.json              # YENİ — root workspace
├── pnpm-workspace.yaml       # YENİ
├── pnpm-lock.yaml            # YENİ (pnpm install çıktısı)
├── tsconfig.base.json        # YENİ
├── eslint.config.js          # YENİ
├── .prettierrc               # YENİ
├── .prettierignore           # YENİ
├── .gitignore                # YENİ
├── .editorconfig             # YENİ
├── .nvmrc                    # YENİ
├── mobile/
│   ├── package.json          # YENİ — placeholder
│   ├── tsconfig.json         # YENİ
│   └── src/.gitkeep          # YENİ
├── backend/
│   ├── package.json          # YENİ — placeholder
│   ├── tsconfig.json         # YENİ
│   └── src/.gitkeep          # YENİ
└── shared/
    ├── package.json          # YENİ
    ├── tsconfig.json         # YENİ
    └── src/index.ts          # YENİ
```

---

## Dikkat Noktaları

- **Prisma 7 tuzağı (Araştırma §1):** Monorepo'da Expo/RN ile backend ayrı tsconfig şart — bu task'ta tsconfig ayrımı zaten yapılıyor; Prisma 7 setup sonraki task'ta bu ayrımın üstüne kurulacak.
- **New Arch filtresi (Araştırma §2):** Bu task'ta üçüncü-parti paket eklemiyoruz; ama eklenecek paketler için README'de "New Arch + Expo SDK 56+ uyumlu" filtresinin bilinçli uygulanacağı kuralı sonraki task'larda hatırlanmalı.
- **pnpm lockfile commit edilir** — `pnpm-lock.yaml` reproducibility için repo'da tutulur.
- **`.env*` gitignore'da** ama `.env.example` commit edilir (sonraki task'larda eklenir).
- **Devcontainer Postgres 16 + Redis 7 baseline korunur** (Araştırma §Teknik Kararlar). Bu task'ta devcontainer'a dokunma; sadece pnpm + Node 22 eklenmesi gerekiyorsa CLAUDE.md "Dokunulmazlar"daki `.devcontainer/` notuna uygun olarak kullanıcıya danış.

---

## Test Kriterleri

- [x] `pnpm install` hatasız tamamlanır, `pnpm-lock.yaml` oluşur — 227 paket, 9.6s
- [x] `pnpm typecheck` üç workspace'i de hatasız geçer (boş iskelet) — `pnpm -r --parallel run typecheck` 3/3 done
- [x] `pnpm lint` hatasız çalışır — sıfır warning (eslint.config.mjs)
- [x] `pnpm format:check` hatasız çalışır — "All matched files use Prettier code style"
- [x] `tsc --showConfig` ile mobile + backend tsconfig'lerinin base'i extend ettiği doğrulanır — paths `@shared/*`, target ES2022, strict opsiyonlar üçünde de aynı
- [x] `pnpm -F @alpfit/shared exec tsc --noEmit` çalışır — exit 0

---

## Karar Noktaları

- **Devcontainer'a pnpm + Node 22 eklenmesi:** CLAUDE.md `.devcontainer/` dokunulmaz; pnpm host'ta `corepack enable` ile yönetilebilir mi, yoksa devcontainer Dockerfile'a `RUN corepack enable` mi eklensin? → Kullanıcıya sor (memory: feedback-no-assumptions).

---

## Risk ve Geri Dönüş Planı

- **Risk:** tsconfig `moduleResolution NodeNext` Expo SDK 56 ile uyumsuz çıkabilir (bundler vs node resolver) → Expo iskeletini kurarken (TASK-1.05) mobile/tsconfig override gerekebilir.
  - **Mitigation:** TASK-1.05'te Expo CLI'ın ürettiği tsconfig'i base ile karşılaştır, gerekirse `mobile/tsconfig.json` içinde `moduleResolution: "bundler"` override edilir.
- **Rollback:** Tüm yeni dosyalar repo'ya yeni eklendiği için `git rm` ile tek seferde geri alınabilir.

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı (`feat(TASK-1.01): scaffold pnpm monorepo with tsconfig and lint`)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi
- [x] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-29

**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- Root `package.json` + `pnpm-workspace.yaml` + `.nvmrc` (Node 22, pnpm@10.11.0 packageManager lock)
- `tsconfig.base.json` strict baseline (ES2022 + NodeNext + paths `@shared/*` → `shared/src/*` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`); `shared/tsconfig.json` composite (project references için), `backend/` + `mobile/` base'i extend edip `shared`'a referans verir
- ESLint flat config (`eslint.config.mjs`) — typescript-eslint recommended + import order + prettier-config; TASK-1.06 için TR locale (`toLowerCase`/`toUpperCase`) yasağı yorum-slot olarak işaretli
- Prettier (`.prettierrc` + `.prettierignore`) — `_dev/`, `.claude/`, `.devcontainer/`, markdown otonomu hariç tutuldu
- `shared/`, `backend/`, `mobile/` workspace iskeletleri (`@alpfit/shared`, `@alpfit/backend`, `@alpfit/mobile`); backend + mobile shared'a `workspace:*` ile bağlı
- `.gitignore` (mevcut) `*.tsbuildinfo` + `.expo/` eklendi; `.editorconfig` (LF + 2-space + utf-8 + markdown trim-istisnası)

**Karar Notları:**
- Devcontainer'a dokunulmadı — Dockerfile'da `corepack enable && corepack prepare pnpm@latest --activate` zaten var; Node 22 hazır. Task'taki karar noktası bu yüzden devre dışı.
- ESLint config `eslint.config.js` → `eslint.config.mjs` olarak isimlendirildi (Node ES module warning'i temizler; root `package.json`'a `type: module` eklemek workspace'leri tetiklemediği için `.mjs` daha temiz çözüm).
- Prettier `--check` script'i `format:check` olarak adlandırıldı (CI'da `format` write değil check olmalı); `pnpm format` write yapar, `pnpm format:check` doğrular.

**Sonuç:**
- 227 dev dependency kuruldu (pnpm install 9.6s).
- Tüm test kriterleri ✅ — typecheck/lint/format temiz, tsconfig extend zinciri doğrulandı, shared paket workspace üzerinden import edilebilir.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
