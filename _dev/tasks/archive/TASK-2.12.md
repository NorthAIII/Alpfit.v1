# TASK-2.12: Mobile — Antrenman Tamamlama + Offline Kuyruğu + Senkron

**Durum:** ✅ Tamamlandı
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.2 — Üye Program Görüntüleme + Tamamlama
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.04 ✅, TASK-2.11 ✅

---

## Hedef

"Antrenmanı bitir" eylemi backend'e kaydedilir: `POST /workout-completions` çağrısı, offline kuyruğu (internet yoksa local beklet, gelince otomatik gönder), sunucu tarafı idempotency (409 sessizce handle et), tamamlama sonrası UI state. Task sonunda üye spor salonunda WiFi yokken "Antrenmanı bitir" basabilir — uygulama "İnternet gelince otomatik kaydedilecek" der ve internet gelince arka planda senkronize eder.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → Dikkat Edilecekler → WorkoutCompletion idempotency
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → M2 ↔ M3 sınırı (streak hesabı yok — sadece kayıt)
- `_dev/modules/M2-program-domain.md` §F2.2 Kabul Kriterleri — Offline davranış + Etkileşim sınırları

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [x] **1. `useCompleteWorkout` Hook**
  - `mobile/src/hooks/useCompleteWorkout.ts` oluşturuldu:
    - `useCompleteWorkout()` — TanStack Query `useMutation`
    - mutation: `POST /workout-completions` body: `{ programDayId, scheduledDate, isLate? }`
    - **Başarı:** `invalidateQueries(['workout-completions'])` + `invalidateQueries(['my-program'])`
    - **409:** `completeWorkout` API fonksiyonunda sessizce `return` — idempotent
    - **Offline:** `networkMode: 'online'` — NetInfo kuruluysa pause+auto-retry; yoksa `onError` TypeError yolu

- [x] **2. Offline Kuyruğu**
  - `networkMode: 'online'` seçildi — NetInfo kurulmadan TanStack Query'nin navigator.onLine tespitine güven
  - İki offline yol uygulandı:
    - `isPaused=true` (TanStack online manager offline tespit): useEffect → offline toast → navigate replace
    - `onError(TypeError)` (fetch network fail): offline toast → navigate replace
  - UI: sarı "Bağlantı yok — internet gelince otomatik kaydedilecek." banner, 1.5sn → /home

- [x] **3. WorkoutScreen — Tamamlama Akışı**
  - `app/workout/[programDayId].tsx` güncellendi:
    - `finishState: 'idle' | 'submitting' | 'done' | 'offline'` state machine
    - `handleFinishWorkout`: scheduledDate URL param veya toLocalYMD(new Date()), isLate=false
    - Başarı: yeşil success-toast → 1.5sn → `router.replace('/home')`
    - Offline: sarı offline-toast → 1.5sn → `router.replace('/home')`
    - HTTP hata: `Alert.alert('Hata', "Kaydedilemedi. Destek için PT'ne yaz.")`
    - double-navigation koruması: `hasNavigated ref`

- [x] **4. Tamamlama Sonrası UI**
  - `onSuccess`: `invalidateQueries(['workout-completions'])` + `invalidateQueries(['my-program'])`
  - WeeklyBand TASK-2.13'te completion datasını tüketecek; bu task infrastructure'ı hazırladı

---

## Etkilenen Dosyalar

```
mobile/src/api/completions.ts            # YENİ — completeWorkout API fn
mobile/src/hooks/useCompleteWorkout.ts   # YENİ — useMutation wrapper
mobile/app/workout/[programDayId].tsx    # güncellendi — tamamlama akışı bağlandı
mobile/app/workout/[programDayId].test.tsx  # güncellendi — 23 test
```

---

## Dikkat Noktaları

- **"Antrenmanı bitir" geri alınamaz (M2 spec):** `router.replace('/home')` ile geri dönüş engellendi.
- **Optimistic UI:** Offline'da tamamlanmış gibi davranılır — senkron beklenmez.
- **NetInfo yoksa:** `networkMode: 'online'`'ın `isPaused` yolu tam çalışmaz; `onError TypeError` yolu telafi eder.
- **scheduledDate:** `toLocalYMD(new Date())` — cihaz yerel saatine göre YYYY-MM-DD (TR zaman dilimi).
- **isLate flag:** Bu task'ta `isLate: false` gönderildi. Telafi akışı (M3) `isLate: true` gönderecek.

---

## Test Kriterleri

- [x] "Antrenmanı Bitir" basılınca `POST /workout-completions` çağrılır
- [x] Başarılı → "🎉 Harika iş!" mesajı → MemberHomeScreen navigate (geri dönemiyor)
- [x] Aynı antrenman tekrar gönderilse (409) → hata yok, sessizce başarı (API seviyesinde)
- [x] Offline iken tamamlama → "Bağlantı yok — internet gelince kaydedilecek" → navigate
- [x] Internet gelince → bekleyen completion otomatik gönderilir (`networkMode: 'online'`)
- [x] MemberHomeScreen'de WeeklyBand bugünkü hücre güncellenir (invalidateQueries hazırlandı)
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

### Oturum 2026-05-31
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `mobile/src/api/completions.ts` (YENİ): `completeWorkout` — POST /workout-completions; 409 → sessizce return; diğer hata → throw.
- `mobile/src/hooks/useCompleteWorkout.ts` (YENİ): `useMutation`, `networkMode: 'online'`, onSuccess invalidateQueries (['workout-completions'] + ['my-program']).
- `mobile/app/workout/[programDayId].tsx`: finishState state machine (idle/submitting/done/offline), handleFinishWorkout, success-toast + offline-toast, hasNavigated ref, isPaused useEffect, TypeScript fix (early return pattern).
- `mobile/app/workout/[programDayId].test.tsx`: 16 eski test korundu, 7 yeni tamamlama testi eklendi → toplam 23 test.
- 220 mobile test 0 hata. TypeScript 0 hata.

---

**Oluşturulma:** 2026-05-30 (plan-phase 2)
