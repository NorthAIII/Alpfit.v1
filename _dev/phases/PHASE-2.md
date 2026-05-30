# Phase 2: Program akışı uçtan uca (M2)

**Durum:** 🔄 Devam ediyor

---

## Genel Bilgiler

**Amaç:** PT'nin bir üyeye haftalık antrenman şablonu yazması, üyenin programı görmesi ve antrenmanını tamamlaması akışını uçtan uca ayağa kaldırmak. Çekirdek egzersiz kütüphanesi + custom egzersiz, offline cache + senkron, in-app video oynatma bu fazda çalışır hale gelir. Faz sonu: M2 → M3 sinyali hazır, antrenman tamamlama backend'e kaydediliyor.

**Milestone:**
- PT en az bir üyeye 7 günlük haftalık şablon yazabilir (çekirdek kütüphane veya custom egzersiz)
- Şablon kaydedilir kaydedilmez üyenin app'inde anında görünür
- Üye programını görür, antrenmanını tamamlar ("Antrenmanı bitir" → backend `workout_completion` kaydı)
- Çevrimdışı: antrenman ekranı cache'ten açılır; tamamlama internet gelince senkronize olur
- Video in-app modal'da oynar (YouTube embed)
- PT mevcut üyenin programını başka üyeye kopyalayabilir
- Tüm akışlar test kapsamında (backend unit+integration, mobile component+smoke)

### Feature Listesi

| Feature | Modül | Açıklama |
|---------|-------|----------|
| F2.1: Program Builder (PT) | M2 | Haftalık şablon, çekirdek 50 egzersiz, custom egzersiz, kopyalama |
| F2.2: Üye Program Görüntüleme + Tamamlama | M2 | Ana ekran, antrenman ekranı, offline cache, video embed, tamamlama sinyali |

---

## Kapsam Tartışması

> Bu bölüm `/devflow:discuss-phase 2` oturumunda (2026-05-30) dolduruldu.

### Alınan Kararlar

**M2 ↔ M3 sınırı:**
- "Antrenmanı bitir" → backend'e `workout_completion` kaydı düşer (M3 için hazır endpoint, future-proof). Bu fazda streak hesabı yapılmaz — streak alanı üye ana ekranında gizlenir (M3 faza kadar görünmez). Gerekçe: ILKELER §Kalıcılık — streak motorunun yarım parçasını şimdi yazıp sonra üstüne kurmak M3 fazını kirletir; "Antrenmanı bitir" → 200 OK Faz 2 UAT için yeterlidir.

**Builder giriş noktası (M5 yokken):**
- Mevcut "Üyeler" sekmesindeki aktif üye satırına tap → üye mini-detay sayfası açılır (ad, telefon son 4, katılım tarihi), "Program yaz" butonu bu sayfada. M5 fazında bu ekran tam PT Dashboard üye detayına dönüşür — mimari hazır, revize küçük. Gerekçe: ILKELER §Scope disiplini — ayrı "Program" alt sekmesi açmak M5 tasarımını önceden bağlar.

**Builder UI layout:**
- Haftanın günleri: üstte yatay kaydırmalı sekme (Pzt/Sal/Çar/Per/Cum/Cmt/Paz); aktif gün highlight'lı; FlatList horizontal. Mobile standart pattern, sığdırma sorunu yok.
- Egzersiz ekleme: "+" → bottom sheet modal (search input + kas grubu filtresi). Bottom sheet Expo native feel için daha uygun; modal yerine daha az etkileşim adımı.
- Egzersiz sıralama: DraggableFlatList (react-native-draggable-flatlist, Reanimated 3 — Expo SDK 56 ile uyumlu).

**Video hosting:**
- YouTube embed — react-native-webview ile in-app modal. Maliyet sıfır, setup basit. M2 modül notu "v1'de YouTube embed pratik" ile örtüşüyor. Çekirdek egzersiz videoları Alpfit YouTube kanalından; PT custom egzersiz için opsiyonel YouTube/Vimeo URL.

**Program kaydetme UX:**
- Auto-save draft (yerel state + debounced backend PATCH 1 sn) — PT yarım bırakabilir, "Taslak kaydedildi" indicator görünür. "Kaydet" butonu explicit publish — basıldığında üyenin app'inde görünür. Kayıp riski sıfır, PT kontrolü korunur.

**Offline cache kapsam:**
- Haftalık şablonun tamamı (7 gün) cache'lenir — React Query persist + MMKV (new arch compat, Expo SDK 56 uyumlu). Sadece bugün değil; üye haftanın herhangi bir günü offline bakabilir.

