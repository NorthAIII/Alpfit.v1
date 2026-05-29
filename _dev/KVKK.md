# KVKK — Kişisel Verilerin Korunması Çerçevesi

**Amaç:** Alpfit'in KVKK uyumu için aydınlatma metni, sağlık verisi açık rıza metni, saklama süresi politikası ve üye self-silme akışını tek yerde tutmak.
**Ne zaman doldurulur:** Bu doküman **boş şablon olarak** kickoff-docs'ta açıldı. İçerik **Yakın 4 (PT dashboard + Sağlık verisi) fazına girmeden önce** `/devflow:prd-refine` + **hukuki danışman incelemesi** ile doldurulur.
**Statü:** ⬜ Boş şablon — Yakın 4 blocker. DURUM.md'de "Engelleyici Ön-Koşullar" altında izlenir.

> ⚠️ **Bu doküman hukuki tavsiye değildir.** Hazırlanacak metinler **TR KVKK mevzuatına uygun** olmalı ve **hukuki danışman incelemesinden geçmeli**. v1 launch (Yakın 5) için bu adım atlanamaz.

---

## KVKK Şema Altyapısı (TASK-1.14 — yerleşik)

Metin hukuki danışman onayıyla doldurulmadan **önce** KVKK denetim altyapısı kuruldu (TASK-1.14, 2026-05-29). Hukuki metin sürümü değiştiğinde sadece string güncellenir; şema/akış aynı kalır.

**ConsentRecord** — `backend/prisma/schema.prisma` model `ConsentRecord` (versiyonlu, append-only event log):
- `userId` FK + `consentType` (`kvkk_aydinlatma`/`saglik_verisi`/`pazarlama_iletisim`) + `eventType` (`granted`/`revoked`/`auto_revoked`)
- `textVersion` tarih-bazlı string (örn. `v2026-05-29` → bu doküman güncellendiğinde tag bump)
- `occurredAt` + opsiyonel `ipAddress`/`userAgent` — KVKK denetim için **bilinçli toplanır** (Sentry'ye gönderilmez; pino redact + Sentry beforeSend `[REDACTED]`'ler)
- **Append-only:** UPDATE/DELETE convention olarak yasak; geri çekme = yeni `revoked` event satırı; tarih zinciri kayıtlı kalır
- `User.kvkkConsentAt`/`healthConsentAt` denormalized cache olarak kalır (hot-path UI/auth check); truth source ConsentRecord'un `orderBy occurredAt desc limit 1` event'i
- Application helper'ları: `backend/src/kvkk/consent.ts` — `recordConsent()` Prisma `$transaction` ile insert + cache senkron; `getActiveConsent()` truth-source query

