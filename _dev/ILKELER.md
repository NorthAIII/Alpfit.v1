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

**v1–v1.5: TR pazarında PT-üye coaching aracı.** Kardeş + 3-4 üye pilot (v1, ~90 gün) → 5-10 PT genişleme (v1.5).

**v2 ufku: TR'de PT + Gym Owner ekosistemi.** Spor salonlarına retention dashboard, çoklu PT yönetimi, akıllı takvim, tam AI nutrition. Diyetisyen 4. rolü asla eklenmez — yasal çerçeve (§Pazarlık Konusu Olmayanlar §2 ve [00-VISION §5](PRD/00-VISION.md)).

**v2 ötesi: TR-odaklı kalır.** EN / global açılım bilinçli karar olmadan yapılmaz. Sebep: TR yerelleştirme (dil tonu, yemek kültürü, KVKK, BTK uyumlu SMS, +90 telefon-only) ürünün rekabet avantajı. Jenerik global ürün olmak bu farklılaşmayı sıfırlar — Trainerize/TrueCoach pazarına benzemiş oluruz.

**Çıkış stratejisi şu an konuşulmadı** — bağımsız ürün varsayımı. Pilot doğrulandıktan sonra (v2 öncesi) netleşir; o tartışma için ayrı oturum gerekir.

### En Yüksek Öncelikli Eksenler

İki eksen v1 kararlarını yönlendirir. Bir karar bu iki eksenden birine ters düşüyorsa **geriye dönüp tekrar düşün** — "çalışıyor" yetmez.

1. **Üye sürdürülebilirliği motoru doğruluğu.** Ürün hipotezinin testi buna bağlı. v1 başarı kriteri ([00-VISION §7](PRD/00-VISION.md)): *"comeback bildirimleri en az 1 üyeyi geri çekmiş olmalı."* Motor yanlış çalışırsa (false comeback, kaçırılmış telafi penceresi, hatalı streak hesabı, T+7 banner'ı doğru üyeyi göstermemesi) v1 hipotezi sınanamaz. Streak/comeback/reminder akışı koddaki en yüksek test sıklığı + en katı kabul kriteri ile yazılır.

2. **PT günlük iş akışı sürtünmesizliği.** Kardeş testçinin değerlendirme kriteri. v1 başarısızlık kriteri ([00-VISION §7](PRD/00-VISION.md)): *"kardeş 'WhatsApp + Word daha kolay' derse."* Program builder, dashboard, davet akışı, ölçüm formu bu eksenden geçer. "Çalışıyor ama hantal" kabul edilmez — tıklama sayısı, ekran geçişi, form doldurma süresi ölçülür. Builder'ın mevcut WhatsApp+Word akışına göre **en az 2× hızlı** olması v1 launch kabul ön şartı.

İki eksen arasında gerilim doğarsa (örn. motor doğruluğu için PT'ye fazla onay ekranı koymak) sürdürülebilirlik motoru ön plana çıkar — [00-VISION §1](PRD/00-VISION.md) "ürünün kalbi" beyanı bunu gerektirir.

### Pazarlık Konusu Olmayanlar

Aşağıdaki kararlar 2026-05-28 planlama oturumunda alındı ve geriye dönüş yok — PRD/kickoff/feature kararlarında bunlara sadık kalınır:

1. **3 rol mimari kararı.** Veri modeli ve auth katmanı **Member + Trainer + Gym Owner** üç rolü ilk günden destekler. v1 ekranlarında sadece Member ve Trainer görünür, ama "Gym Owner sonradan üstüne eklenir" — "baştan yazılmaz." Diyetisyen 4. rol olarak eklenmez; beslenme PT + üye + (v1.5'te) AI üçgeniyle çözülür.

2. **AI nutrition yasal çerçeve.** v1.5'te aktif olduğunda: (a) "öneri / yemek günlüğü / kalori hedefi" dili — "beslenme programı" YASAK; (b) her beslenme ekranında disclaimer ("Bu öneri tıbbi tavsiye değildir, kişisel diyet için diyetisyen ile görüşün"); (c) AI çıktısı **PT onayından sonra** üyeye gider — yasal sorumluluk PT'de. v1'de AI yok ama dil ve mimari hazırlanır.

3. **Scope büyütme dürtüsüne disiplin.** Yeni feature fikri çıkarsa v1/v1.5/v2 versiyon tablosuna düşürülür; v1 ~90 gün taahhüdünü tehlikeye atan eklemeler reddedilir ya da sonraki versiyona itilir. Yarım kalma deseninin tekrarlanmaması, ürün başarısı için herhangi bir özellikten önemlidir.

4. **Sürdürülebilirlik motoru ürünün kalbidir.** Her tasarım ve scope kararı şu testi geçer: "Bu özellik üye sürdürülebilirliğine ne katıyor?" Cevap zayıfsa karar tekrar gözden geçirilir.

---

**Son Güncelleme:** 2026-05-29 (Proje Ufku + Öncelik Eksenleri dolduruldu)
