# TASK-2.01: DB Schema — M2 Tabloları + Prisma Migration + Seeder + Shared Zod Şemaları

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.1 + F2.2 — temel altyapı
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** Yok (ilk task)

---

## Hedef

Faz 2'nin tüm backend task'larının temelini oluşturan 5 yeni Prisma tablosu (Exercise, Program, ProgramDay, ProgramDayExercise, WorkoutCompletion) Prisma schema'ya eklenir, migration çalıştırılır, `backend/prisma/seed.ts`'e ~20 placeholder egzersiz seeder'ı eklenir ve `@alpfit/shared`'a bu tablolara ait Zod şemaları yazılır. Task sonunda `prisma migrate dev` temiz geçer, `prisma db seed` çalışır ve paylaşılan şemalar backend + mobile'da import edilebilir durumdadır.

---

## Bağlam

Faz 2 tüm DB tablolarını bu task'ta tek seferde kurar — böylece sonraki API task'ları (TASK-2.02–2.04) migration yükü taşımadan route + service yazar. Araştırma bulgularındaki tam schema tasarımı bu task'ta implement edilir.

WorkoutCompletion'daki `@@unique([memberId, programDayId, scheduledDate])` standart composite unique — partial unique SQL geçici çözümü gerektirmez (soft-delete yok). Ancak Exercise soft-delete için `deletedAt` eklenecek; bu alan adsı iç uniqueness gerektirmiyorsa Prisma DSL yeterlidir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → DB Schema kısmı — tam şema
- `_dev/memory/prisma-partial-unique-index.md` — soft-delete unique index tuzağı (Exercise soft-delete varsa ilgili)
- `_dev/memory/kvkk-pii-scrubbing-matrisi.md` — yeni alan eklenince `shared/src/pii-fields.ts` PII_FIELDS güncellenir

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. Prisma Schema — 5 yeni tablo ekle**
  - `apps/backend/prisma/schema.prisma` dosyasına ekle:
    - `Exercise`: id, name (TR), muscleGroup?, videoUrl?, isCustom (bool), deletedAt? (soft-delete), createdById? (trainerId FK)
    - `Program`: id, trainerId (FK), memberId (FK), status (draft|active|archived), publishedAt?, archivedAt?
    - `ProgramDay`: id, programId (FK), dayOfWeek (Int, 0=Pzt..6=Paz), title? (Push/Pull/Legs vb), position (Int), isOneOff (bool default false), specificDate? (DateTime)
    - `ProgramDayExercise`: id, programDayId (FK), exerciseId (FK), sets (Int), reps (String — "8" veya "8-12"), restSeconds? (Int), notes? (String), position (Int)
    - `WorkoutCompletion`: id, memberId (FK), programDayId (FK), scheduledDate (DateTime), completedAt (DateTime), isLate (bool default false)
  - Index'leri ekle (PHASE-2.md schema'dan birebir al)
  - `@@unique([memberId, programDayId, scheduledDate])` — WorkoutCompletion'da

- [ ] **2. Prisma Migration çalıştır**
  - `pnpm --filter backend prisma migrate dev --name m2_program_domain`
  - Migration temiz geçmeli, DB güncellenmiş olmalı

