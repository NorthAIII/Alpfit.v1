# TASK-1.24: Davet kabul endpoint (lazy expiry + tek kullanımlık + PT-Member ilişki)

**Durum:** ✅ Tamamlandı
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.20, TASK-1.23

---

## Hedef

`POST /invitations/:code/accept` endpoint'i kur — kullanıcı OTP verify + profil oluşturduktan sonra davet kodunu accept eder; davet tek kullanımlık, expiry lazy-check, kabul eden member kullanıcısı davet sahibi PT'ye **otomatik bağlanır** (`TrainerMember.endedAt IS NULL` aktif ilişki kurulur). Eğer member'ın aktif PT'si zaten varsa (rare edge case) → 409. PT'nin başka PT'nin üyesi olamayacağı için role kontrolü.

---

## Bağlam

F1.1 PRD: "Davet kodu hangi PT'ye aitse, üye o PT'ye otomatik bağlanır", "Bir davet linki tek kullanımlık". Discuss-phase Aktif task: "PT-üye ilişki yönetimi". TASK-1.13'te aktif tek PT-Member ilişki DB-level partial unique constraint ile garantili — bu task'ta application logic ona bağlı.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 davet kabul + PT-üye ilişki
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → davet akışı
- TASK-1.13 — TrainerMember partial unique

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. POST /invitations/:code/accept endpoint**
  - Authenticated (member zaten profil oluşturup login olmuş)
  - Path: `:code`
  - Validations:
    - Davet yok → 404 "Davet bağlantısı geçersiz"
    - Lazy expire check → expired ise 410 "Bu davet süresi geçmiş. PT'nden yeni link iste."
    - status `accepted` → 409 "Bu davet zaten kullanılmış"
    - status `cancelled` → 410 "Davet iptal edilmiş"
    - `req.user.role !== 'member'` → 403 "Sadece üye davet kabul edebilir"
    - Member'ın zaten aktif PT'si varsa → 409 "Zaten bir PT'ye bağlısın" (v1; PT değiştirme v1.5)
    - PT kendi davetini kabul edemez (`invitation.trainerId === req.user.sub`) → 400
  - Atomik transaction:
    - `Invitation.status = accepted`, `acceptedAt = now`, `acceptedByUserId = req.user.sub`
    - `TrainerMember.create({ trainerId, memberId, startedAt: now })`
    - AuditLog `invitation_accepted` event
  - Response 200: `{ trainerId, trainerFirstName, trainerLastName }` (member görsün kim olduğunu)
  - Dosya: `backend/src/routes/invitations-accept.ts`

- [ ] **2. GET /invitations/:code (preview — davet linkinden ön bilgi)**
  - Public endpoint (auth gerekmez) — davet linkine tıklayan kullanıcı PT'nin ismini görsün
  - Lazy expire check
  - Geçersiz davet → 404
  - Expired → 410 + body: `{ status: 'expired' }`
  - Valid → 200: `{ trainerFirstName, trainerLastName, expiresAt }`
  - **PII not:** PT ismi public; davet linki zaten paylaşılırken bunu kabul ediyoruz. Telefon, soyisim, profil PII'sı YOK.
  - **Karar:** PT soyismi gösterilsin mi? F1.1 PRD'de "Davet kabul edildiğinde PT'ye banner '[Üye adı] davetini kabul etti'" — ama davet linki açan üye PT'nin tam ismini görmeli mi yarı mı? → Tam isim öneririm (üye PT'sini doğrulasın diye).
  - Dosya: `backend/src/routes/invitations-preview.ts`

- [ ] **3. PT-Member aktif ilişki helper**
  - `backend/src/auth/relations.ts` (TASK-1.13'te placeholder; bu task'ta doldur):
    - `getActivePtForMember(memberId): User | null`
    - `assertNoActivePt(memberId): void` — varsa throw
    - `createPtMemberRelation(trainerId, memberId): TrainerMember`
  - Dosya: `backend/src/auth/relations.ts` (UPDATE)

- [ ] **4. Integration testler**
  - `backend/src/routes/invitations-accept.test.ts`:
    - Member davet kabul → 200, TrainerMember aktif, Invitation accepted, AuditLog event
    - Aynı davet ikinci kabul → 409 (zaten accepted)
    - Expired davet → 410
    - PT davet kabul → 403 (role)
    - Member'ın zaten aktif PT'si var → 409
    - PT kendi davet → 400
    - Geçersiz code → 404
  - `backend/src/routes/invitations-preview.test.ts`:
    - Valid davet preview → 200 + trainer ismi
    - Expired preview → 410
    - Geçersiz code preview → 404
  - Concurrent kabul (race): 2 farklı member aynı kodu → biri 200 biri 409 (DB unique constraint garanti)
  - Dosya: `backend/src/routes/invitations-accept.test.ts`, `backend/src/routes/invitations-preview.test.ts`

---

## Etkilenen Dosyalar

```
backend/
└── src/
    ├── auth/
    │   └── relations.ts                                # GÜNCELLE (helper'lar dolar)
    └── routes/
        ├── invitations-accept.ts                       # YENİ
        ├── invitations-accept.test.ts                  # YENİ
        ├── invitations-preview.ts                      # YENİ
        └── invitations-preview.test.ts                 # YENİ
```

