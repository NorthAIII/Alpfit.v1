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

> Bu bölüm `/devflow:research-phase 2` oturumunda doldurulur.

---

## Task Listesi

> Bu bölüm `/devflow:plan-phase 2` oturumunda doldurulur.

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
**Son Güncelleme:** 2026-05-30 — discuss-phase 2: Kapsam tartışması tamamlandı.
