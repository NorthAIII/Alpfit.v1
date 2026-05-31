# TASK-3.06: Push Token Yönetimi — Backend API

**Durum:** ⬜ Bekliyor
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

- [ ] **1. Route Dosyası Oluştur**

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

- [ ] **2. Shared Şema Ekle**

  `shared/src/schemas/` → `pushTokenSchemas.ts` (veya mevcut dosyaya ekle):
  - `registerPushTokenSchema = z.object({ token: z.string().min(1), platform: z.enum(['ios', 'android']) })`
  - `deletePushTokenSchema = z.object({ token: z.string().min(1) })`

- [ ] **3. Route'u Fastify'a Kaydet**

  `backend/src/server.ts` (veya route kayıt dosyası) → `app.register(pushTokenRoutes)`

- [ ] **4. Güvenlik Kontrolleri (plan phase security checklist)**

  Her endpoint için:
  - Ownership: `DELETE` yalnızca `userId = claims.sub` tokenları siler (WHERE userId = sub)
  - Role guard: her iki rol (member + trainer) erişebilir — explicit kontrol
  - Status guard: kullanıcı `deletedAt IS NULL` (mevcut `authenticate` middleware halleder)
  - Input bounding: token max uzunluk (Expo token ~100 chars, FCM ~200 chars → `z.string().max(500)`)

- [ ] **5. Test Yaz**

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

- [ ] `POST /push-tokens` geçerli token + platform → 201, `PushToken` oluştu
- [ ] `POST /push-tokens` aynı token → 201, duplicate satır yok
- [ ] `POST /push-tokens` eksik platform → 400
- [ ] `DELETE /push-tokens` → 204, token silindi
- [ ] Başka kullanıcının token `DELETE` isteği → 204 ama token hâlâ var
- [ ] Auth header eksik → 401
- [ ] `pnpm -F backend test` yeşil

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