**Program değişikliği bildirimi (M4 yokken):**
- Bu fazda push gönderilemez (M4 yok). Üye bir sonraki app açışında nötr in-app banner ("Programında güncelleme var"). M1'deki davet kabul banner'ı precedent'i kullanılır — aynı banner-store katmanına bağlanır. M4 fazında bu tetikleyici push'a yükseltilir.

**Program kopyalama:**
- Bu fazda dahil. "Başka üyenin programını kopyala" CTA builder içinde — PT verimliliği (ILKELER §En Yüksek Öncelikli Eksen #2) için kritik. Şablonu hedef üyeye kopyalar, PT kişiselleştirir.

**Çekirdek egzersiz kütüphanesi (seeder):**
- Faz 2'de backend `exercises` tablosu + seeder (placeholder egzersizler, gerçek 50 liste Yakın 5 blocker'ı). PT builder bu tablodan çeker. Video URL'siz egzersizlerde video butonu görünmez.

### Kullanıcı Tercihleri

- Kullanıcı kararları bu oturumda skip edildi; tüm kararlar best practice + proje ilkelerine göre alındı.

### Kapsam Dışı

- **M3 streak hesabı ve motoru** (telafi, T+2/T+7/T+14 comeback) — M3 fazı
- **M4 push bildirimleri** (program değişikliği push, yeni program push) — M4 fazı; bu fazda in-app banner ile yetinilir
- **M5 PT Dashboard** (üye listesi + banner stack + üye detay tam ekranı) — M5 fazı
- **Sürükle-kaydır sayfa geçişi** üye ana ekranında — v1.5 adayı
- **Üye streak opt-out toggle** — v1.5 adayı
- **Geçmiş sekmesi grafik/filtre** — v1.5 adayı
- **Süperset / RIR / tempo formatları** — v1.5 adayı
- **Çekirdek 50 egzersiz + videoların finalize edilmesi** — Yakın 5 blocker (bu fazda placeholder seeder yeterli)
- **Gerçek SMS provider** — Yakın 5
- **E2E testler (Maestro)** — Yakın 5

---

## Araştırma Bulguları

> Bu bölüm `/devflow:research-phase 2` oturumunda (2026-05-30) dolduruldu.

### Değerlendirilen Yaklaşımlar

**Egzersiz Sıralama (PT Builder):**
- `react-native-draggable-flatlist`: Projede kurulu Reanimated 4.3.1 ile tam uyumluluğu teyit edilmemiş (GitHub'da açık issue'lar); v1'de risk taşır.
- Yukarı/Aşağı butonları (↑ ↓): Sıfır bağımlılık riski, pilot ölçeğinde PT için yeterli UX, 1 günde tamamlanır.
- **Seçilen:** ↑ ↓ butonlar — v1.5'te gerçek drag'e geçilebilir (ILKELER §Scope disiplini).

**Offline Cache:**
- MMKV: 30× daha hızlı ama Expo managed workflow'da `expo prebuild` (dev build) gerektirir — Expo Go kaybedilir.
- AsyncStorage + TanStack Query persister: Expo managed workflow'da sorunsuz, pilot ölçeğinde (küçük program JSON'u) hız farkı duyulmaz.
- **Seçilen:** AsyncStorage persister — `@react-native-async-storage/async-storage` + `@tanstack/react-query-persist-client`.

**Video Oynatma:**
- `react-native-webview`: Expo SDK 56 + New Arch ile tam uyumlu; `npx expo install react-native-webview` yeterli. YouTube embed için `allowsInlineMediaPlayback={true}` + `mediaPlaybackRequiresUserAction={false}` gerekli (iOS inline playback).
- **Seçilen:** `react-native-webview` + YouTube iframe embed.

### Kullanılacak Kütüphaneler

**Mobile (yeni eklenecek):**
- `@tanstack/react-query` v5 — server state yönetimi (builder PATCH + viewer GET)
- `@tanstack/react-query-persist-client` — offline persist koordinatörü
- `@tanstack/query-async-storage-persister` — AsyncStorage adaptörü
- `@react-native-async-storage/async-storage` — persist depolama
- `react-native-webview` — YouTube embed in-app modal

**Backend (yeni eklenecek):**
- Yeni DB tabloları + Prisma migration (bkz. Teknik Kararlar → DB Schema)
- Yeni Fastify route'ları (exercises, programs, workout-completions)

