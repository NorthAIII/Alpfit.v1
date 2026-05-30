# TASK-2.06: Mobile — Egzersiz Kütüphanesi Query Hook + ExerciseSearchBottomSheet

**Durum:** ⬜ Bekliyor
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

- [ ] **1. `useExercises` Query Hook**
  - `apps/mobile/src/hooks/useExercises.ts` oluştur:
    - `useExercises(params?: { search?: string; muscleGroup?: string })` — `GET /exercises` query
    - TanStack Query `useQuery` ile; queryKey: `['exercises', params]`
    - Debounce search input: `useDebounce(search, 300)` — her tuşa istek atmasın
    - `staleTime: 10 * 60 * 1000` (10 dk — egzersiz listesi sık değişmez)
    - `useAddExercise()` mutation — `POST /exercises` (PT custom ekleme)
  - `apps/mobile/src/hooks/useDebounce.ts` oluştur (yoksa): 300ms debounce util

- [ ] **2. `ExerciseSearchBottomSheet` Bileşeni**
  - `apps/mobile/src/components/ExerciseSearchBottomSheet.tsx` oluştur:
    - Props: `isVisible: bool`, `onClose: () => void`, `onSelect: (exercise: Exercise) => void`
    - İçerik:
      - Search input (TR placeholder: "Egzersiz ara...")
      - Kas grubu filtresi: yatay kaydırmalı chip listesi (Tümü / Göğüs / Sırt / Omuz / Bacak / Kol / Karın)
      - Egzersiz listesi: `FlatList` — her satır: egzersiz adı + kas grubu (muted text)
      - Satıra tıklanınca `onSelect(exercise)` → bottom sheet kapanır
      - Loading state: skeleton placeholder (veya `ActivityIndicator`)
      - Hata durumu: "Yüklenemedi, tekrar dene" + Retry butonu
      - "Boş sonuç" state: "Egzersiz bulunamadı — kendi egzersizini ekle" CTA

- [ ] **3. Custom Egzersiz Ekleme Formu (Bottom Sheet içinde)**
  - "Kendi egzersizini ekle" → bottom sheet içinde form açılır (veya ikinci sheet):
    - Zorunlu: Egzersiz adı (TextInput)
    - Opsiyonel: Hedef kas grubu (picker/input)
    - Opsiyonel: Video URL (YouTube/Vimeo — format validasyonu)
  - "Ekle" → `useAddExercise()` mutation → başarıda liste yenilenir, yeni egzersiz otomatik seçilir (`onSelect`)
  - Hata: "Eklenemedi, tekrar dene" inline uyarı

- [ ] **4. Temel component test**
  - `ExerciseSearchBottomSheet.test.tsx`:
    - Açıkken egzersiz listesi render oluyor mu?
    - Search input'u değiştirince query parametresi güncelleniyor mu?
    - Egzersiz seçilince `onSelect` çağrıldı mı?

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

- [ ] Bottom sheet açılınca egzersiz listesi yüklenir (loading → list)
- [ ] Search input'a "bench" yazınca API `?search=bench` ile çağrılır (debounce 300ms sonra)
- [ ] Kas grubu chip seçilince API `?muscleGroup=Göğüs` ile çağrılır
- [ ] Egzersiz satırına tıklanınca `onSelect` doğru egzersiz objesiyle çağrılır
- [ ] API hata verirse "Yüklenemedi, tekrar dene" gösterilir
- [ ] Custom egzersiz formu: ad boşken "Ekle" butonu disabled
- [ ] Custom egzersiz eklendi → liste yenilendi ve yeni egzersiz seçili
- [ ] TypeScript typecheck: 0 hata

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
