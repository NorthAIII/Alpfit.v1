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

> Bu bölüm `/devflow:research-phase 3` oturumunda doldurulacak.

---

## Task Listesi

> Bu bölüm `/devflow:plan-phase 3` oturumunda doldurulacak.

**Durum simgeleri:** ⬜ Bekliyor | 🔄 Devam ediyor | ⏸️ Duraklatıldı | ✅ Tamamlandı | 🔴 Bloke | ❌ İptal

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
**Son Güncelleme:** 2026-05-31 — discuss-phase 3: kapsam tartışması tamamlandı.
