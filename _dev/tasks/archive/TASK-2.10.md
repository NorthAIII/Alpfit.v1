# TASK-2.10: Mobile — Üye Ana Ekranı Temel Layout (Streak Gizli, BUGÜN Kartı, Haftalık Band)

**Durum:** ✅ Tamamlandı
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.2 — Üye Program Görüntüleme + Tamamlama
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.03 ✅, TASK-2.05 ✅

---

## Hedef

`MemberHomeScreen` ana ekranı implement edilir: streak alanı `display: none` (M3'e kadar gizli), BUGÜN kartı (antrenman var/yok durumu + CTA), haftalık band (7 gün durum ikonları), bekleme durumu (PT henüz program yazmadı). Task sonunda üye uygulamayı açınca bugünkü programını görebilir ve antrenman ekranına geçebilir.

---

## Bağlam

Streak alanı `display: none` ile gizlenir — M3 fazında açılacak. Bu kapsam tartışması kararıdır: yarım streak UI yazıp üstüne kurmak M3'ü kirletir; "Antrenmanı bitir" → 200 OK Faz 2 UAT için yeterlidir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → M2 ↔ M3 sınırı (streak alanı gizlenir)
- `_dev/modules/M2-program-domain.md` §F2.2 Kabul Kriterleri — Ana ekran kompozisyonu + Bekleme durumu + Edge case'ler

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [x] **1. `useMemberHome` Query Hook**
  - `apps/mobile/src/hooks/useMemberHome.ts` oluştur:
    - `useMyActiveProgram()` — `GET /me/program` query
    - `staleTime: 60 * 1000` (1 dk — üye açtıkça tazelensin ama çok request atmasın)
    - `gcTime: 7 * 24 * 60 * 60 * 1000` (7 gün persist — offline için)
    - Program yoksa `null` döner (bekleme durumu)
    - `getTodayWorkout(program)` util: `dayOfWeek = today`, programdan o günün `ProgramDay`'ini bul

- [x] **2. `WeeklyBand` Bileşeni**
  - `apps/mobile/src/components/WeeklyBand.tsx` oluştur:
    - Props: `programDays`, `workoutCompletions` (bu haftanın tamamlamaları — şimdilik placeholder/boş)
    - Pzt-Paz 7 hücre, yatay sıra
    - Her hücre: gün harfi (P/S/Ç/P/C/C/P) + alt durum ikonu
    - Durum mantığı (M3 yokken basit versiyon):
      - Bugün: `▶` (aktif)
      - Geçmiş gün (antrenman varsa): `⬜` (tamamlanmadı — M3'te ✓/⏰/✗ ayrımı yapılacak)
      - Geçmiş gün (dinlenme): `-`
      - Gelecek gün (antrenman): boş kutu
      - Gelecek gün (dinlenme): `-`
    - Bugünkü hücre highlight (arka plan rengi)

- [x] **3. `MemberHomeScreen` — Ana Layout**
  - `apps/mobile/src/screens/MemberHomeScreen.tsx` oluştur (veya mevcut varsa güncelle):
    - **Üst alan (streak — GİZLİ):** `{ display: 'none' }` veya `null` — M3'te açılacak. Yorum bırak: `{/* TASK-M3: streak alanı buraya gelecek */}`
    - **Banner stack alanı:** TASK-2.14'te bağlanacak; şimdilik boş `View` placeholder
    - **BUGÜN kartı:**
      - Program ve bugün antrenman varsa: antrenman tipi (ProgramDay.title veya "Antrenman") + "Antrenmana git →" CTA butonu → WorkoutScreen navigate
      - Program var ama bugün dinlenme: "Bugün dinlenme günün 🌿" + "Yarın [tip] günü"
      - Program yok: bekleme durumu (aşağıda)
    - **Haftalık Band:** `WeeklyBand` bileşeni
    - **Alt navigasyon:** "Geçmiş" sekmesi tab'ı (TASK-2.13'te doldurulacak)

- [x] **4. Bekleme Durumu**
  - Program yokken (`useMyActiveProgram` null dönerse):
    - Streak alanı hâlâ gizli
    - Ortalanmış tek kart: "🏋️ [PT Adı] senin için programını hazırlıyor. Hazır olduğunda buradan görebileceksin."
    - PT adını `GET /me/trainer` endpoint'inden çek (veya Faz 1'de kayıtlı profile verisinden al)

