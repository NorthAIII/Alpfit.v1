# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-29 — TASK-1.02 ✅: Fastify 5 + zod env loader (fail-fast) + buildServer factory + /healthz; pino-pretty dev + JSON prod; typecheck/build/lint/format temiz; dev+build /healthz 200; 3 fail-fast senaryosu doğrulandı; sıradaki TASK-1.03.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 2/34 task — TASK-1.02 tamamlandı; sıradaki adım `/devflow:run-task` ile TASK-1.03 (Prisma 7 + adapter-pg + ilk migration + generate smoke)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)

---

## Aktif Versiyon

**Versiyon:** v1
**Hedef:** Trainer + Member rolleriyle sürdürülebilirlik motoru iddiasının ilk testi — kardeş (1 PT) + 3-4 öğrencisi, ~90 gün pilot.
**Versiyon Sonu Durumu:** içerik_fazları

<!-- Versiyon geçişlerinde güncellenir. discuss-phase versiyon sonu tespitinde bu alanı okur. -->
<!-- Değerler: içerik_fazları | teknik_borç | senaryo_testi | prd_review_bekliyor -->

---

## Aktif Task

**Task:** TASK-1.03 — Prisma 7 + adapter-pg + ilk migration + generate smoke
**Durum:** ⬜ Bekliyor
**İlerleme:** Bir sonraki oturumda `/devflow:run-task` ile çalıştırılacak.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 2 tamamlandı. Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

| # | Task | Durum |
|---|------|-------|
| 1.01 | Monorepo iskeleti | ✅ Tamamlandı |
| 1.02 | Backend Fastify iskeleti + zod env + healthz | ✅ Tamamlandı |
| 1.03–1.16 | M0 Altyapı (Prisma, test, mobile, CI, hosting, Sentry, 3 rol model, KVKK, retention, yedek) | ⬜ Bekliyor (14) |
| 1.17–1.25 | M1 Auth backend (SMS, OTP, JWT, refresh, davet, deep link) | ⬜ Bekliyor (9) |
| 1.26–1.34 | M1 Mobile UI + akış + smoke (onboarding ekranları, PT üyeler tab, banner, auto-login, e2e smoke) | ⬜ Bekliyor (9) |

**Durum Kodları:** ⬜ Bekliyor | 🔄 Devam ediyor | ⏸️ Duraklatıldı | ✅ Tamamlandı | 🔴 Bloke | ❌ İptal

---

## Engelleyici Ön-Koşullar

Aşağıdaki ön-koşullar ilgili fazlar başlamadan önce çözülmüş olmalı. Discuss-phase'de fazın milestone'una bunlardan birine bağımlıysa, faz bu blocker çözülmeden başlatılmaz.

| Ön-koşul | Blocker olduğu faz konusu | Notlar |
|---|---|---|
| 🔴 **KVKK aydınlatma + sağlık verisi açık rıza metni** (TR, hukuki danışman review'lu) | Yakın 4 (PT dashboard + Sağlık verisi) | Ölçüm + yemek günlüğü bu metin olmadan tamamlanamaz. `KVKK.md` boş şablon olarak duruyor. `/devflow:prd-refine` veya hukuki danışmanla erken oturum gerekir. |
| 🔴 **Çekirdek 50 egzersiz listesi + videolar** | Yakın 5 (UAT + Pilot launch) | Placeholder ile Yakın 2'de program builder'a başlanabilir, ama launch öncesi liste + video kararı şart. Kardeşle ortak liste + video çekim/lisans kararı. Bütçe + zaman karar gerekir. |
| 🟡 **Kardeşin "mevcut WhatsApp+Word program yazma süresi" baseline ölçümü** | Yakın 2 (Program akışı uçtan uca) | [[ilkeler]] §En Yüksek Öncelikli Eksen #2 "2× hız" hedefinin doğrulanması için gerekli. Basit ölçüm: kardeşten "yeni üye için kaç dakika sürdü" notu — pahalı değil ama unutulmasın. |

---

## Son Task Özetleri

> **KURAL:** Sadece son 2 task özeti tutulur, daha eskileri **gerçekten silinir** (HTML comment'e sarma, "Önceki:" prefix, üstü çizili etiket yasak — detay için git log + arşivlenmiş task dokümanı). Her özet kısa formatlı: paragraf yasak, **bullet zorunlu**, "Özet" alanı max 3 bullet.

### TASK-1.02 — Backend Fastify iskeleti + zod env + healthz (2026-05-29) ✅

- Fastify 5 + `@fastify/sensible` + `@fastify/cors` (origin:false) + zod + pino kuruldu; `buildServer({ env, logger? })` factory + zod-validated `loadEnv()` (fail-fast, anlamlı issue listesi); dev pino-pretty + prod JSON
- `/healthz` → `{ status, timestamp, version }` 200; `.env.example` repo'da, `.env` gitignore (kural `.gitignore:13`); script'ler: dev (tsx watch) + build + start + typecheck
- Test kriterleri ✅ — typecheck/build/lint/format temiz; dev (3718) + build (3717) `/healthz` 200; 3 fail-fast senaryosu (missing/short/invalid enum) anlamlı mesaj + exit 1; karar DECISIONS.md'ye yazıldı (server factory + zod loader)

### TASK-1.01 — Monorepo iskeleti (2026-05-29) ✅

- pnpm workspaces (mobile/backend/shared) + Node 22 + packageManager lock; root `tsconfig.base.json` strict NodeNext + paths; ESLint flat + Prettier kuruldu
- Devcontainer'a dokunulmadı (corepack zaten pnpm@latest aktif); ESLint config `.mjs` olarak isimlendirildi
- Test kriterleri ✅ — typecheck/lint/format temiz; tsconfig extend zinciri ve `@alpfit/shared` workspace bağı doğrulandı (227 dep, 9.6s install)

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Duraklatma Notu

<!-- Bu bölüm sadece /devflow:pause kullanıldığında doldurulur. Devam edildiğinde silinir. -->

> ⏸️ **Duraklatma yok** — Aktif çalışma devam ediyor.

## Hızlı Erişim

**Aktif Task:** TASK-1.03 — Prisma 7 + adapter-pg + ilk migration + generate smoke
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`

---

**Son Güncelleme:** 2026-05-29 — TASK-1.02 ✅: Fastify 5 + zod env loader (fail-fast) + buildServer factory + /healthz; pino-pretty dev + JSON prod; typecheck/build/lint/format temiz; dev+build /healthz 200; 3 fail-fast senaryosu doğrulandı; sıradaki TASK-1.03.
