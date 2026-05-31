# TASK-3.01: Faz 2 Teknik Borç Kapatma

**Durum:** ✅ Tamamlandı
**Modül:** M2 — Program Domain (`modules/M2-program-domain.md`)
**Feature:** Altyapı temizliği (Faz 3 öncesi)
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** Yok

---

## Hedef

M3 inşasından önce Faz 2'de tespit edilen 3 teknik borcu temizle: `limit=abc` gibi geçersiz query param 500 döndürüyor, `POST /programs/:id/copy` Zod şemasına değil ham tip kontrolüne güveniyor, `getMemberActiveProgram` içindeki program select bloğu kod tekrarı yaratıyor. Task tamamlanınca bu 3 sorun ortadan kalkar ve Faz 3 temiz bir kod tabanına inşa edilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-3.md` §Kapsam Tartışması — teknik borç tespiti

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-3.md` — Task Listesi tablosunda durum güncelle

---

## Alt Görevler

- [x] **1. `limit=abc → NaN → 500` Düzeltmesi**
  - `backend/src/routes/workout-completions.ts` → `GET /me/workout-completions` handler'ında `parseInt(query.limit, 10)` yerine Zod `z.coerce.number().int().min(1).max(100).default(30)` kullan
  - `parseInt('abc', 10)` → `NaN` → Prisma `take: NaN` → 500; Zod coerce → 400

- [x] **2. `POST /programs/:id/copy` Zod Şeması**
  - `shared/src/schemas/` → `copyProgramBodySchema = z.object({ targetMemberId: z.string().min(1) })` ekle ve export et
  - `backend/src/routes/programs.ts` → ham `typeof body.targetMemberId` kontrolü yerine `copyProgramBodySchema.safeParse(req.body)` kullan
  - `shared` paketi export listesine ekle

- [x] **3. `getMemberActiveProgram` Kod Tekrarı**
  - `backend/src/services/program.service.ts` → `getMemberActiveProgram` ve `getMyActiveProgram` arasındaki ortak program select bloğunu `buildProgramSelect()` özel yardımcı fonksiyonuna çıkar
  - Her iki fonksiyon bu yardımcıyı çağırır; dışa açılmaz

---

## Etkilenen Dosyalar

```
backend/src/routes/
├── workout-completions.ts    # limit query coerce
├── programs.ts               # copy endpoint Zod
backend/src/services/
└── program.service.ts        # buildProgramSelect() extract
shared/src/schemas/           # veya mevcut export dosyası
└── (copyProgramBodySchema ekle)
```

---

## Dikkat Noktaları

- Zod `z.coerce.number()` string'i otomatik parse eder; `'abc'` için hata üretir → 400 döner, 500 değil
- `copyProgramBodySchema` shared'a gidince `@alpfit/shared` import'u güncellenmeli
- `buildProgramSelect()` fonksiyonu private helper — modülden export edilmez
- Mevcut testlerin kırılmadığını `pnpm test` ile doğrula

---

## Test Kriterleri

- [x] `GET /me/workout-completions?limit=abc` → HTTP 400 (önceden 500)
- [x] `GET /me/workout-completions?limit=5` → HTTP 200, `items` max 5 kayıt
- [x] `POST /programs/:id/copy` body eksik → HTTP 400 (Zod mesajı)
- [x] `POST /programs/:id/copy` geçerli body → davranış değişmedi, önceki testler geçiyor
- [x] `getMemberActiveProgram` ve `getMyActiveProgram` önceki testler aynen geçiyor (davranış değişmedi)
- [x] `pnpm -F backend test` — 234 test yeşil

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-31
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `shared/src/schemas/program.ts` → `copyProgramBodySchema` eklendi ve export edildi; `pnpm -F @alpfit/shared build` ile dist güncellendi
- `backend/src/routes/programs.ts` → `POST /programs/:id/copy` handler'ında ham tip kontrolü kaldırıldı, `copyProgramBodySchema.safeParse(req.body)` ile Zod doğrulaması eklendi
- `backend/src/routes/workout-completions.ts` → `GET /me/workout-completions` handler'ında `parseInt(query.limit)` yerine `workoutHistoryQuerySchema` (Zod coerce) kullanıldı; `limit=abc` → 400 döndürüyor
- `backend/src/services/program.service.ts` → `buildProgramSelect()` private helper çıkarıldı; `fetchFullProgram`, `getMemberActiveProgram`, `getMyActiveProgram` üçü de bu helper'ı kullanıyor
- Test case'ler eklendi: `limit=abc → 400`, `limit=5 → max 5 kayıt`, `copy body eksik → 400`
- 234 test yeşil

---

**Oluşturulma:** 2026-05-31
