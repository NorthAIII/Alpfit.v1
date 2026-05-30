# TASK-2.13: Mobile — Geçmiş Sekmesi (WorkoutHistoryScreen)

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.2 — Üye Program Görüntüleme + Tamamlama
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.04 ✅, TASK-2.12 ✅

---

## Hedef

`WorkoutHistoryScreen` implement edilir: tamamlanmış antrenmanlar tarih sırasıyla en yeni üstte, cursor-based lazy load (30/page), satıra tıklayınca o günün egzersizleri okuma modunda gösterilir, boş durum ("Henüz tamamlanmış antrenmanın yok"). Task sonunda üye "Geçmiş" sekmesinde geçmiş antrenmanlarını görebilir ve tekrar bakabilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M2-program-domain.md` §F2.2 Kabul Kriterleri — Geçmiş antrenmanlar + Edge case'ler (boş geçmiş)
- `_dev/phases/PHASE-2.md` §Kapsam Dışı — geçmiş sekmesinde filtre/grafik v1.5 adayı (bu fazda yok)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. `useWorkoutHistory` Hook**
  - `apps/mobile/src/hooks/useWorkoutHistory.ts` oluştur:
    - `useInfiniteQuery` ile `GET /me/workout-completions?cursor=&limit=30`
    - `getNextPageParam(lastPage)` → `lastPage.nextCursor ?? undefined`
    - Cache: persist altyapısından yararlanır (TanStack Query gcTime 7 gün)
    - Her sayfa: `{ items: WorkoutCompletion[], nextCursor: string | null }`

- [ ] **2. `WorkoutHistoryScreen` — Ana Liste**
  - `apps/mobile/src/screens/WorkoutHistoryScreen.tsx` oluştur:
    - `FlatList` + `useInfiniteQuery` infinite scroll
    - Her satır:
      - Sol: tarih (dd MMM yyyy — "29 Mayıs 2026") + gün adı ("Pazartesi")
      - Orta: antrenman tipi (ProgramDay.title veya "Antrenman")
      - Sağ: durum ikonu (✓ tamamlandı / ⏰ geç tamamlandı [isLate])
    - `onEndReached`: `fetchNextPage()` — infinite scroll
    - Loading indicator (footer): son sayfaya gelindi mi kontrolü
    - **Boş durum:** "Henüz tamamlanmış antrenmanın yok. İlk antrenmanını yapınca burada görünür." ortalanmış illüstrasyon + metin

- [ ] **3. Satır Detay — Okuma Modu**
  - Satıra tıklanınca: o günün egzersizlerini okuma modunda gösteren ekran/modal
  - `GET /me/workout-completions/:id` veya mevcut program verisinden ilgili `ProgramDay` çek
  - Egzersiz listesi: set×tekrar + notlar — salt okunur, tik kutusu yok, ↑↓ yok
  - Header: "[Antrenman Tipi] — 29 Mayıs 2026" + durum badge (Tamamlandı / Geç Tamamlandı)
  - Implementasyon: ayrı ekran (`WorkoutDetailScreen`) veya bottom sheet — ekran daha temiz

- [ ] **4. Alt Navigasyon Sekmesi**
  - "Geçmiş" tab'ını alt navigasyona bağla (Faz 1'den gelen tab navigator'da):
    - Tab ikonu: saat veya takvim ikonu
    - Tab label: "Geçmiş"
    - Aktif: `WorkoutHistoryScreen` render edilir

---

## Etkilenen Dosyalar

```
apps/mobile/src/
├── screens/WorkoutHistoryScreen.tsx    # YENİ
├── screens/WorkoutDetailScreen.tsx     # YENİ (okuma modu)
└── hooks/useWorkoutHistory.ts          # YENİ
```

---

## Dikkat Noktaları

- **Tarih formatı:** `dd MMM yyyy` — "29 Mayıs 2026". `@alpfit/shared` formatTrDate util'i varsa kullan; yoksa Intl.DateTimeFormat ile TR locale: `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })`. Snapshot test için `jest.useFakeTimers().setSystemTime(...)` pin'le (memory: `feedback-snapshot-tarih-pin.md`).
- **v1'de filtre/grafik yok:** Filtre chip'leri, takvim görünümü, aylık özet — hepsi kapsam dışı (PHASE-2.md §Kapsam Dışı). Sadece düz liste.
- **Cursor-based pagination:** Offset kullanma. `nextCursor` null ise "Tüm geçmiş yüklendi" (pagination bitti).
- **Detay ekranında program verisi:** WorkoutCompletion sadece `programDayId` tutar — egzersiz detayı için `ProgramDay`'i program endoint'inden çek. Arşivlenmiş programlarda bu mümkün olmalı (program `archived` durumunda bile GET /programs/:id çalışır).

---

## Test Kriterleri

- [ ] Tamamlanmış antrenmanlar en yeni üstte sıralı listede gösterilir
- [ ] Liste sonuna gelinince `fetchNextPage()` tetiklenir, yeni sayfa yüklenir
- [ ] Boş geçmişte "Henüz tamamlanmış antrenmanın yok" mesajı görünür
- [ ] Satıra tıklanınca WorkoutDetailScreen açılır, egzersizler okuma modunda
- [ ] Tarih "29 Mayıs 2026" formatında gösterilir (TR locale)
- [ ] isLate=true satırlarda ⏰ ikonu görünür
- [ ] "Geçmiş" tab'ına tıklayınca bu ekran açılır
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