### Teknik Kararlar

**DB Schema — M2 yeni tablolar:**

```
Exercise
  id, name (TR), muscleGroup?, videoUrl?, isCustom (bool), createdById? (trainerId)
  @@index([isCustom]), @@index([createdById])

Program (haftalık şablon)
  id, trainerId, memberId, status (draft|active|archived), publishedAt?, archivedAt?
  @@index([memberId, status]), @@index([trainerId])

ProgramDay (şablon günleri)
  id, programId, dayOfWeek (0=Pzt..6=Paz), title? (Push/Pull/Legs), position (sıra)
  isOneOff (bool, default false), specificDate? (Date — tek seferlik gün için)
  @@index([programId, dayOfWeek])

ProgramDayExercise (gün içi egzersizler)
  id, programDayId, exerciseId, sets (int), reps (String — "8" veya "8-12"),
  restSeconds?, notes?, position (↑↓ sıra)
  @@index([programDayId])

WorkoutCompletion (tamamlama kaydı — M3'e sinyal)
  id, memberId, programDayId, scheduledDate (Date), completedAt, isLate (bool)
  @@unique([memberId, programDayId, scheduledDate])  — server-side idempotent
  @@index([memberId, scheduledDate])
```

**Reps tipi String:** "8" veya "8–12" aralığı desteklensin diye — Int değil.

**Tek seferlik gün:** ProgramDay'e `isOneOff: Boolean + specificDate?: Date` eklenir; `isOneOff=true` ise `dayOfWeek` baz alınmaz, sadece o tarihte gösterilir. Template günlerden ayrı model açmak yerine aynı tabloda flag çözümü tercih edildi (ilişki basit kalır).

**API Endpoint Tasarımı:**

```
Exercises:
  GET  /exercises               → listeleme (search + muscleGroup filtresi)
  POST /exercises               → PT custom egzersiz ekle
  PUT  /exercises/:id           → PT kendi custom'ını düzenle
  DELETE /exercises/:id         → PT kendi custom'ını sil (soft delete)

Programs:
  POST /programs                → yeni program oluştur (draft, trainerId+memberId)
  PATCH /programs/:id           → auto-save (debounced 1s, tam yapı gönderilir)
  POST /programs/:id/publish    → PT explicit publish (üye görür)
  POST /programs/:id/copy       → başka üyeye kopyala
  GET  /programs/:id            → tam program (days + exercises)
  GET  /members/:memberId/program → aktif program (PT view)
  GET  /me/program              → kendi aktif programı (üye view)

Workout Completions:
  POST /workout-completions     → "Antrenmanı bitir" (idempotent)
    body: { programDayId, scheduledDate, isLate? }
  GET  /me/workout-completions  → geçmiş (cursor-based, 30/page)
```

**Auto-save Mimarisi:**

Local state → `useEffect` + `setTimeout(1000)` debounce → `PATCH /programs/:id` (tüm yapı, küçük veri). "Taslak kaydedildi" / "Kaydediliyor..." / "Kaydetme hatası, tekrar dene" 3 state indicator. Publish butonu debounce bypass, direkt mutation.

**TanStack Query Persist Kurulumu:**

QueryClient `gcTime: 7 * 24 * 60 * 60 * 1000` (7 gün) — offline hafızada haftalık program cache'de kalır. Persist key: `alpfit-cache-v1` (versiyon prefix'i; schema değişince bump + invalidate).

