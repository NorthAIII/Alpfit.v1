# TASK-2.15: CI Kalite — Lint + Format + Backend Typecheck Düzeltmesi

**Durum:** ✅ Tamamlandı
**Modül:** M0: Çekirdek Altyapı (modules/M0-cekirdek-altyapi.md)
**Feature:** Cross-cutting CI kalitesi
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.14 ✅

---

## Hedef

Faz 2 task'larının bıraktığı lint + format + backend typecheck hatalarını temizle. `pnpm lint`, `pnpm format:check` ve `pnpm -F @alpfit/backend typecheck` hatasız geçmeli. Task sonunda CI kalite job'ı (Lint & Format) ve backend typecheck job'ı yeşile döner.

---

## Bağlam

verify-phase 2 otomatik kontrollerinde saptandı. Testler ve mobile typecheck ✅; ancak CI'da şu 3 kategori fail etmekte:
- **Lint:** 35 hata (import/order, `toLowerCase` yasak, unused vars, `require()` style)
- **Format:** 25 dosyada Prettier uyumsuzluğu (çoğu Faz 2 dosyaları)
- **Backend Typecheck:** 2 TS strict hatası (exercises route + workout-completions route)

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/memory/tr-locale-util-zorunlu.md` — `trLower` / `trUpper` kullanım kuralı
- `_dev/phases/PHASE-2.md` §UAT — verify-phase bulgu kaydı

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [x] **1. Format Düzelt (auto-fix)** — `pnpm format` ile 25 dosya otomatik düzeltildi
- [x] **2. Import Order Hataları (auto-fix)** — `pnpm lint:fix` ile import/order hataları giderildi
- [x] **3. `toLowerCase` → `trLower` (manual)** — `exercises.test.ts`: `trLower` import edildi; satır 125 ve 141 düzeltildi
- [x] **4. Unused Variables (manual)** — `programs.test.ts`: 4 unused var sırasıyla kaldırıldı (`{ trainer }` destructure, `await seedExercise()`, `{ auth }` destructure, `await server.prisma.program.create(...)`)
- [x] **5. `require()` Style Imports (manual)** — `[programDayId].test.tsx`: `import { useLocalSearchParams } from 'expo-router'` eklendi; 4 `require()` çağrısı değiştirildi
- [x] **6. Backend TypeScript Hataları (manual)** — `exercises.ts`: createExercise + updateExercise spread pattern; `workout-completions.ts`: `typeof isLate === 'boolean' && { isLate }` spread
- [x] **7. Kalan Lint Temizlik** — `useProgramAutoSave.ts`'deki geçersiz `// eslint-disable-next-line react-hooks/exhaustive-deps` yorumu kaldırıldı; `pnpm lint` 0 hata
- [x] **8. Tüm Testleri Doğrula** — 519 test (41+251+227) ✅

---

## Etkilenen Dosyalar

```
backend/src/routes/
├── exercises.ts                         # TS tipi düzeltme
├── exercises.test.ts                    # trLower + import/order
├── programs.test.ts                     # unused vars
├── server.ts                            # import/order

mobile/app/
├── workout/[programDayId].test.tsx      # require() → import + import/order
├── workout-history/[programDayId].tsx   # import/order
├── program/[programId].tsx              # import/order
├── program/[programId].test.tsx         # import/order

mobile/src/
├── api/exercises.ts                     # import/order
├── api/programs.ts                      # import/order
├── hooks/useProgramAutoSave.ts          # import/order
├── hooks/useWorkoutHistory.ts           # import/order

mobile/test/
├── render-with-providers.tsx            # import/order
└── setup.ts                             # import/order

(+ format: 25 dosya — çoğu auto-fix)
```

---

## Dikkat Noktaları

- **Auto-fix önce, manual sonra:** `pnpm format:write` + `pnpm lint --fix` ile otomatik düzeltilebilecekleri önce bitir; sonra manual fix'lere geç. Bu sıra daha az conflict yaratır.
- **`trLower` import:** `import { trLower } from '@alpfit/shared'` — eğer `@alpfit/shared`'da test ortamında build gerekiyorsa `pnpm -F @alpfit/shared build` önce çalıştır.
- **TS `exactOptionalPropertyTypes`:** workout-completions.ts'deki hata "opsiyonel property'yi `undefined` olarak spread etme" sorunudur. Çözüm: `{ programDayId, scheduledDate, ...(typeof isLate === 'boolean' && { isLate }) }` ya da şemada `isLate` zorunlu yapılıp default `false` atanması.
- **Faz 2 testleri bozulmasın:** Hiçbir değişiklik mevcut 519 testi kırmamalı. Her sub-task sonrası test çalıştır.

---

## Test Kriterleri

- [x] `pnpm lint` → 0 hata, 0 uyarı ✅
- [x] `pnpm format:check` → 0 dosya uyumsuz ✅
- [x] `pnpm -F @alpfit/backend typecheck` → 0 hata ✅
- [x] `pnpm -F @alpfit/mobile typecheck` → 0 hata ✅
- [x] `pnpm -F @alpfit/mobile test` → 251 test ✅
- [x] `pnpm -F @alpfit/backend test` → 227 test ✅
- [x] `pnpm -F @alpfit/shared test` → 41 test ✅

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı (conventional commits formatı)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-31
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `pnpm format` → 25 dosya Prettier ile otomatik düzeltildi; `pnpm lint:fix` → import/order hataları auto-fix edildi
- `exercises.test.ts`: `trLower` import edildi; `.toLowerCase()` → `trLower()` (satır 125, 141)
- `programs.test.ts`: 4 unused var kaldırıldı (`trainerToken`, `exercise`, `member`, `prog`)
- `[programDayId].test.tsx`: `import { useLocalSearchParams } from 'expo-router'` eklendi; 4 `require()` çağrısı kaldırıldı
- `useProgramAutoSave.ts`: Geçersiz `// eslint-disable-next-line react-hooks/exhaustive-deps` yorumu kaldırıldı (plugin ESLint config'de tanımlı değil)
- `exercises.ts`: `createExercise` + `updateExercise` çağrıları `exactOptionalPropertyTypes` uyumlu spread pattern'a geçirildi
- `workout-completions.ts`: `isLate` → `typeof isLate === 'boolean' && { isLate }` spread pattern
- 519 test (41+251+227), lint 0 hata, format 0 uyumsuz, backend+mobile typecheck 0 hata

---

**Oluşturulma:** 2026-05-31 (verify-phase 2 — CI bulgu düzeltme task'ı)
