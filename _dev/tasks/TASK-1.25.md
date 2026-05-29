# TASK-1.25: Deep link kurulumu (Universal Link + App Link + .well-known/)

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.05, TASK-1.23

---

## Hedef

iOS Universal Link + Android App Link altyapısını kur — `.well-known/apple-app-site-association` + `.well-known/assetlinks.json` dosyaları backend tarafından (veya EAS Hosting üzerinden) `alpfit.app` domain'inde servis edilir. Expo Router `app/davet/[code].tsx` dynamic route'u deep link'i karşılar. Universal/App Link açıldığında: app yüklüyse → app açılır + davet kodu otomatik geçer; yüklü değilse → app store yönlendirme + clipboard kod yakalama.

---

## Bağlam

F1.1 PRD: "Davet linkine tıklayan üye app store'a yönlendirilir; app açıldığında davet kodu otomatik tanınır (deep link)", "Davet linkine masaüstünden tıklayan kullanıcıya 'Mobile cihazda aç' QR kod gösterilir". Discuss-phase: "Deep link (Universal Link + App Link) konfigürasyonu domain'e bağlı — prod domain Yakın 5'te test edilir." Bu task **staging domain veya geçici alpfit.app kullanımı** ile yapılır; prod domain'e taşıma Yakın 5'te tek string değişikliği.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 deep link + masaüstü fallback
- `_dev/phases/PHASE-1.md` — Araştırma → Deep link = Expo Router + EAS Hosting `.well-known/`
- `_dev/ILKELER.md` §"Kalıcılık önceliği"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Universal Link/App Link kurulumu + .well-known servis kararı

---

## Alt Görevler

- [ ] **1. Apple App Site Association (AASA)**
  - `mobile/public/.well-known/apple-app-site-association` (Expo Router public assets) JSON:
    ```json
    {
      "applinks": {
        "apps": [],
        "details": [{
          "appID": "<TEAM_ID>.app.alpfit.mobile",
          "paths": ["/davet/*"]
        }]
      }
    }
    ```
  - TEAM_ID placeholder (Apple Developer hesabı Yakın 5'te alınır; o ana kadar `STAGING_TEAM_ID`)
  - **Content-Type: application/json** olarak serve edilir (Coolify/EAS Hosting otomatik)
  - Dosya: `mobile/public/.well-known/apple-app-site-association` veya backend statik servis

- [ ] **2. Android Asset Links**
  - `mobile/public/.well-known/assetlinks.json`:
    ```json
    [{
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "app.alpfit.mobile",
        "sha256_cert_fingerprints": ["<EAS_SIGNING_CERT_SHA256>"]
      }
    }]
    ```
  - SHA256 fingerprint EAS Build cert'inden (Yakın 5'te alınır; staging için EAS dev cert kullanılabilir)
  - Dosya: `mobile/public/.well-known/assetlinks.json`

- [ ] **3. Backend `.well-known/` route'u (eğer EAS Hosting yoksa)**
  - **Karar:** EAS Hosting Expo'nun resmi `.well-known/` servisini sunuyor; staging'de Coolify backend bu dosyaları statik servis eder.
  - `backend/src/routes/well-known.ts` — `GET /.well-known/apple-app-site-association` + `GET /.well-known/assetlinks.json` statik içerik döner, **Content-Type: application/json**
  - Bu task'ta Coolify üzerinden backend serve eder; EAS Hosting'e geçiş Yakın 5'te ayrı task (faz dışı)
  - Dosya: `backend/src/routes/well-known.ts`

- [ ] **4. Expo Router deep link konfigürasyonu**
  - `mobile/app.config.ts`:
    - `scheme: "alpfit"` (custom scheme — `alpfit://davet/CODE` testlerde)
    - `ios.associatedDomains: ["applinks:alpfit.app", "applinks:staging.alpfit.app"]`
    - `android.intentFilters` — autoVerify + host `alpfit.app` ve `staging.alpfit.app`
  - Dosya: `mobile/app.config.ts` (UPDATE)

- [ ] **5. `app/davet/[code].tsx` dynamic route (mobile)**
  - Davet kodunu route param'dan okur
  - `GET /invitations/:code` preview endpoint çağrılır (TASK-1.24)
  - Eğer auth değilse: rol seçim akışına yönlendir + kodu state'te tut
  - Eğer auth + member ise: davet kabul akışına geç (`POST /invitations/:code/accept` — TASK-1.24)
  - Eğer auth + PT ise: hata "PT olarak davet kabul edemezsin"
  - Dosya: `mobile/app/davet/[code].tsx`

