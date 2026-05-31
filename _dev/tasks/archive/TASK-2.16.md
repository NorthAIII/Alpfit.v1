# TASK-2.16: Backend Güvenlik Düzeltmeleri (verify-phase 2 bulgusu)

**Durum:** ✅ Tamamlandı
**Modül:** M2 — Program Domain
**Feature:** F2.1 Program Builder, F2.2 Üye Program Görüntüleme
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.15 ✅

---

## Hedef

verify-phase 2 güvenlik incelemesinde tespit edilen 3 orta düzey backend güvenlik bulgusunu düzelt. Üç düzeltme birbirine yakın dosyalarda yapılacak (service katmanı), tek oturumda tamamlanabilir boyutta.

---

## Bağlam

verify-phase 2 güvenlik incelemesi (2026-05-31) aşağıdaki bulguları tespit etti. Kritik bulgu yok; tümü orta düzeyde — işlevselliği bozmaz ama M3 streak motoruna hatalı sinyal verebilir veya veri bütünlüğünü bozabilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` — güvenlik bulguları detayı (Otomatik Kontrol Sonuçları bölümü)
- `_dev/modules/M2-program-domain.md` — program domain kuralları

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — task durumu ve özet
- `_dev/phases/PHASE-2.md` — task listesi tablosunda durum güncelle

---

## Alt Görevler

- [x] **1. `completeWorkout` — programDayId ownership doğrulaması**
  - Sorun: `POST /workout-completions` isteğinde `programDayId`'nin üyenin aktif programına ait olduğu doğrulanmıyor. Üye kendi programına ait olmayan bir gün ID'si ile "sahte tamamlama" kaydı yazabiliyor → M3'e hatalı streak sinyali.
  - Düzeltme: `workout-completion.service.ts` → `completeWorkout()` içinde `programDayId`'nin üyenin aktif programına (`program.memberId = memberId AND program.status = 'active'`) ait olduğunu doğrula. Doğrulama başarısız → `{ kind: 'forbidden' }` döndür.
  - Route: `workout-completions.ts` → `forbidden` case → 403 döndür.
  - Dosya: `backend/src/services/workout-completion.service.ts`, `backend/src/routes/workout-completions.ts`

- [x] **2. `publishProgram` — status kontrolü**
  - Sorun: Arşivlenmiş veya zaten aktif bir program `POST /programs/:id/publish` ile tekrar yayınlanabilir. `archivedAt` sıfırlanabilir, çalışan streak kaydını kesintiye uğratabilir.
  - Düzeltme: `program.service.ts` → `publishProgram()` başına `if (existing.status !== 'draft') return { kind: 'forbidden' }` kontrolü ekle.
  - Route: `programs.ts` → `forbidden` case zaten mevcut, yeni durum otomatik ele alınır.
  - Dosya: `backend/src/services/program.service.ts`

- [x] **3. `patchProgram` — silinmiş egzersiz kontrolü**
  - Sorun: `PATCH /programs/:id` payload'ındaki `exerciseId`'lerin `deletedAt: null` olduğu doğrulanmıyor. Soft-delete edilmiş egzersiz ID'si programa eklenebiliyor → "görünmez egzersiz" sorunu.
  - Düzeltme: `program.service.ts` → `patchProgram()` transaction başında payload'daki tüm `exerciseId`'leri topla, `findMany({ where: { id: { in: exerciseIds }, deletedAt: null } })` ile doğrula. Eksik/silinmiş varsa `{ kind: 'invalidInput' }` döndür.
  - Route: `programs.ts` → `invalidInput` case → 422 döndür.
  - Dosya: `backend/src/services/program.service.ts`, `backend/src/routes/programs.ts`

- [x] **4. Testler**
  - Her düzeltme için backend integration test ekle:
    - `workout-completions.test.ts`: "üye başka üyenin programDayId'si ile tamamlama yapamaz → 403"
    - `programs.test.ts`: "arşivlenmiş program publish edilemez → 403", "silinmiş egzersiz patch'te reddedilir → 422"

---

## Etkilenen Dosyalar

```
backend/src/
├── services/
│   ├── workout-completion.service.ts   # programDayId ownership check
│   └── program.service.ts              # publishProgram status guard + patchProgram exercise check
└── routes/
    ├── workout-completions.ts          # forbidden → 403
    └── programs.ts                     # invalidInput → 422 (yeni case)
```

---

## Dikkat Noktaları

- `completeWorkout` ownership kontrolü: üyenin yalnızca `status='active'` programının günleri geçerli. Draft program günü için tamamlama yaptırmama doğru davranış.
- `publishProgram` kontrolü: sadece `draft → active` geçişine izin ver; `active` veya `archived` program tekrar publish edilemez.
- `patchProgram` egzersiz kontrolü: payload'da hiç egzersiz yoksa (gün egzersizsiz bırakılıyorsa) kontrol atlanmalı. Sadece en az bir `exerciseId` varsa doğrulama yap.
- Mevcut testlerin kırılmamasına dikkat — özellikle `publishProgram` ve `patchProgram` happy path testleri.

---

## Test Kriterleri

- [x] `POST /workout-completions` — üye kendi aktif programına ait olmayan `programDayId` → 403
- [x] `POST /programs/:id/publish` — `status='active'` program → 403
- [x] `POST /programs/:id/publish` — `status='archived'` program → 403
- [x] `PATCH /programs/:id` — `deletedAt` dolu egzersiz ID içeriyorsa → 422
- [x] Mevcut 227 backend testi hâlâ geçiyor (231 oldu — 4 yeni test eklendi)

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı
- [x] Bu doküman güncellendi
- [x] DURUM.md güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-31
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `workout-completion.service.ts`: `completeWorkout()` başına `programDayId` ownership kontrolü eklendi. `CompleteWorkoutResult` union tipi eklendi (`{ kind: 'ok'; completion }` | `{ kind: 'forbidden' }`).
- `workout-completions.ts` route: `forbidden` case → 403.
- `program.service.ts`: `publishProgram()` — `status` field'ı sorguya eklendi; `status !== 'draft'` → `{ kind: 'forbidden' }`. `patchProgram()` — exerciseIds toplanıp `deletedAt: null` doğrulaması eklendi; `{ kind: 'invalidInput' }` yeni result tipi. `PatchProgramResult` tipi güncellendi.
- `programs.ts` route: `invalidInput` case → 422.
- 4 yeni integration test: workout-completions (1) + programs (3). 231 test geçti, lint temiz, typecheck temiz.

---

**Oluşturulma:** 2026-05-31 — verify-phase 2 güvenlik incelemesi bulgusu
