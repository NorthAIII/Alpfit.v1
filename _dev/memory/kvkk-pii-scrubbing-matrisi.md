# KVKK PII Scrubbing Matrisi — Süreç Disiplini

**Tip:** Süreç Disiplini
**Kural:** Backend + mobile'ın log/error tracking'e yazdığı her veri **KVKK PII** listesinden geçer. Yeni alan eklendiğinde liste **mutlaka** güncellenir.

---

## Niye

KVKK Madde 6 sağlık verisi (kilo, boy, ölçüm, yemek/kalori) **özel nitelikli** kişisel veri — log'a/Sentry'ye sızması ihlal sebebidir. Discuss-phase-1 kararı: *"log'lara üye sağlık verisi YAZILMAZ (sadece event tip + üye ID hash)"*. Bu kararın **kod-seviye gardiyanı** PII_FIELDS listesidir; liste eksik kaldığında savunma sessizce zayıflar — KVKK ihlali compile/test zamanında yakalanmaz.

PHASE-1 Araştırma §Tuzak #3 (Sentry default PII gönderir) ve §Tuzak #7 (5K event silently drop) bu disiplinin doğum sebebi.

---

## Source of Truth

**Tek dosya:** [shared/src/pii-fields.ts](../../shared/src/pii-fields.ts) → `PII_FIELDS` (readonly tuple).

Bu liste backend (pino redact + Sentry beforeSend) ve mobile (Sentry RN beforeSend, TASK-1.12) tarafından **paylaşılır** — `@alpfit/shared` re-export'u ile.

Kategoriler:
- **Kimlik:** phone, phoneNumber, mobile, email, name, firstName, lastName, fullName, displayName
- **Sağlık verisi (Madde 6):** weight, height, measurement(s), bodyFat, bmi, waist, hip, chest, arm, thigh
- **Yemek/beslenme:** foodLog, meal(s), mealLog, food, calories, kcal, macros, protein, carbs, fat
- **Notlar:** note(s), comment(s)
- **Rıza:** kvkkConsent, healthDataConsent, consent
- **Auth/sır:** password, otp, otpCode, smsCode, verificationCode, token, accessToken, refreshToken, secret, apiKey, authorization

Liste **hem camelCase hem snake_case** içerir — DB column adı ne olursa olsun yakalanır.

---

## 3 Katmanlı Savunma

| Katman | Nerede | Ne Yapar |
|--------|--------|----------|
| #1 SDK default | `sentry.ts → sendDefaultPii: false` | Sentry'nin otomatik user IP / cookies / headers gönderimini kapatır. |
| #2 beforeSend | `pii-scrubber.ts → sentryBeforeSend` | Event Sentry'ye gitmeden `request.data`, `user`, `extra`, `contexts`, `breadcrumbs[].data` PII alanlarını siler. User ID hash'lenir (sha256 prefix 12). |
| #3 pino redact | `server.ts → buildLoggerConfig` | stdout log JSON'ında PII alanlarını `[REDACTED]` yapar (4 nested seviye wildcard). |

Üçü birlikte savunma derinliği sağlar — biri bypass edilse diğeri yakalar.

Bonus katman: Sentry UI **Settings → Security & Privacy → Additional Sensitive Fields** ayrıca aynı liste girilir (server-side redundant scrub). Detay: [docs/sentry-setup.md §4](../docs/sentry-setup.md).

---

## Kontrol Anı (Disiplin)

Şu adımlarda **PII_FIELDS güncel mi?** kontrolü yap:

1. **DB schema değişikliği task'lerinde** (TASK-1.13 3 rol model, TASK-1.14 KVKK consent, ileride Yakın 3 ölçüm + yemek günlüğü schema'sı): Migration `.prisma` dosyasına eklenen her yeni kolon adını PII_FIELDS'e gir. Özellikle health/measurement/meal/note alanları.
2. **Yeni API endpoint task'lerinde** (Yakın 2-4): request body schema (zod) içinde PII alanı var mı? Listede yoksa **task BAŞLAMADAN** ekle, sonra endpoint yaz.
3. **PR review'da:** Diff'te yeni schema/zod field varsa, `shared/src/pii-fields.ts`'in de güncellenip güncellenmediğini kontrol et. Yoksa istem: "Bu alan PII mi? Listeye eklenmeli mi?"
4. **Faz review'da (review-phase):** O fazda DB'ye giren her yeni alan PII_FIELDS'te mi diye toplu kontrol et.

---

## Yedek Savunma — Wildcard'a Güvenme

Pino redact path generator (`getPinoRedactPaths()`) 4 seviye `*.*.*.field` türetir — pratikte Fastify log objelerini kapsar. Ama:

- **Daha derin nested veri** (5+ level) wildcard'a girmez → PII sızabilir.
- **`scrubPii()` recursive walker** bu sınırı tanımaz; Sentry tarafı güvenli. Ama pino log'larda derin nested PII varsa **manuel path eklenmesi** gerekir.
- **Yeni alan adı varyantı** (örn. `weight_kg` yerine `weight`'in listede olması yetmez) → memory disiplini: **iki form da listeye gir** (camelCase + snake_case + varyant).

---

## Kanıt (Test'le Bağ)

[backend/src/observability/pii-scrubber.test.ts](../../backend/src/observability/pii-scrubber.test.ts) bu matrisin somut doğrulamasıdır:
- Sentry beforeSend: kilo/boy/yemek/telefon alanlı mock event → çıktıda yok (assertion).
- pino redact: logger.info({phone, weight, mealLog, password, email}) → stdout'ta `[REDACTED]`.
- Hash kontrolü: `event.user.id` 12 hex hash, ham telefon yok.

Test fail oluyorsa = matrise yeni alan eklendi ama scrubber zinciri bunu yakalamıyor demektir.

---

## İlgili

- [Staging altyapısı](staging-infra.md) — Sentry DSN env'i `.env.staging`'de.
- DECISIONS.md → "2026-05-29 — TASK-1.11: 3 Katmanlı KVKK PII Scrubbing Matrisi".
- ILKELER.md §"En Yüksek Öncelikli Eksen #1" — sağlık verisi gizliliği.