- [ ] **6. Web fallback (masaüstü)**
  - `mobile/public/davet/[code].html` — basit statik HTML "Mobil cihazda aç" + QR kod (davet linki QR'ı)
  - **Alternatif:** backend `GET /davet/:code` HTML response ile aynı; Expo Router static export hangi yaklaşım kullanılırsa
  - **Karar:** Backend route döner (basit + dinamik QR olabilir). UI tasarım basit (TR sade dil).
  - Dosya: `backend/src/routes/davet-web-fallback.ts`

- [ ] **7. Test plan (manuel)**
  - Universal Link test rehberi: TestFlight veya EAS Dev Client build + cihaza yükle + Notes uygulamasından linki tıkla
  - App Link test: Android `adb shell am start ...` ile intent test
  - Bu task'ta otomatik test sınırlı (gerçek cihaz şart); component-level test deep link param parse
  - Dosya: `_dev/docs/deep-link-test.md`

---

## Etkilenen Dosyalar

```
mobile/
├── app.config.ts                                       # GÜNCELLE
├── app/
│   └── davet/
│       └── [code].tsx                                  # YENİ
└── public/.well-known/
    ├── apple-app-site-association                      # YENİ
    └── assetlinks.json                                 # YENİ
backend/
└── src/routes/
    ├── well-known.ts                                   # YENİ
    └── davet-web-fallback.ts                           # YENİ
_dev/docs/
└── deep-link-test.md                                   # YENİ
```

---

## Dikkat Noktaları

- **TEAM_ID + SHA256 placeholder:** Apple Developer + Google Play hesapları Yakın 5'te açılır; bu task'ta `.well-known/` JSON'larında placeholder; Yakın 5'te tek string değişikliği.
- **AASA cache (iOS):** Apple AASA'yı saatlerce cache eder; debug için Settings → Developer → Reset Universal Links.
- **Content-Type kritik:** `apple-app-site-association` MIME `application/json` (uzantısız!), `assetlinks.json` aynı. Coolify reverse proxy'sini bu MIME için ayarla.
- **autoVerify true (Android):** Google Play tüm app linkleri otomatik doğrular; SHA256 fingerprint eksikse intent chooser çıkar.
- **Staging vs prod domain:** Bu task'ta staging Coolify URL veya placeholder `alpfit.app`; prod domain Yakın 5'te alındığında `.well-known/` servisinin oraya da deploy edilmesi gerekir.

---

## Test Kriterleri

- [ ] `curl https://staging.../​.well-known/apple-app-site-association` → 200 + Content-Type application/json + doğru içerik
- [ ] `curl https://staging.../​.well-known/assetlinks.json` → 200 + Content-Type application/json
- [ ] Component test: `<DavetCodeScreen code="ABC123" />` render eder, preview endpoint mock'lanır
- [ ] Manuel cihaz testi: dev client'ta `alpfit://davet/ABC123` açılınca dynamic route load eder
- [ ] Masaüstü `/davet/ABC123` URL'i HTML fallback döner (QR + mobile yönlendirme)

---

## Karar Noktaları

- **`.well-known/` nerede:** Backend serve (basit, dinamik); EAS Hosting Yakın 5'te değerlendirilir. → Backend öneririm.
- **TEAM_ID placeholder:** Yakın 5 öncesi Apple hesabı açıldığında tek string change; bu task'ta development team ID veya dummy.
- **Custom scheme + Universal Link beraber:** `alpfit://` dev test için, `https://alpfit.app/davet/...` production için. İkisi de support edilir.

---

## Risk ve Geri Dönüş Planı

- **Risk:** AASA cache iOS'ta deploy sonrası yanlış davranışı saatlerce sürdürür.
  - **Mitigation:** Settings reset + dev cihaz test; production yayın öncesi 24h test penceresi.
- **Risk:** SHA256 fingerprint yanlışsa Android App Link çalışmaz, intent chooser çıkar.
  - **Mitigation:** EAS Build cert + Google Play console fingerprint sync; Yakın 5'te.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı (manuel deep link smoke için kullanıcı gerek)
- [ ] Git commit & push yapıldı (`feat(TASK-1.25): set up universal link and app link with .well-known files`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Deep link kurulumu kararı

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
