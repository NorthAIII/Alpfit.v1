# TASK-1.21: Refresh token rotation (30 gün opaque + rotate-on-use + replay attack koruma)

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.20

---

## Hedef

Refresh token sistemini kur — **opaque** (JWT değil; random secret) DB-stored (Postgres `RefreshToken` tablosu), 30 gün TTL, **rotate-on-use** (her kullanımda yeni refresh + yeni access döner, eski refresh revoke), **replay attack koruma** (revoked refresh tekrar kullanılırsa o token ailesinin TÜM aktif refresh'leri revoke + user notify). `POST /auth/refresh` endpoint'i. Discuss-phase'in "30 gün cihaz hatırlama" + Research §Tuzak #8 mitigation.

---

## Bağlam

Discuss-phase: "30 gün cihaz hatırlama varsayılan açık". Research-phase Tuzak #8: "Fastify refresh-token rotation resmi recipe yok; topluluk patternleri olgun ama bilinçli yazılıp test edilmeli." Bu task pattern'i bilinçli yazıyor + replay attack senaryosu test ediliyor. Token aile (family) konsepti: her ilk login yeni "aile" başlatır; rotation aileyi takip eder; revoked refresh tekrar kullanılırsa aile tamamen iptal.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 oturum yönetimi + 30 gün cihaz hatırlama
- `_dev/phases/PHASE-1.md` — Araştırma → Dikkat Edilecekler #8 (refresh rotation)
- `_dev/QUALITY.md` §2 (replay attack)
- `_dev/ILKELER.md` §"Kalıcılık önceliği"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Refresh token aile + rotate-on-use + replay detection kararı

---

## Alt Görevler

- [ ] **1. RefreshToken modeli**
  - ```prisma
    model RefreshToken {
      id              String   @id @default(cuid())
      userId          String
      tokenHash       String   @unique  // sha256(token) — ham token DB'de yok
      familyId        String   // tüm rotation chain aynı familyId
      previousId      String?  // önceki refresh (rotation chain)
      issuedAt        DateTime @default(now())
      expiresAt       DateTime
      revokedAt       DateTime?
      revokedReason   String?  // 'rotated' | 'logout_all' | 'replay_detected'
      deviceInfo      Json?    // userAgent + platform (PII not — analytics için)
      user            User     @relation(fields: [userId], references: [id])

      @@index([userId])
      @@index([familyId])
      @@index([tokenHash])
    }
    ```
  - Migration: `pnpm prisma migrate dev --name refresh_token`
  - Dosya: `backend/prisma/schema.prisma` (UPDATE), migration

- [ ] **2. Token üretim + hash helper**
  - `backend/src/auth/refresh-token.ts`:
    - `generateRefreshToken(): { token: string, tokenHash: string }` — `crypto.randomBytes(32).toString('base64url')` + sha256
    - `issueRefreshToken(userId, familyId?, previousId?, deviceInfo?): { token, expiresAt }` — DB insert, return raw token (sadece response'da, DB'de hash)
  - Dosya: `backend/src/auth/refresh-token.ts`

- [ ] **3. POST /auth/refresh route**
  - Body: `{ refreshToken: string }`
  - Token hash lookup → DB'den `RefreshToken` row
  - Validations:
    - Row yok → 401 "Geçersiz refresh"
    - `revokedAt != null`: **replay attack** — aileyi (`familyId`) tamamen revoke (`revokedReason: 'replay_detected'`), AuditLog event, user notify (TASK-1.32 banner ile bildirir; v1'de in-app), 401
    - `expiresAt < now` → 401 "Süre doldu, yeniden giriş yap"
  - Rotation:
    - Eski refresh `revokedAt = now`, `revokedReason = 'rotated'`
    - Yeni refresh issue (`previousId` = eski.id, `familyId` aynı)
    - Yeni access token issue (TASK-1.20)
    - Response: `{ accessToken, refreshToken, expiresAt }`
  - Dosya: `backend/src/routes/auth-refresh.ts`

- [ ] **4. POST /auth/profile + login akışlarına refresh issue entegrasyonu**
  - TASK-1.20'deki `POST /auth/profile` + verify (mevcut user login) akışlarında refresh token da issue edilir
  - İlk login: `familyId = cuid()` (yeni aile başlar), `previousId = null`
  - Dosya: `backend/src/routes/auth-profile.ts` (UPDATE), `backend/src/routes/auth-otp-verify.ts` (UPDATE)

- [ ] **5. AuditLog event'leri**
  - `refresh_rotated`, `refresh_replay_detected`, `refresh_expired` event tipleri TASK-1.14 enum'unda tanımlı — hazır kullanılır.
  - Rotation başarılı → `refresh_rotated`; replay attack → `refresh_replay_detected`; expired → `refresh_expired`
  - Metadata: familyId hash (PII whitelist'te)

- [ ] **6. Integration testler**
  - `backend/src/routes/auth-refresh.test.ts`:
    - Geçerli refresh → 200, yeni access + yeni refresh, eski revokedAt set
    - Eski (rotated) refresh ile retry → 401 + aile revoked (tüm aktif refresh'ler `revokedReason: 'replay_detected'`)
    - Expired refresh → 401
    - Geçersiz token → 401
    - 2 farklı device family: bir device'ta logout (TASK-1.22) diğeri etkilenmez
    - Concurrent 2 refresh aynı token ile → biri başarılı, diğeri replay detected
  - Dosya: `backend/src/routes/auth-refresh.test.ts`

- [ ] **7. Token cleanup background job (opsiyonel)**
  - Expired refresh tokens periyodik silinir (Coolify scheduled task aynı sözleşmeyle — TASK-1.15 retention job extend edilebilir)
  - v1'de opsiyonel; expired token zaten 401 dönüyor, DB temizliği nice-to-have
  - **Karar:** Bu task'ta sadece interface (`cleanupExpiredRefreshTokens()` helper); Coolify scheduled hook TASK-1.15 ile birleşik kalır

---

## Etkilenen Dosyalar

```
backend/
├── prisma/
│   ├── schema.prisma                                          # GÜNCELLE
│   └── migrations/
│       └── <ts>_refresh_token/migration.sql                   # YENİ
└── src/
    ├── auth/
    │   └── refresh-token.ts                                   # YENİ
    └── routes/
        ├── auth-refresh.ts                                    # YENİ
        ├── auth-refresh.test.ts                               # YENİ
        ├── auth-profile.ts                                    # GÜNCELLE (refresh issue)
        └── auth-otp-verify.ts                                 # GÜNCELLE
```

---

## Dikkat Noktaları

- **Token DB'de hash:** Ham token sadece response'da, sonra DB'de yok. Saldırgan DB dump'ı alsa bile token'ları kullanamaz.
- **familyId vs userId aile:** Bir user birden fazla aktif aile (=device) tutar. Logout-all (TASK-1.22) tüm aileleri revoke.
- **Replay detection user notify:** v1'de in-app banner; ileride email/SMS uyarısı (M4 push fazında değerlendirilir).
- **Concurrent rotation race:** İki istemci aynı refresh ile aynı anda gelirse — first wins, second replay detected. DB transaction (`SELECT FOR UPDATE` veya optimistic update with revokedAt null check) ile race garantili.
- **Mobile secure storage:** Refresh token mobile cihazda Keychain (iOS) / Keystore (Android) ile saklanır — `expo-secure-store` (TASK-1.33).
- **TR error mesajları:** i18n key'leri `errors.json`'da; 401/410 sonra UI giriş ekranına yönlendirir.

---

## Test Kriterleri

- [ ] 6+ senaryo PASS
- [ ] Replay attack senaryosu aileyi tamamen revoke eder
- [ ] Concurrent rotation race testinde DB consistency korunur (1 başarılı + 1 reject)
- [ ] Expired refresh 401 + DB row hala var (cleanup helper'da silinecek)
- [ ] AuditLog replay event yazılır
- [ ] Token base64url encoding — URL-safe (mobile'da güvenle taşır)

---

## Karar Noktaları

- **familyId revoke replay'da:** Tüm aile (TÜM aktif refresh ler) iptal mi sadece o cihaz mı? → Aile iptal öneririm (replay = compromised; user logout-all benzeri davranış). v1.5+'da daha granular karar (sadece o cihaz revoke + user warn) düşünülebilir.
- **Refresh response'ta yeni token ailesi mi:** Rotation'da `familyId` aynı kalır (chain takibi); yeni aile yalnızca ilk login + logout sonrası tekrar login'de.

---

## Risk ve Geri Dönüş Planı

- **Risk:** Network kesintisinde rotation eski token'ı revoke etti ama yeni token istemciye ulaşmadı → kullanıcı re-login gerekir.
  - **Mitigation:** Mobile'da rotation idempotent değil (request retry yapamaz); UX cost kabul edilebilir (30 gün TTL içinde 1 kez re-login).
- **Risk:** Replay detection false positive (gerçek kullanıcı çift istek attı).
  - **Mitigation:** Concurrent rotation race transaction ile resolve; ardışık 1 dakika sonra retry "replay" değil "rotation tamamlandı" → idempotent fail kabul, kullanıcı yeniden giriş yapar.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.21): add refresh token rotation with replay detection`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Refresh token rotation + family + replay detection kararı

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
