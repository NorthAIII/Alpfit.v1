# TASK-2.08: Mobile — Program Builder — Gün İçi Egzersiz Listesi + ↑↓ Sıralama

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.1 — Program Builder (PT)
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.06 ✅, TASK-2.07 ✅

---

## Hedef

`ProgramBuilderScreen`'de seçili günün egzersiz listesi implement edilir: egzersiz kartları (set, tekrar, dinlenme, not), ↑↓ sıralama butonları, egzersiz silme ve "+" butonuna basınca `ExerciseSearchBottomSheet` açılması. Task sonunda PT bir gün için egzersiz ekleyip düzenleyebilir, sırasını değiştirebilir ve silebilir — tüm değişiklikler local state'te tutulur (TASK-2.09'da backend'e yazılacak).

---

## Bağlam

Araştırma bulgusunda DraggableFlatList reddedildi (Reanimated 4 uyumluluk riski); ↑↓ butonlar seçildi. Pilot ölçeğinde (birkaç üye) PT verimliliği için yeterli. v1.5'te gerçek drag'e geçilebilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → Egzersiz Sıralama kararı (↑↓ butonlar)
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → Builder UI layout
- `_dev/modules/M2-program-domain.md` §F2.1 Kabul Kriterleri — egzersiz programa eklenme formatı + edge case'ler

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. Egzersiz Listesi Local State (ProgramBuilderScreen)**
  - `ProgramBuilderScreen.tsx`'te 7 günlük local state yönetimi:
    - `programDays: Record<dayOfWeek, ProgramDayExercise[]>` — her gün için egzersiz dizisi
    - Başlangıç değeri: `GET /programs/:id` sonucundan beslenir (TASK-2.03 endpoint)
    - Her egzersiz için: `{ exerciseId, name, sets, reps, restSeconds?, notes?, position }`

- [ ] **2. `ExerciseDayCard` Bileşeni**
  - `apps/mobile/src/components/ExerciseDayCard.tsx` oluştur:
    - Props: `exercise`, `position`, `isFirst`, `isLast`, `onMoveUp`, `onMoveDown`, `onDelete`, `onChange`
    - UI:
      - Sol: egzersiz adı (bold) + kas grubu (muted)
      - Set/reps: iki küçük input yan yana (set: Int, reps: String "8" veya "8-12")
      - Opsiyonel alanlar: dinlenme (sn input) + not (tek satır TextInput) — initially hidden, "+" ile açılır
      - Sağ: ↑ ↓ butonlar (isFirst ise ↑ disabled; isLast ise ↓ disabled)
      - Sağ üst: sil ikonu (trash)
    - Silme: onay dialog ("Bu egzersizi kaldır?") — `Alert.alert` ile

- [ ] **3. Egzersiz Listesi Render + CRUD**
  - `ProgramBuilderScreen.tsx`'te aktif günün egzersiz listesini `ExerciseDayCard` ile render et:
    - "+" butonu → `ExerciseSearchBottomSheet`'i aç; seçilen egzersiz listeye eklenir (default: sets=3, reps="10", position=son+1)
    - `onMoveUp(index)` → dizi içinde pozisyon değişimi (swap [i] ve [i-1])
    - `onMoveDown(index)` → swap [i] ve [i+1]
    - `onDelete(index)` → diziden çıkar
    - `onChange(index, field, value)` → ilgili alanı güncelle

- [ ] **4. Boş gün state**
  - Aktif günde egzersiz yokken: ortalanmış ikon + "Bu gün için egzersiz eklenmedi" + "+ Egzersiz Ekle" CTA butonu

- [ ] **5. Temel bileşen testi**
  - `ExerciseDayCard.test.tsx`:
    - Render: egzersiz adı, set/reps görünüyor
    - ↑ butonu ilk elemanken disabled
    - ↓ butonu son elemanken disabled
    - `onMoveUp` çağrılınca doğru tetikleniyor

---

## Etkilenen Dosyalar

```
apps/mobile/src/
├── screens/ProgramBuilderScreen.tsx    # güncellendi (local state + egzersiz listesi)
├── components/ExerciseDayCard.tsx      # YENİ
└── components/ExerciseDayCard.test.tsx # YENİ
```

---

## Dikkat Noktaları

- **reps String:** "8" veya "8-12" — TextInput, keyboard type "default" (tire karakteri gerekiyor). Sayısal klavye kullanma.
- **Aynı egzersiz aynı güne iki kez:** İzin verilir (M2 edge case: "warm-up Squat" + "working Squat"). Uyarı verilmez.
- **position alanı:** Client'ta 0-indexed array sırası kullanılır; backend'e gönderilirken `position = index` olarak hesaplanır. Backend sıra validasyonu yapmaz — sıra array sırasından türetilir.
- **Opsiyonel alanlar (dinlenme + not):** Başlangıçta hidden, "Detay ekle" veya küçük "+" ile açılır — ekran kalabalıklaşmasın. Açıldıktan sonra collapse edilemez (değer varsa göster, yoksa hide).
- **Silme onayı:** Her silme için `Alert.alert` — "Kaldır" / "İptal". Accidental tap koruması.

---

## Test Kriterleri

- [ ] Aktif günde egzersiz yokken boş state gösterilir
- [ ] "+" butonuna basılınca `ExerciseSearchBottomSheet` açılır
- [ ] Egzersiz seçilince listeye eklenir (default set=3, reps="10")
- [ ] ↑↓ butonlarla egzersiz sırası değişir
- [ ] İlk egzersizde ↑ disabled; son egzersizde ↓ disabled
- [ ] Sil → onay dialog → onaylayınca egzersiz listeden kalkar
- [ ] Set/reps değerleri düzenlenebilir
- [ ] Gün sekmeleri arasında geçince her günün egzersiz listesi bağımsız (A günü listelenirken B günü değişmez)
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