- [ ] **3. Exercise Seeder — ~20 Placeholder Egzersiz**
  - `apps/backend/prisma/seed.ts` dosyasına ekle (mevcut seed korunarak)
  - 20 yaygın egzersiz: TR isimler + kas grubu + videoUrl: null (Yakın 5'e kadar placeholder)
  - Örnekler: Squat, Deadlift (Ölü Kaldırış), Bench Press (Göğüs Presi), Pull-up (Barfiks), Shoulder Press (Omuz Presi), Lat Pulldown (Lat Çekiş), vb.
  - `isCustom: false`, `createdById: null` — çekirdek kütüphane
  - `pnpm --filter backend prisma db seed` çalıştır ve egzersizlerin eklendiğini doğrula

- [ ] **4. Shared Zod Şemaları — M2**
  - `packages/shared/src/schemas/exercise.ts` oluştur:
    - `exerciseSchema` (id, name, muscleGroup, videoUrl, isCustom)
    - `createExerciseSchema` (PT custom ekleme: name required, diğerleri optional)
    - `updateExerciseSchema` (partial createExercise)
    - `exerciseListSchema` (array)
  - `packages/shared/src/schemas/program.ts` oluştur:
    - `programDayExerciseSchema` (sets, reps, restSeconds?, notes?, position, exerciseId)
    - `programDaySchema` (dayOfWeek, title?, position, isOneOff, specificDate?, exercises: array)
    - `programSchema` (id, trainerId, memberId, status, days: array, publishedAt?, archivedAt?)
    - `createProgramSchema` (memberId required)
    - `patchProgramSchema` — auto-save body: tam yapı (days + exercises)
  - `packages/shared/src/schemas/workout-completion.ts` oluştur:
    - `createWorkoutCompletionSchema` (programDayId, scheduledDate, isLate?)
    - `workoutCompletionSchema` (tüm alanlar)
  - Şemaları `packages/shared/src/index.ts`'ten export et
  - `packages/shared`'ı build et: `pnpm --filter @alpfit/shared build`

- [ ] **5. PII Fields güncelle**
  - `packages/shared/src/pii-fields.ts` PII_FIELDS listesine ekle:
    - `notes` (ProgramDayExercise — PT'nin PT notları kişisel veri sayılabilir, PT-spesifik)
    - WorkoutCompletion alanları (memberId zaten var — completedAt, scheduledDate eklenebilir)
  - KVKK memory'deki matrise uygun: log/Sentry'ye sızarsa redakte

---

## Etkilenen Dosyalar

```
apps/backend/prisma/
├── schema.prisma        # 5 yeni tablo eklendi
└── seed.ts              # Exercise seeder eklendi

packages/shared/src/schemas/
├── exercise.ts          # YENİ
├── program.ts           # YENİ
└── workout-completion.ts  # YENİ

packages/shared/src/
├── index.ts             # yeni şemalar export edildi
└── pii-fields.ts        # yeni PII alanları eklendi
```

---

## Dikkat Noktaları

- **reps alanı String:** `"8"` veya `"8-12"` aralığı için — Int değil. Zod şemasında `z.string()` kullan.
- **isOneOff flag:** `dayOfWeek` ile birlikte tutulur ama `isOneOff=true` ise `specificDate` baz alınır. Her ikisi de schema'da bulunur — uygulama mantığı API katmanında.
- **WorkoutCompletion scheduledDate:** Backend Date olarak saklar ama client'tan ISO string gelir — Zod'da `z.coerce.date()` veya `z.string().datetime()` kullan.
- **Seeder idempotent olmalı:** `seed.ts` içinde `upsert` veya önce silme yap; `prisma db seed` birden fazla çalıştırılabilsin.
- **`deletedAt` Exercise'da:** Soft delete — `WHERE deletedAt IS NULL` filtresi API katmanında uygulanır.
- **Prisma generate:** Migration + seed sonrası `pnpm --filter backend prisma generate` çalıştır (Prisma Client güncellensin).

---

## Test Kriterleri

- [ ] `pnpm --filter backend prisma migrate dev` — 0 hata, migration dosyası `prisma/migrations/` altında oluştu
- [ ] `pnpm --filter backend prisma db seed` — 20 Exercise satırı DB'ye yazıldı; ikinci çalıştırmada duplicate yok (idempotent)
- [ ] `pnpm --filter @alpfit/shared build` — 0 TypeScript hatası
- [ ] Zod şemalarından `createExerciseSchema.parse({ name: "Squat" })` — başarılı
- [ ] `programSchema.parse(...)` — eksik zorunlu alan varsa hata fırlatır
- [ ] `createWorkoutCompletionSchema.parse({ programDayId: "uuid", scheduledDate: "2026-05-30T00:00:00Z" })` — başarılı parse
- [ ] Backend TypeScript build: `pnpm --filter backend build` — 0 hata

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
