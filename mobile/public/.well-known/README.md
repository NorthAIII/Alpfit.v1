# `.well-known/` — Deep Link Association (TASK-1.25)

Bu klasör iOS Universal Link (`apple-app-site-association`) + Android App Link
(`assetlinks.json`) dosyalarını içerir. Expo Router static export / **EAS Hosting**
(Yakın 5) bunları `https://<domain>/.well-known/...` altında servis eder.

## Şu an authoritative değil

Staging Coolify değil **docker-compose + bunker-nginx** ile çalışıyor; bunker-nginx
tüm path'leri `alpfit-backend:3000`'e proxy'liyor. Bu yüzden staging'de
`.well-known/` dosyalarını **backend route** servis ediyor
(`backend/src/routes/well-known.ts`) — env üzerinden (`APPLE_APP_ID`,
`ANDROID_SHA256_CERT_FINGERPRINTS`). Bu statik dosyalar **EAS Hosting yoluna
geçilirse** devreye girer; içerikleri backend route ile **aynı tutulmalı**.

## Placeholder değerler

- `appID` Team ID'si (`STAGINGTEAMID`) — Apple Developer hesabı Yakın 5'te açılınca
  gerçek Team ID ile değişir.
- `sha256_cert_fingerprints` (`FF:FF:...`) — EAS Build imza sertifikası Yakın 5'te
  alınınca gerçek fingerprint ile değişir.

Yanlış fingerprint → Android'de intent chooser çıkar (autoVerify başarısız).
Detay: `_dev/docs/deep-link-test.md`.
