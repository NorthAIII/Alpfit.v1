# TASK-3.07: Bildirim Tercihleri — Backend API

**Durum:** ⬜ Bekliyor
**Modül:** M4 — Bildirim Altyapısı (`modules/M4-bildirim-altyapisi.md`)
**Feature:** F4.1 — Bildirim Ayarları
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.02 ✅

---

## Hedef

Üyenin bildirim tercihlerini okuma ve güncelleme endpoint'lerini yaz: `GET /notification-preferences` ve `PATCH /notification-preferences`. İlk erişimde satır yoksa default değerlerle upsert yapılır. Bu endpoint'ler sabah reminder job'ı (TASK-3.08) ve mobile ayarlar ekranı (TASK-3.12) tarafından kullanılır.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M4-bildirim-altyapisi.md` — F4.1 bildirim ayarları kabul kriterleri (reminder/comeback/sistem toggleları, saat)
- `backend/prisma/schema.prisma` — NotificationPreference modeli (TASK-3.02)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [ ] **1. Route Dosyası Oluştur**

  `backend/src/routes/notification-preferences.ts` (yeni dosya):

  **`GET /notification-preferences`** — mevcut tercihleri döndür
  - Auth: `app.authenticate`, yalnızca `member` rolü
  - `memberId = claims.sub`
  - Satır yoksa upsert (default değerlerle) yap ve döndür
  - Response: 200, `{ reminderEnabled, comebackEnabled, systemEnabled, morningHour, morningMinute }`

  **`PATCH /notification-preferences`** — tercihleri güncelle
  - Auth: `app.authenticate`, yalnızca `member` rolü
  - Body Zod: tüm alanlar opsiyonel (partial update)
    - `reminderEnabled?: boolean`
    - `comebackEnabled?: boolean`
    - `systemEnabled?: boolean`
    - `morningHour?: number` (0-23)
    - `morningMinute?: number` (0-59)
  - Satır yoksa önce oluştur (upsert); varsa update
  - Response: 200, güncel tercih objesi
  - **PT bu endpoint'e erişemez** (role guard: member only)

- [ ] **2. Shared Şema Ekle**

  `shared/src/schemas/` → `notificationPreferenceSchema` Zod şeması:
  - `patchNotificationPreferenceSchema` — tüm alanlar optional, morningHour 0-23 arası, morningMinute 0-59 arası

- [ ] **3. Route'u Fastify'a Kaydet**

  `backend/src/server.ts` → `app.register(notificationPreferencesRoutes)`

- [ ] **4. Güvenlik Kontrolleri**
  - Role: yalnızca `member` erişir (PT'nin üyenin tercihini görmesi/değiştirmesi yasak — M4 gizlilik kuralı)
  - Ownership: `memberId = claims.sub` (implicit — herkes kendi tercihini okur)
  - Input bounding: morningHour 0-23, morningMinute 0-59 (Zod `.min(0).max(23)`)
  - Status guard: `deletedAt IS NULL` (authenticate middleware)

- [ ] **5. Test Yaz**

  `backend/src/routes/notification-preferences.test.ts` (yeni dosya):
  - `GET` satır yok → 200, default değerler
  - `GET` satır var → 200, gerçek değerler
  - `PATCH { morningHour: 7 }` → 200, güncellendi
  - `PATCH { morningHour: 25 }` → 400 (validation hata)
  - Trainer rolü `GET` → 403
  - Auth yok → 401

---

## Etkilenen Dosyalar

```
backend/src/routes/
├── notification-preferences.ts       # YENİ — GET + PATCH
└── notification-preferences.test.ts  # YENİ — testler

shared/src/schemas/
└── (notificationPreferenceSchema ekle)
```

---

## Dikkat Noktaları

- PT'nin üyenin bildirim tercihine **erişimi yok** — bu M4 gizlilik kuralıdır (M4 modül dokümanı: "PT üyenin bildirim ayarını göremez/değiştiremez")
- `morningHour` + `morningMinute` ayrı saklanır — timezone offset olmadan (Europe/Istanbul sabit v1'de)
- Upsert default: `{ reminderEnabled: true, comebackEnabled: true, systemEnabled: true, morningHour: 9, morningMinute: 0 }`
- Sabah reminder job'ı `GET /notification-preferences` çağırmaz; doğrudan DB'den `NotificationPreference.findMany` yapar (server-side job — token yoktur)

---

## Test Kriterleri

- [ ] `GET /notification-preferences` — satır yok → default değerler dönüyor
- [ ] `GET /notification-preferences` — satır var → güncel değerler dönüyor
- [ ] `PATCH /notification-preferences` morningHour güncellendi → `GET` yeni değer dönüyor
- [ ] `PATCH { morningHour: 25 }` → 400
- [ ] Trainer rolü `GET` → 403
- [ ] Auth eksik → 401

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