**Egzersiz Seeder:** `backend/prisma/seed.ts` — ilk aşamada ~20 placeholder egzersiz (video URL'siz); Yakın 5'te gerçek 50 + video URL güncellenir. `prisma db seed` ile çalıştırılır.

### Dikkat Edilecekler

- **New Arch + kütüphane filtresi:** Faz 2'de yeni paket eklenirken "Expo SDK 56 + New Arch uyumlu" kontrolü şart (TECH-STACK.md uyarısı).
- **YouTube embed iOS:** `allowsInlineMediaPlayback={true}` + `mediaPlaybackRequiresUserAction={false}` olmadan iOS'ta tam ekrana geçer — dikkat.
- **WorkoutCompletion idempotency:** `@@unique([memberId, programDayId, scheduledDate])` server tarafında; client retry'da backend 409 döndürür, mobile sessizce handle eder.
- **Auto-save ve publish race:** Debounce süresi içinde PT publish basarsa inflight PATCH cancel edilmeli (mutasyonları yokla veya publish öncesi await son PATCH).
- **Program değişikliği banner (M4 yokken):** M1'de kurulan `banner-store` kullanılır; `program_changed` event tipi eklenir. M4 fazında bu event push'a yükseltilir — değişiklik minimum.
- **Streak alanı gizlenir:** Üye ana ekranında streak UI M3 fazına kadar `display: none` (PHASE-2.md Kapsam Tartışması kararı). Backend `workout_completion` endpoint'i M3 için hazır — streak hesabı yapılmaz.
- **Shared Zod schemas:** `@alpfit/shared`'a program + exercise + completion şemaları eklenir (backend + mobile ortak tip güvencesi).

---

## Task Listesi

> Bu bölüm `/devflow:plan-phase 2` oturumunda (2026-05-30) dolduruldu.

| # | Task | Durum | Açıklama |
|---|------|-------|----------|
| 2.01 | TASK-2.01 | ✅ Tamamlandı | DB Schema — 5 M2 tablosu (Exercise, Program, ProgramDay, ProgramDayExercise, WorkoutCompletion) + Prisma migration + seeder (~20 placeholder) + Shared Zod şemaları |
| 2.02 | TASK-2.02 | ✅ Tamamlandı | Exercises API — GET liste/arama/filtre + POST custom + PUT + DELETE soft-delete |
| 2.03 | TASK-2.03 | ✅ Tamamlandı | Programs API — POST yeni, PATCH auto-save, POST publish, POST copy, GET görüntüleme (PT + üye view) |
| 2.04 | TASK-2.04 | ✅ Tamamlandı | WorkoutCompletions API — POST idempotent tamamlama + GET geçmiş cursor-based pagination |
| 2.05 | TASK-2.05 | ✅ Tamamlandı | Mobile: TanStack Query v5 + AsyncStorage offline persist altyapısı + react-native-webview kurulumu |
| 2.06 | TASK-2.06 | ✅ Tamamlandı | Mobile: `useExercises` hook + ExerciseSearchBottomSheet (arama + kas grubu filtresi + custom egzersiz formu) |
| 2.07 | TASK-2.07 | ✅ Tamamlandı | Mobile: Program Builder giriş noktası — MemberDetailScreen + ProgramBuilderScreen çatısı + yatay gün sekmeleri |
| 2.08 | TASK-2.08 | ✅ Tamamlandı | Mobile: Program Builder — gün içi egzersiz listesi + ExerciseDayCard + ↑↓ sıralama + egzersiz ekle/sil |
| 2.09 | TASK-2.09 | ⬜ Bekliyor | Mobile: Program Builder — `useProgramAutoSave` hook (1s debounce PATCH) + publish butonu + kopyalama CTA |
| 2.10 | TASK-2.10 | ⬜ Bekliyor | Mobile: Üye Ana Ekranı temel layout — streak gizli, BUGÜN kartı, WeeklyBand, bekleme durumu |
| 2.11 | TASK-2.11 | ⬜ Bekliyor | Mobile: Antrenman Ekranı — egzersiz listesi + yerel tik state + VideoModal (react-native-webview + YouTube embed) |
| 2.12 | TASK-2.12 | ⬜ Bekliyor | Mobile: Antrenman tamamlama + offline kuyruğu + senkron (POST /workout-completions, idempotent, optimistic UI) |
| 2.13 | TASK-2.13 | ⬜ Bekliyor | Mobile: Geçmiş Sekmesi — WorkoutHistoryScreen (infinite scroll, cursor-based, okuma modu, boş durum) |
| 2.14 | TASK-2.14 | ⬜ Bekliyor | Mobile: Program değişikliği banner — banner-store'a `program_changed` tipi + MemberHomeScreen banner stack |

---

## UAT Senaryoları

> Bu bölüm `/devflow:verify-phase 2` oturumunda doldurulur.

---

## Retrospektif

> Bu bölüm `/devflow:review-phase 2` oturumunda doldurulur.

---

## Kalite Kontrol Sonuçları

> Bu bölüm `/devflow:review-phase 2` oturumunda doldurulur.

---

## Sonuç

> Bu bölüm `/devflow:review-phase 2` oturumunda doldurulur.

---

**Oluşturulma:** 2026-05-30 (discuss-phase 2)
**Son Güncelleme:** 2026-05-30 — TASK-2.08 ✅: ExerciseDayCard + ProgramBuilderScreen local state/CRUD + boş gün state + ExerciseSearchBottomSheet entegrasyonu. 152 test 0 hata.