- [x] **5. Loading + Hata Durumları**
  - Program yükleniyor: skeleton placeholder (BUGÜN kartı alanında)
  - Program yüklenemedi: "Programını yükleyemedik. İnternetini kontrol et." + "Yenile" butonu

---

## Etkilenen Dosyalar

```
apps/mobile/src/
├── screens/MemberHomeScreen.tsx    # YENİ veya güncellendi
├── hooks/useMemberHome.ts          # YENİ
└── components/WeeklyBand.tsx       # YENİ
```

---

## Dikkat Noktaları

- **Streak alanı `display: none` karar notu:** Kapsam tartışmasından — M3'e kadar gizli. Render edilmez ama kodda yer placeholder'ı var. `display: 'none'` yerine conditional render (`null`) daha temiz — React Native'de `display: 'none'` layout hesabı yapar ama göstermez; `null` render etmez. `null` kullan.
- **Bugünün tespiti:** `new Date().getDay()` → Alpfit dayOfWeek dönüşümü (Pzt=0): `(jsDay + 6) % 7`. Saat dilimi: cihaz yerel saatini kullan (`new Date()` TR'de doğru).
- **WeeklyBand geçmiş tamamlamaları:** Bu task'ta WorkoutCompletion API'sini çağırma — boş bırak veya placeholder. TASK-2.12 sonrası `useWorkoutHistory` ile bağlanacak. Şimdilik hücreler statik durum ikonu (sadece bugün ▶, diğerleri boş).
- **Dinlenme günü tespiti:** `program.days` içinde o `dayOfWeek`'e ait `ProgramDay` yoksa → dinlenme günü.

---

## Test Kriterleri

- [x] Program varken bugün antrenman varsa BUGÜN kartı "Antrenmana git →" gösterir
- [x] Bugün dinlenme günüyse "Bugün dinlenme günün 🌿" gösterilir
- [x] Program yokken bekleme durumu ("PT hazırlıyor" kartı) gösterilir
- [x] WeeklyBand 7 hücre gösteriyor; bugünkü hücre highlight'lı
- [x] "Antrenmana git →" butonuna basılınca WorkoutScreen navigate oluyor (TASK-2.11 sonrası tam çalışacak; `@ts-expect-error` ile geçici tipleme)
- [x] Streak alanı görünmüyor (null render)
- [x] Yükleniyor durumunda skeleton/indicator gösterilir
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

**2026-05-30** — TASK-2.10 tamamlandı.
- `mobile/src/api/programs.ts`: `fetchMyActiveProgram()` eklendi (GET /me/program, 404→null)
- `mobile/src/hooks/useMemberHome.ts` (YENİ): `useMyActiveProgram` (staleTime 1dk, gcTime 7gün) + `getTodayWorkout` util + `toAlpfitDay/todayAlpfitDay` helpers
- `mobile/src/components/WeeklyBand.tsx` (YENİ): Pzt-Paz 7 hücre, today highlight, ▶/⬜/□/- durum ikonları
- `mobile/app/home/index.tsx` güncellendi: loading/hata/bekleme/dinlenme/antrenman durumları; `@ts-expect-error` ile TASK-2.11 placeholder navigate; streak null render
- 14 yeni test (WeeklyBand: 5, MemberHomeScreen: 9). 187 mobile test 0 hata. TypeScript 0 hata.

---

**Oluşturulma:** 2026-05-30 (plan-phase 2)
