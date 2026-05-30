# TASK-1.35: admin-internal token karşılaştırmasını timingSafeEqual ile yap

**Durum:** ✅ Tamamlandı
**Modül:** M0 Çekirdek Altyapı
**Feature:** —
**Faz:** Phase 1 (phases/PHASE-1.md)
**Bağımlılıklar:** Yok

---

## Hedef

`admin-internal.ts` ve `internal-dev-otp.ts` dosyalarındaki `ADMIN_INTERNAL_TOKEN` Bearer token karşılaştırması `!==` (string equality) ile yapılıyor; OTP karşılaştırmasındaki gibi `timingSafeEqual` kullanılmalı. Değişiklik iki satır; test yazılır; tutarsızlık giderilir.

---

## Bağlam

verify-phase 1 security review bulgusu (orta risk): Her iki dosyada `if (provided !== configured)` şeklinde plain string equality kullanılıyor. Pratik risk düşük — endpoint'ler dev-only + token uzun + yüksek entropi — ama OTP endpoint'teki `timingSafeEqual` pattern'ı tutarlı şekilde uygulanmamış. Küçük ve temiz bir düzeltme.

---

## Referans Dokümanlar

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu
- `_dev/phases/PHASE-1.md` — Task listesi + UAT senaryosu #5

---

## Alt Görevler

- [x] **1. admin-internal.ts düzeltmesi**
  - `backend/src/routes/admin-internal.ts` — `!==` → `timingSafeEqual` + uzunluk guard + `node:crypto` import

- [x] **2. internal-dev-otp.ts düzeltmesi**
  - `backend/src/routes/internal-dev-otp.ts` — aynı pattern uygulandı

- [x] **3. Test**
  - `retention-job.test.ts`: "length-mismatch token does not throw" senaryosu eklendi (+1)
  - `internal-dev-otp.test.ts`: aynı senaryo eklendi (+1)
  - Backend 173 PASS (was 171, +2); typecheck + lint temiz

---

## Etkilenen Dosyalar

```
backend/src/routes/
├── admin-internal.ts      # timingSafeEqual fix
└── internal-dev-otp.ts    # timingSafeEqual fix
```

---

## Dikkat Noktaları

- `timingSafeEqual` Buffer karşılaştırması yapar: `crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(configured))`
- Uzunluk farkı varsa Buffer.from farklı boyuta sahip olur ve doğrudan `timingSafeEqual` throw eder — önce uzunluk kontrolü ekle (veya uzunluk farklıysa direkt 401)
- Mevcut OTP implementasyonu referans al: `backend/src/routes/auth/otp-verify.ts`

---

## Test Kriterleri

- [ ] Doğru token → 200 / beklenen yanıt (değişmedi)
- [ ] Hatalı token → 401 (değişmedi)
- [ ] Uzunluk farklı hatalı token → throw etmeden 401 döner
- [ ] Backend 171 PASS (mevcut testler kırmadı)

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Test kriterleri karşılandı
- [x] Git commit & push yapıldı
- [x] Bu doküman güncellendi
- [x] DURUM.md güncellendi

---

**Oluşturulma:** 2026-05-30 — verify-phase 1 security review bulgusu
**Tamamlanma:** 2026-05-30 — timingSafeEqual fix uygulandı (+2 test); backend 173 PASS
