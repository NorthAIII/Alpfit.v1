/**
 * KVKK PII alanları — Single Source of Truth (SSOT).
 *
 * Backend (pino redact + Sentry beforeSend) ve mobile (Sentry RN beforeSend, TASK-1.12)
 * bu listeyi paylaşır. Liste KVKK Madde 6 özel nitelikli kişisel veri kategorilerini
 * (sağlık verisi: kilo, boy, ölçüm, yemek/kalori) ve kimlik verisini (telefon, isim,
 * email) içerir. Yeni bir alan DB schema'sına eklendiğinde **buraya da eklenir**
 * (memory/kvkk-pii-scrubbing-matrisi.md disiplini).
 *
 * Alan adları camelCase + snake_case birlikte listelenir; pino redact path generator
 * büyük/küçük kombinasyon üretmez — alan adının kanonik formu burada doğru yazılmalı.
 */
export const PII_FIELDS = [
  // Kimlik (KVKK kişisel veri)
  'phone',
  'phoneNumber',
  'phone_number',
  'mobile',
  'tel',
  'email',
  'name',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'fullName',
  'full_name',
  'displayName',
  'display_name',

  // Sağlık verisi (KVKK Madde 6 özel nitelikli)
  'weight',
  'height',
  'measurement',
  'measurements',
  'bodyFat',
  'body_fat',
  'bmi',
  'waist',
  'hip',
  'chest',
  'arm',
  'thigh',

  // Yemek günlüğü / beslenme
  'foodLog',
  'food_log',
  'meal',
  'meals',
  'mealLog',
  'meal_log',
  'food',
  'calories',
  'kcal',
  'macros',
  'protein',
  'carbs',
  'fat',

  // Notlar (PT'nin üye notu içerebilir)
  'note',
  'notes',
  'comment',
  'comments',

  // KVKK rıza alanları (rıza durumu kendisi PII değil ama log'da bağlamla görünmesi sızıntı riski)
  'kvkkConsent',
  'kvkk_consent',
  'healthDataConsent',
  'health_data_consent',
  'consent',

  // Auth (sır)
  'password',
  'otp',
  'otpCode',
  'otp_code',
  'smsCode',
  'sms_code',
  'verificationCode',
  'verification_code',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
] as const;

export type PiiField = (typeof PII_FIELDS)[number];

/**
 * Pino `redact.paths` için path listesi üretir.
 *
 * Pino fast-redact tabanlıdır; path syntax'i `key`, `nested.key`, `*.key`
 * (tek seviye wildcard) destekler. Tam recursive (`**`) desteklenmez, bu yüzden
 * 3 seviye wildcard türetilir — pratikte Fastify log objelerinde alanlar
 * `req.body.X` veya `res.payload.X` gibi en fazla 3 nested görünür.
 *
 * Aynı alan adı birden fazla path üretir (tepe + wildcard); pino redact
 * çakışmaları sessizce idare eder.
 */
export function getPinoRedactPaths(): string[] {
  const paths: string[] = [];
  for (const field of PII_FIELDS) {
    paths.push(field);
    paths.push(`*.${field}`);
    paths.push(`*.*.${field}`);
    paths.push(`*.*.*.${field}`);
  }
  return paths;
}
