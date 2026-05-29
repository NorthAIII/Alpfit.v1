# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.18 ✅: OTP send endpoint kuruldu — `POST /auth/otp/send` (telefon doğrula → atomik `SET NX EX 60` rate limit → `crypto.randomInt` 6 hane OTP → Redis `otp:send:` TTL 300 → MockSmsProvider → `otp_sent` audit). Redis backend'e tanıtıldı (`redis/client.ts` createRedisClient+getRedis, prisma deseni; `app.redis` decorate; `/healthz` Redis PING + `redis` alanı). Test izolasyonu gerçek Redis 7 + per-suite keyPrefix (Testcontainers değil — Postgres kararının devamı). 400 invalid_phone / 429 + Retry-After / 200; bilgi sızdırmaz (telefon varlığı verify'de). backend 70 PASS (63+7), shared 41 + mobile 30 regresyon, typecheck/lint/format temiz. Sıradaki lineer TASK-1.19 OTP verify (brute force kilidi).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 19/34 task tamam (TASK-1.28 sıra dışı); lineer sıradaki TASK-1.19 OTP verify (brute force kilidi)
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

**Task:** Yok — TASK-1.18 ✅ tamamlandı (commit edildi). Lineer sıradaki TASK-1.19 (OTP verify — brute force kilidi) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.19` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 19 tamamlandı (TASK-1.28 sıra dışı). Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

| # | Task | Durum |
|---|------|-------|
| 1.01 | Monorepo iskeleti | ✅ Tamamlandı |
| 1.02 | Backend Fastify iskeleti + zod env + healthz | ✅ Tamamlandı |
| 1.03 | Prisma 7 + adapter-pg + ilk migration + generate smoke | ✅ Tamamlandı |
| 1.04 | Backend test altyapısı (Vitest + per-suite Postgres) | ✅ Tamamlandı |
| 1.05 | Mobile Expo SDK 56 + Expo Router iskelet | ✅ Tamamlandı |
| 1.06 | TR locale util + lint kuralı (toLowerCase yasağı) | ✅ Tamamlandı |
| 1.07 | i18n shell (i18next mobile + backend, TR-only) | ✅ Tamamlandı |
| 1.08 | Mobile test altyapısı (Jest + RTL + MSW) | ✅ Tamamlandı |
| 1.09 | CI PR pipeline (GitHub Actions: test + lint + typecheck) | ✅ Tamamlandı |
| 1.10 | Staging deploy (shared VPS — docker-compose + bunker-nginx + GH Actions) | ✅ Tamamlandı |
| 1.11 | Backend Sentry + PII scrubber + KVKK test | ✅ Tamamlandı |
| 1.12 | Mobile Sentry crash reporting + PII scrubber | ✅ Tamamlandı |
| 1.13 | 3 rol veri modeli (User + role enum + ilişki tabloları) | ✅ Tamamlandı |
| 1.14 | KVKK consent schema + audit log | ✅ Tamamlandı |
| 1.15 | Soft delete + 30 gün retention job | ✅ Tamamlandı |
| 1.16 | Backblaze B2 yedek + restore drill prosedürü | ✅ Tamamlandı |
| 1.17 | Mock SMS provider interface + dev_otp_log | ✅ Tamamlandı |
| 1.18 | OTP send endpoint (rate limit + Redis) | ✅ Tamamlandı |
| 1.19–1.25 | M1 Auth backend (OTP verify, JWT, refresh, davet, deep link) | ⬜ Bekliyor (7) |
| 1.26–1.27 | M1 Mobile UI (açılış ekranı, telefon girişi) | ⬜ Bekliyor (2) |
| 1.28 | KVKK rıza ekranı (2 tickbox + placeholder metin) | ✅ Tamamlandı (sıra dışı) |
| 1.29–1.34 | M1 Mobile UI + akış + smoke (OTP ekranı, profil, PT üyeler tab, banner, auto-login, e2e smoke) | ⬜ Bekliyor (6) |

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

### TASK-1.18 — OTP send endpoint (rate limit + Redis) (2026-05-30) ✅

- **Redis backend'e tanıtıldı (`backend/src/redis/client.ts` YENİ)** — `createRedisClient(url, opts?)` + `getRedis(url)` singleton + `pingRedis` (`db/prisma.ts` deseni). `server.ts` `app.redis` decorate + `redis.on('error')` pino log (EventEmitter throw koruması); `/healthz` db **ve** redis PING → biri down 503 + payload `redis: 'up'|'down'`. `ioredis` eklendi.
- **OTP send (`auth/otp.ts` + `routes/auth-otp-send.ts` YENİ)** — `POST /auth/otp/send`: `parseTrPhone` doğrula → `SET NX EX 60` atomik rate slot → `crypto.randomInt(100_000,1_000_000)` 6 hane → Redis `otp:send:` `{code,attempts}` TTL 300 → MockSmsProvider `sendOtp` → `otp_sent` audit (telefon subject hash + `metadata.ip`). 400 invalid_phone (sızdırmaz) / 429 + `Retry-After:60` (i18n `auth.otpRateLimited`) / 200 `{success,expiresInSec}`. Brute force kilidi TASK-1.19'da.
- **Test izolasyonu: gerçek Redis 7 + per-suite keyPrefix** (`test/redis.ts` YENİ, Testcontainers değil — Postgres izolasyon kararının devamı, DECISIONS "TASK-1.18" Karar 5). `buildTestServer` redis enjekte + `closeRedis`; healthz/internal-dev-otp testleri uyarlandı. Gerçek Redis TTL fake-timer ile ilerletilemediğinden "1dk sonra" senaryosu rate kilidi `del()` ile simüle.
- Test ✅ — backend **70 PASS** (63 + 6 auth-otp-send [200 tutarlılık/400 yabancı/400 boş/429+Retry-After/60sn-sonrası/concurrent-100→tek] + 1 healthz redis-down). PII redaction MockSmsProvider'a delege → `mock-sms-provider.test.ts` kapsamı miras. typecheck/lint/format temiz; shared 41 + mobile 30 regresyon yeşil.

### TASK-1.28 — KVKK rıza ekranı (2 tickbox + placeholder metin) (2026-05-30) ✅ — SIRA DIŞI

- **`mobile/app/auth/kvkk.tsx` (YENİ)** — KVKK rıza ekranı: header + scroll edilebilir aydınlatma metin alanı (placeholder) + iki ayrı tickbox (inline `Checkbox`: `Pressable` + custom kutu/✓, dış paket yok) — (1) KVKK aydınlatma ZORUNLU, (2) sağlık verisi OPSİYONEL — + opsiyonel-rıza info + "Devam" CTA (sadece zorunlu tickbox işaretliyken aktif). A11y: checkbox/button/text/header rolleri + `accessibilityState`.
- **`mobile/src/i18n/locales/tr/kvkk.json` (GÜNCELLE)** — TASK-1.07 placeholder dolduruldu; proje **camelCase** konvansiyonu (`title`/`subtitle`/`aydinlatmaMetni`/`checkboxes.{kvkk,saglik}`/`infoOptional`/`cta`/`textVersion`). Metin "[Hukuki review bekliyor]" işaretli — Yakın 5 öncesi hukuki onayla dolacak, mimari sabit.
- **Consent taşıma — store yerine navigation params:** State-store altyapısı yok; onaysız paket eklememek için consent `router.push('/auth/profile', { params: {kvkkConsent, healthConsent, kvkkTextVersion} })` ile profil adımına (TASK-1.20) taşınır. Backend gönderim bu task'ta yok.
- **`mobile/app/auth/kvkk.test.tsx` (YENİ)** — 7 test (disabled/enabled CTA, opsiyonel tickbox, false/true healthConsent navigate, checkbox toggle, snapshot); `expo-router` mock. Test ✅ — mobile **30 PASS** (23+7), typecheck temiz, kendi dosyaları eslint+prettier temiz.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.18 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.19` (OTP verify — brute force kilidi)
