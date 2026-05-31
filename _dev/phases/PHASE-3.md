# Phase 3: Sürdürülebilirlik Motoru + Bildirim (M3 + M4)

**Durum:** 🔄 Devam ediyor

---

## Genel Bilgiler

**Amaç:** M3 (Sürdürülebilirlik Motoru) + M4 (Bildirim Altyapısı) birlikte inşa edilir. Motor streak/telafi/comeback hesabını yapar; M4 push bildirimlerini teslim eder. Bu faz [[ilkeler]] §En Yüksek Öncelikli Eksen #1'in doğrulama yeridir — v1 başarı kriterinin testi buraya bağlıdır.

**Milestone:**
- Üye antrenman tamamladığında streak doğru hesaplanır (+1)
- Planlı günü kaçırınca 1 günlük telafi penceresi açılır; kaçırılırsa streak sıfırlanır
- T+2 sonra üyeye push *"Bugün yeni bir streak başlatabilirsin."* gider
- T+7 sonra PT'ye in-app banner uyarısı + push backup gider
- T+14 sonra backend flag üretir (M5 fazında PT üye listesinde ⚠️ etiket görünür)
- Sabah 09:00 reminder push gider; sessiz saat (22:00–08:00) uygulanır
- İlk antrenman bitince bildirim izni açıklama ekranı + native diyalog gösterilir
- Üye Ayarlar > Bildirimler'den reminder saatini değiştirebilir
- Tüm kritik edge case'ler (gece yarısı geçişi, çoklu antrenman, telafi sınırı) test kapsamında

### Feature Listesi

| Feature | Modül | Açıklama |
|---------|-------|----------|
| F3.1: Streak + Telafi + Comeback | M3 | Motor hesaplama + T+2/T+7/T+14 comeback akışı + olay üretimi |
| F4.1: Bildirim Sistemi (Push) | M4 | APNs+FCM altyapısı, token yönetimi, sessiz saat, izin akışı, deep link |

---

## Kapsam Tartışması

> Bu bölüm `/devflow:discuss-phase 3` oturumunda (2026-05-31) dolduruldu.

### Alınan Kararlar

