/**
 * SMS gönderim katmanı soyutlaması (TASK-1.17).
 *
 * Backend'deki **tüm** SMS çağrıları yalnızca bu interface üzerinden yapılır.
 * Böylece driver değişimi (mock → live) tek bir factory satırı (`sms/index.ts`)
 * ve env değeriyle olur — çağrı yapan kod değişmez ([[ilkeler]] §"Kalıcılık
 * önceliği"; provider değiştirme migration ağrısı sıfır).
 *
 * Driver'lar:
 *   - MockSmsProvider (dev/staging) — `dev_otp_log` tablosuna yazar, gerçek SMS
 *     göndermez. `sms/mock-sms-provider.ts`.
 *   - LiveSmsProvider (Yakın 5) — gerçek provider (Netgsm/Twilio kararı
 *     `TECH-STACK.md`'de). Henüz yok; factory `live` değerinde hata fırlatır.
 */

/** `sendOtp` sonucu — provider'ın mesaj kimliği (varsa) ile geri döner. */
export interface SmsSendResult {
  /** Provider tarafından üretilen mesaj kimliği (teslimat takibi için, opsiyonel). */
  providerMessageId?: string;
}

export interface SmsProvider {
  /**
   * Tek kullanımlık doğrulama kodunu (OTP) hedef telefona gönderir.
   *
   * @param phoneE164 E.164 normalize edilmiş telefon ("+905551234567").
   * @param code      Üretilmiş OTP kodu (6 hane). Mock driver bunu plaintext
   *                  saklar; log/Sentry yoluna `otpCode` adıyla gider (redact).
   * @param ttlSec    Kodun geçerlilik süresi (saniye). discuss-phase: 300 (5 dk).
   */
  sendOtp(phoneE164: string, code: string, ttlSec: number): Promise<SmsSendResult>;
}
