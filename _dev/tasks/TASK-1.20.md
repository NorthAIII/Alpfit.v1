# TASK-1.20: JWT access token (@fastify/jwt + claims yapısı)

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.19

---

## Hedef

JWT access token altyapısını kur — `@fastify/jwt` + `fast-jwt` ile access token (15dk TTL) issue + verify, Fastify `request.user` decorator, auth middleware (`authenticate` hook). Claims: `{ sub: userId, role, iat, exp }`. OTP verify başarılı + user oluşturma/login akışıyla bu task entegre — verify → JWT issue. Refresh token rotation TASK-1.21'de.

---

## Bağlam

Discuss-phase: "stateless JWT + refresh token mekanizması bazında gidilir (mobile-native pattern). Detay research-phase'de TECH-STACK kararıyla beraber netleşir." Research-phase: "Access 15dk + refresh 30 gün opaque DB-stored + rotate-on-use." Bu task access token kısmı; refresh token TASK-1.21.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 oturum yönetimi
- `_dev/phases/PHASE-1.md` — Araştırma → JWT kararı + Dikkat Edilecekler #8 (refresh-token pattern)
- `_dev/QUALITY.md` §2 (auth)
- `_dev/ILKELER.md` §"Sır ve konfigürasyon yönetimi"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — JWT access claims + auth middleware kararı

---

## Alt Görevler

- [ ] **1. @fastify/jwt + fast-jwt kurulumu**
  - `pnpm -F @alpfit/backend add @fastify/jwt fast-jwt`
  - Plugin register `backend/src/server.ts` — `JWT_ACCESS_SECRET` env, algorithm HS256, expiresIn 15m
  - Dosya: `backend/package.json`, `backend/src/server.ts` (UPDATE)

- [ ] **2. JWT claims tip + issue helper**
  - `backend/src/auth/jwt.ts`:
    - `AccessTokenClaims = { sub: string, role: Role, iat: number, exp: number, jti: string }`
    - `issueAccessToken(user: User): string` — fastify.jwt.sign({ sub: user.id, role: user.role, jti: cuid() })
    - `jti` (JWT ID) include — gelecekte revoke-by-jti opsiyonu için
  - Dosya: `backend/src/auth/jwt.ts`

- [ ] **3. authenticate hook (Fastify decorator)**
  - `backend/src/auth/middleware.ts`:
    - `app.decorate('authenticate', async (req, reply) => { await req.jwtVerify() })`
    - Protected route'lar `preHandler: app.authenticate` ile guard
    - `req.user` typed: `AccessTokenClaims`
  - Dosya: `backend/src/auth/middleware.ts`

- [ ] **4. User creation/login akışı (verify endpoint entegre)**
  - TASK-1.19'da `POST /auth/otp/verify` JWT döndürmüyordu; bu task'ta extend:
    - Verify başarılı + user yok → response: `{ verified: true, isNew: true }` (mobile UI profil oluşturma ekranına geçer; ana login TASK-1.21 refresh ile)
    - Verify başarılı + user var → response: `{ verified: true, isNew: false, accessToken, refreshToken }` (TASK-1.21'den)
  - Yeni endpoint: `POST /auth/profile` (yeni kullanıcı için profil + JWT issue)
    - Body: `{ phone, code, role, firstName, lastName, kvkkConsent: true, healthConsent?: boolean, gymName?, certificateNote? }`
    - OTP verify (tekrar) + user create + ConsentRecord granted + JWT access + refresh issue
    - Response: `{ accessToken, refreshToken, user: { id, role, firstName, ... } }`
  - Dosya: `backend/src/routes/auth-otp-verify.ts` (UPDATE), `backend/src/routes/auth-profile.ts` (YENİ)

- [ ] **5. Integration testler**
  - `backend/src/auth/jwt.test.ts`:
    - `issueAccessToken` 15dk TTL ile token üretir, decode doğru claims gösterir
    - Expired token (manipulated exp) verify FAIL
    - Wrong signature FAIL
  - `backend/src/auth/middleware.test.ts`:
    - Protected route token ile 200
    - Token yoksa 401
    - Expired token 401
  - `backend/src/routes/auth-profile.test.ts`:
    - Yeni user OTP + profile → 201, accessToken alır, User + ConsentRecord DB'de
    - KVKK consent false → 403 "KVKK rızası zorunlu"
    - Mevcut telefon → 409 "Bu telefon zaten kayıtlı"
  - Dosya: `backend/src/auth/jwt.test.ts`, `backend/src/auth/middleware.test.ts`, `backend/src/routes/auth-profile.test.ts`

- [ ] **6. AuditLog event'leri**
  - User create → `user_created` event
  - Login (mevcut user verify) → `user_login` event
  - ConsentRecord granted (kvkk + opsiyonel health)
  - Metadata: ip, userAgent (PII whitelist'te zaten var)

---

## Etkilenen Dosyalar

```
backend/
├── package.json                                          # GÜNCELLE
└── src/
    ├── server.ts                                         # GÜNCELLE (jwt plugin)
    ├── auth/
    │   ├── jwt.ts                                        # YENİ
    │   ├── jwt.test.ts                                   # YENİ
    │   ├── middleware.ts                                 # YENİ
    │   └── middleware.test.ts                            # YENİ
    └── routes/
        ├── auth-otp-verify.ts                            # GÜNCELLE (JWT response existing user)
        ├── auth-profile.ts                               # YENİ
        └── auth-profile.test.ts                          # YENİ
```

---

## Dikkat Noktaları

- **Secret rotation:** JWT_ACCESS_SECRET değişirse tüm access token invalid olur (1 dakika maksimum kullanıcı kesintisi — acceptable). Refresh token TASK-1.21 ile birlikte rotation pattern netleşir.
- **`jti` claim:** Şu an kullanılmıyor ama include; ileride blacklist-based revoke için hazır.
- **`role` claim'de mi DB lookup mu:** Role JWT'de cache — değişirse JWT yeniden issue edilmesi gerek (v1'de role değişmez, kabul). Sensitive izinler için DB lookup şart (örn. soft-deleted user) — middleware DB ping yapar (perf maliyeti kabul edilebilir).
- **Soft-deleted user:** `authenticate` middleware'i `deletedAt IS NOT NULL` user için 401 döner — TASK-1.15 soft delete uyumlu.
- **TR error mesajları:** i18n shell üzerinden TR; key'ler `errors.json`'da.

---

## Test Kriterleri

- [ ] 3 test dosyasında toplam 10+ senaryo PASS
- [ ] Token TTL 15dk doğru
- [ ] Soft-deleted user authenticate edemez
- [ ] User create + ConsentRecord transaction atomik (biri fail diğeri rollback)
- [ ] AuditLog event'leri user_created + user_login doğru yazılır
- [ ] KVKK consent false ile profil create reddedilir

---

## Karar Noktaları

- **Algorithm HS256 vs RS256:** Solo dev + tek backend → HS256 yeterli; multi-service mimari'de RS256 (public key verify). v1 HS256 sade.
- **Mevcut user phone clash:** F1.1 PRD "Bu telefon zaten kayıtlı, giriş yap →" yönlendirmesi. POST /auth/profile mevcut user'da 409 + mobile UI giriş akışına yönlendirir.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.20): add jwt access token with auth middleware and profile creation`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — JWT access claims + auth middleware + profile creation kararı

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
