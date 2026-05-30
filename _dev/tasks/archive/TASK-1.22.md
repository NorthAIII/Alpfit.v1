# TASK-1.22: Tüm cihazlardan çıkış endpoint

**Durum:** ✅ Tamamlandı
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.21

---

## Hedef

`POST /auth/logout-all` endpoint'i kur — kullanıcının TÜM aktif refresh token'larını revoke eder (`revokedReason: 'logout_all'`); access token'lar 15dk TTL ile zaten ölecek. Mobile "Tüm cihazlardan çıkış" akışının backend tarafı. Ayrıca `POST /auth/logout` (sadece bu cihaz) eklenir — current refresh token revoke.

---

## Bağlam

F1.1 PRD: "'Çıkış yap' butonu Ayarlar'da; 'Tüm cihazlardan çıkış' opsiyonu da var." Discuss-phase Kapsam Dışı'nda: "Üye sayfasından 'tüm cihazlardan çıkış' akışı — F1.1 PRD'de var, ama plan-phase'de task seviyesinde değerlendirilecek (kapsamda; sadece UI/UX detayı)." → Backend endpoint **kapsam içinde**, UI tarafı TASK-1.33 (30 gün cihaz hatırlama + ayarlar) ya da gelecek faz.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 oturum yönetimi
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması (D)
- TASK-1.21 — Refresh token rotation

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. POST /auth/logout endpoint (current device)**
  - Authenticated (access token)
  - Body: `{ refreshToken: string }` (gerekiyor — hangi cihazın token'ı revoke edilecek)
  - Token hash lookup; user ID match doğrulanır (başka user'ın token'ı revoke edilemez)
  - `revokedAt = now`, `revokedReason = 'logout'`
  - AuditLog `user_logout` event (TASK-1.14 enum'unda tanımlı, hazır kullanılır)
  - Response: 204 No Content
  - Dosya: `backend/src/routes/auth-logout.ts`

- [ ] **2. POST /auth/logout-all endpoint (all devices)**
  - Authenticated
  - Kullanıcının tüm `revokedAt IS NULL` refresh token'ları batch revoke (`updateMany`)
  - `revokedReason = 'logout_all'`
  - AuditLog `user_logout_all` (TASK-1.14 enum'da zaten var)
  - Response: 204 No Content
  - Dosya: `backend/src/routes/auth-logout-all.ts`

- [ ] **3. Integration testler**
  - `backend/src/routes/auth-logout.test.ts`:
    - Logout bu cihaz: refresh revoke, diğer cihazlar aktif
    - Başka user'ın refresh token'ını revoke etmeye çalışma → 403
    - Already revoked refresh logout → 204 (idempotent)
  - `backend/src/routes/auth-logout-all.test.ts`:
    - 3 aktif refresh, logout-all sonrası 0 aktif (revokedAt set)
    - AuditLog `user_logout_all` event yazıldı
    - Access token yine 15dk geçerli (logout-all access'i revoke etmez; bu beklenen davranış — kabul)
  - Dosya: `backend/src/routes/auth-logout.test.ts`, `backend/src/routes/auth-logout-all.test.ts`

---

## Etkilenen Dosyalar

```
backend/
└── src/routes/
    ├── auth-logout.ts                            # YENİ
    ├── auth-logout.test.ts                       # YENİ
    ├── auth-logout-all.ts                        # YENİ
    └── auth-logout-all.test.ts                   # YENİ
```

---

## Dikkat Noktaları

- **Access token logout sonrası 15dk hala geçerli:** Stateless JWT'nin doğal davranışı. Mobile'da logout sonrası UI hemen kapanır (token storage silinir); ama theoretical olarak access token süresi dolana kadar API erişimi mümkün. Kabul edilebilir trade-off (15dk pencere); kritik invalidation gerekirse blacklist (jti) eklenir.
- **Logout sırasında refresh token gönderme:** Body'de açık mı? Yes — mobile current refresh'i ile request atar. Alternatif: server-side last-used tracking ile current device tahmin etmek (kompleks; v1'de basit body parametresi).
- **AuditLog metadata:** Logout-all'da kaç token revoke edildi (sayı) metadata'da; PII yok.

---

## Test Kriterleri

- [ ] 5+ senaryo PASS
- [ ] AuditLog event'leri doğru tip + metadata
- [ ] Idempotency: aynı logout çağrısı tekrarlanırsa 204
- [ ] User isolation: A'nın token'ı B revoke edemez

---

## Karar Noktaları

- **Logout sırasında access token'ı blacklist mi:** v1'de hayır (15dk pencere kabul). v1.5+ JWT jti blacklist Redis'te eklenebilir.

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı (`feat(TASK-1.22): add logout and logout-all endpoints`)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi
- [x] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-30
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `POST /auth/logout` (`routes/auth-logout.ts` YENİ) — `app.authenticate` (access token) korumalı; body `{ refreshToken }`. Token hash lookup → `userId` match (başka kullanıcının token'ı → **403** `forbidden`, hedef token dokunulmaz). Idempotency: bilinmeyen token **204**, zaten revoke **204** (yeni audit yok). Gerçek revoke atomik compare-and-set (`updateMany WHERE id=? AND revokedAt IS NULL`) → race'te çift audit önlenir; `revokedReason:'logout'` + `user_logout` audit (`refreshTokenId` whitelist). 400 eksik gövde, 401 middleware.
- `POST /auth/logout-all` (`routes/auth-logout-all.ts` YENİ) — `app.authenticate` korumalı; kullanıcının tüm `revokedAt IS NULL` token'ları tek `updateMany` ile batch revoke (`revokedReason:'logout_all'`). `user_logout_all` audit **her zaman** yazılır, metadata `count` (revoke edilen sayı, PII yok). 204.
- Access token logout/logout-all sonrası 15dk TTL dolana kadar geçerli kalır (stateless JWT; kabul edilen trade-off — jti blacklist v1.5+). logout-all GET /auth/me testinde doğrulandı.
- errors.json `auth.logoutTokenForbidden` ("Bu oturum sana ait değil.") eklendi. İki route `server.ts`'e kaydedildi (import sırası: `auth-logout-all` → `auth-logout`).

**Kalan İşler:** Yok. Mobile "Çıkış / Tüm cihazlardan çıkış" UI tarafı sonraki M1 Mobile task'lerinde (TASK-1.33 ayarlar/cihaz hatırlama).

**Test Sonucu:**
- Yeni: `auth-logout.test.ts` (6 senaryo: bu cihaz revoke + diğer aktif / 403 cross-user / idempotent already-revoked / idempotent unknown / 400 / 401) + `auth-logout-all.test.ts` (5 senaryo: 3→0 aktif + count=3 audit / access hâlâ geçerli (me 200) / yalnızca çağıranın token'ı / boş→count=0 audit / 401).
- backend **118 PASS** (107 + 11). typecheck / lint / format temiz.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
