# TECH-STACK — Teknik Mimari Kararları

**Amaç:** Mobile / Backend / DB / SMS / Push / Hosting tüm teknik seçimleri tek yerde tutmak. Kararlar burada damgalanır, gerekçesi yazılır. Gelecekte "neden X seçildi?" sorusu burada cevaplanır.
**Statü:** ✅ Yakın 1 (Çekirdek altyapı + Auth) için research-phase'de dolduruldu (2026-05-29).

---

## Karar Verilenler

### 2026-05-29 — Mobile Stack: Expo (React Native)

**Seçenekler:** Expo RN, Flutter, Native (Swift+Kotlin).
**Karar:** **Expo (React Native, managed workflow) + EAS Build + Expo Router**.
**Gerekçe:** Solo founder + 90 gün pilot + teknik bilgi sınırlı = zero-config + en hızlı geliştirme şart. Tek TypeScript dilinde mobile+backend (paylaşılan tipler). EAS Build solo dev'in ops yükünü %60-70 azaltıyor (free tier 15+15 build/ay pilot için yeterli). `expo-notifications` APNs+FCM'i tek arayüzde birleştiriyor → M4'te push entegrasyonu küçük task'e iner. Expo Router file-based + EAS Hosting `.well-known/` otomasyonu Universal Link (iOS) + App Link (Android) kurulumunu minimuma indiriyor (Firebase Dynamic Links Ağustos 2025'te kapatıldıktan sonra bu kritik).
**Tradeoff'lar:** Flutter (UI consistency güçlü ama Dart öğrenmek + push/deep link manuel + Hive/Isar topluluğa bırakıldı), Native (en esnek ama 2 codebase = solo dev için 90 günde gerçekçi değil).
**Etkilenen modüller:** M0 (repo iskeleti), M1 (deep link + auth), M4 (push), M5 (dashboard UI).
**Risk:** RN 0.82 ile eski mimari kaldırıldı (New Architecture default). Third-party kütüphane seçerken "**New Arch + Expo SDK 56+ uyumlu**" filtresi zorunlu — paket seçim disiplinine yazıldı.
**Versiyon:** Expo SDK 56, React Native 0.81 (köprü), Expo Router (file-based).
**DECISIONS.md karşılığı:** [2026-05-29 — Mobile Stack Kararı](docs/DECISIONS.md).

---

### 2026-05-29 — Backend Stack: Node.js + Fastify 5 + TypeScript

**Seçenekler:** Express 5, Fastify 5, NestJS 11, Hono.
**Karar:** **Fastify 5 + TypeScript** (vanilla, NestJS değil).
**Gerekçe:** "Az sihir + bol batarya" dengesi — solo dev + zayıf teknik için ideal. Express'ten 2-3× hızlı; built-in JSON schema validation; `@fastify/jwt` plugin'i refresh-token altyapısını hazır veriyor. TypeScript ergonomisi Express'ten çok daha iyi (TypeBox/Zod ile schema-tip ikilisi). NestJS'in decorator+DI sihrinin dik öğrenme eğrisi 90 günde risk; Hono'nun KVKK audit/queue/cron ekosistemi henüz olgunlaşmadı.
**Tradeoff'lar:** NestJS (yapısal disiplin güçlü ama solo dev için magic riski yüksek), Express (en geniş ekosistem ama TS ergonomisi zayıf — her şey elle), Hono (modern ama production-grade ekosistem genç).
**Etkilenen modüller:** M0 (backend iskeleti), M1 (auth endpoint'leri), M3 (motor hesap), M4 (bildirim tetik), tüm backend.
**Risk:** Fastify'ın refresh-token rotation resmi recipe'i yok (topluluk patternleri olgun). Pattern bilinçli yazılıp test edilmeli.
**Versiyon:** Fastify 5.x, Node.js 22 LTS, TypeScript 5.x.
**DECISIONS.md karşılığı:** [2026-05-29 — Backend Stack Kararı](docs/DECISIONS.md).

---

### 2026-05-29 — Veritabanı + ORM: PostgreSQL 16 + Prisma 7

**Seçenekler:** Prisma 7, Prisma 6.x LTS, Drizzle, Knex, TypeORM.
**Karar:** **PostgreSQL 16 + Prisma 7**.
**Gerekçe:** Tek `schema.prisma` dosyası → 3 rol veri modelini deklaratif tutar; graph-tabanlı migration KVKK + [[ilkeler]] §"Kümülatif test altyapısı" prensibi için en güvenli yol (drift detection built-in). En geniş docs solo dev için kritik. jsonb desteği v1.5 AI-ready veri yapısı için yeterli. Drizzle'ın "SQL'e yakın" avantajı bu bağlamda dezavantaja dönüşüyor (her migration manuel SQL review = zaman kaybı). TypeORM maintenance modda — yeni proje için önerilmez. Postgres charset UTF-8 (TR karakter) sorunsuz.
**Tradeoff'lar:** Prisma 6.x LTS (güvenli ama Prisma 7'nin Rust-free %85 küçük bundle + 3.4× hız avantajından mahrum), Drizzle (hızlı + tip güvenliği iyi ama prod migration tuzakları), Knex (boilerplate fazla, 90 gün için maliyetli).
**Etkilenen modüller:** M0 (DB iskeleti, migration altyapısı), tüm modüller (DB erişimi).
**Risk:** Prisma 7 ESM + Rust-free geçişi Kasım 2025'te çıktı → henüz olgunlaşma süreci. Üç somut tuzak:
  1. **tsconfig çakışması** — monorepo'da Expo/RN ile backend ayrı tsconfig şart (backend ESM, mobile bundler).
  2. **Driver adapter explicit kurulum** — `@prisma/adapter-pg` atlanırsa runtime'da kırılır.
  3. **`prisma generate` artık otomatik değil** — `migrate dev`/`db push` artık client generate çalıştırmıyor; CI pipeline + dev script'lerine explicit adım eklenmeli.

  Mitigation: Yakın 1 ilk task'ında "Prisma 7 setup smoke check" — generate adımı eksikse CI fail.
**Versiyon:** PostgreSQL 16, Prisma 7.x, `@prisma/adapter-pg`.
**DECISIONS.md karşılığı:** [2026-05-29 — DB+ORM Kararı](docs/DECISIONS.md).

---

### 2026-05-29 — Hosting + Staging: Hetzner Cloud (Falkenstein/AB) + Coolify

**Seçenekler:** Hetzner+Coolify, Render Frankfurt, DigitalOcean Frankfurt, Fly.io FRA, Railway, AWS Lightsail.
**Karar:** **Hetzner Cloud (Falkenstein veya Nuremberg, AB) + Coolify**.
**Gerekçe:** KVKK m.9 reformu (7499 sayılı Kanun, 01.06.2024) sonrası **hiçbir ülke için yeterlilik kararı yok** → AB (Almanya) en savunulabilir konum (GDPR-KVKK uyumu argümanı güçlü). ABD bölgesi (Fly.io US, Railway US) açıkça riskli, "arızi hal" sayılır. Hetzner CPX22 €7.99/ay pilot ölçeğinin 10 katına sığar. Coolify Heroku-benzeri DX'i veriyor (GitHub push-to-deploy + Postgres+Redis one-click + S3 yedek + staging ve prod tek sunucuda izole proje).
**Tradeoff'lar:** Render Frankfurt (~$37/ay, tam managed PITR — Coolify'da Linux/Docker tuzağına takılırsan kaçış yolu), Railway (UX en sade ama 2024-2026 ciddi sicil: DDoS + GCP suspend + exploit), Fly.io FRA (Managed PG $38/ay'dan başlıyor + FRA WireGuard olayı), AWS (overkill).
**Etkilenen modüller:** M0 (deploy pipeline), tüm backend (runtime).
**Risk:** **Tek-node SPOF** — Hetzner sunucusu çökerse Coolify yeniden kurulum + DB restore = 30-60 dk downtime. **Mitigation:**
  1. Günlük Backblaze B2 otomatik yedek (Coolify built-in).
  2. Ayda 1 manuel restore drill (faz retrosuna ekle).
  3. DB+Coolify config ayrı dokümante.
  4. v1.5'te ikinci Hetzner node'a HA Postgres (Patroni) değerlendirilir.

  **İkincil risk:** KVKK Standart Sözleşme — Frankfurt veri-işleyen olarak Hetzner ile SCC imzalanması Yakın 4 hukuki adımıdır (kod tarafında değil; KVKK.md'ye not düştü).
**Staging stratejisi:** Tek CPX22 sunucusunda Coolify ile iki ayrı project (`staging-alpfit` ve `prod-alpfit`); her project kendi Postgres+Redis+env'i. GitHub Actions: `main` push → staging; tagged release + manuel approval → prod. v1.5'te trafik artarsa staging ayrı CX23'e çıkar.
**Versiyon:** Hetzner CPX22 (Falkenstein/Nuremberg, EU-region), Coolify latest stable.
**DECISIONS.md karşılığı:** [2026-05-29 — Hosting Kararı](docs/DECISIONS.md).

---

### 2026-05-29 — Observability: Sentry Developer (Free → Team)

**Seçenekler:** Sentry, GlitchTip, Better Stack, DataDog.
**Karar:** **Sentry Developer (free tier, EU Frankfurt region) — 6. ay civarı Team plan ($26/ay)**, hem backend Node hem RN/Expo için tek araç.
**Gerekçe:** EU Frankfurt residency free plan'a dahil → KVKK için doğrudan ikna edici argüman. PII scrubbing 3 katmanlı (`beforeSend` + server-side scrubber + opsiyonel Relay) — sağlık verisi senaryosu için endüstrinin en güçlü desteği. RN/Expo + EAS source map entegrasyonu "kur ve unut" seviyesinde. 5K event/ay v1 pilot için yeterli (~50 üye, beklenen error <500/ay). v1.5'te Team plan'a geçiş tek tıkla.
**Tradeoff'lar:** GlitchTip self-host (ücretsiz ama Postgres+Redis+Celery ops yükü solo dev için fazla), DataDog (premium APM ama $26/ay sınırını ilk aydan aşar), Sadece stdout (production'da kullanıcı görmeden crash riski).
**Etkilenen modüller:** M0 (observability altyapısı), tüm modüller (instrument).
**Risk:** Sentry varsayılan olarak `req.body`'nin tamamını gönderir → **PII scrubber yazılmadan sağlık verisi sızar** (KVKK ihlali). **Mitigation:** İlk task'lerden biri "Sentry kurulumu + PII scrubber + zorunlu unit test" — scrubber regex'ini test'le doğrula (kilo/boy/yemek alanları içeren mock event → Sentry'ye giden payload'da bu alanlar bulunamaz assertion'u). İkincil risk: 5K event sınırı aşılırsa silently drop → production'da `quota_exceeded` webhook'unu Slack/email'e bağla.
**KVKK-uyumlu loglama deseni:**
  - **Loglanabilir:** request_id (UUID), event_type (`workout.completed`, `streak.broken`), `user_id_hash` (HMAC-SHA256, salt env'de), role, HTTP method+path (parametreler scrub'lı), status, duration_ms, error class + stack.
  - **ASLA loglanmaz:** kilo, boy, ölçüm, yemek günlüğü içeriği, kalori/makro, sağlık notu, profil foto URL'i, telefon, email, ad-soyad.
  - **Yapı:** `pino` + `fast-redact` (sağlık alanlarını stdout'a yazılmadan keser) + Sentry SDK `beforeSend` hook + Sentry server-side scrubber (defense-in-depth).
  - **Destinasyon:** v1'de stdout → Coolify built-in log aggregator (EU). Ayrı log SaaS gereksiz.
**Versiyon:** Sentry SDK (Node+React Native), pino + fast-redact.
**DECISIONS.md karşılığı:** [2026-05-29 — Observability Kararı](docs/DECISIONS.md).

---

### 2026-05-29 — Test Framework Kombosu

**Karar:**
- **Backend:** Vitest + Testcontainers (gerçek Postgres ile integration test) + Supertest (HTTP assertion).
- **Mobile:** Jest + React Native Testing Library (RTL) — Expo template'inin standart kombosu.
- **E2E (mobile uçtan uca):** Maestro — Yakın 5 (UAT + Pilot launch) öncesi kurulur.
**Gerekçe:** Vitest TS-native ve hızlı; backend'de Fastify ile sorunsuz. Testcontainers KVKK uyumu için kritik — gerçek üye verisi yerine ephemeral test DB üzerinde migration test ([[ilkeler]] §"Kümülatif test altyapısı"). Mobile'de Vitest desteği henüz olgunlaşmadı; RN/Expo standardı Jest+RTL bilinçli seçim. E2E (Detox vs Maestro) bu fazda kurulmaz — basit cihaz-bağımsız bir tool (Maestro) ile Yakın 5'te eklenir.
**Test DB stratejisi:** Her test suite ephemeral Postgres container (`@testcontainers/postgresql`) + `prisma migrate deploy` + tear down. Test paralel çalışabilir (her suite kendi DB).
**Etkilenen modüller:** M0 (test altyapısı kurulumu), tüm modüller (test sorumluluğu).

---

### 2026-05-29 — Mock SMS Mimari Deseni

**Karar:** **Provider interface + 2 driver (mock/live)**.
- `SmsProvider` interface: `sendOtp(phone: string, code: string): Promise<SendResult>`.
- `MockSmsProvider`: OTP'yi `dev_otp_log` tablosuna yazar + stdout'a basar (dev/CI).
- `LiveSmsProvider`: Yakın 5'te eklenir (Twilio veya Netgsm — research-phase Yakın 5 öncesi).
- Seçim env değişkeniyle: `SMS_PROVIDER=mock|netgsm|twilio`.
**Gerekçe:** Interface bilinçli soyutlama → Yakın 5'te live provider eklemek interface'i implement etmek = küçük task. Test'te mock kontrol kolay (provider state inspection). dev'de `dev_otp_log` tablosundan kod okumak da kolay; CI'da log assertion.
**Etkilenen modüller:** M0 (provider interface tanımı), M1 (auth endpoint'leri).

---

### 2026-05-29 — Monorepo Paket Yöneticisi: pnpm Workspaces

**Karar:** **pnpm workspaces**.
**Gerekçe:** Disk verimli (npm'in 1/3'ü), hızlı, monorepo desteği yerleşik. Solo dev için en sade tooling. Expo/RN ile uyumlu (klasik node_modules; PnP modu kullanılmaz).
**Yapı:**
```
Alpfit.v1/
├── package.json (workspaces root)
├── pnpm-workspace.yaml
├── mobile/         (Expo app)
├── backend/        (Fastify + Prisma)
└── shared/         (Zod schemas, types, util)
```
**Etkilenen modüller:** M0 (repo iskeleti).
**Devcontainer:** `pnpm` post-create script'e eklenir (mevcut Postgres+Redis baseline korunur).

---

### 2026-05-29 — Diğer Karara Bağlanmış Detaylar

**JWT:** `@fastify/jwt` plugin + `fast-jwt` (Fastify'ın standart kombo).
  - **Access token:** stateless JWT, 15 dakika TTL.
  - **Refresh token:** opaque random (256-bit), `refresh_tokens` tablosunda (DB-stored), 30 gün TTL, **kullanımda rotate** (eski iptal, yeni üretilir), şüpheli aktivitede revoke.
  - **Device remember (30 gün):** Cihaz başına ayrı refresh token (mobile secure storage'da: iOS Keychain / Android Keystore).
  - **"Tüm cihazlardan çıkış":** Üyeye ait tüm refresh_tokens revoke.

**DB Migration:** `prisma migrate`.
  - **Dev:** `prisma migrate dev` (creates + applies + generates).
  - **Staging/Prod:** `prisma migrate deploy` (sadece pending uygula, generate ayrı adım).

**Deep linking:** Expo Router built-in + `expo-linking`.
  - **iOS Universal Link** + **Android App Link** — EAS Hosting `.well-known/apple-app-site-association` + `.well-known/assetlinks.json` otomatik servis.
  - **Staging:** `staging.alpfit.app` (env-bazlı BASE_URL).
  - **Prod:** `alpfit.app` (Yakın 5 öncesi domain alınır).
  - **Davet linki:** `alpfit.app/davet/{kod}` → app'te `OnboardingDavet` route.

**i18n:** `i18next` + `react-i18next` (mobile) + `i18next` standalone (backend SMS/notification stringleri).
  - **v1 dil:** TR (tek). Shell v2 için hazır (locale resource separation).
  - **TR locale tuzağı:** JS `toLowerCase()` Türk "İ" → "i" yapmaz; `toLocaleLowerCase("tr")` kullanılır. Util fonksiyon `shared/locale.ts`'de tanımlanır, lint kuralı ham `.toLowerCase()`/`.toUpperCase()` çağrılarını yasaklar.
  - **Tarih:** `dd MMM yyyy` ("29 Mayıs 2026") — Intl.DateTimeFormat veya `date-fns` + `tr` locale.
  - **Telefon:** `+90 5XX XXX XX XX` — `libphonenumber-js` parse/format.

**CI/CD:** GitHub Actions.
  - **PR pipeline:** install (pnpm) → lint (eslint) → typecheck (tsc) → unit test (vitest+jest) → integration test (vitest + testcontainers Postgres).
  - **Deploy pipeline:**
    - `main` push → Coolify webhook → staging deploy + `prisma migrate deploy` + smoke test.
    - Tagged release (`v*`) → manuel approval gate → Coolify webhook → prod deploy + `prisma migrate deploy` + smoke test.
  - **Mobile build:** EAS Build ayrı workflow (PR'da preview build, main'de internal distribution).
  - **Migration rollback stratejisi:** Migration deploy başarısızsa pipeline fail + Slack/email alert. Geri alma: önce snapshot restore (Backblaze yedeği), sonra önceki migration'a `prisma migrate resolve --rolled-back` ile işaretle. Rollback drill faz retrosunda kontrol edilir.

**Validation:** `zod` (shared schemas backend+mobile'da kullanılır).
  - Fastify entegrasyonu: `fastify-type-provider-zod` veya manuel adapter.

**Code style:** ESLint + Prettier — devcontainer'da zaten kurulu.

**Sessiz saat (M4 için baseline):** Backend'de saat kontrolü → 22:00-08:00 (`Europe/Istanbul`) arası push gönderim ertelenir. M4 fazında implement.

---

## Kapsam Dışı (Yakın 1'de Yapılmayacak — sonraki fazlarda)

### Gerçek SMS Provider (Yakın 5 öncesi)
- **Seçenekler:** Twilio (uluslararası, dolar), Netgsm/İletişim Merkezi (TR yerel, TL, BTK uyumu), Verimor (TR), AWS SNS.
- **Kriterler:** TR deliverability (Turkcell/Türk Telekom/Vodafone), maliyet, BTK uyumu, API olgunluğu, 5 hatalı OTP koruması.
- **Karar zamanı:** Yakın 5 (Pilot launch) öncesi research-phase.
- **Bu faza hazır:** Provider interface, mock driver. Live driver eklemek interface implement etmek = küçük task.

### Push Provider (M4 fazı)
- **Seçenekler:** FCM tek nokta (iOS+Android tek SDK, baz varsayım), APNs+FCM ayrı.
- **Kriter:** Sessiz saat penceresi zamanlama kontrolü, deep link payload formatı.
- **Karar zamanı:** M4 fazı (Sürdürülebilirlik motoru + Bildirim).
- **Bu faza hazır:** Expo `expo-notifications` interface'i baseline; mobile permission ekranı M4'te kurulur.

### Video Hosting (Yakın 5 öncesi)
- **Seçenekler:** YouTube embed (baz varsayım — maliyet sıfır), Vimeo, kendi CDN.
- **Karar zamanı:** Yakın 5 (UAT + Pilot launch) — egzersiz video lisans + çekim kararı sırasında.
- **Bu faza hazır:** Hiçbir şey (M2'de program builder bunu kullanır; v1'de "Video çevrimiçi gerektirir" PRD F2.2 §S7).

### App Store Hesapları (Yakın 5 öncesi)
- **Apple Developer:** $99/yıl.
- **Google Play Developer:** $25 tek seferlik.
- **Karar zamanı:** Yakın 5 yaklaşırken açılır.
- **Bu fazda:** Simulator/emulator + dev cihazlarla geliştirme yapılır; EAS preview build yeterli.

### KVKK Standart Sözleşme (Yakın 4 öncesi)
- **Hetzner ile veri-işleyen SCC imzalanması** (KVKK m.9 uygun güvence).
- **Karar zamanı:** Yakın 4 (sağlık verisi modülleri öncesi) — hukuki danışmanla.
- **Kayıt:** KVKK.md'de.

---

**Son Güncelleme:** 2026-05-29 — research-phase 1: Yakın 1 için tüm teknik kararlar verildi (mobile, backend, ORM, DB, hosting, observability, test, mock SMS, pkg mgr, JWT, deep link, i18n, CI/CD). 4 ertelenen alan (gerçek SMS, push, video, app store) "Kapsam Dışı" bölümünde işaretlendi.
