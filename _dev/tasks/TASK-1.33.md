# TASK-1.33: 30 gün cihaz hatırlama (secure storage refresh token)

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.21, TASK-1.22, TASK-1.30

---

## Hedef

Mobile'da refresh token'ı iOS Keychain / Android Keystore üzerinde **secure storage**'da sakla (`expo-secure-store`), app açılışta refresh token varsa otomatik `POST /auth/refresh` çağrılır + access token alınır + login state'i restore edilir. Kullanıcı 30 gün boyunca tekrar OTP girmez. Ayarlar ekranında "Çıkış yap" ve "Tüm cihazlardan çıkış" butonları + token temizleme.

---

## Bağlam

F1.1 PRD: "30 gün cihaz hatırlama varsayılan açık (üye/PT bir cihazda giriş yaptıktan sonra 30 gün tekrar OTP istenmez)", "Şifre YOK — her giriş ya cihaz hatırlama ya da SMS OTP". TASK-1.21'de refresh token rotation backend kuruldu; bu task mobile tarafı secure storage + auto-login akışı.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 oturum yönetimi
- `_dev/phases/PHASE-1.md` — Kapsam Dışı (ayarlar ekranı plan-phase'de değerlendirilir — kapsamda)
- TASK-1.21 — refresh rotation
- TASK-1.22 — logout endpoints

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. expo-secure-store kurulumu**
  - `pnpm -F @alpfit/mobile add expo-secure-store`
  - iOS Keychain, Android Keystore — token'lar OS seviyesinde şifreli
  - Dosya: `mobile/package.json`

- [ ] **2. Auth storage helper**
  - `mobile/src/auth/storage.ts`:
    - `saveTokens({ accessToken, refreshToken }): Promise<void>` — secure store'a yazar
    - `loadTokens(): Promise<{ accessToken, refreshToken } | null>`
    - `clearTokens(): Promise<void>`
  - Keys: `auth.access_token`, `auth.refresh_token`
  - Dosya: `mobile/src/auth/storage.ts`

- [ ] **3. Auth state context (zustand)**
  - `mobile/src/auth/auth-store.ts` — `useAuthStore({ user, accessToken, refreshToken, isAuthenticated, setAuth, clearAuth })`
  - Access token in-memory (Zustand state); refresh token in-memory + secure storage'da kalıcı
  - Dosya: `mobile/src/auth/auth-store.ts`

- [ ] **4. App boot — auto-login akışı**
  - `mobile/app/_layout.tsx` (UPDATE) — app open'da:
    1. `loadTokens()` çağır
    2. `refreshToken` varsa: `POST /auth/refresh` (TASK-1.21) → yeni access + refresh
    3. Başarısızsa: token'ları temizle + onboarding ekranına yönlendir
    4. Başarılıysa: `GET /me` (yeni endpoint — bu task'ta backend eklenir) → user profil + auth state set + home'a navigate
  - Splash screen sırasında bu akış (sade "Yükleniyor..." ekranı)
  - Dosya: `mobile/app/_layout.tsx` (UPDATE), `mobile/src/auth/bootstrap.ts`

- [ ] **5. Backend GET /me endpoint**
  - Authenticated; user profil döner (id, role, firstName, lastName, kvkkConsentAt, healthConsentAt, deletedAt: null)
  - Dosya: `backend/src/routes/me.ts`, `.test.ts`

- [ ] **6. Ayarlar ekranı (minimum)**
  - `mobile/app/(tabs)/settings.tsx` veya `app/profile/settings.tsx`
  - Bu fazda minimum: "Çıkış yap" + "Tüm cihazlardan çıkış" butonları
  - Tap → `POST /auth/logout` veya `/auth/logout-all` (TASK-1.22) + `clearTokens` + onboarding'e navigate
  - Confirm dialog: "Çıkmak istediğine emin misin?"
  - Dosya: `mobile/app/(tabs)/settings.tsx`

- [ ] **7. API client interceptor (refresh on 401)**
  - `mobile/src/api/client.ts` extend — fetch wrapper:
    - 401 yanıtı geldiğinde refresh token ile `/auth/refresh` çağır, yeni access token'la orijinal isteği tekrarla
    - Eğer refresh de 401 dönerse: clearTokens + onboarding'e
  - Concurrent request'lerde 1 refresh paylaşılır (token rotate edilirken aynı eski token'ı tekrar tekrar göndermez)
  - Dosya: `mobile/src/api/client.ts` (UPDATE)

- [ ] **8. Tests**
  - `mobile/src/auth/storage.test.ts` — save/load/clear roundtrip
  - `mobile/src/auth/bootstrap.test.ts` — refresh success/fail akış mock
  - `mobile/src/api/client.test.ts` — 401 interceptor refresh edip retry eder
  - `mobile/app/(tabs)/settings.test.tsx` — logout butonu tap → API + clear
  - Backend `me.test.ts`
  - Dosya: ilgili `.test.ts`'ler

---

## Etkilenen Dosyalar

```
mobile/
├── package.json                                # GÜNCELLE
├── app/
│   ├── _layout.tsx                             # GÜNCELLE
│   └── (tabs)/
│       ├── settings.tsx                        # YENİ
│       └── settings.test.tsx                   # YENİ
└── src/
    ├── auth/
    │   ├── storage.ts                          # YENİ
    │   ├── storage.test.ts                     # YENİ
    │   ├── auth-store.ts                       # YENİ
    │   ├── bootstrap.ts                        # YENİ
    │   └── bootstrap.test.ts                   # YENİ
    └── api/
        ├── client.ts                           # GÜNCELLE
        └── client.test.ts                      # GÜNCELLE
backend/
└── src/routes/
    ├── me.ts                                   # YENİ
    └── me.test.ts                              # YENİ
```

---

## Dikkat Noktaları

- **expo-secure-store iOS biometric:** `requireAuthentication: true` opsiyonu Touch/Face ID gerektirir; v1'de **kapalı** (UX sürtünmesi); biometric Yakın 5+ opsiyonel feature olarak değerlendirilir.
- **Token rotation concurrency:** Birden fazla concurrent request 401 dönerse her biri refresh tetiklemesin — `refreshPromise` singleton tutulur; yarısı refresh'i bekler.
- **Replay detection (TASK-1.21):** Eğer cihaz uzun süre offline kaldıktan sonra refresh tetiklerse + arada user logout-all yaptıysa → 401 + clearTokens + onboarding.
- **Splash screen:** Expo `expo-splash-screen` ile programmatic hide; bootstrap bitince hide.
- **Storage limitler:** expo-secure-store iOS Keychain'de ~512 byte limit; refresh token (44 char base64url) +access token (~400 char JWT) toplam ~500 byte — limit civarında. **Karar:** access token in-memory only, secure'da sadece refresh + minimal user info.

---

## Test Kriterleri

- [ ] Toplam 6+ test PASS
- [ ] Storage roundtrip iOS/Android sim'de manuel doğrulama
- [ ] Auto-login: refresh token aktif → kullanıcı OTP girmeden home'a
- [ ] Logout: token'lar Keychain'den silinir
- [ ] 401 interceptor concurrent request'lerde tek refresh paylaşır
- [ ] Refresh fail (replay vs expired) → clearTokens + onboarding

---

## Karar Noktaları

- **access token storage:** Sadece in-memory (her boot'ta refresh ile yeniden alınır) öneririm — Keychain limit + güvenlik (access kısa ömürlü, kaybedilse problem değil).
- **`GET /me` endpoint scope:** Bu task'ta minimum field; gelecekte profil ekranı için zenginleştirilir.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.33): add secure storage for refresh token and auto-login flow`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
