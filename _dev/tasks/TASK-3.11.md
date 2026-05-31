# TASK-3.11: Mobile — Push Token Kaydı + Bildirim İzni Akışı

**Durum:** ⬜ Bekliyor
**Modül:** M4 — Bildirim Altyapısı (`modules/M4-bildirim-altyapisi.md`)
**Feature:** F4.1 — Push İzni + Token
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.06 ✅

---

## Hedef

Mobile tarafında Expo push notification kurulumunu yap: token alma, backend'e kaydetme, ilk antrenman tamamlama sonrası izin isteme akışı (açıklama ekranı + native diyalog), app açılışında token yenileme, logout'ta token silme. Simulator'da push çalışmaz — izin ekranı + token flow unit test + mock ile test edilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M4-bildirim-altyapisi.md` — F4.1 izin yönetimi kabul kriterleri (timing, reddedilirse ne olur, in-app banner)
- `_dev/phases/PHASE-3.md` §Araştırma Bulguları (expo-notifications, simulator push çalışmaz uyarısı) + §Kapsam Tartışması (izin zamanlaması: ilk antrenman bitince)
- `mobile/src/hooks/useCompleteWorkout.ts` — antrenman tamamlama hook'u (izin isteği buraya eklenir)
- `mobile/src/api/push-tokens.ts` — oluşturulacak API client

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [ ] **1. expo-notifications Kurulumu**
  - `pnpm -F mobile add expo-notifications` (Expo SDK 56 uyumlu — PHASE-3.md araştırma)
  - `app.json` veya `app.config.js`'e gerekli izin bildirimlerini ekle (iOS: `NSUserNotificationsUsageDescription`, Android: FCM config)

- [ ] **2. Push Token API Client**

  `mobile/src/api/push-tokens.ts` (yeni dosya):
  ```ts
  export async function registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void>
  export async function deletePushToken(token: string): Promise<void>
  ```

- [ ] **3. `usePushToken` Hook**

  `mobile/src/hooks/usePushToken.ts` (yeni dosya):
  - `getExpoPushTokenAsync()` ile token al (fiziksel cihaz / Expo Go)
  - `registerPushToken(token, platform)` → backend'e kaydet
  - Simulator'da push çalışmaz → try/catch, hata logla ama akışı engelleme
  - `useEffect` on mount: token refresh (app açılışında)

- [ ] **4. `useNotificationPermission` Hook**

  `mobile/src/hooks/useNotificationPermission.ts` (yeni dosya):
  - `getPermissionsAsync()` → mevcut izin durumu
  - `requestPermissionsAsync()` → native dialog göster
  - `granted: boolean` state yönetimi

- [ ] **5. İzin İsteme Akışı (İlk Antrenman Sonrası)**

  `mobile/src/hooks/useCompleteWorkout.ts` → antrenman başarıyla tamamlanınca:
  - Daha önce hiç izin istenmemiş mi kontrol et (AsyncStorage veya store flag)
  - İstenmemişse: açıklama ekranı göster (`NotificationPermissionModal`)
  - Modal "İzin Ver" → `requestPermissionsAsync()` → native diyalog → token al + backend'e kaydet
  - Modal "Şimdi Değil" → dismiss, bir daha bu oturumda sorma

  `mobile/src/components/NotificationPermissionModal.tsx` (yeni dosya):
  - İzin neden istendiğini açıklayan kısa metin
  - "İzin Ver" ve "Şimdi Değil" butonları
  - Açıklama ekranı (native diyalog'tan önce gösterilir)

- [ ] **6. Logout'ta Token Silme**

  Mevcut logout akışına (auth store veya logout hook) `deletePushToken(token)` çağrısı ekle.

- [ ] **7. İzin Reddedilince UI**

  İzin reddedilmişse: üye ana ekranında üst uyarı banner (haftada bir tekrar, kapatılabilir). Banner bileşeni mevcut `in-app-banner.tsx` üzerine kurulabilir; `"Bildirim izni kapalı — reminder almıyorsun. Aç →"` text ile cihaz ayarlarına link.

---

## Etkilenen Dosyalar

```
mobile/
├── package.json                         # expo-notifications eklendi
├── app.json / app.config.js             # izin bildirim metinleri

mobile/src/
├── api/push-tokens.ts                   # YENİ — API client
├── hooks/
│   ├── usePushToken.ts                  # YENİ — token alma + kaydetme
│   ├── useNotificationPermission.ts     # YENİ — izin yönetimi
│   └── useCompleteWorkout.ts            # izin isteme akışı eklendi
└── components/
    └── NotificationPermissionModal.tsx  # YENİ — açıklama modal
```

---

## Dikkat Noktaları

- **Simulator'da push çalışmaz** — `getExpoPushTokenAsync()` simulator'da hata fırlatır; try/catch ile handle et, hata logla, akışı engelleme
- İzin isteği **ilk antrenman sonrası** — onboarding'de değil. `useCompleteWorkout` hook'u doğru tetik noktası
- İzin reddedildikten sonra app native dialog'u **tekrar açamaz** (iOS/Android kısıtı); yalnızca cihaz ayarlarına yönlendir (`Linking.openSettings()`)
- `AsyncStorage` veya zustand store: "izin istendi mi?" flag → oturumlararası kalıcı (AsyncStorage)
- Token refresh: her app açılışında `usePushToken` mount'unda çalışır (idempotent `POST /push-tokens`)
- Multi-cihaz: aynı kullanıcı iki cihazda → her cihazın kendi tokeni backend'de ayrı kayıt

---

## Test Kriterleri

- [ ] `usePushToken` — mock token ile `registerPushToken` API çağrısı yapıldı (unit test, mock expo-notifications)
- [ ] `useNotificationPermission` — izin `granted` state doğru yönetiliyor (unit test)
- [ ] İlk antrenman sonrası `NotificationPermissionModal` gösteriliyor (snapshot veya render test)
- [ ] "Şimdi Değil" → modal kapanıyor, bir daha açılmıyor
- [ ] Logout → `deletePushToken` çağrıldı (mock API)
- [ ] Simulator'da push token alınamıyor ama akış çökmüyor (error boundary)

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi

---

## Oturum Kayıtları

*(Task çalıştırılınca doldurulacak)*

---

**Oluşturulma:** 2026-05-31