---

## Dikkat Noktaları

- **Atomik transaction kritik:** Davet kabul ve TrainerMember create aynı DB transaction; yarıda hata olursa rollback.
- **PII preview:** PT ismi davet preview'da public; bu bilinçli karar (üye PT'sini doğrulasın). Email/telefon YOK.
- **Race condition:** İki üye aynı kodu eş zamanlı tıklarsa partial unique + status atomik update + transaction ile biri başarılı, diğeri 409.
- **Soft delete:** Soft-deleted PT'nin davet kodu kabul edilemez (PT user yok sayılır; preview de 404 döner).
- **PT'nin kendi davet kabul edemez:** v1 PT-only role; kendine üye olarak ekleyemez (data integrity).
- **AuditLog metadata:** invitationId + memberHash + trainerHash; ham ID'ler PII değil ama hash convention TASK-1.14.

---

## Test Kriterleri

- [ ] Toplam 10 senaryo PASS (7 accept + 3 preview)
- [ ] Concurrent accept testi (Vitest concurrent flag)
- [ ] Atomik transaction: hata fırlatıldığında rollback (manuel test sentetik hatayla)
- [ ] PT-Member aktif tekliği DB seviyesinde garanti
- [ ] AuditLog event metadata PII içermez

---

## Karar Noktaları

- **Preview public mi auth-gated mi:** Public öneririm (üye app indirmeden link açtığında PT'sini görsün — UX). PII riski düşük (sadece isim).
- **Member zaten aktif PT'si var → ne mesaj:** "Zaten bir PT'ye bağlısın" → kullanıcı kafası karışabilir. Alt mesaj: "Yeni PT için önce mevcut PT'nle ilişkini sonlandır" (v1.5 PT değiştirme). v1'de manuel destek.

---

## Risk ve Geri Dönüş Planı

- **Risk:** Race condition'da iki member aynı PT'ye eşzamanlı bağlanmaya çalışırsa (mantıksız ama mümkün) → unique constraint patlar.
  - **Mitigation:** Partial unique constraint (TASK-1.13) garantili; transaction'da hata yakalanır + 409.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.24): add invitation accept and preview with pt member relation`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-30
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- **`backend/src/routes/invitations-accept.ts` (YENİ)** — `POST /invitations/:code/accept` (auth korumalı). Davet `code @unique` ile çekilir (trainer ad/soyad/deletedAt join). Doğrulama sırası: davet yok **veya PT soft-deleted** → 404; lazy expire (`markIfExpired`) → 410 `expired`; accepted → 409 `already_used`; cancelled → 410 `cancelled`; **own_invitation → 400 (role 403'ten ÖNCE** — aksi halde PT kendi davetinde role guard'a takılır); role !== member → 403; üyenin aktif PT'si var → 409 `already_has_trainer`. Kabul atomik `$transaction`: compare-and-set `updateMany WHERE status='pending'` (count=0 → `InvitationRaceLostError` → 409) + `createPtMemberRelation` (P2002 → 409 already_has_trainer) + `logAuditEvent('invitation_accepted', {invitationId})`. 200 `{trainerId, trainerFirstName, trainerLastName}`.
- **`backend/src/routes/invitations-preview.ts` (YENİ)** — `GET /invitations/:code` public (auth yok). Davet yok/PT soft-deleted → 404; lazy expire → 410 `{status:'expired'}`; cancelled/accepted → 410; pending → 200 `{trainerFirstName, trainerLastName, expiresAt}`. PII: yalnızca PT ad+soyad (bilinçli — üye PT'sini doğrulasın); telefon/üye verisi yok.
- **`backend/src/auth/relations.ts` (GÜNCELLE)** — placeholder dolduruldu: `getActivePtForMember` (soft-deleted PT filtreli), `assertNoActivePt`, `createPtMemberRelation`; eski `assertSingleActivePtForMember` alias olarak korundu (TASK-1.13 test'i kırılmaz). Tüm helper'lar `Pick<PrismaClient,'trainerMember'>` alır (tx uyumlu).
- **i18n** (`errors.json` invite bölümü) — `expired`/`cancelled`/`onlyMember`/`alreadyHasTrainer`/`ownInvitation` eklendi; `notFound`/`alreadyUsed`/`expired` metinleri F1.1 diline güncellendi.
- **`server.ts`** — iki route register edildi (accept + preview).

**Test:** ✅ accept 10 senaryo + preview 6 senaryo (concurrent race dahil: Promise.all → biri 200 biri 409, tek aktif TrainerMember). Backend **148 PASS** (önceki 132). typecheck + lint + format temiz.

**Karar notları:**
- AuditLog metadata yalnızca `invitationId` (TASK-1.23 deseni) — memberHash/trainerHash whitelist'te yok; `userId` zaten `logAuditEvent`'te hash'lenir, ham ID yazılmaz. Whitelist'e alan eklemek bilinçli karar gerektirir, gerek görülmedi.
- Race güvencesi iki katman: davet tek-kullanımı status compare-and-set ile (aynı kodu 2 üye); aktif PT tekliği DB partial unique index ile (P2002 yakalanır).

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
