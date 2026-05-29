# TASK-1.23: PT davet linki üretim endpoint

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.20

---

## Hedef

`POST /invitations` endpoint'i kur — sadece trainer rolü kullanabilir, 6 karakterli benzersiz davet kodu üretir, 30 gün TTL ile `Invitation` tablosuna yazar, response'ta `{ code, url, expiresAt }` döner. `GET /invitations` (PT'nin bekleyen davet listesi) eklenir. `DELETE /invitations/:id` (PT kendi davetini iptal eder) eklenir.

---

## Bağlam

F1.1 PRD: "Benzersiz davet kodu (örn. 6 karakterli) içeren link üretilir: `alpfit.app/davet/{kod}`", "Bir davet linki tek kullanımlık", "30 gün içinde kullanılmazsa otomatik iptal", "PT eş zamanlı birden fazla davet tutabilir". Discuss-phase "Davet linki 30 gün iptal: Lazy-check — link tıklandığında veya liste sorgusunda `expires_at < now()` kontrolü; cron gerekmez."

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 davet üretimi
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → Davet linki 30 gün iptal

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Davet kodu format + lazy expiry kararı

---

## Alt Görevler

- [ ] **1. Invitation modeli**
  - ```prisma
    enum InvitationStatus {
      pending
      accepted
      expired
      cancelled
    }

    model Invitation {
      id           String           @id @default(cuid())
      code         String           @unique
      trainerId    String
      acceptedByUserId String?
      status       InvitationStatus @default(pending)
      expiresAt    DateTime
      createdAt    DateTime         @default(now())
      acceptedAt   DateTime?
      cancelledAt  DateTime?
      trainer      User             @relation("trainer_invitations", fields: [trainerId], references: [id])

      @@index([trainerId, status])
      @@index([code])
      @@index([expiresAt])
    }
    ```
  - User modelinde counter-relation: `trainerInvitations Invitation[] @relation("trainer_invitations")`
  - Migration
  - Dosya: `backend/prisma/schema.prisma`, migration

- [ ] **2. Davet kodu üretim helper**
  - `backend/src/invitations/code.ts`:
    - `generateInvitationCode(): string` — 6 karakter, base32 (Crockford — okunabilir; I/O/U/L harfleri yok)
    - Çakışma çözümü: DB unique constraint + retry (max 3) — alfa 32^6 ≈ 1 milyar kombinasyon, çakışma çok düşük
  - Dosya: `backend/src/invitations/code.ts`

- [ ] **3. POST /invitations route (PT-only)**
  - Authenticated + role guard: `req.user.role !== 'trainer'` → 403
  - Body: `{}` (gerekli alan yok — PT zaten authenticated)
  - Soft-deleted user kontrolü authenticate middleware'inde (TASK-1.20)
  - Code üretilir, `expiresAt = now + 30 days`, status `pending`
  - URL: `https://alpfit.app/davet/{code}` (env'den base URL)
  - AuditLog `invitation_created` (metadata: trainerHash sadece, code YOK — PII değil ama log şişirmemek için)
  - Response 201: `{ id, code, url, expiresAt }`
  - Dosya: `backend/src/routes/invitations-create.ts`

- [ ] **4. GET /invitations (PT'nin bekleyen davetleri)**
  - Authenticated + role guard trainer
  - Query: liste pagination yok (max 50 bekleyen kabul edilebilir)
  - Filter: `trainerId = req.user.sub`, status `pending`, lazy expire (`expiresAt < now` ise status `expired` update + filter dışı bırakılır)
  - Response: `[{ id, code, url, expiresAt }, ...]`
  - Dosya: `backend/src/routes/invitations-list.ts`

- [ ] **5. DELETE /invitations/:id (PT iptal)**
  - Authenticated + role guard trainer
  - Owner check: `invitation.trainerId === req.user.sub` else 403
  - Pending dışı status'ta cancel → 409 (zaten kabul edilmiş veya iptal edilmiş)
  - status `cancelled`, `cancelledAt = now`
  - Response 204
  - Dosya: `backend/src/routes/invitations-cancel.ts`

- [ ] **6. Lazy expiry helper**
  - `backend/src/invitations/expiry.ts`:
    - `markIfExpired(invitation): boolean` — `expiresAt < now` ise status update + return true
    - Liste sorgularında ve accept (TASK-1.24)'te kullanılır
  - Dosya: `backend/src/invitations/expiry.ts`

- [ ] **7. Integration testler**
  - `backend/src/routes/invitations.test.ts`:
    - PT create → 201, kod 6 char base32
    - Member rolü create denemesi → 403
    - 30 gün geçmiş davet list'te `expired` olarak işaretlenir, response'dan çıkar
    - Pending davet cancel → 204
    - Başka PT'nin davet cancel → 403
    - Accepted davet cancel → 409
    - Aynı PT 5 davet üretir, hepsi list'te
    - Unique constraint test: aynı kod üretimi retry mekanizması (mock conflict)
  - Dosya: `backend/src/routes/invitations.test.ts`

---

## Etkilenen Dosyalar

```
backend/
├── prisma/
│   ├── schema.prisma                                     # GÜNCELLE
│   └── migrations/<ts>_invitations/migration.sql         # YENİ
└── src/
    ├── invitations/
    │   ├── code.ts                                       # YENİ
    │   └── expiry.ts                                     # YENİ
    └── routes/
        ├── invitations-create.ts                         # YENİ
        ├── invitations-list.ts                           # YENİ
        ├── invitations-cancel.ts                         # YENİ
        └── invitations.test.ts                           # YENİ
```

---

## Dikkat Noktaları

- **Crockford base32:** 32 karakter alfabesi I/O/U/L olmadan; insan okumasını kolaylaştırır (PT QR yerine kodu sözlü iletebilir).
- **PII:** Davet kodu PII değil; ama log'da gerek yok (audit metadata'da `invitationId` yeterli).
- **URL base env:** `APP_BASE_URL=https://alpfit.app` (`.env.example`'a eklenir; staging'de `https://staging.alpfit.app` veya Coolify URL).
- **PT davet sayı limiti:** v1'de yok; spam abuse Yakın 5 öncesi düşünülebilir.
- **Soft-deleted PT davet üretemez:** authenticate middleware filtreler.

---

## Test Kriterleri

- [ ] 8 senaryo PASS
- [ ] Kod uniqueness garanti (1000 random üretim çakışmaz)
- [ ] Lazy expiry doğru çalışır
- [ ] AuditLog `invitation_created` metadata PII içermez
- [ ] URL formatı `${APP_BASE_URL}/davet/${code}` doğru üretilir

---

## Karar Noktaları

- **Kod uzunluğu 6 mı 8 mi:** F1.1 PRD "6 karakterli". Crockford base32 6 char = 32^6 ≈ 1 milyar; çakışma riski kabul edilebilir.
- **URL path `/davet/` mi `/invite/` mi:** TR pazar — `/davet/` (kullanıcı dostu); Universal/App Link path'i TASK-1.25'te bunu yakalar.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.23): add invitation creation list cancel endpoints`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Davet kodu format (Crockford base32 6 char) + lazy expiry kararı

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
