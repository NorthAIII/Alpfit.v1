# TASK-1.35: admin-internal token karşılaştırmasını timingSafeEqual ile yap

**Durum:** ⬜ Bekliyor
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

- [ ] **1. admin-internal.ts düzeltmesi**
  - `backend/src/routes/admin-internal.ts:39` — `if (provided !== configured)` satırını `timingSafeEqual` kullanacak şekilde değiştir
  - `crypto` import'u ekle (Node built-in)

- [ ] **2. internal-dev-otp.ts düzeltmesi**
  - `backend/src/routes/internal-dev-otp.ts:52` — aynı pattern, aynı düzeltme

- [ ] **3. Test**
  - Mevcut admin-internal ve internal-dev-otp testleri hâlâ geçiyor mu? (varsa)
  - Yoksa: invalid token → 401 senaryosu için unit test ekle

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

- [ ] Tüm alt görevler tamamlandı
- [ ] Test kriterleri karşılandı
- [ ] Git commit & push yapıldı
- [ ] Bu doküman güncellendi
- [ ] DURUM.md güncellendi

---

**Oluşturulma:** 2026-05-30 — verify-phase 1 security review bulgusu
