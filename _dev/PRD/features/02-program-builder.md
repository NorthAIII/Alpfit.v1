# Program Builder (PT Tarafı)

## Özet

PT'nin üyelerine antrenman programı yazdığı çekirdek araç. Mevcut sürtünmenin (Word/PDF/WhatsApp) Alpfit içine taşınması değil, **yarıya indirilmesi** hedeflenir. PT bir kez **haftalık şablon** yazar; bu şablon üyenin program süresi boyunca her hafta tekrar eder. Egzersizler **çekirdek kütüphaneden** (Alpfit'in ön-yüklediği ~50 temel hareket) hızla seçilir; eksik bir hareket varsa PT **kendi egzersizini ekler**.

---

## Kullanıcı Senaryoları

### S1 — Yeni üyeye program yazma (mutlu yol)
PT (kardeş) yeni üyesi Ayşe'yi kabul etti. Üye listesinden Ayşe'yi açar, "Program oluştur" butonuna basar. Hafta günleri ızgarası açılır (Pzt–Paz). Pzt günü için "Push" etiketini yazar, "Egzersiz ekle" der. Arama kutusuna "bench" yazar, kütüphaneden "Bench Press" çıkar, seçer. Set/tekrar girer: 4×8. Aynı şekilde 4 egzersiz daha ekler. Çar ve Cum günleri için aynı akışı tekrar eder. "Programı kaydet" der, Ayşe'nin app'inde program o anda görünür hale gelir. Tüm süre ~5–8 dakika.

### S2 — Eksik egzersiz ekleme
PT Salı için "Bulgarian Split Squat" yazmak ister. Kütüphanede yok. Arama sonucunun altında "+ Yeni egzersiz ekle" butonuna basar. Ad: "Bulgarian Split Squat", hedef kas: "Quad/Glute" seçer, video opsiyonel (boş bırakır), kaydet. Egzersiz artık PT'nin kendi listesinde görünür (kütüphane bütününe değil, sadece bu PT'ye). Programa ekler.

### S3 — Şablon güncelleme
PT 6 hafta sonra Ayşe'nin Squat'ını ağırlaştırmak ister. Ayşe'nin programını açar, Cum gününde Squat'a tıklar, 4×8'i 4×6'ya günceller, kaydet. Üyenin app'inde sonraki Cum'dan itibaren yeni hali görünür. Geçmiş tamamlanmış antrenmanlar etkilenmez.

### S4 — Program kopyalama (PT verimliliği)
PT yeni üyesi Mehmet'e program yazarken "Ayşe'nin programını kopyala" der. Ayşe'nin haftalık şablonu Mehmet'e kopyalanır; PT kişiselleştirme için set/tekrar düzenler, kaydet. ~2 dakika.

### S5 — Tek bir günü ekstra antrenman
PT bir hafta Ayşe'ye haftalık şablona ek olarak Cumartesi için tek seferlik bir kardiyo antrenmanı koymak ister. Şablonu bozmadan, ilgili haftanın Cumartesi gününe "Bu haftalık ek antrenman" ekler. Sonraki haftalarda Cumartesi yine boş döner.

---

## Davranış Kuralları

### Program yapısı
- **Tek şablon:** Bir üye için tek bir aktif haftalık şablon vardır. Şablon Pzt'den Paz'a 7 günlük ızgaradır. PT bazı günleri boş bırakabilir (dinlenme).
- **Tekrar:** Şablon, üyenin program süresi boyunca her hafta tekrar eder. v1'de "blok/faz" yapısı YOK.
- **Şablon güncelleme:** PT şablonu istediği zaman düzenler. Değişiklik **bir sonraki yapılmamış antrenmandan itibaren** geçerlidir. Tamamlanmış antrenmanlar geçmiş hâliyle saklanır.
- **Tek seferlik ek:** PT belirli bir haftanın belirli bir gününe "bu haftalık" ek antrenman koyabilir. Şablona girmez, sadece o hafta görünür.

### Egzersiz kütüphanesi
- **Çekirdek:** Alpfit ~50 temel hareketi ön-yükler. Her birinde TR ad + hedef kas grubu + kısa video (10–30 sn form gösterimi). Liste v1 launch öncesi belirlenir, sonradan Alpfit ekibi büyütebilir.
- **PT'nin kendi egzersizleri:** PT eksik bir hareketi ekleyebilir. Sadece zorunlu alan: ad. Opsiyonel: hedef kas, video URL'i (PT YouTube linki yapıştırabilir).
- **Görünürlük:** PT'nin eklediği egzersiz sadece o PT'nin listesinde görünür. Diğer PT'lerle paylaşılmaz. (v2 adayı: paylaşımlı PT kütüphanesi.)
- **Düzenleme/silme:** PT kendi eklediği egzersizi düzenleyebilir/silebilir. Çekirdek kütüphane egzersizleri düzenlenemez/silinemez.

### Egzersiz programa eklenme formatı
- **Zorunlu alanlar:** Set sayısı, tekrar sayısı (tek sayı: 8, veya aralık: 8–12).
- **Opsiyonel alanlar:** Dinlenme süresi (sn), notlar (serbest metin — örn. "yavaş ekzantrik").
- **Sıralama:** PT bir gün içindeki egzersizleri sürükle-bırak ile sıralayabilir.
- **Süperset/giant set:** v1'de YOK. Egzersizler birbirinden bağımsız sırayla yapılır. (v1.5 adayı.)

