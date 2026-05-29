# Sentry Setup — Backend (EU Frankfurt)

**Amaç:** Alpfit backend Sentry projesi kurulum + KVKK uyumlu konfigürasyon + 5K event/ay free plan quota webhook'u.

**Bağlantı:** TASK-1.11 (backend Sentry + PII scrubber + KVKK test) + DECISIONS.md "2026-05-29 — TASK-1.11: 3 Katmanlı KVKK PII Scrubbing Matrisi".

---

## 1. Proje Açma (manuel — Sentry Cloud EU UI)

1. https://sentry.io adresine git, **"Sign up"** ile EU bölgesi seç (Frankfurt residency). Hesap zaten varsa: Settings → Account → "Switch region" → **Europe (Frankfurt)**.
2. **Create Project** → Platform: **Node.js (Fastify)** → Name: `alpfit-backend-staging`.
3. Aynı adımı `alpfit-backend-production` için tekrarla. **İki ayrı proje** — quota karışmasın + tracesSampleRate ayrı.
4. DSN'i kopyala. Format: `https://<hash>@o<orgId>.ingest.de.sentry.io/<projectId>`. **`.de.sentry.io`** host olduğunu doğrula — `.us.sentry.io` ise yanlış bölge.

> Mobile için ayrı proje (`alpfit-mobile-staging` / `-production`) **TASK-1.12**'de açılır. Backend ve mobile aynı proje değil — quota + payload karışmasın.

---

## 2. Env'e DSN Yazma

### Staging (Hetzner VPS)

```bash
# Sunucuda /opt/alpfit/_ops/staging/.env.staging içine ekle:
SENTRY_DSN=https://<hash>@o<orgId>.ingest.de.sentry.io/<projectId>
SENTRY_RELEASE=$(git rev-parse --short HEAD)   # opsiyonel — deploy script'i set eder
```

Sahiplik: `deploy:deploy`, izin `600`. `chmod 600 .env.staging`.

### Production

Yakın 5 prod deploy task'inde Coolify/Hetzner env UI'ından girilir; repo'ya commit edilmez.

### Local Dev

Local'de **DSN gerekmez** — `initSentry()` DSN yoksa no-op döner, app degrade çalışır. Stderr'e warning düşmez (sadece staging/prod'da). Local'de hata test etmek isteyene Sentry "dev" projesi açılabilir; rutinde gerek yok.

---

## 3. Quota Webhook (Araştırma §Tuzak #7 Mitigation)

Free Developer plan: **5,000 event/ay** üst sınır. Aşılırsa Sentry **silently drop** eder — yeni hatalar görünmez kalır. Webhook bağlamak şart.

### Adımlar (Sentry Cloud EU UI)

1. **Settings** (sol alt) → **General Settings** → **Usage & Billing** → **Notifications** sekmesi.
2. **"Notify me when usage exceeds..."** → eşik **80%** (4,000 event) + **100%** (5,000 event) için ayrı kayıt ekle.
3. **Delivery channel** seç:
   - **Email** (kurucu — kivanc@kiwiailab.com) → en sade, ek setup yok.
   - **Slack** (opsiyonel) — Sentry Slack integration'ı kur, alpfit kanalını seç.
4. **Save**.

> Proje bazlı quota uyarısı: **Settings → [Project] → Spike Protection** ile per-project rate limit kurulabilir (örn. dakikada 100 event tavanı). Bir bug yağmuru tek seferde 5K quota'yı silip süpürmesin. **Önerilen:** `alpfit-backend-staging` için spike protection aktif (limit: 50 event/dk); production için 200 event/dk.

### Test

Webhook'u test etmek için Sentry **Settings → Internal Issues → "Send Test Notification"** komutu (varsa). Yoksa, dev projesinde kasten 4,001 event yollayıp email/Slack mesajını doğrula.

---

## 4. KVKK Konfigürasyon Çek-Listesi

Sentry init kodu (`backend/src/observability/sentry.ts`) bu ayarları zaten zorlar; UI tarafında ayrıca işaretle ki **savunma derinliği** olsun:

- **Settings → Security & Privacy → Data Scrubbing** → ✅ "Prevent Storing of IP Addresses" + ✅ "Require Scrub Data" + ✅ "Require Scrub Default PII"
- **Settings → Security & Privacy → Additional Sensitive Fields** → şu alanları (boşlukla ayrılı) ekle: `phone phoneNumber phone_number weight height measurement bodyFat foodLog mealLog meal calories note password otp`. (Backend `pii-scrubber.ts` ile çakışır — bilinçli redundansı.)
- **Settings → Data Residency** → ✅ EU (Frankfurt) seçili olduğunu doğrula.
- **Settings → Security & Privacy → Retention** → 30 gün (KVKK [[ilkeler]] §En Yüksek Öncelikli Eksen + saklama disiplini).

---

## 5. Release Tracking (Opsiyonel — Yakın 2'de Aktive)

Deploy script'inde `SENTRY_RELEASE=<git sha>` set et + Sentry CLI ile release upload:

```bash
npx @sentry/cli releases new "$SENTRY_RELEASE"
npx @sentry/cli releases set-commits "$SENTRY_RELEASE" --auto
npx @sentry/cli releases finalize "$SENTRY_RELEASE"
```

Source map upload sonraki task'lerin işi (TASK-1.12 mobile + production deploy).

---

## 6. Test Senaryosu (Manuel — KVKK Kabul Kriteri Smoke)

1. Staging'e deploy et (`SENTRY_DSN` set).
2. Staging'de bir endpoint'i kasten kıracak request at — örn. invalid body validation hatası, kilo + telefon alanı içersin.
3. Sentry dashboard → Issues → yeni event aç → **Event Detail** → şu sekmeleri kontrol et:
   - **Request → Body Data:** `phone`, `weight` alanları **`[REDACTED]`** veya yok.
   - **User:** sadece hash'li `id` (12 hex), `phone`/`email`/`username`/`ip_address` yok.
   - **Extra / Contexts:** PII yok.
   - **Breadcrumbs:** HTTP breadcrumb'larında PII yok.
4. ❌ Eğer PII görünüyorsa: (a) DSN yanlış proje, (b) deploy eski versiyon, (c) PII_FIELDS listesi eksik — kontrol et.

---

## 7. Quota İzleme Disiplini

- **Haftalık 30 sn check:** Sentry dashboard → Stats → Events graph. Trend yukarıysa Settings → Inbound Filters'tan "transaction" sample rate'i düşür veya environment-bazlı sample.
- **Aşılırsa hemen yapılacak:** Spike protection sıkılaştır + bug fix önceliklendir; quota satın al ($26/ay Team plan) sadece kalıcı yüksek hacim ise.
