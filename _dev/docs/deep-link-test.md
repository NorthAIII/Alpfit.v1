# Deep Link Test Rehberi (TASK-1.25)

Bu rehber iOS Universal Link + Android App Link + custom scheme deep link'inin
**elle** nasıl test edileceğini anlatır. Otomatik testler (`backend` well-known +
web-fallback, `mobile` davet ekranı component testi) CI'da koşar; gerçek cihaz
davranışı (OS'in linki app'e yönlendirmesi) **fiziksel cihaz + imzalı build**
gerektirir, bu yüzden manueldir.

## Mimari özet

- **Davet linki:** `https://<domain>/davet/{kod}` (`APP_BASE_URL` + `/davet/{kod}`).
- **Domain'ler (app.config.ts `DEEP_LINK_DOMAINS`):**
  - `alpfit-staging.kiwiailab.com` — gerçek staging (bunker-nginx → backend).
  - `alpfit.app` — prod placeholder (Yakın 5'te domain alınınca aktif).
- **`.well-known/` servisi:** Staging'de **backend route** servis ediyor
  (`backend/src/routes/well-known.ts`); Coolify yok, bunker-nginx tüm path'leri
  `alpfit-backend:3000`'e proxy'liyor. EAS Hosting'e geçilirse
  `mobile/public/.well-known/` statik kopyaları devreye girer (içerik aynı).
- **Custom scheme:** `alpfit://davet/{kod}` (app.json `scheme: "alpfit"`) — dev
  client / simulator testleri için (domain doğrulaması gerektirmez).

## 1. `.well-known/` dosyaları (curl)

Staging deploy sonrası:

```bash
# iOS — uzantısız, Content-Type application/json olmalı
curl -i https://alpfit-staging.kiwiailab.com/.well-known/apple-app-site-association
#  → 200, content-type: application/json
#  → {"applinks":{"apps":[],"details":[{"appID":"<TeamID>.app.alpfit.mobile","paths":["/davet/*"]}]}}

# Android
curl -i https://alpfit-staging.kiwiailab.com/.well-known/assetlinks.json
#  → 200, content-type: application/json
#  → [{"relation":[...],"target":{"package_name":"app.alpfit.mobile","sha256_cert_fingerprints":[...]}}]
```

**Kontrol:** Content-Type **kesinlikle** `application/json` olmalı. iOS yanlış MIME
veya yönlendirme (3xx) olursa AASA'yı reddeder.

## 2. Masaüstü fallback (curl + tarayıcı)

```bash
curl -i https://alpfit-staging.kiwiailab.com/davet/ABC123
#  → 200, content-type: text/html; charset=utf-8
#  → davet linki + inline QR (data:image/png;base64,...) + "mobil cihazda aç"
```

Tarayıcıda aç: QR + davet linki + TR yönlendirme görünmeli. QR **inline data-URI**
(harici QR servisi yok — davet kodu 3. tarafa sızmaz).

## 3. Custom scheme (dev client / simulator)

EAS dev client veya `expo run:ios` / `expo run:android` ile cihaza/simülatöre
kurduktan sonra:

```bash
# iOS Simulator
xcrun simctl openurl booted "alpfit://davet/ABC123"

# Android emulator/cihaz
adb shell am start -W -a android.intent.action.VIEW -d "alpfit://davet/ABC123" app.alpfit.mobile
```

Beklenen: app açılır, `app/davet/[code].tsx` yüklenir, `GET /invitations/ABC123`
preview çağrısı yapılır (geçerli davette PT adı + son geçerlilik; geçersizde TR
hata mesajı).

## 4. Universal Link (iOS — gerçek cihaz, imzalı build)

> Apple Developer hesabı + gerçek Team ID + imzalı build gerekir (Yakın 5).

1. `APPLE_APP_ID` env'ine **gerçek** `<TeamID>.app.alpfit.mobile` gir, staging'i
   yeniden deploy et (AASA güncellensin).
2. TestFlight / EAS internal build cihaza yükle.
3. **Notlar** uygulamasına `https://alpfit-staging.kiwiailab.com/davet/ABC123`
   yapıştır, tıkla → app açılmalı (Safari'de açılmamalı).
4. **AASA cache tuzağı:** iOS AASA'yı saatlerce cache'ler. Test öncesi:
   *Ayarlar → Geliştirici → Reset Universal Links* (veya app'i sil/yeniden kur).

## 5. App Link (Android — gerçek cihaz/emulator, imzalı build)

> Gerçek EAS Build imza sertifikası SHA256 fingerprint'i gerekir (Yakın 5).

1. EAS Build cert fingerprint'ini al (`eas credentials` veya Google Play Console),
   `ANDROID_SHA256_CERT_FINGERPRINTS` env'ine gir, staging'i yeniden deploy et.
2. İmzalı APK/AAB cihaza yükle.
3. Doğrulama durumu:
   ```bash
   adb shell pm get-app-links app.alpfit.mobile
   #  → host'lar "verified" olmalı
   ```
4. `adb shell am start -a android.intent.action.VIEW -d "https://alpfit-staging.kiwiailab.com/davet/ABC123"`
   → app doğrudan açılmalı (intent chooser çıkmamalı). Çıkıyorsa fingerprint
   yanlış/eksik.

## Yakın 5 yapılacaklar (placeholder → gerçek)

- [ ] `APPLE_APP_ID` → gerçek Apple Team ID.
- [ ] `ANDROID_SHA256_CERT_FINGERPRINTS` → gerçek EAS Build cert fingerprint.
- [ ] `mobile/public/.well-known/*` statik kopyaları aynı değerlerle güncelle
      (EAS Hosting yoluna geçilirse).
- [ ] Prod domain `alpfit.app` alınınca `APP_BASE_URL` + DNS + `.well-known/`
      prod'a da deploy.
- [ ] iOS AASA 24h cache penceresini hesaba kat (yayın öncesi test).
