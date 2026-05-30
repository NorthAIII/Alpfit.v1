# TASK-2.02: Exercises API — Listeleme + PT Custom CRUD

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.1 — Program Builder (egzersiz kütüphanesi katmanı)
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.01 ✅

---

## Hedef

`GET /exercises` (listeleme + search + kas grubu filtresi), `POST /exercises` (PT custom ekleme), `PUT /exercises/:id` (PT kendi custom'ını düzenle), `DELETE /exercises/:id` (PT kendi custom'ını soft-delete et) endpoint'leri Fastify route handler + service katmanıyla implement edilir ve integration testleri yazılır. Task sonunda exercises route'ları auth middleware arkasında çalışır, çekirdek 50 (şimdilik ~20 placeholder) egzersiz listesini döner ve PT kendi egzersizini yönetebilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → API Endpoint Tasarımı (Exercises kısmı)
- `_dev/modules/M2-program-domain.md` §F2.1 Edge Case'ler — egzersiz silme/düzenleme kuralları

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. Exercise Service katmanı**
  - `apps/backend/src/services/exercise.service.ts` oluştur:
    - `listExercises(trainerId, search?, muscleGroup?)` — çekirdek (isCustom=false) + trainer'ın custom'ları (isCustom=true, createdById=trainerId); deletedAt IS NULL filtresi; arama TR karakter uyumlu ILIKE
    - `createExercise(trainerId, data)` — isCustom=true, createdById=trainerId; name zorunlu
    - `updateExercise(trainerId, exerciseId, data)` — sadece kendi custom'ını güncelleyebilir (ownership check)
    - `deleteExercise(trainerId, exerciseId)` — soft-delete (deletedAt=now); sadece kendi custom'ını silebilir; çekirdek egzersiz silinemez (isCustom=false → 403)

- [ ] **2. Exercises Route Handler**
  - `apps/backend/src/routes/exercises.ts` oluştur:
    - `GET /exercises` — query: `search?: string`, `muscleGroup?: string` → `listExercises()`
    - `POST /exercises` — body: `createExerciseSchema` → `createExercise()`; sadece Trainer rolü
    - `PUT /exercises/:id` — body: `updateExerciseSchema` → `updateExercise()`; sadece Trainer + ownership
    - `DELETE /exercises/:id` → `deleteExercise()`; sadece Trainer + ownership
  - Route'ları `apps/backend/src/app.ts` veya route kayıt noktasına ekle
  - Shared Zod şemalarını (`@alpfit/shared`) kullan — runtime validation

- [ ] **3. Integration Testler**
  - `apps/backend/src/routes/exercises.test.ts` oluştur:
    - `GET /exercises` — çekirdek egzersizleri listeler
    - `GET /exercises?search=squat` — arama çalışır
    - `GET /exercises?muscleGroup=bacak` — filtre çalışır
    - `POST /exercises` — Trainer custom egzersiz ekler
    - `POST /exercises` — Member rolü → 403
    - `PUT /exercises/:id` — Trainer kendi custom'ını günceller
    - `PUT /exercises/:id` (başka trainer'ın) → 403
    - `DELETE /exercises/:id` — soft delete; tekrar `GET` → listede yok
    - `DELETE /exercises/:id` (çekirdek) → 403

---

## Etkilenen Dosyalar

```
apps/backend/src/
├── services/exercise.service.ts    # YENİ
├── routes/exercises.ts             # YENİ
└── routes/exercises.test.ts        # YENİ
```

---

## Dikkat Noktaları

- **TR karakter search:** PostgreSQL `ILIKE` kullan; `trLower` normalizasyonu backend'de Prisma raw query veya computed field gerekebilir. Basit çözüm: DB'de egzersiz isimleri zaten TR doğru saklanacak, `mode: 'insensitive'` Prisma ILIKE ile yeterli pilot ölçeğinde.
- **Ownership check:** `PUT`/`DELETE`'te DB'den exercise çekip `createdById === trainerId` kontrol et — yoksa 404 (ownership sızdırma), ownership yok ise 403.
- **Çekirdek egzersiz silme/düzenleme engeli:** `isCustom: false` ise `PUT`/`DELETE` → 403 "Çekirdek egzersizler düzenlenemez".
- **Silinen egzersiz kullanan ProgramDayExercise:** Soft-delete sonrası mevcut programlarda egzersiz kayıtları kalmaya devam eder (`exerciseId` FK, `deletedAt` sadece listelemeyi etkiler). Bu edge case Faz 2 sona kadar sorun yaratmaz — pilot ölçeğinde kabul edilebilir.
- **Role auth:** `requireRole('trainer')` middleware kullan — Faz 1'den gelen pattern.

---

## Test Kriterleri

- [ ] `GET /exercises` — status 200, çekirdek egzersizler döner
- [ ] `GET /exercises?search=bench` — "Bench Press" veya TR çevirisi döner
- [ ] `GET /exercises?muscleGroup=göğüs` — filtre doğru çalışır
- [ ] `POST /exercises` (Trainer) — status 201, yeni custom egzersiz döner
- [ ] `POST /exercises` (Member) — status 403
- [ ] `PUT /exercises/:id` (kendi custom'ı) — status 200, güncelleme yansır
- [ ] `PUT /exercises/:id` (başka trainer) — status 403
- [ ] `DELETE /exercises/:id` (kendi custom'ı) — status 204; `GET /exercises` listesinde artık yok
- [ ] `DELETE /exercises/:id` (çekirdek) — status 403
- [ ] Backend typecheck + tüm test'ler geçer: `pnpm --filter backend test`

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (conventional commits formatı)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi

---

## Oturum Kayıtları

*(Doldurulmadı — task henüz çalıştırılmadı)*

---

**Oluşturulma:** 2026-05-30 (plan-phase 2)