### Üye atama ve görünürlük
- **Program oluşturma:** PT yalnızca kabul ettiği üyelere program yazabilir.
- **Üye görünümü:** Program kaydedilir kaydedilmez üyenin app'inde görünür. Üye programı **değiştiremez** (sadece görür ve tamamlama işaretler).
- **Program silme:** PT üyenin programını silebilir. Silinen program geçmiş tamamlama verisiyle birlikte arşivlenir (PT geçmişe bakabilir, ama üye yeni programı görmez).

### Default antrenman/hafta
- **Default değer YOK** — PT şablon yazarken hangi günlere antrenman koyacağına kendi karar verir.
- **Üye onboarding'de soru YOK** — bu PT-üye anlaşmasının parçası, app sormaz.
- **Sürdürülebilirlik motoru bağı:** Streak tamamen PT'nin şablonuna bağlıdır (3 gün koymuşsa 3 gün, 5 gün koymuşsa 5 gün).

---

## Versiyon

v0.1 (v1)

<!-- VERSIONS.md tek kaynak (source of truth). Çelişki durumunda VERSIONS.md geçerlidir. -->

---

## Edge Case'ler ve Sınır Durumları

- **PT şablonu yazarken yarıda bıraktıysa:** Otomatik taslak olarak saklanır. PT geri döndüğünde "Yarım kalan programa devam et" görür. Üyeye gönderilmez.
- **PT üyeyi kabul etmeden program yazmaya kalkarsa:** Engellenir — "Önce üyeyi kabul et" uyarısı.
- **Aynı egzersiz aynı güne iki kez eklenirse:** Sistem izin verir (örn. PT bilinçli olarak "warm-up Squat" + "working Squat" yazmak isteyebilir). Uyarı yok.
- **PT video URL'i yanlış format:** Sadece YouTube/Vimeo URL formatı kabul edilir. Yanlışsa "Geçersiz video URL" uyarısı.

---

## Hata Durumları

- **Kütüphane yüklenmediyse (offline/hata):** Egzersiz arama "yüklenemedi, tekrar dene" gösterir. PT yine de manuel egzersiz ekleyebilir (offline çalışır).
- **Şablon kayıt başarısız:** PT'ye hata gösterilir, şablon local'de korunur (kaybolmaz). Tekrar dene butonu.

---

## Boş ve Varsayılan Durumlar

- **İlk üye:** PT'nin hiç üyesi yoksa "Önce üye ekle" yönlendirmesi (Üye Kabul feature'ına).
- **Boş şablon:** PT yeni şablon açtığında 7 gün ızgarası boş gelir. "Pzt'ye antrenman ekle" gibi placeholder yoktur — kullanıcı kendi bilir.
- **Çekirdek kütüphane:** v1 launch'ta hazır olarak gelir. Liste belirlenmemişse PT sadece kendi egzersizlerini ekleyebilir.

---

## İlişkili Feature'lar

- **[Onboarding (Üye Kabul)](03-onboarding.md)** — PT'nin program yazabilmesi için üyenin davet kabul akışını tamamlamış olması gerekir.
- **[Üye Program Görüntüleme + Tamamlama](05-member-program-view.md)** — Builder'ın çıktısı bu feature'ın girdisidir.
- **[PT Dashboard](06-pt-dashboard.md)** — PT, üye satırına tıklayıp "Program oluştur" veya "Program" CTA'sından bu builder'a girer.
- **[Sürdürülebilirlik Motoru](01-sustainability-engine.md)** — Streak hesaplaması builder'da yazılan planlı antrenmanlara dayanır.

---

## Açık Sorular

- **PT'nin program yazma süresi hedefi:** Kardeşin şu anki süresi (Word + WhatsApp) ölçülmedi. v1 launch öncesi kardeşten "bir program kaç dakika sürüyor?" verisi al; builder'ın 2'ye katı sürede yapması red bayrağı. PRD-refine veya v1 pilot ölçümü.
- **Çekirdek kütüphane listesi (50 egzersiz):** Hangi 50 hareket? Bunun kararı bir egzersiz bilimi/fitness uzmanı incelemesini gerektirir — kardeşle birlikte liste oluşturulmalı. v1 launch öncesi tamamlanmalı.
- **Çekirdek kütüphane videoları kim çeker?** Stok video mu (lisanslı), Alpfit kendi mi çeker, kardeşle mi çekilir? İçerik üretim kararı, scope'a ek görünmüyor.
- **Süperset/RIR/tempo:** v1.5 adayı olarak işaretlendi — kardeş gerçek kullanımda "lazım" derse öncelik artar.
- **Program kopyalama (S4):** Bu özellik PT verimliliği için kritik mi yoksa v1.5'e mi atılır? Şimdilik v1'de gibi yazıldı, doğrulanmalı.
- **Üye tarafında egzersiz video oynatma:** Modal mı, ekran içi gömülü mü? UX detayı — üye program görüntüleme feature'ında netleşir.
