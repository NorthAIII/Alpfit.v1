# TASK-2.15: CI Kalite — Lint + Format + Backend Typecheck Düzeltmesi

**Durum:** ⬜ Bekliyor
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

- [ ] **1. Format Düzelt (auto-fix)**
  - `pnpm format:write` çalıştır — Prettier 25 dosyayı otomatik düzeltir
  - Dosyaları gözden geçir, istemeden değişen yapı varsa geri al
  - `pnpm format:check` ile doğrula

- [ ] **2. Import Order Hataları (auto-fix)**
  - `pnpm lint --fix` çalıştır — import/order hataları auto-fixable
  - Kalan manual fix gerektirenleri listele

- [ ] **3. `toLowerCase` → `trLower` (manual)**
  - `backend/src/routes/exercises.test.ts:125, 141`
  - `@alpfit/shared` → `trLower()` import et, ham `.toLowerCase()` değiştir

- [ ] **4. Unused Variables (manual)**
  - `backend/src/routes/programs.test.ts:504` — `trainerToken` → `_trainerToken` veya sil
  - `backend/src/routes/programs.test.ts:611` — `exercise` → `_exercise` veya sil
  - `backend/src/routes/programs.test.ts:636` — `member` → `_member` veya sil
  - `backend/src/routes/programs.test.ts:697` — `prog` → `_prog` veya sil

- [ ] **5. `require()` Style Imports (manual)**
  - `mobile/app/workout/[programDayId].test.tsx:163, 169, 245, 261`
  - `require()` çağrılarını `import` bildirimine dönüştür

- [ ] **6. Backend TypeScript Hataları (manual)**
  - `backend/src/routes/exercises.ts`: `name: string | undefined` → service dönüş tipi `name: string` garantisi ekle veya route'da undefined guard
  - `backend/src/routes/workout-completions.ts:33`: `isLate: boolean | undefined` → `CompleteWorkoutInput` ile uyum için `...(isLate !== undefined && { isLate })` spread paterni veya şema düzeltmesi

- [ ] **7. Kalan Lint Temizlik**
  - `pnpm lint` çalıştır, kalan hataları incele
  - Tüm hataları gider
  - `pnpm lint` ve `pnpm format:check` sıfır hatayla geçmeli

- [ ] **8. Tüm Testleri Doğrula**
  - `pnpm -F @alpfit/mobile test`, `pnpm -F @alpfit/backend test`, `pnpm -F @alpfit/shared test`
  - Tüm 519 test hâlâ geçmeli

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

- [ ] `pnpm lint` → 0 hata, 0 uyarı (veya yalnızca meşru warnings)
- [ ] `pnpm format:check` → 0 dosya uyumsuz
- [ ] `pnpm -F @alpfit/backend typecheck` → 0 hata
- [ ] `pnpm -F @alpfit/mobile typecheck` → 0 hata (bozulmadı)
- [ ] `pnpm -F @alpfit/mobile test` → 251 test ✅
- [ ] `pnpm -F @alpfit/backend test` → 227 test ✅
- [ ] `pnpm -F @alpfit/shared test` → 41 test ✅

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (conventional commits formatı)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi

---

## Oturum Kayıtları

(Henüz oturum yok)

---

**Oluşturulma:** 2026-05-31 (verify-phase 2 — CI bulgu düzeltme task'ı)