**AuditLog** — `backend/prisma/schema.prisma` model `AuditLog` (KVKK Madde 11 denetim event log):
- `userIdHash` — ham userId DB'ye **YAZILMAZ**, sha256 prefix 12 hex (broad disclosure önler, correlation yeterli)
- `eventType` enum v1'de 16 değer (user_*, otp_*, consent_*, invitation_*, refresh_*, member_removed, retention_purge)
- `metadata Json?` — **PII YASAK**; helper `logAuditEvent()` zod `.strict()` whitelist 10 alan (`ip`/`deviceType`/`userAgent`/`invitationId`/`refreshTokenId`/`consentType`/`textVersion`/`attemptCount`/`count`/`reason`) — bilinmeyen anahtar ZodError fırlatır (PII alan adı verilirse runtime'da reddedilir)
- **Append-only:** UPDATE/DELETE convention olarak yasak; doğrudan `prisma.auditLog.create(...)` yasak — `logAuditEvent()` tek giriş noktası
- Application helper: `backend/src/kvkk/audit.ts`

**Audit Retention Politikası (TODO — Yakın 4 öncesi hukuki danışman ile netleşecek):**
- v1: sınırsız tutulur (storage düşük, denetim sorgusu olası)
- v1.5+: KVKK denetim sürelerine göre purge politikası (öneri: 7 yıl audit log, sonra purge — denetim talebi yanıt süresi 30 gün; geç eskimiş audit pratikte sorgulanmıyor)
- `retention_purge` event tipi audit log'un kendi purge'ını de **kendi içine yazar** (KVKK uyum şeffaflığı)

**İlgili kararlar:** `_dev/docs/DECISIONS.md` "2026-05-29 — TASK-1.14: KVKK Consent Versiyonlu Append-Only + AuditLog Whitelist Metadata + UserIdHash".

---

## Veri Saklama Politikası (TASK-1.15 — yerleşik)

Saklama mekaniği TASK-1.15'te kuruldu; metnin hukuki danışman onaylı sürümü Yakın 4 öncesi `KVKK.md` §3'e (yukarıda) yerleşecek. Bu bölüm **mekanik altyapıyı** belgeler.

**30 gün retention deadline'ı üç akışla tetiklenir** (`backend/src/kvkk/soft-delete.ts`):

| Akış | Helper | Set edilen alanlar | Akıbet |
|------|--------|---------------------|--------|
| Üye hesabı kapatma (self / PT-removed / admin) | `softDeleteUser` | `User.deletedAt = now`, `User.retentionDeadline = now + 30g`, AuditLog `member_removed` | 30g sonra retention-job kullanıcıyı **anonimize eder** (firstName/lastName/profilePhotoUrl/gymName/certificateNote null, phoneE164 = `deleted_<hash>`); FK'lar korunur. |
| PT üyeyi çıkarır (ilişki sonlandı) | `endTrainerMember` | `TrainerMember.endedAt = now`, member'ın `retentionDeadline = now + 30g`, AuditLog `member_removed` | Üye **hesabı kalır**; 30g sonra sağlık verisi (Yakın 4 tabloları) purge'lenir. |
| Üye sağlık rızasını geri çeker | `revokeHealthConsent` | ConsentRecord `saglik_verisi/revoked`, `User.healthConsentAt = null`, `User.retentionDeadline = now + 30g`, AuditLog `consent_revoked` | Üye **hesabı kalır**; 30g sonra sağlık verisi purge'lenir. |

**Retention purge job** (`backend/src/kvkk/retention-job.ts → runRetentionPurge`):
- `retentionDeadline IS NOT NULL AND retentionDeadline < now` koşulundaki tüm kullanıcıları işler.
- Her kullanıcı için `purgeDeletableTablesForUser(userId)` çağrılır — **v1'de boş**, Yakın 4'te ölçüm + yemek günlüğü tabloları eklenir.
- `deletedAt IS NOT NULL` ise kullanıcı anonimize edilir; değilse sadece `retentionDeadline = null` reset (sağlık-purge yolu).
- AuditLog `retention_purge` event'i her çalıştırmada yazılır (KVKK uyum şeffaflığı; `count: 0` da kanıt).

**Anonimizasyon stratejisi (DECISIONS 2026-05-29 "TASK-1.15"):**
- User row korunur (FK güvencesi). PII alanları temizlenir (`firstName=''`, `lastName=''`, `profilePhotoUrl=null`, `gymName=null`, `certificateNote=null`).
- `phoneE164 = 'deleted_<sha256-prefix-12>'` — global unique constraint için collision-safe (canlı E.164 ile çakışmaz: `+` ile başlamaz).
- AuditLog `userIdHash` (sha256 prefix) anonimizasyon sonrası **hala aynıdır** → denetimde "bu kullanıcı X tarihinde Y eylemini yapmıştı, sonra anonimize edildi" zinciri kurulabilir.
- `deletedAt` korunur (denetim kanıtı).

**Audit Retention Politikası (TODO — Yakın 4 öncesi hukuki danışman ile netleşecek):**
- v1: sınırsız tutulur (storage düşük, denetim sorgusu olası)
- v1.5+: KVKK denetim sürelerine göre purge politikası (öneri: 7 yıl audit log, sonra purge — denetim talebi yanıt süresi 30 gün; geç eskimiş audit pratikte sorgulanmıyor)
- `retention_purge` event tipi audit log'un kendi purge'ını de **kendi içine yazar** (KVKK uyum şeffaflığı)

**Tetikleme altyapısı (host crontab — TASK-1.10 mimari sapması ile uyumlu):**
- Coolify scheduled task **yok** (docker-compose'a geçildi); yerine VPS host crontab `deploy` user altında çalışır.
- Endpoint: `POST /admin/internal/retention-purge` — bearer auth, env: `ADMIN_INTERNAL_TOKEN` (32+ char).
- Tetikleme: günlük UTC 00:00 (Europe/Istanbul UTC+3 → 03:00 TR).
- Kurulum rehberi: [`_dev/docs/staging-retention-cron.md`](docs/staging-retention-cron.md).
- Tüm istek path'i: crontab → `alpfit-retention-purge.sh` → `docker compose exec alpfit-backend curl ...` (container DNS'inden çağırır, bunker-nginx katmanı atlanır → SAN cert + dış expose yok).

---

## Neden Bu Doküman Erken Açılıyor?

KVKK çerçevesi M0 Çekirdek Altyapı'da kurulur (3 rol veri modeli, açık rıza akış, saklama politikası). Ama metinler ve hukuki kararlar **uzun lead time** gerektirir:

1. **M1 Onboarding (F1.1) KVKK açık rıza ekranı içeriyor** — metin Yakın 1 öncesi gerekli değil ama yer ayrılıyor (placeholder)
2. **M6 Sağlık Verisi (F6.1 + F6.2) sağlık verisi açık rıza istiyor** — Yakın 4 başlamadan önce hazır olmalı
3. **Üye self-silme akışı** (KVKK Madde 11) — Yakın 4 öncesi netleşmeli
4. **Saklama süresi politikası** — backend'de delete job yazılmadan önce karar gerekli

Bu nedenle **kickoff-docs'ta boş şablon** olarak açıldı; gerçek içerik **PRD-refine + hukuki danışman** ile doldurulur.

---

## Doldurulacak Bölümler

### 1. Aydınlatma Metni (KVKK Madde 10)

**Ne içerir:**
- Veri sorumlusu kim (Alpfit Yazılım — kurucu bilgisi)
- Hangi kişisel verileri işliyoruz (isim, soyisim, telefon, profil fotoğrafı, ölçüm verileri, yemek günlüğü, antrenman geçmişi, push token, IP, cihaz bilgisi)
- Hangi amaçla işliyoruz (hizmet sunumu, PT-üye iletişimi, sürdürülebilirlik motoru, KVKK gereği saklama)
- Kimlerle paylaşıyoruz (üyenin atandığı PT — sağlık verisi gizlilik toggle'ı dikkate alınır; SMS provider; push provider; hosting sağlayıcı; AI nutrition v1.5'te — sadece PT onaylı)
- KVKK Madde 11 hakları (erişim, düzeltme, silme, itiraz, taşınabilirlik)
- İletişim kanalı (destek email/form)

**UI yerleşimi:** M1 onboarding'inde SMS OTP sonrası, profil formundan önce. Ekran içeriği:
- Aydınlatma metni özeti (link "Tam metni oku")
- "Aydınlatma metnini okudum, kabul ediyorum" onay kutusu (zorunlu)
- "KVKK metnini kabul etmeden hesap açılamaz" mesajı

**Statü:** ⬜ Boş — hukuki danışmandan metin alınacak.

---

### 2. Sağlık Verisi Açık Rıza Metni (KVKK Madde 6)

KVKK Madde 6 sağlık verisini **özel nitelikli kişisel veri** olarak tanımlar — ayrı açık rıza gerekli. Aydınlatma metniyle birlikte ama ayrı checkbox.

**Ne içerir:**
- Kilo, boy, vücut çevre ölçümleri, yemek günlüğü içeriği "özel nitelikli kişisel veri"dir
- Bu veriler **antrenman programının kişiselleştirilmesi**, **sürdürülebilirlik takibi** ve **v1.5'te AI nutrition önerisi** için işlenir
- PT (kullanıcının atandığı) bu verilere erişebilir — **gizlilik toggle ile üye PT erişimini kısıtlayabilir** (F6.1 + F6.2)
- Diyetisyen rolü Alpfit'te yoktur; AI nutrition v1.5'te aktif olduğunda **çıktı PT onayından sonra üyeye gider** ([[00-vision]] §6 yasal çerçeve)
- Veri **yurt içinde mi yurt dışında mı** saklanır? (Hosting kararı `TECH-STACK.md`'de — sağlık verisi data residency hukuki incelemesi gerekir)

**UI yerleşimi:** M1 onboarding'inde aydınlatma metni onayından sonra. Ekran içeriği:
- Sağlık verisi açık rıza metni özeti (link "Tam metni oku")
- "Sağlık verilerimin işlenmesine açık rıza veriyorum" onay kutusu (zorunlu)
- "Sağlık verisi rızası verilmezse ölçüm + yemek günlüğü özellikleri kullanılamaz" mesajı

**Sonradan geri çekme:** Üye Ayarlar > Gizlilik > "KVKK rızamı geri çek" CTA. Geri çekildiğinde 30 gün içinde sağlık verisi silinir (hesap kalır).

**Statü:** ⬜ Boş — hukuki danışmandan metin alınacak.

---

### 3. Saklama Süresi Politikası

**v1 baz varsayım (PRD'den):**
- Üye hesabı **aktif** olduğu sürece tüm veri saklanır
- Üye hesabı silinirse: tüm veri silinir (KVKK hak)
- Üye PT'den çıkarıldığında: veri **arşivlenir** (silinmez); üye "verilerimi sil" derse arşiv dahil silinir
- KVKK rızası geri çekilirse: sağlık verisi 30 gün içinde silinir; hesap kalır (KVKK aydınlatma metni kabul edilmiş sayılır)

**Doldurulacak:**
- Audit log (kim, ne zaman, hangi veriyi okudu/değiştirdi) saklama süresi
- Backup'larda veri ne kadar tutulur? (Hosting kararı sonrası)
- Hesap inaktif olduğunda (üye 6 ay/1 yıl giriş yapmadıysa) ne olur? Otomatik silme yok mu? Bilgilendirme + onay var mı?
- KVKK denetim talebine yanıt süresi (yasal: 30 gün)

**Statü:** ⬜ Boş — hukuki danışmandan + PRD-refine ile netleşecek.

---

### 4. Üye Self-Silme Akışı (KVKK Madde 11)

**KVKK Madde 11:** Üye verilerinin silinmesini talep etme hakkına sahiptir. Bu hak teknik olarak self-service olmalı (manuel müracaat zorlanmamalı).

**UI yerleşimi:** Ayarlar > Hesap > "Hesabımı sil" CTA. Akış:
1. Üye "Hesabımı sil" der → uyarı modalı: *"Tüm verilerin (ölçümler, yemek günlüğü, antrenman geçmişi, notlar) silinecek. PT'nle ilişkin sonlanacak. Geri alınamaz."*
2. Onay → SMS OTP ile bir kez daha doğrula (güvenlik)
3. Silme talebi backend'e iletilir → asenkron silme job'u (audit log dışında her şey 30 gün içinde silinir)
4. Üye'ye onay email/SMS bildirimi (silme tamamlandığında)

**PT tarafında etki:** PT dashboard'da üye satırı kaybolur. Notlarda kalmış mı? Veri yapısında üye verisi nasıl tutulur (foreign key constraint vb.)? — M0 implement edilirken karar.

**Statü:** ⬜ Boş — UI akış M5'te + backend job M0'da implement, metin hukuki danışman.

---

### 5. Veri İhlali Bildirim Süreci

**KVKK Madde 12:** Veri ihlali öğrenildiğinde **72 saat içinde** KVK Kurumu'na bildirim zorunluluğu.

**Doldurulacak:**
- İhlal tespit edildiğinde kim sorumlu (kurucu)
- KVK Kurumu bildirim şablonu
- Etkilenen üyelere bildirim metni şablonu (email/in-app)
- Pre-mortem: en kötü senaryolar (örn. SMS provider compromise — telefon numaraları sızdı; DB sızdı — tüm sağlık verisi)

**Statü:** ⬜ Boş — Yakın 5 launch öncesi hazır olmalı.

---

## Hukuki Danışman Süreci

**Önerilen adımlar:**
1. v1 PRD + bu doküman taslağı + ürün demosunu (mockup) hukuki danışmana göster
2. Aydınlatma metni + sağlık verisi açık rıza metni + üye self-silme akışı taslağını al
3. Saklama süresi + audit log + veri ihlali bildirim süreci politikasını netleştir
4. **Diyetisyen rolü olmaması** ve **AI nutrition PT onayı modeli** üzerinde özellikle danış — yetkisiz diyetisyenlik riskinin yasal değerlendirmesi
5. Hosting kararı yapıldıktan sonra **data residency** (yurt içi/yurt dışı saklama) hukuki incelemesi
6. v1 launch (Yakın 5) öncesi son review

**Beklenen süre:** 2-4 hafta. Yakın 4 başlamadan önce başlanmalı (Yakın 4 milestone'u sağlık verisi giriş akışıyla ilgili).

---

## Üçüncü Taraf Sözleşmeler (Standart Sözleşme — SCC) — TODO

KVKK m.9 reformu (7499 sayılı Kanun, 01.06.2024) sonrası yurt dışı veri aktarımı için **Standart Sözleşme (SCC) imzası** zorunlu — Kasım 2025 itibarıyla hiçbir ülke için yeterlilik kararı yok. AB'de hostlanan servisler için bile SCC imzalanmalı.

**TODO (Yakın 4 öncesi, hukuki danışman ile birlikte):**

- [ ] **Hetzner Cloud Standart Sözleşme imzası** — Backend + Postgres + Redis Hetzner Nuremberg'de (`_dev/memory/staging-infra.md`). SCC metni Hetzner DPA'sı kapsamında mevcut; hukuki danışman onayı + Kıvanç imzası.
- [ ] **Squarespace DNS Standart Sözleşme** — `kiwiailab.com` DNS Squarespace'te (US). DNS verisi sadece A record + CNAME (PII içermez ama metadata olarak kabul edilebilir); hukuki danışmana sor.
- [ ] **GitHub Actions** — CI/CD build/test sürecinde repo kodu Microsoft (US) sunucularında işleniyor. Genelde geliştirme metadata SCC kapsamı dışında ama sağlık verisi test fixture'ı asla CI'a girmemeli (zaten yok).
- [ ] **SMS provider (Yakın 4 — TASK-1.17/1.18)** — Twilio (US) mı Netgsm (TR) mi kararı SCC gerekliliğini değiştirir. PRD-refine'da.
- [ ] **Push provider** (Yakın 3) — FCM (Google US) zorunlu Android için; APNs (Apple US) zorunlu iOS için. SCC + push payload'ında PII olmaması (sadece üye ID hash + event tipi).
- [x] **Backblaze B2 region kararı** (TASK-1.16, 2026-05-30) — **EU Central `eu-central-003` (Amsterdam, AB)** seçildi. KVKK m.9 SCC + DPA ile savunulabilir konum. Hesap açılışı + bucket + rclone kurulum rehberleri repo'da: [`_dev/docs/backblaze-setup.md`](docs/backblaze-setup.md) + [`_dev/docs/staging-pg-backup-cron.md`](docs/staging-pg-backup-cron.md) + [`_dev/docs/restore-drill.md`](docs/restore-drill.md). Yedek mekanizması: host crontab + `pg_dump` (`docker compose exec`) + rclone B2 + crypt overlay (client-side AES; key password manager'da). Lifecycle 30 gün hide + 1 gün delete (KVKK veri minimizasyonu). v1 DB ~100 MB → ~$0.02/ay maliyet.
- [ ] **Backblaze B2 DPA imzası** (TASK-1.16 follow-up — kullanıcı, Yakın 4 öncesi) — B2 [DPA sayfası](https://www.backblaze.com/company/legal/dpa) formu doldurulur; imzalı PDF KVKK denetim arşivine + `_dev/memory/staging-infra.md` "B2 Off-Site Yedek" tablosunda imza tarihi notu. Hukuki danışman onayı SCC ile birlikte.
- [ ] **Sentry** (TASK-1.11/1.12) — EU Frankfurt residency seçildi (DECISIONS 2026-05-29 "Observability: Sentry Developer"); EU veri merkezi SCC gerektirebilir, sözleşme metnine bak.

---

**Son Güncelleme:** 2026-05-29 — TASK-1.14: KVKK şema altyapısı bölümü eklendi — `ConsentRecord` (versiyonlu append-only, `textVersion` + opsiyonel `ipAddress`/`userAgent`, denormalized cache) + `AuditLog` (`userIdHash` sha256 prefix 12 hex, metadata zod `.strict()` whitelist 10 alan); helper'lar `backend/src/kvkk/consent.ts` + `audit.ts`; v1 retention sınırsız + v1.5 7-yıl önerisi TODO; karar DECISIONS.md "TASK-1.14".
