# TASK-1.36: CI kırık — Redis servisi eksik + mobile typecheck shared build

**Durum:** ⬜ Bekliyor
**Modül:** M0 Çekirdek Altyapı
**Feature:** —
**Faz:** Phase 1 (phases/PHASE-1.md)
**Bağımlılıklar:** Yok (CI fix'i bağımsız)

---

## Hedef

GitHub Actions CI workflow'u son 5+ commit'te başarısız. İki ayrı neden:
1. Backend test job'ında Redis servisi tanımlı değil → OTP/auth testleri bağlantı kuramıyor
2. Mobile typecheck job'ında shared package build edilmeden typecheck çalıştırılıyor → `@alpfit/shared` exports.types çözülemiyor olabilir

CI düzeltilene kadar staging hiç güncellenmedi (Deploy Staging her seferinde "skipped").

---

## Bağlam

verify-phase 1 UAT bulgusu (otomatik kontrol): GitHub Actions CI durumu incelendi, son 5 commit (TASK-1.32 → TASK-1.35) hepsinde CI:failure. Deploy Staging her seferinde skipped — koşul `CI.conclusion == 'success'`.

Staging backend'de yalnızca healthz yanıt veriyor; auth/invitation route'ları 404 → staging en son TASK-1.10 döneminden (healthz ekleme) güncellenmemiş.

---

## Referans Dokümanlar

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu
- `_dev/phases/PHASE-1.md` — Task listesi + UAT

---

## Alt Görevler

- [ ] **1. CI backend job'a Redis servisi ekle**
  - `.github/workflows/ci.yml` backend job'ına Postgres gibi Redis service ekle
  - Image: `redis:7-alpine`; `REDIS_URL: redis://redis:6379` env ekle
  - Test: CI'da `pnpm -F @alpfit/backend test:coverage` başarılı olmalı

- [ ] **2. CI mobile job'a shared build adımı ekle**
  - Mobile typecheck'ten önce `pnpm -F @alpfit/shared build` adımı ekle
  - Test: CI'da `pnpm -F @alpfit/mobile typecheck` başarılı olmalı (yerel zaten geçiyor)
  - Not: Yerel devcontainer'da shared/dist zaten mevcut; CI'da yoktur

- [ ] **3. CI geçince staging güncellenir mi kontrol et**
  - Push sonrası CI yeşil → Deploy Staging otomatik tetiklenmeli
  - Staging healthz + `/auth/otp/send` + `/invitations/:code` endpoint'lerini doğrula

---

## Etkilenen Dosyalar

```
.github/workflows/
└── ci.yml       # Redis service + mobile shared build adımı
```

---

## Test Kriterleri

- [ ] CI backend job: tüm 173 test geçiyor (Redis bağlantısı var)
- [ ] CI mobile job: typecheck clean (shared build önce çalıştı)
- [ ] GitHub Actions: CI yeşil → Deploy Staging triggered → staging güncellendi
- [ ] Staging'de `POST /auth/otp/send` 400/422 (geçersiz body) veya 200 → 404 değil

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Test kriterleri karşılandı
- [ ] Git commit & push yapıldı
- [ ] Bu doküman güncellendi
- [ ] DURUM.md güncellendi

---

**Oluşturulma:** 2026-05-30 — verify-phase 1 UAT bulgusu (CI kırık, staging eski sürümde)
