# Alpfit — Proje İlkeleri

---

## Bu Doküman Hakkında

**ILKELER.md** bu projenin yön-veren ilkelerini tutar — "kararsız kaldığında neye göre karar ver, neyi feda etme, bu projenin ufku ne?" Nadiren ve **bilinçli** değişir; karar-şekillendiren fazlarda (prd, prd-refine, prd-review, kickoff, discuss, research, plan) okunur ve önerileri yönlendirir.

**Nasıl kullanılır:** Q&A fazlarında Claude gri alan sorularını boş sormak yerine, ilgili ilkeye göre cevabı önceden doldurur ve kullanıcıya **teyit ettirir**. Bir ilkeyle gerçek bir gerilim doğarsa (ilke X diyor ama bu durum Y gerektiriyor) açıkça kullanıcıya getirir — sessizce bir tarafı seçmez.

### Bilginin Doğru Evi — bu doküman NE tutmaz

ILKELER yalnızca **yön ve önceliği** taşır, mekanizmayı/detayı değil. Tekrar = drift kaynağı.

- Değerlendirme ekseni / "şunu iyi yaptık mı?" kontrolü → `QUALITY.md`
- Somut teknik kural (framework versiyonu, lint kuralı, isimlendirme) → `CLAUDE.md` Projeye Özgü Kurallar
- Ürün vizyonu, feature, davranış kuralı → `_dev/PRD/`
- Spesifik mimari/tasarım kararı → `docs/DECISIONS.md`

---

## Temel İlkeler

### Kalıcılık önceliği

En kalıcı ve ileriye dönük çözümü seç. Kısa vadeli hız uğruna uzun vadeli sağlamlığı feda etme; "şimdilik çalışıyor" bir bitiş kriteri değildir. İki yol arasında kararsızken daha sağlam olana eğil.

### Sır ve konfigürasyon yönetimi

Secret'lar ve ortama bağlı değerler koda gömülmez. Merkezi, değişken-tabanlı bir model kullanılır: aynı kod her ortamda farklı değerlerle çalışır.

### Kümülatif test altyapısı

Test atlanmaz. Test altyapısı her geliştirmeyle üstüne koyarak büyür — her yeni yetenek kendi güvencesini de getirir. Geriye dönük güven zamanla artmalı, azalmamalı.

---

## Bu Projeye Özgü

Aşağıdaki bölümler keşif ilerledikçe doldurulur. Boş bir alan "henüz konuşulmadı" demektir — varsayma, gerektiğinde kullanıcıya sor.

### Proje Ufku

[Henüz konuşulmadı — PRD keşfinde netleşecek. v1 90 günlük testçi hedefli; uzun vade ufku ayrı bir karar.]

### En Yüksek Öncelikli Eksenler

[Henüz konuşulmadı — QUALITY.md'den seçilecek. Adayı: "üye sürdürülebilirliği motoru doğruluğu" (ürün hipotezinin testi buna bağlı), "PT günlük iş akışı sürtünmesizliği" (kardeş testçinin ilk değerlendirme kriteri).]

### Pazarlık Konusu Olmayanlar

Aşağıdaki kararlar 2026-05-28 planlama oturumunda alındı ve geriye dönüş yok — PRD/kickoff/feature kararlarında bunlara sadık kalınır:

1. **3 rol mimari kararı.** Veri modeli ve auth katmanı **Member + Trainer + Gym Owner** üç rolü ilk günden destekler. v1 ekranlarında sadece Member ve Trainer görünür, ama "Gym Owner sonradan üstüne eklenir" — "baştan yazılmaz." Diyetisyen 4. rol olarak eklenmez; beslenme PT + üye + (v1.5'te) AI üçgeniyle çözülür.

2. **AI nutrition yasal çerçeve.** v1.5'te aktif olduğunda: (a) "öneri / yemek günlüğü / kalori hedefi" dili — "beslenme programı" YASAK; (b) her beslenme ekranında disclaimer ("Bu öneri tıbbi tavsiye değildir, kişisel diyet için diyetisyen ile görüşün"); (c) AI çıktısı **PT onayından sonra** üyeye gider — yasal sorumluluk PT'de. v1'de AI yok ama dil ve mimari hazırlanır.

3. **Scope büyütme dürtüsüne disiplin.** Yeni feature fikri çıkarsa v1/v1.5/v2 versiyon tablosuna düşürülür; v1 ~90 gün taahhüdünü tehlikeye atan eklemeler reddedilir ya da sonraki versiyona itilir. Yarım kalma deseninin tekrarlanmaması, ürün başarısı için herhangi bir özellikten önemlidir.

4. **Sürdürülebilirlik motoru ürünün kalbidir.** Her tasarım ve scope kararı şu testi geçer: "Bu özellik üye sürdürülebilirliğine ne katıyor?" Cevap zayıfsa karar tekrar gözden geçirilir.

---

**Son Güncelleme:** 2026-05-28
