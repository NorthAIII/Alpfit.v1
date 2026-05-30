# TASK-2.06: Mobile — Egzersiz Kütüphanesi Query Hook + ExerciseSearchBottomSheet

**Durum:** ✅ Tamamlandı
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.1 — Program Builder (egzersiz seçme katmanı)
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.02 ✅, TASK-2.05 ✅

---

## Hedef

`useExercises(search?, muscleGroup?)` query hook'u ve `ExerciseSearchBottomSheet` bileşeni implement edilir. Bottom sheet: egzersiz arama + kas grubu filtreleme + listeden egzersiz seçme + "PT custom egzersiz ekle" formu içerir. Task sonunda program builder ekranında "+" butonuna basıldığında bu bottom sheet açılır ve PT egzersiz seçebilir ya da kendi egzersizini ekleyebilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → Builder UI layout (egzersiz ekleme bottom sheet kararı)
- `_dev/modules/M2-program-domain.md` §F2.1 Kabul Kriterleri — egzersiz kütüphanesi + custom egzersiz kuralları
- `_dev/modules/M2-program-domain.md` §F2.1 Edge Case'ler — kütüphane yüklenmedi senaryosu

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [x] **1. `useExercises` Query Hook**
  - `mobile/src/hooks/useExercises.ts` — `useExercises` + `useAddExercise` (TanStack Query)
  - `mobile/src/hooks/useDebounce.ts` — 300ms debounce util
  - `mobile/src/api/exercises.ts` — `fetchExercises` / `createExercise` (authedFetch tabanlı)

- [x] **2. `ExerciseSearchBottomSheet` Bileşeni**
  - `mobile/src/components/ExerciseSearchBottomSheet.tsx` — Modal tabanlı bottom sheet
  - Props: `isVisible`, `onClose`, `onSelect`; search input + 7 kas grubu chip + FlatList + loading/error/empty state

- [x] **3. Custom Egzersiz Ekleme Formu (Bottom Sheet içinde)**
  - Form: zorunlu ad, opsiyonel kas grubu, opsiyonel video URL (YouTube/Vimeo regex)
  - "Ekle" → `useAddExercise().mutateAsync` → onSelect + onClose
  - Hata: inline "Eklenemedi, tekrar dene"

- [x] **4. Temel component test**
  - `ExerciseSearchBottomSheet.test.tsx`: 10 test — loading/list/error/select/search/chip/disabled/add/video-url/invisible
  - `render-with-providers.tsx` QueryClientProvider wrap eklendi
  - `test/setup.ts`: TanStack Query senkron scheduler + React.version patch (react@19.2.6/rn-renderer@19.2.3 minor fark workaround)

---

## Etkilenen Dosyalar

```
apps/mobile/src/
├── hooks/useExercises.ts               # YENİ
├── hooks/useDebounce.ts                # YENİ (yoksa)
└── components/ExerciseSearchBottomSheet.tsx  # YENİ

apps/mobile/src/components/
└── ExerciseSearchBottomSheet.test.tsx  # YENİ
```

---

## Dikkat Noktaları

- **Bottom sheet implementasyonu:** Expo/React Native'de built-in bottom sheet yok. Seçenekler: `@gorhom/bottom-sheet` (kuruluysa kullan), `Modal` + animasyon (sıfırdan), Expo'nun `BottomSheet` (varsa). Faz 1'de ne kullanıldıysa aynı pattern'ı uygula — M1'deki rıza ekranında bottom sheet/modal var mıydı kontrol et. Eğer kurulu kütüphane yoksa `Modal` ile başla.
- **Kas grubu filtresi değerleri:** Türkçe chip etiketleri: "Tümü", "Göğüs", "Sırt", "Omuz", "Bacak", "Kol", "Karın" — API'ye `muscleGroup` parametresi olarak gönderilecek değerlerle eşleşmeli (seed.ts'deki değerler).
- **Video URL validasyonu:** YouTube: `https://www.youtube.com/watch?v=` veya `https://youtu.be/`; Vimeo: `https://vimeo.com/`. Regex ile Zod frontend validasyonu — yanlış format ise "Geçersiz video URL" uyarısı (M2 modül edge case).
- **`useExercises` cache:** Egzersiz listesi sık değişmez — agresif staleTime (10 dk) kullan. Offline'da son cache döner.

---

## Test Kriterleri

- [x] Bottom sheet açılınca egzersiz listesi yüklenir (loading → list)
- [x] Search input'a "bench" yazınca `useExercises({ search: 'bench' })` çağrılır (debounce hook ile)
- [x] Kas grubu chip seçilince `useExercises({ muscleGroup: 'Göğüs' })` çağrılır
- [x] Egzersiz satırına tıklanınca `onSelect` doğru egzersiz objesiyle çağrılır
- [x] API hata verirse "Yüklenemedi, tekrar dene" gösterilir
- [x] Custom egzersiz formu: ad boşken "Ekle" butonu disabled
- [x] Custom egzersiz eklendi → mutateAsync çağrıldı ve yeni egzersiz onSelect ile döndü
- [x] TypeScript typecheck: 0 hata

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
- `mobile/src/api/exercises.ts`: `fetchExercises` + `createExercise` (authedFetch tabanlı, exactOptionalPropertyTypes uyumlu)
- `mobile/src/hooks/useDebounce.ts`: 300ms generic debounce hook
- `mobile/src/hooks/useExercises.ts`: `useExercises(params?)` (TanStack Query, staleTime 10dk, debounce) + `useAddExercise()` mutation
- `mobile/src/components/ExerciseSearchBottomSheet.tsx`: Modal tabanlı bottom sheet — search input, 7 kas grubu chip, FlatList, loading/error/empty state, custom egzersiz formu (video URL regex YouTube/Vimeo)
- `mobile/test/render-with-providers.tsx`: `QueryClientProvider` wrap eklendi (retry: false, test izolasyonu)
- `mobile/src/components/ExerciseSearchBottomSheet.test.tsx`: 10 test (hook'lar mock'landı)
- `mobile/test/setup.ts`: TanStack Query senkron scheduler + `React.version` patch (react@19.2.6/rn-renderer@19.2.3 minor versiyon farkı workaround)

**Teknik Not (test ortamı):**
`react-native-renderer@19.2.3` DevTools init kodu `React.version !== '19.2.3'` kontrolü yapıyor; projede `react@19.2.6` yüklü. Bu fark, `fireEvent.changeText` + yeni mount edilen TextInput kombinasyonunda error fırlatıyor. `test/setup.ts`'de `React.version = '19.2.3'` patch ile giderildi. İleride `react-native`'i 19.2.6 uyumlu sürüme güncellediğinde bu satır kaldırılabilir.

**Sonuç:** 124 mobile test 0 hata. TypeScript 0 hata.

---

**Oluşturulma:** 2026-05-30 (plan-phase 2)
