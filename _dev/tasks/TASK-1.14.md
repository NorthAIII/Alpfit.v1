# TASK-1.14: KVKK consent schema + audit log

**Durum:** ⬜ Bekliyor
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.13

---

## Hedef

KVKK uyumu için consent ve audit log şemasını Prisma'ya ekle: `ConsentRecord` (versiyonlu — kullanıcı hangi metin sürümünü onayladı, ne zaman verdi/geri çekti), `AuditLog` (KVKK denetiminde "kim, ne zaman, neyi değiştirdi" gereksinimi için append-only event log; üye sağlık verisi YAZILMAZ — sadece event tip + user ID hash). Migration uygula, integration test KVKK senaryolarını doğrulasın.

---

## Bağlam

Discuss-phase rıza ekran kararı: tek ekran, iki tickbox — KVKK aydınlatma (zorunlu) + sağlık verisi açık rıza (opsiyonel). `User.kvkkConsentAt` + `healthConsentAt` (TASK-1.13) **anlık durum** içindir; tarihsel kayıt (versiyonlu metin, geri çekme tarihi, audit zinciri) ayrı `ConsentRecord` tablosunda. KVKK Madde 6 + Madde 11: veri sahibi rızasını ne zaman/hangi metni okuyarak verdiğinin denetlenebilir kaydı şart.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §4 (KVKK Çerçevesi)
- `_dev/modules/M6-saglik-verisi.md` — KVKK + gizlilik toggle paterni
- `_dev/KVKK.md` (boş şablon — gelecek dolacak; bu task şema kurar, metin bağımsız)
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → KVKK + Yasal
- `_dev/QUALITY.md` §2

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Versiyonlu consent + append-only audit log şema kararı
- `_dev/KVKK.md` — şema referansı + audit policy not

---

## Alt Görevler