- **M3 + M4 birlikte faz:** Modüller sıkıca bağlı (motor event üretir → M4 push'a çevirir); motor push olmadan tam test edilemez. PHASES.md planı teyit edildi.
- **Faz 3 ilk task = Faz 2 teknik borç kapatma:** `limit=abc → 500` hatası, `POST /programs/:id/copy` Zod eksikliği, `getMemberActiveProgram` kod tekrarı — üstüne M3 inşa edilmeden önce temizlenir.
- **Reminder saati v1'de dahil:** Ayarlar > Bildirimler ekranı oluşturulur; default 09:00, üye değiştirebilir.
- **Antrenman öncesi 2 saat bildirim v1'de YOK:** M2'de antrenman saati girişi yok; bu özellik v1.5 adayı.
- **Bildirim izni zamanlaması:** İlk antrenman tamamlandıktan sonra — kullanıcı neden izin istediğini o anda anlıyor (motivasyon yüksek). Açıklama ekranı + native diyalog.
- **Streak UI açılışı:** Backend hazır + testler geçince streak göstergesi mobilede açılır (M2'de `display: none` olan alan). Streak açılışı fazın son task'lerinden biri.
- **T+7 in-app uyarı:** Mevcut banner-store üzerinden basit in-app banner eklenir (M5 yokken temel görünüm). M5 fazında tam dashboard entegrasyonu yapılır.
- **T+14 kayıp risk:** Backend flag üretir; üye listesindeki ⚠️ etiket UI'ı M5 fazında.
- **10 ertelenen UAT:** Yakın 5 öncesine ertelendi (blokaj değil).

### Kullanıcı Tercihleri

- Bildirim izni: İlk antrenman bitince (onboarding sırasında değil)
- Reminder saati: v1'de dahil, değiştirilebilir
- Antrenman saati girişi (2 saat öncesi bildirim): v1'de YOK

### Kapsam Dışı

- Antrenman öncesi 2 saat bildirim (saat girişi M2'de yok) → v1.5
- Streak toggle (üye devre dışı bırakabilir) → v1.5
- Bildirim geçmişi / notification center → v1.5
- WhatsApp / SMS bildirim kanalı → v1.5
- Push "okundu" tracking → v1.5
- T+14 kayıp risk UI etiketi (üye listesinde) → M5 fazı
- Üye tatil/seyahat modu → v1.5
- Sessiz saatin üye tarafından özelleştirilmesi → v1.5
- M5 PT dashboard banner stack tam görünümü → M5 fazı

---

## Araştırma Bulguları

> Bu bölüm `/devflow:research-phase 3` oturumunda (2026-05-31) dolduruldu.

### Değerlendirilen Yaklaşımlar

**Push Notification Backend Katmanı**

- **Expo Push API:** Backend `https://exp.host/--/api/v2/push/send` adresine HTTP POST atar. Mobile `expo-notifications` SDK token'ı (`ExponentPushToken[...]`) üretir, backend `expo-server-sdk` Node paketi sarıcıyla çağırır. FCM+APNs köprüsü Expo altyapısında; EAS sertifika yönetimi otomatik. Ops yükü minimal.
- **Firebase Admin SDK:** `firebase-admin` paket + Firebase Console kurulumu. iOS APNs sertifikasını Firebase'e yükleme gerekir. Daha fazla vendor kontrolü ama daha ağır altyapı.
- **Seçilen: Expo Push API** — TECH-STACK'teki `expo-notifications` seçimiyle tutarlı, solo dev için ops sıfır. Bildirim gönderim katmanı kanal-agnostik interface arkasına sarılır; v1.5 WhatsApp kanalı ikinci implementation olarak gelir.

**Zamanlama / Job Scheduler**

- **BullMQ + Redis:** `ioredis` zaten backend'de kurulu — altyapı ek olmadan hazır. `bullmq` paketi eklenir. Delayed job (T+2: 2 gün delay), repeatable job (sabah 09:00: cron pattern). Process restart'ta job kaybı yok (Redis'te saklanır), built-in retry + exponential backoff.
- **node-cron:** Her dakika/saat DB polling. Yeni bağımlılık yok, basit. Eksi: process restart gap, 09:00 exact timing için ek mantık, debug zorlu.
- **Seçilen: BullMQ + Redis** — Redis altyapısı zaten var, T+2/T+7/T+14 için "delayed job per member" modeli temiz fit. ILKELER §"Kalıcılık önceliği" ile uyumlu.

**Motor Hesaplama Mimarisi**

- **On-demand:** Her istek anında WorkoutCompletion tablosundan hesapla. Basit ama T-sayaçları için ayrıca state gerekir.
- **StreakState cache (seçilen):** Üye başına mutable state tablosu. WorkoutCompletion = değişmez kayıt defteri; StreakState = okuma hızı + T-sayaç takibi. Re-aktivasyonda tek satır sıfırlama.

### Yeni DB Tabloları

| Tablo | Amaç |
|-------|------|
| `StreakState` | Üye başına streak cache + T-sayaçları |
| `PushToken` | Cihaz token yönetimi (Expo token, platform, revoke) |
| `NotificationPreference` | Üye bildirim ayarları (reminder saat, kategori aç/kapa) |
| `NotificationLog` | Gönderilen/başarısız bildirim kaydı — "zaten gönderildi mi?" kontrolü |

**StreakState şema (kritik alanlar):**
```
memberId           (unique)
currentStreak      Int @default(0)
maxStreak          Int @default(0)
lastActivityDate   DateTime?        -- son tamamlanan antrenman tarihi
streakResetAt      DateTime?        -- streak sıfırlanma zamanı (T sayaçlarının başlangıcı)
comebackT2SentAt   DateTime?        -- T+2 push gönderildi mi?
ptT7AlertedAt      DateTime?        -- PT T+7 in-app banner gösterildi mi?
t14FlaggedAt       DateTime?        -- T+14 kayıp risk flag set edildi mi?
ptT7DismissedAt    DateTime?        -- PT "Okudum" tıkladı mı?
```

### M3 ↔ M4 Entegrasyon Mimarisi

BullMQ queue-based: Motor job atar → M4 bildirim worker'ı işler.

Job tipleri:
- `notification:morning-reminder` — sabah 09:00 repeatable job (per member, aktif program varsa)
- `notification:comeback-t2` — streak sıfırından 2 gün sonra delayed job
- `notification:comeback-t7-pt` — 7 gün aktivitesizlikten sonra PT'ye
- `notification:t14-flag` — 14 gün aktivitesizlik flag

Worker akışı: sessiz saat kontrolü (`Europe/Istanbul` 22:00–08:00) → Expo Push API → NotificationLog güncelle.

### Sessiz Saat ve Timezone

v1 TR-only pilot → `Europe/Istanbul` sabit. User tablosuna `timezone` alanı eklenmez (şişirme). Cihaz saat dilimi edge case v1.5'te trivial migration ile ele alınır.

### Kullanılacak Araçlar / Paketler

| Paket | Taraf | Versiyon | Ne için |
|-------|-------|----------|---------|
| `expo-notifications` | mobile | Expo SDK 56 uyumlu | Push token alma, izin yönetimi, deep link payload |
| `expo-server-sdk` | backend | latest | Expo Push API sarıcısı |
| `bullmq` | backend | latest | Delayed + repeatable job scheduling |

### Dikkat Edilecekler

- **`expo-notifications` simulator'da push çalışmaz** — test için fiziksel cihaz veya Expo Go gerekir. İzin ekranı ve token flow unit test + mock ile test edilir; gerçek push gönderimi EAS preview build üzerinden doğrulanır.
- **BullMQ worker Fastify server process'inde başlatılır** — ayrı process değil, `onReady` hook'unda; pilot ölçeğinde (30 üye) yeterli. Worker crash Fastify restart'ında otomatik yeniden başlar.
- **NotificationPreference varsayılan satırı** — üye ilk kayıtta otomatik oluşturulur (yoksa hata riski). Upsert pattern kullanılır.
- **StreakState upsert garantisi** — yeni üye davet kabul ettiğinde StreakState satırı açılır (onboarding akışı tetikler); işe bu satır yoksa motor broken.
- **T+7 banner "Okudum" düğmesi** — `ptT7DismissedAt` set edilince banner kaybolur, **tekrar belirmez** (re-aktivasyon sıfırlaması `ptT7AlertedAt` sıfırlar ama `ptT7DismissedAt` sıfırlamaz — yeni kopma = yeni `ptT7AlertedAt` set edilir).
- **Expo Push API rate limit** — 600 mesaj/saniye per project; v1 pilot için sorun değil.

### Teknik Kararlar

- **Push provider: Expo Push API** — TECH-STACK expo-notifications seçimiyle tutarlı; backend `expo-server-sdk` ile çağrılır; sertifika yönetimi EAS'ta.
- **Scheduler: BullMQ + Redis** — Redis altyapısı hazır; delayed + repeatable job modeli T sayaçları için ideal.
- **Motor mimarisi: Hibrit StreakState** — WorkoutCompletion event log + StreakState okuma cache + T-sayaç state.
- **Timezone: Europe/Istanbul sabit** — v1 TR pilot, User tablosu şişirilmez; v1.5'te `timezone` alanı migration.
- **Sessiz saat kontrolü: Worker katmanında** — motor job atar, sessiz saat kararı worker verir (M3-M4 sınırına uygun).

---

## Task Listesi

> Bu bölüm `/devflow:plan-phase 3` oturumunda (2026-05-31) dolduruldu.

**Durum simgeleri:** ⬜ Bekliyor | 🔄 Devam ediyor | ⏸️ Duraklatıldı | ✅ Tamamlandı | 🔴 Bloke | ❌ İptal

| # | Task | Durum | Açıklama |
|---|------|-------|----------|
| 3.01 | TASK-3.01 | ✅ Tamamlandı | Faz 2 teknik borç: limit coerce, copy Zod, getMemberActiveProgram dedup |
| 3.02 | TASK-3.02 | ✅ Tamamlandı | M3+M4 DB şeması: StreakState, PushToken, NotificationPreference, NotificationLog |
| 3.03 | TASK-3.03 | ✅ Tamamlandı | Streak motoru: processWorkoutCompletion servisi + M2 hook |
| 3.04 | TASK-3.04 | ✅ Tamamlandı | BullMQ + Expo Push altyapısı kurulumu |
| 3.05 | TASK-3.05 | ✅ Tamamlandı | Nightly streak sıfırlama + telafi kontrolü (BullMQ repeatable job) |
| 3.06 | TASK-3.06 | ✅ Tamamlandı | Push token yönetimi: POST + DELETE /push-tokens (backend) |
| 3.07 | TASK-3.07 | ✅ Tamamlandı | Bildirim tercihleri: GET + PATCH /notification-preferences (backend) |
| 3.08 | TASK-3.08 | ✅ Tamamlandı | Sabah reminder push (BullMQ repeatable job — 09:00 Istanbul) |
| 3.09 | TASK-3.09 | ✅ Tamamlandı | Comeback T+2 push (BullMQ delayed job — streak sıfırlamadan 48h) |
| 3.10 | TASK-3.10 | ✅ Tamamlandı | Comeback T+7 PT uyarısı + T+14 kayıp risk flag + PT dismiss endpoint |
| 3.11 | TASK-3.11 | ⬜ Bekliyor | Mobile: push token kaydı + bildirim izni akışı |
| 3.12 | TASK-3.12 | ⬜ Bekliyor | Mobile: Ayarlar > Bildirimler ekranı |
| 3.13 | TASK-3.13 | ⬜ Bekliyor | Streak göstergesi: GET /me/streak + mobile UI açılışı |
| 3.14 | TASK-3.14 | ⬜ Bekliyor | T+7 PT in-app banner: GET /pt/member-alerts + mobile UI |

---

## UAT Senaryoları ve Sonuçları

> Bu bölüm `/devflow:verify-phase 3` oturumunda doldurulacak.

---

## Retrospektif

> Bu bölüm `/devflow:review-phase 3` oturumunda doldurulacak.

---

## Kalite Kontrol Sonuçları

> Bu bölüm `/devflow:review-phase 3` oturumunda doldurulacak.

---

**Oluşturulma:** 2026-05-31 (discuss-phase 3)
**Son Güncelleme:** 2026-05-31 — TASK-3.10 tamamlandı.
