# Phase 1: Çekirdek altyapı + Auth (M0 + M1)

**Durum:** 🔄 Devam ediyor

---

## Genel Bilgiler

**Amaç:** Alpfit'in temel altyapısını (M0 — repo iskeleti, env/secret, 3 rol veri modeli, KVKK çerçevesi, test, CI/CD, observability, TR locale) ve üyenin/PT'nin sisteme ilk giriş akışını (M1 — davet linki + telefon + SMS OTP + KVKK rızası + 30 gün cihaz hatırlama) uçtan uca ayağa kaldırmak. Faz sonunda hem altyapı çekirdeği hem F1.1 davranışı çalışır halde — sonraki fazlar bu zeminin üstüne kurulur.

**Milestone:**
- PT ve üye telefon + mock SMS OTP ile hesap açabilir
- PT davet linki üretebilir (alpfit.app/davet/{kod}); üye linkten gelip otomatik PT'ye bağlanır
- KVKK aydınlatma + sağlık verisi açık rıza ekranı (placeholder metin) çalışır
- Davet kabul edildiğinde PT'ye in-app banner + liste güncellemesi
- 30 gün cihaz hatırlama mekanizması ayakta
- Backend unit + integration test altyapısı kurulu, CI'da yeşil çalışıyor
- Mobile component test altyapısı kurulu
- Lint + format + type check toolchain PR'da çalışıyor
- main branch → staging environment'a otomatik deploy ediyor
- Backend error tracking + mobile crash reporting kurulu
- 3 rol veri modeli (Member + Trainer + Gym Owner) DB'de yerleşmiş; Gym Owner v1'de UI'da görünmez ama model destekler
- TR locale temeli (i18n shell, telefon/tarih formatları, TR karakter desteği) kurulu

### Feature Listesi

| Feature | Modül | Açıklama |
|---------|-------|----------|
| M0 cross-cutting | M0 | Repo iskeleti + env/secret + 3 rol veri modeli + KVKK çerçevesi + test altyapısı + CI/CD + observability + TR locale |
| F1.1: Onboarding (Davet + Auth) | M1 | PT davet linki + üye SMS OTP (mock) + KVKK rızası + 30 gün cihaz hatırlama + PT-üye ilişki yönetimi |

---

## Kapsam Tartışması

> Bu bölüm `/devflow:discuss-phase 1` oturumunda (2026-05-29) dolduruldu.

### Alınan Kararlar

**Faz Kapsamı (Grup A):**
- **Faz boyutu:** M0 tam + M1 tam — birleşik faz. Gerekçe: §En Yüksek Öncelikli Eksen #2 "PT günlük iş akışı sürtünmesizliği" milestone'unun test edilebilir olması için üyenin gerçekten hesap açabilmesi şart. M0 tek başına soyut milestone üretir; M1'i ayrı bölmek §Kalıcılık (test/CI baştan kümülatif) ihlali olur.
- **SMS OTP:** Sandbox/mock — geliştirme sürecinde mock SMS provider, kod sabit veya log'a yazılır. Gerçek SMS provider entegrasyonu Yakın 5 (UAT + Pilot) öncesi. Gerekçe: TECH-STACK research-phase'de provider seçilir; bu faz onu beklemez. Brute force ve edge case testleri rahat.
- **Davet kabul push:** Bu fazda push altyapısı yok. PT'ye davet kabulü sadece in-app banner (uygulama açıkken) + "Bekleyen davetler" liste güncellemesi. APNs/FCM push altyapısı M4 fazına ertelenir. Gerekçe: Push altyapısı (token, sessiz saat, deep link payload) M4'ün kalbi — burada parça parça kurmak M4'ü yarım bırakır + faz çok büyür.

