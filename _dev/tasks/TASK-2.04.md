# TASK-2.04: WorkoutCompletions API — İdempotent Tamamlama + Geçmiş Pagination

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.2 — Üye Program Görüntüleme + Tamamlama
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.01 ✅

---

## Hedef

`POST /workout-completions` (üyenin "Antrenmanı bitir" eylemini idempotent olarak kaydeden endpoint) ve `GET /me/workout-completions` (üyenin geçmiş antrenmanlarını cursor-based pagination ile çeken endpoint) implement edilir ve integration testleri yazılır. Task sonunda mobile "Antrenmanı bitir" eylemi güvenle çağrılabilir, aynı tamamlama iki kez gönderilse de kayıt tekrarlanmaz ve M3 fazı bu endpoint'in çıktısını streak hesabına temel olarak kullanabilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → API Endpoint Tasarımı (Workout Completions)
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → M2 ↔ M3 sınırı (streak hesabı bu fazda yok)
- `_dev/modules/M2-program-domain.md` §F2.2 Kabul Kriterleri → Offline davranış + çakışma senaryosu

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. WorkoutCompletion Service katmanı**
  - `apps/backend/src/services/workout-completion.service.ts` oluştur:
    - `completeWorkout(memberId, data)`:
      - `data`: `{ programDayId, scheduledDate, isLate? }`
      - `upsert` ile yaz: `where: { memberId_programDayId_scheduledDate: { memberId, programDayId, scheduledDate } }` — `@@unique` ile idempotent
      - Eğer zaten varsa (`AlreadyCompleted`): 200 döner, hata değil (sessiz idempotency)
      - `completedAt: new Date()`, `isLate: isLate ?? false`
      - **Bu fazda streak hesabı yapılmaz** — M3 bu endpoint'in verisini okuyacak (future-proof endpoint, hesap yok)
    - `getMyWorkoutHistory(memberId, cursor?, limit=30)`:
      - `completedAt` desc sıra
      - Cursor-based pagination: `cursor` varsa `{ id: { lt: cursor } }` (veya `completedAt` cursor)
      - Her satırda: id, completedAt, scheduledDate, isLate, programDay (dayOfWeek + title + **programId**) — programId, TASK-2.13 WorkoutDetailScreen'de `GET /programs/:id` için gerekli
      - Limit: 30 per page; response: `{ items, nextCursor }`

- [ ] **2. WorkoutCompletions Route Handler**
  - `apps/backend/src/routes/workout-completions.ts` oluştur:
    - `POST /workout-completions` — body: `createWorkoutCompletionSchema` → `completeWorkout(req.user.id, body)`; sadece Member rolü
    - `GET /me/workout-completions` — query: `cursor?: string`, `limit?: number` → `getMyWorkoutHistory(req.user.id, cursor, limit)`; sadece Member rolü
  - Route'ları app'e kaydet

- [ ] **3. Integration Testler**
  - `apps/backend/src/routes/workout-completions.test.ts` oluştur:
    - `POST /workout-completions` — 200/201, kayıt DB'ye düştü
    - `POST /workout-completions` (aynı data tekrar) → 200, DB'de tek kayıt (idempotent)
    - `POST /workout-completions` (Trainer rolü) → 403
    - `GET /me/workout-completions` — paginated list döner, en yeni üstte
    - `GET /me/workout-completions?cursor=X` — cursor sonrası kayıtlar döner
    - `GET /me/workout-completions` (boş) — `{ items: [], nextCursor: null }` döner

---

## Etkilenen Dosyalar

```
apps/backend/src/
├── services/workout-completion.service.ts   # YENİ
├── routes/workout-completions.ts            # YENİ
└── routes/workout-completions.test.ts       # YENİ
```

---

## Dikkat Noktaları

- **Idempotency:** `upsert` kullan, `create` değil. Aynı `(memberId, programDayId, scheduledDate)` ikilisi için DB zaten `@@unique` güvencesi veriyor; Prisma'nın `P2002` (unique constraint violation) hatasını catch etmek yerine `upsert` doğrudan güvenli.
- **409 vs 200:** Mobile client retry'da 409 görürse "hata var" sanabilir. Idempotent upsert 200 dönerse daha temiz — hem ilk yazma hem retry aynı 200 alır.
- **isLate flag:** Bu fazda backend hesaplamıyor — client gönderir. M3 fazında `scheduledDate < completedAt date` kontrolü backend'e taşınabilir; şimdilik client-driven.
- **Cursor-based pagination:** Offset (skip) kullanma — büyük liste performans sorunu yaratır. `id` veya `completedAt` cursor ile cursor-based yap.
- **Member ownership:** `GET /me/workout-completions` sadece kendi tamamlamalarını döner — `WHERE memberId = req.user.id`.
- **scheduledDate zaman dilimi:** UTC olarak sakla; client ISO 8601 gönderir (`z.coerce.date()`). Türkiye UTC+3 — "bugün" hesabı client tarafında yapılır (backend sadece sakladığı tarihi döner).

---

## Test Kriterleri

- [ ] `POST /workout-completions` → 200, DB'de kayıt oluştu
- [ ] `POST /workout-completions` aynı üçlü (`memberId, programDayId, scheduledDate`) ile tekrar → 200, DB'de hâlâ tek kayıt
- [ ] `GET /me/workout-completions` → `{ items: [...], nextCursor: "..." }` formatında döner
- [ ] `GET /me/workout-completions?cursor=X` → cursor sonrasındaki kayıtlar döner (öncekiler yok)
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