- [ ] **1. ConsentRecord modeli**
  - ```prisma
    enum ConsentType {
      kvkk_aydinlatma       // zorunlu — hesap açma için
      saglik_verisi         // opsiyonel — ölçüm/yemek için
      pazarlama_iletisim    // v1.5 adayı; şimdi tanımlı, kullanım sonra
    }

    enum ConsentEventType {
      granted
      revoked
      auto_revoked          // 30 gün retention sonrası otomatik
    }

    model ConsentRecord {
      id            String           @id @default(cuid())
      userId        String
      consentType   ConsentType
      eventType     ConsentEventType
      textVersion   String           // örn. "v2026-05-29"
      occurredAt    DateTime         @default(now())
      ipAddress     String?          // KVKK denetim — bilinçli toplanır
      userAgent     String?
      user          User             @relation(fields: [userId], references: [id])

      @@index([userId, consentType])
      @@index([occurredAt])
    }
    ```
  - **Append-only:** ConsentRecord row'u **silinmez, güncellenmez**. Geri çekme = yeni `revoked` event'i; verme = yeni `granted` event'i. Mevcut durum query: `SELECT ... ORDER BY occurredAt DESC LIMIT 1`.
  - `User.kvkkConsentAt` ve `healthConsentAt` (TASK-1.13'te ekledik) **denormalized cache** olarak kalır — query basitliği için; truth source ConsentRecord.

- [ ] **2. AuditLog modeli (append-only event log)**
  - ```prisma
    enum AuditEventType {
      user_created
      user_login
      user_logout
      user_logout_all
      otp_sent
      otp_verified
      otp_verify_failed
      consent_granted
      consent_revoked
      invitation_created
      invitation_accepted
      member_removed
      refresh_rotated
      refresh_replay_detected
      refresh_expired
      retention_purge
      // v1'de bu kadar; v1.5+ ölçüm/yemek event'leri eklenir
    }

    model AuditLog {
      id           String          @id @default(cuid())
      userIdHash   String          // sha256(user_id) ilk 16 karakter — ham ID değil
      eventType    AuditEventType
      occurredAt   DateTime        @default(now())
      metadata     Json?           // PII içermez; sadece event-specific minimal bilgi

      @@index([userIdHash])
      @@index([occurredAt])
      @@index([eventType])
    }
    ```
  - **PII YASAK:** `metadata` JSON'unda kilo/boy/yemek/telefon/isim YOK. Validator zod schema ile (TASK-1.14 helper) enforce edilir.
  - **userIdHash:** Ham user ID değil, sha256 prefix; KVKK ihlal halinde audit log "kim" sorusunu hash üzerinden cevaplar (correlations için yeterli, broad disclosure önler).

- [ ] **3. Migration**
  - `pnpm -F @alpfit/backend exec prisma migrate dev --name kvkk_consent_audit`
  - Migration SQL'ini incele
  - Dosya: `backend/prisma/migrations/<ts>_kvkk_consent_audit/migration.sql`

- [ ] **4. Application helper'lar**
  - `backend/src/kvkk/consent.ts` — `recordConsent(userId, type, event, textVersion, ctx)`, `getActiveConsent(userId, type) -> boolean`
  - `backend/src/kvkk/audit.ts` — `logAuditEvent(userId, eventType, metadata)` — metadata zod ile validate (PII alanları reddedilir)
  - Dosya: `backend/src/kvkk/consent.ts`, `backend/src/kvkk/audit.ts`

- [ ] **5. PII guard test (KRİTİK)**
  - `backend/src/kvkk/audit.test.ts`:
    - `logAuditEvent(userId, 'user_login', { phone: '+90...' })` → zod validator hata fırlatır (PII reddedildi)
    - `logAuditEvent(userId, 'user_login', { ip: '1.2.3.4', deviceType: 'ios' })` → kabul edilir
    - Yazılan row'da `userIdHash` ham `userId`'den farklı (hash uygulandı)
  - Dosya: `backend/src/kvkk/audit.test.ts`

- [ ] **6. ConsentRecord testleri**
  - `backend/src/kvkk/consent.test.ts`:
    - `recordConsent` `granted` event yazar, `getActiveConsent` true döner
    - `recordConsent` `revoked` event yazar, `getActiveConsent` false döner
    - Eski `granted` event hala DB'de (append-only doğrulanır)
    - User.healthConsentAt denormalized field consent değişikliğinde güncellenir
  - Dosya: `backend/src/kvkk/consent.test.ts`

- [ ] **7. PII_FIELDS güncellemesi**
  - `ipAddress`, `userAgent` consent context için TOPLANIR; ama AuditLog metadata'sında PII listesi gözden geçirilir
  - `shared/src/pii-fields.ts` güncel tutulur (Sentry log'a IP geçerse opsiyonel scrub)
  - **Karar:** IP audit için bilinçli toplanır (KVKK denetim için gerekli); Sentry'ye gönderilmez. Memory'deki `kvkk-pii-scrubbing-matrisi.md` bu nüansı dokümante eder.

---

## Etkilenen Dosyalar

```
backend/
├── prisma/
│   ├── schema.prisma                                        # GÜNCELLE
│   └── migrations/<ts>_kvkk_consent_audit/
│       └── migration.sql                                    # YENİ
└── src/kvkk/
    ├── consent.ts                                           # YENİ
    ├── consent.test.ts                                      # YENİ
    ├── audit.ts                                             # YENİ
    └── audit.test.ts                                        # YENİ
shared/src/
└── pii-fields.ts                                            # GÜNCELLE (IP nüansı)
_dev/KVKK.md                                                 # GÜNCELLE (şema referansı)
_dev/memory/kvkk-pii-scrubbing-matrisi.md                    # GÜNCELLE (IP audit nüansı)
```

---

## Dikkat Noktaları

- **textVersion KVKK metin sürümü:** Hukuki danışman onaylı metin değiştiğinde (Yakın 4 öncesi) text version bump; eski rıza geçerli mi yeni text gerektirir mi → hukuki karar (`KVKK.md`'ye not edilir TODO).
- **Append-only enforcement:** ORM level; ConsentRecord ve AuditLog'da `update` ve `delete` operasyonu kod-incelemede yasak — yardımcı `forbidUpdate()` runtime guard ekleyebilir, ama practical olarak code review + lint kuralı (gelecek).
- **AuditLog retention:** v1'de sınırsız tutulur (storage düşük); v1.5'te 7 yıl + sonra purge politikası KVKK denetim sürelerine göre belirlenir.
- **KVKK manuel test:** "Kullanıcı consent geri çekti" senaryosunda 30 gün retention job (TASK-1.15) tetiklenir; bu task'ta sadece consent kaydı, retention TASK-1.15.

---

## Test Kriterleri

- [ ] Migration başarılı uygular
- [ ] `consent.test.ts` 4 senaryo PASS (granted, revoked, append-only, denormalized sync)
- [ ] `audit.test.ts` 2 senaryo PASS (PII reddedildi, hash uygulandı)
- [ ] AuditLog metadata zod schema yanlış payload'ı reddeder (PII alanı)
- [ ] ConsentRecord row'una UPDATE denemesi (manuel) raw SQL ile bile çalışsa **convention olarak yasak** (code review)
- [ ] Migration rollback simulation: yeni migration ile boş migration geri alır

---

## Karar Noktaları

- **textVersion formatı:** `v2026-05-29` (tarih bazlı) veya `v1.0` (semver bazlı)? → Tarih bazlı öneririm (hukuki metin tarihsel referans daha doğal).
- **AuditLog metadata zod whitelist:** PII alanlarını blacklist (`refuse if contains 'phone'`) mı whitelist (`allow only ['ip', 'deviceType', 'eventId']`) yaklaşımı mı? → **Whitelist öneririm** (güvenli default; yeni alan eklemek için açık karar gerekir).

---

## Risk ve Geri Dönüş Planı

- **Risk:** AuditLog'da yanlışlıkla PII sızması (zod validator atlanırsa).
  - **Mitigation:** Zod tek giriş noktası; helper `logAuditEvent()` dışında doğrudan `prisma.auditLog.create` yasak (code review + lint custom kuralı ileride).

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.14): add versioned consent records and append-only audit log`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — versiyonlu consent + audit log şema kararı
- [ ] KVKK.md şema referansı ve audit policy notu

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
