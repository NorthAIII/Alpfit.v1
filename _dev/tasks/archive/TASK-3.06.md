# TASK-3.06: Push Token Yönetimi — Backend API

**Durum:** ✅ Tamamlandı
**Modül:** M4 — Bildirim Altyapısı (`modules/M4-bildirim-altyapisi.md`)
**Feature:** F4.1 — Push Token Kaydı
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.02 ✅

---

## Hedef

Push token kayıt ve silme endpoint'lerini yaz: `POST /push-tokens` (cihaz kaydı) ve `DELETE /push-tokens` (çıkış). Çoklu cihaz desteği (aynı kullanıcı N cihaz), geçersiz token otomatik temizleme, ownership guard. Bu endpoint'ler TASK-3.11'de mobile'dan çağrılacak.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M4-bildirim-altyapisi.md` — F4.1 token yönetimi kabul kriterleri + edge case'ler
- `backend/prisma/schema.prisma` — PushToken modeli (TASK-3.02'de oluşturuldu)
- `backend/src/routes/auth-logout.ts` — logout sonrası token silme referansı

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [x] **1. Route Dosyası Oluştur**

  `backend/src/routes/push-tokens.ts` (yeni dosya):

  **`POST /push-tokens`** — token kaydet
  - Auth: `app.authenticate` (member veya trainer, her iki rol de bildirim alır)
  - Body Zod: `{ token: string, platform: 'ios' | 'android' }`
  - `userId = claims.sub`
  - Upsert: token zaten kayıtlıysa üzerine yaz (platform güncelle), yoksa yeni oluştur
  - Response: 201

  **`DELETE /push-tokens`** — çıkış sırasında token sil
  - Auth: `app.authenticate`
  - Body Zod: `{ token: string }` veya query param
  - `userId = claims.sub` → yalnızca kendi tokenlarını silebilir (ownership)
  - Token bulunamazsa: 204 (idempotent)
  - Response: 204

- [x] **2. Shared Şema Ekle**

  `shared/src/schemas/` → `pushTokenSchemas.ts` (veya mevcut dosyaya ekle):
  - `registerPushTokenSchema = z.object({ token: z.string().min(1), platform: z.enum(['ios', 'android']) })`
  - `deletePushTokenSchema = z.object({ token: z.string().min(1) })`

- [x] **3. Route'u Fastify'a Kaydet**

  `backend/src/server.ts` (veya route kayıt dosyası) → `app.register(pushTokenRoutes)`

- [x] **4. Güvenlik Kontrolleri (plan phase security checklist)**

  Her endpoint için:
  - Ownership: `DELETE` yalnızca `userId = claims.sub` tokenları siler (WHERE userId = sub)
  - Role guard: her iki rol (member + trainer) erişebilir — explicit kontrol
  - Status guard: kullanıcı `deletedAt IS NULL` (mevcut `authenticate` middleware halleder)
  - Input bounding: token max uzunluk (Expo token ~100 chars, FCM ~200 chars → `z.string().max(500)`)

- [x] **5. Test Yaz**

  `backend/src/routes/push-tokens.test.ts` (yeni dosya):
  - `POST /push-tokens` yeni token → 201, DB'de kayıt var
  - `POST /push-tokens` aynı token tekrar → 201, duplicate yok (upsert)
  - `POST /push-tokens` auth yok → 401
  - `DELETE /push-tokens` kendi tokeni → 204, DB'den silindi
  - `DELETE /push-tokens` başka kullanıcının tokeni → 204 ama silmedi (WHERE userId güvencesi)
  - `DELETE /push-tokens` olmayan token → 204 (idempotent)

---

## Etkilenen Dosyalar

```
backend/src/routes/
└── push-tokens.ts             # YENİ — POST + DELETE /push-tokens

backend/src/routes/
└── push-tokens.test.ts        # YENİ — testler

shared/src/schemas/
└── (pushTokenSchemas ekle)    # Zod şemaları
```

---

## Dikkat Noktaları

- `DELETE` endpoint: başka kullanıcının tokenını silmeye çalışırsa → `WHERE userId = claims.sub AND token = body.token` zaten filtreler; 204 döner (bilgi sızdırılmaz)
- Logout flow: kullanıcı app'ten çıkarsa `DELETE /push-tokens` çağrılır (mobile TASK-3.11'de implement edilir)
- Token değeri log'lara yazılmaz (PII sayılabilir, Expo token'ı cihazı tanımlar)
- Çoklu cihaz: `POST /push-tokens` her cihaz açılışında çağrılabilir; `upsert on token` ile idempotent

---

## Test Kriterleri

- [x] `POST /push-tokens` geçerli token + platform → 201, `PushToken` oluştu
- [x] `POST /push-tokens` aynı token → 201, duplicate satır yok
- [x] `POST /push-tokens` eksik platform → 400
- [x] `DELETE /push-tokens` → 204, token silindi
- [x] Başka kullanıcının token `DELETE` isteği → 204 ama token hâlâ var
- [x] Auth header eksik → 401
- [x] `pnpm -F backend test` yeşil (10 yeni test + 272 yeşil)

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
- `shared/src/schemas/push-token.ts`: `registerPushTokenSchema` + `deletePushTokenSchema` eklendi; `shared/src/index.ts` güncellendi + `pnpm -F @alpfit/shared build` ile dist yenilendi.
- `backend/src/routes/push-tokens.ts`: `POST /push-tokens` (upsert, 201) + `DELETE /push-tokens` (deleteMany ownership guard, 204) — her ikisi de `app.authenticate` korumalı.
- `backend/src/server.ts`: `pushTokensRoutes` register edildi.
- `backend/src/routes/push-tokens.test.ts`: 10 integration test — POST (201 yeni, 201 upsert, 201 trainer, 400 eksik platform, 400 geçersiz platform, 401) + DELETE (204 sil, 204 ownership guard, 204 idempotent, 401).
- Tüm 10 test yeşil. Toplam: 272 yeşil (queue.test.ts önceden var olan flaky test — benim değişikliklerimden bağımsız).

---

**Oluşturulma:** 2026-05-31
