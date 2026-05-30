# TASK-2.02: Exercises API — Listeleme + PT Custom CRUD

**Durum:** ✅ Tamamlandı
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

- [x] **1. Exercise Service katmanı**
  - `apps/backend/src/services/exercise.service.ts` oluştur:
    - `listExercises(trainerId, search?, muscleGroup?)` — çekirdek (isCustom=false) + trainer'ın custom'ları (isCustom=true, createdById=trainerId); deletedAt IS NULL filtresi; arama TR karakter uyumlu ILIKE
    - `createExercise(trainerId, data)` — isCustom=true, createdById=trainerId; name zorunlu
    - `updateExercise(trainerId, exerciseId, data)` — sadece kendi custom'ını güncelleyebilir (ownership check)
    - `deleteExercise(trainerId, exerciseId)` — soft-delete (deletedAt=now); sadece kendi custom'ını silebilir; çekirdek egzersiz silinemez (isCustom=false → 403)

- [x] **2. Exercises Route Handler**
  - `apps/backend/src/routes/exercises.ts` oluştur:
    - `GET /exercises` — query: `search?: string`, `muscleGroup?: string` → `listExercises()`
    - `POST /exercises` — body: `createExerciseSchema` → `createExercise()`; sadece Trainer rolü
    - `PUT /exercises/:id` — body: `updateExerciseSchema` → `updateExercise()`; sadece Trainer + ownership
    - `DELETE /exercises/:id` → `deleteExercise()`; sadece Trainer + ownership
  - Route'ları `apps/backend/src/app.ts` veya route kayıt noktasına ekle
  - Shared Zod şemalarını (`@alpfit/shared`) kullan — runtime validation

- [x] **3. Integration Testler**
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

- [x] `GET /exercises` — status 200, çekirdek egzersizler döner
- [x] `GET /exercises?search=gogus` — arama ILIKE çalışır
- [x] `GET /exercises?muscleGroup=bacak` — filtre doğru çalışır
- [x] `POST /exercises` (Trainer) — status 201, yeni custom egzersiz döner
- [x] `POST /exercises` (Member) — status 403
- [x] `PUT /exercises/:id` (kendi custom'ı) — status 200, güncelleme yansır
- [x] `PUT /exercises/:id` (başka trainer) — status 403
- [x] `DELETE /exercises/:id` (kendi custom'ı) — status 204; `GET /exercises` listesinde artık yok
- [x] `DELETE /exercises/:id` (çekirdek) — status 403
- [x] Backend typecheck + tüm test'ler geçer: `pnpm --filter backend test` → 193 test yeşil

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı (conventional commits formatı)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-30
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `backend/src/services/exercise.service.ts` oluşturuldu: `listExercises`, `createExercise`, `updateExercise`, `deleteExercise` (discriminated union return tipi).
- `backend/src/routes/exercises.ts` oluşturuldu: GET/POST/PUT/DELETE endpoint'leri; trainer guard + ownership check; Zod `safeParse` ile runtime validation.
- `backend/src/server.ts`'e `exercisesRoutes` kaydedildi.
- i18n `errors.json`'a `exercises.notFound` + `exercises.coreForbidden` eklendi.
- `backend/src/routes/exercises.test.ts` oluşturuldu: 20 integration testi (liste, arama, filtre, custom CRUD, 403/404 senaryoları).
- Tüm testler yeşil: 193 test geçti (önceki 173 + 20 yeni).

---

**Oluşturulma:** 2026-05-30 (plan-phase 2)
