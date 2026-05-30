# Staging Manuel Smoke Test Checklist (TASK-1.34)

**Bağlam:** Faz 1 (Çekirdek altyapı + Auth) milestone'unun **gerçek staging
ortamında** uçtan uca doğrulanması. Otomatik smoke testler CI'da koşar
(`backend/test/smoke/onboarding-flow.test.ts` + `mobile/test/smoke/onboarding-flow.test.tsx`);
bu checklist onların yakalayamadığı kısmı kapsar: **gerçek cihaz + gerçek deploy +
gerçek Sentry/Backblaze entegrasyonu**. İki fiziksel test cihazı (ya da 1 cihaz +
1 simulator) gerekir.

**Ne zaman:** Faz 1 verify-phase (UAT) öncesi, en az 1 kez. Sonraki fazlarda
extend edilir.

**Kim:** Kullanıcı (Kıvanç) — fiziksel cihaz + staging erişimi gerektirir, Claude
otonom yapamaz. Her madde işaretlenip tarih + not düşülür.

**Ön gereksinim:**
- ✅ Staging deploy yeşil (`main` push → otomatik — [`hetzner-staging-setup.md`](hetzner-staging-setup.md))
- ✅ EAS preview build iki cihaza kurulu (dev client yeterli)
- ✅ Dev OTP lookup açık (`EXPO_PUBLIC_DEV_OTP_LOOKUP=true` veya `__DEV__`) — SMS provider mock olduğu için kod buradan okunur
- ✅ Sentry kurulu ([`sentry-setup.md`](sentry-setup.md)), Backblaze yedek cron aktif ([`backblaze-setup.md`](backblaze-setup.md))

---

## 1. PT akışı (Test cihazı 1)

- [ ] App açılır → "Antrenörüm" seçilir
- [ ] Telefon (+90 5XX XXX XX XX) girilir → "Devam" → OTP ekranı
- [ ] "Dev OTP getir" ile kod gelir (veya `dev_otp_log`'tan okunur) → otomatik doğrulanır
- [ ] KVKK aydınlatma onayı işaretlenir → "Devam"
- [ ] Profil (ad + soyad, opsiyonel spor salonu) doldurulur → "Hesabı oluştur" → "Üyeler" sekmesi açılır
- [ ] "+ Üye davet et" → davet modal'ı açılır → "Linki kopyala" çalışır
- [ ] (Opsiyonel) "QR kodu göster" → QR modal görünür

**Beklenen:** PT hesabı açıldı, davet linki üretildi, link panoda.

**Not / Tarih:** _______________________

---

## 2. Üye akışı + davet kabul (Test cihazı 2)

- [ ] PT'nin kopyaladığı davet linki cihaz 2'ye iletilir (WhatsApp/SMS — manuel)
- [ ] Linke tıklanır → app açılır, davet önizleme PT adını gösterir → "Devam et"
- [ ] Telefon (farklı numara) → OTP (dev lookup) → KVKK onayı → profil → "Hesabı oluştur"
- [ ] Üye ana ekranına düşer; davet otomatik kabul edildi (PT'ye bağlandı)

**Beklenen:** Üye hesabı açıldı, PT'ye otomatik bağlandı.

**Not / Tarih:** _______________________

---

## 3. PT tarafı in-app event (Test cihazı 1)

- [ ] PT "Üyeler" sekmesi açıkken (veya tekrar açıldığında) davet kabul banner'ı görünür
- [ ] Yeni üye "Aktif üyeler" listesinde görünür (kısa highlight)
- [ ] (Yeniden onboarding denemesi: aynı davet linki ikinci kez açılırsa "geçersiz/kullanılmış" mesajı)

**Beklenen:** Banner + liste real-time (in-app polling) çalışıyor.

**Not / Tarih:** _______________________

---

## 4. Auto-login / 30 gün cihaz hatırlama (Her iki cihaz)

- [ ] App tamamen kapatılıp yeniden açılır → OTP istenmeden ana ekran açılır (auto-login)
- [ ] Ayarlar → "Çıkış yap" → landing'e döner; tekrar açılışta OTP istenir
- [ ] (Opsiyonel) "Tüm cihazlardan çıkış" → diğer cihazda da bir sonraki istekte oturum düşer

**Beklenen:** Refresh token secure storage'da; boot'ta `POST /auth/refresh` → ana ekran.

**Not / Tarih:** _______________________

---

## 5. Sentry PII-sız event smoke

- [ ] Test event fırlat (dev menüsü ya da geçici kod): `Sentry.captureMessage('staging smoke', { extra: { phone: '+90555TEST' } })`
- [ ] Sentry dashboard'da event görünür
- [ ] Event içeriğinde telefon **YOK** — `phone` alanı `[REDACTED]` (PII scrubber çalışıyor)
- [ ] Onboarding sırasında oluşan event'lerde kilo/telefon/isim gibi sağlık/PII verisi yok (sadece event tip + hash)

**Beklenen:** Sentry'de hata yok + PII sızıntısı yok ([`sentry-setup.md`](sentry-setup.md) §PII).

**Not / Tarih:** _______________________

---

## 6. Backblaze yedek teyidi

- [ ] Backblaze B2 bucket'ında son 24 saatte alınmış staging Postgres dump'ı mevcut ([`staging-pg-backup-cron.md`](staging-pg-backup-cron.md))
- [ ] (Aylık restore drill ayrı — [`restore-drill.md`](restore-drill.md))

**Beklenen:** Günlük yedek cron çalışıyor, B2'de dosya var.

**Not / Tarih:** _______________________

---

## Sonuç

- [ ] **Tüm maddeler ✅ → Faz 1 milestone gerçek ortamda doğrulandı.** Verify-phase (UAT) ile gerçek kullanıcı senaryosuyla tekrar doğrulanır.
- [ ] Sorun bulunursa: ilgili task revize edilir, faz kapanmaz (TASK-1.34 Risk planı).

**İmza / Tamamlanma tarihi:** _______________________