**KVKK + Yasal (Grup B):**
- **Rıza ekranı yapısı:** Tek ekran, iki ayrı tickbox — (1) "KVKK Aydınlatma Metnini okudum" (zorunlu, hesap açmaya engel), (2) "Sağlık verisi işlenmesine açık rızam vardır" (opsiyonel — işaretlemezse hesap açılır ama Yakın 4'te ölçüm/yemek günlüğü kullanamaz; toggle ile sonradan açabilir). Gerekçe: KVKK Madde 6 özel nitelikli veriler için ayrı açık rıza zorunlu. §Kalıcılık: şimdi mimari kurulduğundan Yakın 4'te migration olmaz.
- **Metin stratejisi:** UI akışı (ekran + tickbox + scrolling metin alanı + "Devam" butonu) tam kurulur. Metin alanında placeholder ("[KVKK metni hukuki review bekliyor — Yakın 5 öncesi yerleşecek]") veya kısa örnek metin. KVKK.md Yakın 5'ten önce hukuki danışman ile doldurulur; sadece string güncellenir, mimari değişmez. Pilot'a (Yakın 5 sonu) gerçek metin yetişmesi şart.

**Test / CI/CD / Observability (Grup C):**
- **Test stratejisi:** Backend unit (saf fonksiyonlar) + integration (DB ile, gerçek migration'lar üzerinde). Mobile component test (UI elemanları izole) + smoke test (3-5 kritik akış: SMS OTP girme, davet linki açma). E2E (uygulama tam uçtan uca) Yakın 5'te. Test DB ayrı, gerçek üye verisiyle test edilmez (KVKK). CI'da her PR'da çalışır.
- **CI/CD:** Tam — her PR'da test + lint + type check otomatik (kırıksa merge bloke). main branch → staging environment'a otomatik deploy. Production branch → manuel onayla deploy. App store build pipeline iskeleti (açık script'ler), gerçek build Yakın 5'te.
- **Observability:** Backend error tracking servisi (Sentry vb. — TECH-STACK research-phase'de karar) + mobile crash reporting (Crashlytics vb.). Log seviyeleri (debug/info/warn/error), production'da debug kapalı. KVKK uyumu: log'lara üye sağlık verisi YAZILMAZ (sadece event tip + üye ID hash).

**Altyapı / Operasyonel (Grup D):**
- **Repo yapısı:** Monorepo — tek repo (Alpfit.v1) içinde `mobile/` ve `backend/` klasörleri. Gerekçe: tek geliştirici (kurucu) için atomic PR'lar, paylaşılan tip tanımları, tek CI konfigi. v2'de ekip büyürse poly-repo'ya bölünür.
- **Domain:** Geliştirmede staging subdomain (örn. staging.alpfit.app veya hosting platform default URL'si), prod domain (alpfit.app) Yakın 5 öncesi alınır/yapılandırılır. Bu fazda env-bazlı BASE_URL ile çözülür. Deep link (Universal Link + App Link) konfigürasyonu domain'e bağlı — prod domain Yakın 5'te test edilir.
- **App store hesapları:** Kapsam dışı — Yakın 5 (UAT + Pilot) öncesi açılır. Bu fazda mobile geliştirme simulator/emulator + dev cihazlarla yapılır.
- **Davet linki 30 gün iptal:** Lazy-check — davet link'e tıklandığında backend `expires_at < now()` kontrolü yapar; "Bekleyen davetler" liste sorgusunda da aynı kontrol. Cron/scheduled job gerekmez. En basit, en sağlam.

**Sahipsiz Alanlar (Grup E):**
- **First PT (kurucu kardeş) onboarding:** Standart akış — kardeş de diğer PT'ler gibi açılışta "PT" butonuna basar, telefon + mock SMS OTP + profil ile açar. Avantaj: ayrı admin/seed akışı yok; kardeşin akışı gerçek kullanıcı deneyimini doğrular.
- **Auth token mekanizması:** Yön kararı — stateless JWT + refresh token mekanizması bazında gidilir (mobile-native pattern). Detay (kütüphane, JWT türü, expiry süreleri, refresh token rotation politikası) research-phase'de TECH-STACK kararıyla beraber netleşir.
- **PT üye çıkarma — veri akıbeti:** Soft delete + 30 gün saklama. User row korunur, `pt_member_relation` tablosu `ended_at` ile işaretlenir. Üyenin geçmiş tamamlamaları/programı arşivlenir. KVKK rızası aktif kaldıkça veri 30 gün saklanır; rıza geri çekilirse veya 30 gün dolarsa otomatik silinir. Üye app'i açabilir, "PT'nle ilişkin sonlandı" uyarısı görür; yeni program almaz. v1'de başka PT'ye geçiş yok.
- **PT "Üyeler" sekmesi UI:** Tek scrollable liste, iki başlık altında — üstte "Bekleyen davetler (varsa)", altta "Aktif üyeler". Bekleyen üstte çünkü PT'nin aksiyona ihtiyacı olabilir (linki tekrar paylaş, iptal et). Aktif üye yoksa boş durum CTA: "İlk üyeni davet et →".

### Kullanıcı Tercihleri

- **Mock SMS:** Geliştirme + CI ortamında SMS gönderilmez. Test telefonlarına sabit kod (örn. `482931`) veya log'a yazılan kod kabul edilir. Provider entegrasyonu detayı plan-phase'de netleşir.
- **PT için "spor salonu" ve "sertifika notu":** Profil ekranında opsiyonel alanlar olarak görünür; boş bırakılabilir. v1'de PT doğrulama yok (PRD'de net), bu alanlar sadece bilgilendirici.
- **3 rol veri modeli — Gym Owner slot:** Veri modeli ve auth katmanı Gym Owner rolü için baştan hazır (enum + ilişki tabloları boş ama tanımlı). UI'da Gym Owner görünmez. v1.5+/v2'de sadece UI eklenir, model migration olmaz.

### Kapsam Dışı

Bu fazda **yapılmayacak** ama net olarak hatırlamak gereken konular:

- **Gerçek SMS provider entegrasyonu** — Yakın 5 (TECH-STACK research-phase'inden sonra; sandbox kalır)
- **APNs / FCM push bildirim altyapısı** — M4 fazı (sürdürülebilirlik motoru + bildirim)
- **Prod domain (alpfit.app) satın alma + yapılandırma** — Yakın 5 öncesi
- **Apple Developer + Google Play hesapları** — Yakın 5 öncesi
- **E2E (mobile uçtan uca) testler** — Yakın 5
- **KVKK metninin gerçek hali (hukuki danışman onaylı)** — Yakın 5 öncesi (placeholder ile akış kuruldu)
- **M0'da cron / scheduled job altyapısı** — bu fazda gerek yok (lazy-check); ileride bir feature ihtiyaç duyarsa eklenir
- **Auth token detay (kütüphane seçimi, JWT türü, expiry kararları)** — research-phase
- **Üye telefon değiştirme akışı** — v1.5 adayı, yok
- **Üye PT değiştirme akışı** — PRD'de zaten v1.5 adayı, yok
- **PT abonelik / ücretlendirme** — PRD'de v1.5 öncesi netleşecek; auth flow plan-bilinçsiz kurulur
- **PT doğrulama (sertifika upload, spor salonu onayı, manuel inceleme)** — v1.5 adayı, yok
- **Üye profil fotoğrafı upload backend altyapısı** — F1.1 PRD'de "opsiyonel"; bu fazda file upload backend kurulmaz, sadece UI'da alan görünür ama yüklenmesi v1.5'e ertelenir (plan-phase'de teyit edilecek)
- **TR dışı telefon numarası desteği** — v2 adayı, sadece +90 kabul
- **Üye sayfasından "tüm cihazlardan çıkış" akışı** — F1.1 PRD'de var, ama plan-phase'de task seviyesinde değerlendirilecek (kapsamda; sadece UI/UX detayı)

---

## Araştırma Bulguları

> Bu bölüm `/devflow:research-phase 1` oturumunda (2026-05-29) dolduruldu.

### Değerlendirilen Yaklaşımlar

**Mobile Stack** — Expo (React Native) / Flutter / Native (Swift+Kotlin)
- **Expo RN:** Tek TS, EAS Build zero-config, push+deep link otomasyonu, 90 gün için en hızlı.
- **Flutter:** UI consistency güçlü, performans iyi; ama push+deep link manuel, Dart öğrenmek gerek, Hive/Isar topluluğa bırakıldı.
- **Native:** En esnek; 2 codebase → solo dev için 90 günde gerçekçi değil.
- **Seçilen:** Expo (React Native) — solo dev + 90 gün + push/deep link kritikliği + tek TypeScript dilinde mobile+backend.

**Backend Framework** — Express 5 / Fastify 5 / NestJS 11 / Hono
- **Fastify 5:** "Az sihir + bol batarya", TS ergonomisi iyi, `@fastify/jwt` hazır, 2-3× Express performansı.
- **Express 5:** En geniş ekosistem ama TS ergonomisi zayıf, JWT/validation/schema elle.
- **NestJS 11:** Yapısal disiplin güçlü ama dik öğrenme eğrisi + magic riski (90 gün riskli).
- **Hono:** Modern + edge-native ama KVKK audit/queue/cron ekosistemi henüz olgunlaşmadı.
- **Seçilen:** Fastify 5 — solo + zayıf teknik + 90 gün için ideal denge.

**ORM (Postgres + TS)** — Prisma 7 / Prisma 6.x LTS / Drizzle / Knex / TypeORM
- **Prisma 7:** Tek schema dosyası, graph-tabanlı migration (en olgun), en geniş docs, jsonb desteği iyi.
- **Drizzle:** SQL'e yakın, hızlı; ama `drizzle-kit` prod tuzakları manuel SQL review zorunlu.
- **Knex:** Tam kontrol; ama tip güvenliği elle, çok boilerplate.
- **TypeORM:** Maintenance modda — önerilmez.
- **Seçilen:** Prisma 7 — KVKK + [[ilkeler]] §"Kümülatif test altyapısı" için en güvenli migration; en geniş docs solo için kritik.

**Hosting** — Hetzner+Coolify / Render Frankfurt / DigitalOcean Frankfurt / Fly.io FRA / Railway / AWS
- **Hetzner+Coolify (Falkenstein, AB):** ~€10/ay, KVKK için en temiz konum (AB), staging+prod tek sunucu; tek-node SPOF.
- **Render Frankfurt:** ~$37/ay, tam managed PITR; güvenlik ağı olarak.
- **Fly.io FRA:** Managed PG pahalı + FRA WireGuard olayı.
- **Railway:** 2024-2026 ciddi sicil (DDoS, GCP suspend, exploit) — önerilmez.
- **Seçilen:** Hetzner Cloud + Coolify (Falkenstein) — KVKK m.9 reformu sonrası AB en savunulabilir konum, fiyat ölçeğe çok uygun.

**Observability** — Sentry / GlitchTip / Better Stack / DataDog
- **Sentry Developer (free):** EU Frankfurt residency free plan'a dahil, PII scrubbing 3 katmanlı, RN+Node tek araç.
- **GlitchTip self-host:** ücretsiz ama ops yükü solo dev için fazla.
- **Better Stack:** log management odaklı, crash reporting yok.
- **DataDog:** $26/ay sınırını ilk aydan aşar.
- **Seçilen:** Sentry Developer (free → 6. ay Team $26/ay) — KVKK + RN+Node tek araç + endüstri standardı.

**Test Framework** — Vitest+Jest / Jest-her-yer / Vitest-her-yer
- **Seçilen:** Vitest+Testcontainers (backend) + Jest+RTL (mobile); E2E Maestro Yakın 5'te.

**Mock SMS Mimari** — Provider interface + 2 driver / sadece fonksiyon / 3. parti sandbox
- **Seçilen:** Provider interface + `MockSmsProvider` (dev_otp_log tablosuna yazar) + `LiveSmsProvider` (Yakın 5).

**Paket Yöneticisi** — pnpm / npm / yarn berry
- **Seçilen:** pnpm workspaces — disk verimli, monorepo desteği yerleşik.

### Kullanılacak Araçlar/Kütüphaneler

| Katman | Araç | Versiyon | Ne için |
|--------|------|----------|---------|
| Mobile | Expo + React Native | SDK 56, RN 0.81 | Cross-platform iOS+Android |
| Mobile | Expo Router | latest | File-based routing + deep link |
| Mobile | expo-notifications | latest | APNs+FCM (M4'te aktive) |
| Mobile | expo-linking | latest | Universal/App Link |
| Mobile | i18next + react-i18next | latest | i18n shell (TR-only v1) |
| Mobile | Jest + RTL | latest | Component test |
| Backend | Node.js | 22 LTS | Runtime |
| Backend | TypeScript | 5.x | Tip sistemi |
| Backend | Fastify | 5.x | HTTP framework |
| Backend | @fastify/jwt + fast-jwt | latest | JWT + refresh token |
| Backend | Prisma | 7.x | ORM + migration |
| Backend | @prisma/adapter-pg | latest | Postgres driver adapter (Prisma 7 explicit) |
| Backend | zod | latest | Schema validation (shared backend+mobile) |
| Backend | pino + fast-redact | latest | KVKK-safe logging |
| Backend | Vitest + Testcontainers | latest | Unit + integration test |
| Backend | i18next | latest | SMS/notification stringleri |
| Backend | libphonenumber-js | latest | +90 telefon format/validate |
| Backend | date-fns + tr locale | latest | TR tarih format |
| DB | PostgreSQL | 16 | Veri tabanı |
| Cache | Redis | 7 | Session, rate limit, OTP storage |
| Observability | Sentry SDK (Node + RN) | latest | Error tracking + crash reporting |
| Hosting | Hetzner Cloud CPX22 | — | Falkenstein/Nuremberg, EU |
| Hosting | Coolify | latest stable | PaaS dashboard (GitHub push-to-deploy) |
| Hosting | Backblaze B2 | — | Günlük DB yedek |
| CI/CD | GitHub Actions | — | PR + deploy pipeline |
| Mobile build | EAS Build | — | iOS+Android cloud build |
| Pkg Mgr | pnpm | latest | Monorepo workspaces |

### Dikkat Edilecekler (Risk + Tuzaklar)

1. **Prisma 7 ESM + Rust-free geçişi yeni (Kasım 2025)** — 3 somut tuzak: (a) monorepo'da Expo/RN ile backend ayrı tsconfig şart; (b) `@prisma/adapter-pg` explicit kurulum atlanırsa runtime'da kırılır; (c) `migrate dev`/`db push` artık `prisma generate` çalıştırmıyor → CI + dev script'e explicit adım eklenmeli. **Mitigation:** İlk task'lerden biri "Prisma 7 setup smoke check" — generate adımı eksikse CI fail.

2. **React Native 0.82 ile eski mimari kaldırıldı** — third-party kütüphane seçerken "New Arch + Expo SDK 56+ uyumlu" filtresi zorunlu. **Mitigation:** Paket seçim disiplinine yazıldı (kütüphane eklerken README'sini kontrol).

3. **Sentry varsayılan PII gönderir** — `req.body` tam gönderilir → KVKK ihlali. **Mitigation:** İlk task'lerden biri "Sentry kurulumu + PII scrubber + unit test ile doğrulama" — kilo/boy/yemek alanları içeren mock event → Sentry payload'da bulunamaz assertion'u.

4. **Hetzner tek-node SPOF** — sunucu çökerse 30-60 dk downtime. **Mitigation:** Günlük Backblaze B2 yedek (Coolify built-in), ayda 1 manuel restore drill (faz retrosuna ekle), DB+Coolify config ayrı dokümante, v1.5'te HA Postgres değerlendir.

5. **TR locale tuzağı** — JS `toLowerCase()` Türk "İ" → "i" yapmaz (Unicode I-with-dot). **Mitigation:** `shared/locale.ts` util fonksiyonları (`trLower`/`trUpper`) kullanılır; lint kuralı ham `.toLowerCase()`/`.toUpperCase()` çağrılarını yasaklar.

6. **KVKK m.9 reformu (2024)** — Yurt dışı veri aktarımı için yeterlilik kararı yok; AB hosting argümanını **Standart Sözleşme** (SCC) + üye açık rıza ikilisiyle savunabiliriz. **Mitigation:** Yakın 4 öncesi Hetzner ile SCC imzalanması (KVKK.md'ye not düştü; hukuki danışman görevi).

7. **Sentry 5K event/ay sınırı silently drop** — production'da aşılırsa hatalar görünmez. **Mitigation:** `quota_exceeded` webhook'unu Slack/email'e bağla.

8. **Fastify refresh-token rotation resmi recipe yok** — topluluk patternleri olgun ama bilinçli yazılıp test edilmeli. **Mitigation:** Pattern unit + integration test ile doğrulanır (rotation + revoke + replay attack senaryoları).

### Teknik Kararlar

| Karar | Gerekçe |
|-------|---------|
| Mobile = Expo (React Native) | Solo dev + 90 gün + push/deep link kritikliği + tek TS |
| Backend = Fastify 5 + TypeScript | "Az sihir + bol batarya" — solo dev için ideal |
| ORM = Prisma 7 + Postgres 16 | Graph-tabanlı migration (KVKK + kümülatif test) + en geniş docs |
| Hosting = Hetzner+Coolify (Falkenstein, AB) | KVKK m.9 reformu sonrası AB en savunulabilir konum, ~€10/ay |
| Observability = Sentry Developer (EU Frankfurt) | KVKK residency free plan'da, PII scrubbing 3 katmanlı, RN+Node tek araç |
| Test = Vitest+Testcontainers (backend) + Jest+RTL (mobile) | TS-native hız + KVKK-uyumlu test DB |
| Mock SMS = Provider interface + 2 driver | Yakın 5'te live driver eklemek küçük task |
| Pkg Mgr = pnpm workspaces | Disk verimli + monorepo yerleşik |
| JWT = @fastify/jwt + fast-jwt | Access 15dk + refresh 30 gün opaque DB-stored + rotate-on-use |
| Migration = prisma migrate | ORM'in standart aracı; dev/staging/prod pipeline ayrı |
| Deep link = Expo Router + EAS Hosting `.well-known/` | Universal/App Link otomatik servis |
| i18n = i18next + react-i18next | JS ekosisteminin standardı; TR-only v1, shell v2 hazır |
| Sessiz saat = backend timezone-aware (Europe/Istanbul) | M4'te implement; 22:00-08:00 push ertelenir |
| Code style | ESLint + Prettier (devcontainer'da kurulu) |
| Devcontainer | Postgres 16 + Redis 7 baseline korunur; pnpm + Node 22 eklenir |

### Plan-Phase'e Aktarılan Notlar

Plan-phase'de task yazılırken bu kararların somut karşılıkları aşağıdaki sıralamayla iş paketine bölünür (öneri; plan-phase'de teyit edilir):

1. Monorepo iskeleti (pnpm workspaces + tsconfig + ESLint/Prettier hizalama)
2. Backend iskeleti (Fastify + Prisma 7 setup + ilk migration + smoke check)
3. Backend test altyapısı (Vitest + Testcontainers Postgres + first integration test)
4. Mobile iskeleti (Expo SDK 56 + Expo Router + i18n shell + TR locale util)
5. Mobile test altyapısı (Jest + RTL + first component test)
6. CI/CD pipeline (GitHub Actions PR + main → staging Coolify webhook)
7. Hetzner+Coolify hosting kurulumu (staging environment first)
8. Sentry kurulumu + PII scrubber + zorunlu test
9. 3 rol veri modeli + migration (Member + Trainer + Gym Owner)
10. KVKK çerçevesi (rıza tabloları + audit log + soft delete + 30 gün retention job)
11. Auth interface (Mock SMS provider + send/verify OTP + JWT issue/refresh)
12. PT davet linki üretim + 30 gün lazy-check
13. Deep link kurulumu (Universal/App Link + .well-known/ EAS Hosting)
14. M1 onboarding ekranları (rol seçimi, telefon, OTP, KVKK rıza, profil)
15. PT in-app davet kabul banner + liste güncellemesi
16. "Tüm cihazlardan çıkış" akışı (refresh_tokens revoke)
17. Soft delete + 30 gün retention job (üye çıkarma + KVKK rıza geri çekme)
18. Backblaze yedek + restore drill prosedürü

Plan-phase'de bu liste task'lere bölünür; task sayısı ve kesim plan-phase'de netleşir.

---

## Task Listesi

> Bu bölüm `/devflow:plan-phase 1` oturumunda (2026-05-29) dolduruldu — 34 task. Bağımlılık sırasıyla M0 altyapı → M1 Auth backend → M1 Mobile UI + akış → uçtan uca smoke.

| # | Task | Durum | Açıklama |
|---|------|-------|----------|
| 1.01 | TASK-1.01 | ✅ Tamamlandı | Monorepo iskeleti (pnpm workspaces + tsconfig + ESLint/Prettier + shared/) |
| 1.02 | TASK-1.02 | ✅ Tamamlandı | Backend Fastify iskeleti + zod env + healthcheck |
| 1.03 | TASK-1.03 | ✅ Tamamlandı | Prisma 7 + adapter-pg + ilk migration + generate smoke |
| 1.04 | TASK-1.04 | ✅ Tamamlandı | Backend test altyapısı (Vitest + per-suite Postgres) |
| 1.05 | TASK-1.05 | ✅ Tamamlandı | Mobile Expo SDK 56 + Expo Router iskelet |
| 1.06 | TASK-1.06 | ✅ Tamamlandı | TR locale util + lint kuralı (toLowerCase yasağı) |
| 1.07 | TASK-1.07 | ✅ Tamamlandı | i18n shell (i18next mobile + backend, TR-only) |
| 1.08 | TASK-1.08 | ✅ Tamamlandı | Mobile test altyapısı (Jest + RTL) |
| 1.09 | TASK-1.09 | ✅ Tamamlandı | CI PR pipeline (GitHub Actions: test + lint + typecheck) |
| 1.10 | TASK-1.10 | ✅ Tamamlandı | Staging deploy (shared Hetzner VPS — docker-compose + bunker-nginx subdomain proxy + GH Actions SSH auto-deploy) — mimari sapma: Coolify yerine docker-compose |
| 1.11 | TASK-1.11 | ✅ Tamamlandı | Backend Sentry + PII scrubber + KVKK test |
| 1.12 | TASK-1.12 | ✅ Tamamlandı | Mobile Sentry crash reporting + PII scrubber |
| 1.13 | TASK-1.13 | ✅ Tamamlandı | 3 rol veri modeli (User + role enum + ilişki tabloları) |
| 1.14 | TASK-1.14 | ✅ Tamamlandı | KVKK consent schema + audit log |
| 1.15 | TASK-1.15 | ✅ Tamamlandı | Soft delete + 30 gün retention job |
| 1.16 | TASK-1.16 | ✅ Tamamlandı | Backblaze B2 yedek + restore drill prosedürü (dokümantasyon teslim; B2 hesap + cron deploy + ilk drill kullanıcı follow-up) |
| 1.17 | TASK-1.17 | ✅ Tamamlandı | Mock SMS provider interface + dev_otp_log (SmsProvider + MockSmsProvider + factory + dev OTP lookup endpoint) |
| 1.18 | TASK-1.18 | ✅ Tamamlandı | OTP send endpoint (rate limit + Redis) — POST /auth/otp/send + Redis storage/TTL + atomik SET NX rate limit + healthz Redis PING |
| 1.19 | TASK-1.19 | ✅ Tamamlandı | OTP verify endpoint + brute force — POST /auth/otp/verify + atomik GETDEL consume + otp:attempts INCR + 5 hatalı → otp:lockout 15dk + timingSafeEqual |
| 1.20 | TASK-1.20 | ✅ Tamamlandı | JWT access token + auth middleware + profil create — @fastify/jwt HS256, access 15dk + kayıt jetonu 10dk (typ claim), app.authenticate (deletedAt:null), POST /auth/profile atomik $transaction, GET /auth/me |
| 1.21 | TASK-1.21 | ✅ Tamamlandı | Refresh token rotation — opaque 30 gün DB-stored (sha256 hash), aile (familyId) + rotate-on-use + replay detection (aile iptal) + concurrent compare-and-set; POST /auth/refresh + verify/profile entegrasyonu |
| 1.22 | TASK-1.22 | ✅ Tamamlandı | Logout + tüm cihazlardan çıkış endpoints — POST /auth/logout (access korumalı, body refreshToken, cross-user 403, idempotent 204, compare-and-set revoke) + POST /auth/logout-all (batch revoke, user_logout_all audit + count) |
| 1.23 | TASK-1.23 | ⬜ Bekliyor | PT davet linki üretim endpoint |
| 1.24 | TASK-1.24 | ⬜ Bekliyor | Davet kabul endpoint (lazy expiry + PT-Member ilişki) |
| 1.25 | TASK-1.25 | ⬜ Bekliyor | Deep link (Universal/App Link + .well-known/) |
| 1.26 | TASK-1.26 | ⬜ Bekliyor | Açılış ekranı (rol seçimi + manuel davet kodu + deep link) |
| 1.27 | TASK-1.27 | ⬜ Bekliyor | Telefon girişi ekranı (+90 inline validation) |
| 1.28 | TASK-1.28 | ✅ Tamamlandı | KVKK rıza ekranı (2 tickbox + placeholder metin) — sıra dışı |
| 1.29 | TASK-1.29 | ⬜ Bekliyor | OTP girişi ekranı (timer + yeniden gönder + dev lookup) |
| 1.30 | TASK-1.30 | ⬜ Bekliyor | Profil oluşturma ekranı (üye + PT) |
| 1.31 | TASK-1.31 | ⬜ Bekliyor | PT "Üyeler" sekmesi UI (Bekleyen + Aktif + Linki kopyala + QR) |
| 1.32 | TASK-1.32 | ⬜ Bekliyor | Davet kabul banner + liste real-time güncellemesi |
| 1.33 | TASK-1.33 | ⬜ Bekliyor | 30 gün cihaz hatırlama (secure storage + auto-login) |
| 1.34 | TASK-1.34 | ⬜ Bekliyor | Uçtan uca smoke testi (Mock SMS → OTP → profil → bağlanma) |

**Durum simgeleri:** ⬜ Bekliyor | 🔄 Devam ediyor | ⏸️ Duraklatıldı | ✅ Tamamlandı | 🔴 Bloke | ❌ İptal

---

## UAT Sonuçları

> Bu bölüm `/devflow:verify-phase 1` oturumunda doldurulacak.

---

## Retrospektif

> Bu bölüm `/devflow:review-phase 1` oturumunda doldurulacak.

---

## Kalite Kontrol Sonuçları

> Bu bölüm `/devflow:review-phase 1` oturumunda doldurulacak.

---

## Sonuç

- **Tamamlanma Tarihi:** —
- **Toplam Task:** — (plan-phase'de belirlenecek)
- **Notlar:** —

---

**Oluşturulma:** 2026-05-29 (discuss-phase 1)
**Son Güncelleme:** 2026-05-30 — TASK-1.20 ✅: JWT access token + auth middleware + profil create. `@fastify/jwt` HS256; access (15dk) + kayıt jetonu (10dk) `typ` claim ayrımı. `app.authenticate` decorator (jwtVerify→typ:access→DB deletedAt:null). `GET /auth/me` korumalı; `POST /auth/profile` tek `$transaction` (User+ConsentRecord+audit, kvkk zorunlu/403, telefon var/409). verify mevcut user→accessToken+user_login / yeni→registrationToken. Akış: kullanıcı **kayıt jetonu** yaklaşımını seçti (OTP tek-kullanımlık korundu). backend 99 PASS (81+18), typecheck/lint/format temiz.
