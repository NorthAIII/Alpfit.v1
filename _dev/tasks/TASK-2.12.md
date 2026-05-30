# TASK-2.12: Mobile — Antrenman Tamamlama + Offline Kuyruğu + Senkron

**Durum:** ⬜ Bekliyor
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

- [ ] **1. `useCompleteWorkout` Hook**
  - `apps/mobile/src/hooks/useCompleteWorkout.ts` oluştur:
    - `useCompleteWorkout()` — TanStack Query `useMutation`
    - mutation: `POST /workout-completions` body: `{ programDayId, scheduledDate, isLate? }`
    - **Başarı:** tamamlanma state set et (UI güncelle) + `queryClient.invalidateQueries(['workout-completions'])` (geçmiş sekmesi güncellensin)
    - **409 (Already Completed):** sessizce başarı say — idempotent. Kullanıcıya hata gösterme.
    - **Offline / ağ hatası:** TanStack Query retry mekanizması — 2 retry, sonra `onError` callback

- [ ] **2. Offline Kuyruğu**
  - Offline senaryo: `POST /workout-completions` başarısız (network error, not 4xx):
    - TanStack Query `offline` mutation queue: `networkMode: 'offlineFirst'` veya `'online'` seçeneği değerlendir
    - Alternatif: TanStack Query v5'te `persistMutations` ile offline queue persist — kurulum karmaşıksa basit yaklaşım kullan:
      - Mutation fail → AsyncStorage'a bekleyen completion yaz
      - `NetInfo` ile internet gelince → queue'dan çek → tekrar dene
    - **NetInfo paketi:** `@react-native-community/netinfo` — zaten kuruluysa kullan, yoksa `expo-network` veya basit `fetch` kontrol
    - UI: "Bağlantı yok — internet gelince otomatik kaydedilecek" banner
    - UI davranışı: tamamlanmış gibi davran (optimistic) — üye spor salonundan çıkarken endişelenmesin

- [ ] **3. WorkoutScreen — Tamamlama Akışı**
  - `WorkoutScreen.tsx`'i güncelle:
    - "Antrenmanı Bitir" basıldığında → `completeWorkout({ programDayId, scheduledDate })` çağır
    - Yükleniyor: buton "Kaydediliyor..." + loading indicator
    - Başarı: "🎉 Harika iş! Antrenmanını tamamladın." konfeti/toast animasyonu → 1-2 sn sonra MemberHomeScreen'e navigate (replace — geri butonu bu ekrana dönmesin)
    - Offline success (optimistic): "Kaydedildi — Senkronize edilecek" → aynı navigate davranışı
    - Hata (non-retry, 4xx): "Kaydedilemedi. Destek için PT'ne yaz." alert

- [ ] **4. Tamamlama Sonrası UI**
  - `MemberHomeScreen`'de: antrenman tamamlanınca BUGÜN kartı güncellenir (✓ tamamlandı durumu)
  - TanStack Query `invalidateQueries(['program', 'me'])` → MemberHomeScreen yeniden fetch
  - WeeklyBand: bugünkü hücre durum ikonu güncellenir (✓ veya tamamlandı rengi)

---

## Etkilenen Dosyalar

```
apps/mobile/src/
├── hooks/useCompleteWorkout.ts     # YENİ
└── screens/WorkoutScreen.tsx       # güncellendi (tamamlama butonu artık çalışıyor)
```

---

## Dikkat Noktaları

- **"Antrenmanı bitir" geri alınamaz (M2 spec):** Navigate replace ile geriye dönüşü engelle — üye yanlışlıkla tekrar basamasın. Server zaten idempotent ama "accidental double submit" UX karmaşası olmasın.
- **Optimistic UI:** Offline'da tamamlanmış gibi davranmak üzere local state hemen güncellenir — senkron beklenmez. Senkron başarısızsa (3 retry sonra) kullanıcıya bildir + "Tekrar dene" seçeneği.
- **NetInfo veya basit fetch kontrolü:** `@react-native-community/netinfo` projeye kuruluysa kullan. Yoksa `expo-network` dene. Hiçbiri yoksa basit: TanStack Query'nin network detection'ına güven (`networkMode: 'online'` — internet yokken mutation suspend eder, gelince auto-retry).
- **scheduledDate:** Üye "Antrenmanı bitir" basınca `scheduledDate = new Date()` değil — o günün antrenmana ait tarih (`programDay.specificDate` veya bugünün tarihi `YYYY-MM-DD`). Saat sıfır, sadece tarih bileşeni önemli (TR zaman dilimi).
- **isLate flag:** Bu task'ta `isLate: false` gönder. Telafi akışı (M3) isLate: true gönderecek.

---

## Test Kriterleri

- [ ] "Antrenmanı Bitir" basılınca `POST /workout-completions` çağrılır
- [ ] Başarılı → "🎉 Harika iş!" mesajı → MemberHomeScreen navigate (geri dönemiyor)
- [ ] Aynı antrenman tekrar gönderilse (409) → hata yok, sessizce başarı
- [ ] Offline iken tamamlama → "Bağlantı yok — internet gelince kaydedilecek" → navigate
- [ ] Internet gelince → bekleyen completion otomatik gönderilir
- [ ] MemberHomeScreen'de WeeklyBand bugünkü hücre güncellenir
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
