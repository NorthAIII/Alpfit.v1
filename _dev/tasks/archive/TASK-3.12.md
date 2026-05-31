# TASK-3.12: Mobile — Bildirim Tercihleri Ekranı (Ayarlar > Bildirimler)

**Durum:** ✅ Tamamlandı
**Modül:** M4 — Bildirim Altyapısı (`modules/M4-bildirim-altyapisi.md`)
**Feature:** F4.1 — Bildirim Ayarları (üye tarafı)
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.07 ✅

---

## Hedef

Üyenin bildirim tercihlerini yönettiği "Ayarlar > Bildirimler" ekranını yaz: reminder / comeback / sistem bildirim toggle'ları, sabah reminder saat seçici, izin kapalıysa "İzin ver" CTA. Bu ekran TASK-3.07'de yazılan backend API'yi kullanır.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M4-bildirim-altyapisi.md` — F4.1 bildirim ayarları kabul kriterleri (toggle'lar, saat, PT müdahale yok)
- `mobile/src/api/` — mevcut API client pattern'ı
- `mobile/src/components/` — mevcut component pattern'ı (in-app-banner.tsx stili)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [x] **1. Bildirim Tercihleri API Client**

  `mobile/src/api/notification-preferences.ts` (yeni dosya):
  ```ts
  export async function getNotificationPreferences(): Promise<NotificationPreferences>
  export async function patchNotificationPreferences(patch: Partial<NotificationPreferences>): Promise<NotificationPreferences>
  ```

- [x] **2. `useNotificationPreferences` Hook**

  `mobile/src/hooks/useNotificationPreferences.ts` (yeni dosya):
  - `getNotificationPreferences()` ile veri çek
  - `update(patch)` → `patchNotificationPreferences(patch)` → local state güncelle
  - Loading / error state

- [x] **3. Bildirim Tercihleri Ekranı**

  `mobile/src/components/NotificationPreferencesScreen.tsx` veya mevcut Ayarlar ekranına sekme ekle (proje navigasyon yapısına göre):

  **UI bileşenleri:**
  - **Reminder Bildirimleri** toggle (on/off)
  - **Comeback Bildirimleri** toggle (on/off)
  - **Sistem Bildirimleri** toggle (on/off)
  - **Sabah Reminder Saati** → saat seçici (TimePicker tarzı, "09:00" formatı)
    - Değer değişince anında `PATCH` gönderilir (debounced, 500ms)
  - **Bildirim izni durumu:** İzin kapalıysa üstte uyarı + "İzin ver" butonu (Linking.openSettings())

- [x] **4. Toggle Aksiyonları**

  Her toggle değişiminde `patchNotificationPreferences` çağrılır. Optimistic update: local state hemen güncellenir, API hata dönerse geri alınır.

- [x] **5. Test Yaz**

  - Ekran ilk yüklenince `getNotificationPreferences` çağrıldı (mock API)
  - Reminder toggle kapatılınca `patchNotificationPreferences({ reminderEnabled: false })` çağrıldı
  - Sabah reminder saati değişince `patchNotificationPreferences({ morningHour: 7, morningMinute: 0 })` çağrıldı
  - İzin kapalıysa "İzin ver" butonu görünüyor

---

## Etkilenen Dosyalar

```
mobile/src/
├── api/notification-preferences.ts           # YENİ — API client
├── hooks/useNotificationPreferences.ts        # YENİ — data hook
└── components/NotificationPreferencesScreen.tsx  # YENİ — ekran
```

---

## Dikkat Noktaları

- **PT bu ekrana erişemez** — yalnızca member rolü; navigasyon guard'ı veya role check eklenmeli
- Saat seçici: platform native time picker (`@react-native-community/datetimepicker`) veya custom list; değer morningHour (0-23) + morningMinute (0-59) olarak backend'e gider
- Optimistic update kritik: toggle'ın UI'da hemen yanıt vermesi gerekiyor (ağ gecikme toleransı)
- "İzin ver" butonundan sonra: ekran geri geldiğinde izin durumu yeniden kontrol edilmeli
- Debounce: saat değişimi her slider hareketiyle değil, durma sonrası `PATCH` gönderir (500ms debounce)

---

## Test Kriterleri

- [x] Ekran ilk açılışında `getNotificationPreferences` çağrıldı, değerler gösteriliyor
- [x] Reminder toggle off → `patchNotificationPreferences` çağrıldı, UI off state
- [x] API hata dönünce toggle geri döndü (optimistic rollback)
- [x] Sabah saati değişimi → debounce sonrası `PATCH` çağrıldı
- [x] İzin kapalıysa banner + "İzin ver" CTA görünüyor
- [x] Tüm testler yeşil

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-31
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `mobile/src/api/notification-preferences.ts` — `getNotificationPreferences` + `patchNotificationPreferences` API client; `NotificationPreferences` tipi tanımlandı.
- `mobile/src/hooks/useNotificationPreferences.ts` — mount'ta yükleme, optimistic `update()`, rollback; stale-closure için `dataRef` pattern.
- `mobile/src/components/NotificationPreferencesScreen.tsx` — 3 toggle (reminder/comeback/system), +/− saat seçici (debounced 500ms), izin banner + "İzin ver" CTA (Linking.openSettings), member-only role guard.
- `mobile/app/home/notifications.tsx` — route (named export re-export).
- 15 yeni test: `useNotificationPreferences.test.ts` (4) + `NotificationPreferencesScreen.test.tsx` (11). Tüm suite: 279 yeşil.

---

**Oluşturulma:** 2026-05-31
