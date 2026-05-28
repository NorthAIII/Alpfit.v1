# [PROJE_ADI] — Proje İlkeleri

---

## Bu Doküman Hakkında

**ILKELER.md** bu projenin yön-veren ilkelerini tutar — "kararsız kaldığında neye göre karar ver, neyi feda etme, bu projenin ufku ne?" Nadiren ve **bilinçli** değişir; karar-şekillendiren fazlarda (prd, prd-refine, prd-review, kickoff, discuss, research, plan) okunur ve önerileri yönlendirir. (kickoff bu dosyayı yalnızca varsa okur — PRD'siz akışta dosya kickoff-docs'ta doğar.)

**Nasıl kullanılır:** Q&A fazlarında Claude gri alan sorularını boş sormak yerine, ilgili ilkeye göre cevabı önceden doldurur ve kullanıcıya **teyit ettirir**. Bir ilkeyle gerçek bir gerilim doğarsa (ilke X diyor ama bu durum Y gerektiriyor) açıkça kullanıcıya getirir — sessizce bir tarafı seçmez.

### Bilginin Doğru Evi — bu doküman NE tutmaz

ILKELER yalnızca **yön ve önceliği** taşır, mekanizmayı/detayı değil. Tekrar = drift kaynağı.

- Değerlendirme ekseni / "şunu iyi yaptık mı?" kontrolü → `QUALITY.md`
- Somut teknik kural (framework versiyonu, lint kuralı, isimlendirme) → `CLAUDE.md` Projeye Özgü Kurallar
- Ürün vizyonu, feature, davranış kuralı → `_dev/PRD/`
- Spesifik mimari/tasarım kararı → `docs/DECISIONS.md`

Örnek: "Sırlar koda gömülmez, merkezi model" **ilkesi** burada yaşar; "şu vault'u, şu env-isim kuralını kullan" gibi somut mekanizma `CLAUDE.md` / `DECISIONS.md`'de.

---

## Temel İlkeler

Aşağıdakiler makul varsayılanlardır — projeye uymayanı çıkar, projeye özgü olanı ekle.

### Kalıcılık önceliği

En kalıcı ve ileriye dönük çözümü seç. Kısa vadeli hız uğruna uzun vadeli sağlamlığı feda etme; "şimdilik çalışıyor" bir bitiş kriteri değildir. İki yol arasında kararsızken daha sağlam olana eğil.

### Sır ve konfigürasyon yönetimi

Secret'lar ve ortama bağlı değerler koda gömülmez. Merkezi, değişken-tabanlı bir model kullanılır: aynı kod her ortamda farklı değerlerle çalışır.

### Kümülatif test altyapısı

Test atlanmaz. Test altyapısı her geliştirmeyle üstüne koyarak büyür — her yeni yetenek kendi güvencesini de getirir. Geriye dönük güven zamanla artmalı, azalmamalı.

---

## Bu Projeye Özgü

Kickoff/PRD sırasında doldurulur. Boş bir alan "henüz konuşulmadı" demektir — varsayma, gerektiğinde kullanıcıya sor.

### Proje Ufku

[Bu proje ne kadar uzun ömürlü? Kararlar hangi zaman ölçeğine göre alınmalı? Örn: "Yıllar sürecek bir altyapı — kararlar buna göre değerlendirilir."]

### En Yüksek Öncelikli Eksenler

[Bu projede hangi kalite eksenleri (QUALITY.md'den) diğerlerinin önüne geçer? Yalnızca öncelik sıralaması — eksenin tanımı QUALITY'de kalır. Örn: "Veri tutarlılığı ve güvenlik, hız ve estetikten önce gelir."]

### Pazarlık Konusu Olmayanlar

[Bu projede asla feda edilmeyecek, asla "sonra hallederiz" denmeyecek şeyler.]

---

**Son Güncelleme:** [Tarih]
