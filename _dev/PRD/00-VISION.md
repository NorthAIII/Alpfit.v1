# Alpfit — Vizyon, Pazar ve Mimari Çerçeve

> Bu doküman Alpfit'i ilk kez okuyan biri için **tek başına yeterli** bağlamı sağlar. Tarihsel araştırma detayları için: `/CONTEXT-BRIEF.md` (2026-05-28 planlama oturumu).

---

## 1. Tek Satır Vizyon

**Alpfit, üye sürdürülebilirlik motoru olarak konumlanan bir PT-üye koachluk uygulamasıdır.**

Sadece antrenman/program yönetimi değil. Üyenin spora **devamlılığını** sağlayan akıllı sistem.

Bu cümle her tasarım kararını test eder: *"Bu özellik üye sürdürülebilirliğine ne katıyor?"* Cevap zayıfsa karar tekrar gözden geçirilir.

---

## 2. Problem

### Üye tarafı
Mevcut PT-üye akışında üyenin top 3 şikayeti (sahadan toplandı):
- **Düzen zorluğu** — programa hangi gün ne yapacağını hatırlamak
- **Süreklilik problemi** — başlayıp 2-3 hafta sonra bırakma
- **Zaman/program uyumsuzluğu** — hayatın araya girmesi, programı kaçırma

Sonuç: üyelerin **spora başlayıp bırakma döngüsü**. Çözüm: devamlılığı sistemli destekleyen bir araç.

### PT tarafı
Mevcut PT iş akışı (kardeş örneği):
- **Program yazımı**: defter / Word / PDF, WhatsApp ile paylaşım
- **Hatırlatma**: elle WhatsApp mesajı, her üye için ayrı
- **Beslenme**: PT'nin işi değil ama üye soruyor — boşlukta kalan ihtiyaç
- **Mevcut yazılım kullanımı**: Flyby var ama sadece takvim için; gerisi manuel

Kardeşin kendi sözleri: *"sistem içinde üyelerin programlarını kolayca görüp takip edebilmesi benim için çok daha iyi olurdu."*

### Pazar boşluğu (Mayıs 2026)
TR pazarında PT-coaching + sürdürülebilirlik + AI nutrition üçlüsünü birleştiren rakip yok.

---

## 3. Rakipler ve Pozisyonlama

| Rakip | Tip | Güçlü yan | Zayıf yan |
|-------|-----|-----------|-----------|
| **Flyby** | TR, gym ops focus | Üyelik, rezervasyon, POS | PT-üye koachluk yok, beslenme yok, UX zayıf/yavaş |
| **Trainerize / ABC Trainerize** | US, PT coaching | Olgun PT-üye akışı | İngilizce, TR yemek/kültür yok, gym ops zayıf |
| **MyPTHub / TrueCoach / PT Distinction** | US/UK, PT coaching | Profesyonel feature seti | TR dışı, yerelleştirme yok |

**Alpfit pozisyonu** — pazar matrisi:

```
                       PT-COACHING GÜÇLÜ
                              │
         Trainerize           │           [ALPFIT v1 hedef]
         MyPTHub              │           - TR localized
         TrueCoach            │           - sürdürülebilirlik motoru
         (US, İngilizce)      │           - PT-üye flow
                              │           - AI nutrition (v1.5)
   GYM OPS ZAYIF ─────────────┼───────────► GYM OPS GÜÇLÜ
                              │
                              │           Flyby
                              │           (TR, gym ops focus
                              │            PT-coaching yok)
                              │
                       PT-COACHING ZAYIF
```

Alpfit, TR pazarında "PT-coaching + sürdürülebilirlik motoru + (v1.5'te) AI nutrition" üçlüsünün ilk birleştiricisi.

---

## 4. Hedef Kullanıcı

### Birincil: PT (Trainer)
- Bir spor salonunda veya bağımsız çalışıyor
- 5–30 üye arası portföy
- Şu an WhatsApp + Word/PDF ile çalışıyor, yazılım kullanmıyor veya sadece takvim için kullanıyor
- "Daha profesyonel görünmek" + "daha az manuel iş" istiyor
- **İlk testçi:** Kardeş, bir fitness center'da PT, Flyby kullanıcısı (sadece takvim için)

### Birincil: Member (Üye)
- PT ile çalışmaya başlamış veya başlayacak
- Önceden spora başlayıp bırakma deneyimi var (yüksek olasılık)
- Telefon-dominant, email kullanmıyor olabilir
- Türkçe konuşur
- **İlk testçiler:** Kardeşin 3-4 öğrencisi (v1 pilot)

### v1.5+ ikincil: Gym Owner (Spor Salonu Sahibi)
- Spor salonu işletiyor, birden fazla PT ve onlarca/yüzlerce üye
- Üye retention ve operasyonel verim istiyor
- v1'de YOK; v1.5'ten itibaren rol modelinde aktif olur

---

## 5. Roller — Mimari Karar (3 rol, ilk günden)

Veri modeli ve auth katmanı **Member + Trainer + Gym Owner** üç rolü ilk günden destekler. v1 ekranlarında sadece Member ve Trainer görünür, ama "Gym Owner sonradan üstüne eklenir" — "baştan yazılmaz."

| Rol | Sorumluluk | Hangi versiyonda |
|-----|-----------|------------------|
| **Member (üye)** | Programını görme + tamamlama + yemek günlüğü + reminder + streak takibi | v1 |
| **Trainer (PT)** | Üye kabul + ölçüm + program builder + ilerleme görme + otomatik reminder + (v1.5) AI nutrition onayı | v1 |
| **Gym Owner** | Üyelik, ödeme, rezervasyon, retention dashboard | v1.5+ |

### Kapsam dışı: Diyetisyen 4. rolü
**Asla eklenmeyecek.** Beslenme şu üçgenle çözülür:
- **PT manuel** (v1)
- **Üye yemek günlüğü** (v1)
- **AI önerisi + PT onayı** (v1.5)

Sebep: diyetisyenlik TR'de lisanslı meslek. Diyetisyen rolü Alpfit'e yetkisiz diyetisyenlik riski getirir. AI + PT onayı modeli yasal sorumluluğu PT'de tutar.

---

## 6. AI Nutrition — Yasal Çerçeve

TR'de diyetisyenlik lisanslı meslek. Alpfit "beslenme programı yazıyor" konumlandırılırsa yetkisiz diyetisyenlik riski. Buna karşı **3 kural**:

1. **Dil:** "Beslenme programı" YASAK. Yerine: "öneri", "yemek günlüğü", "kalori hedefi", "günlük makro".
2. **Disclaimer:** Her beslenme ekranında: *"Bu öneri tıbbi tavsiye değildir, kişisel diyet için diyetisyen ile görüşün."*
3. **PT onayı zorunlu:** AI çıktısı **PT onayından sonra** üyeye gider. Yasal sorumluluk PT'de.

### Katmanlı uygulama
- **v1:** AI yok. PT manuel yazar, üye yemek günlüğü tutar.
- **v1.5:** AI önerir → PT onaylar/düzenler → üyeye gider. Dar senaryo (kalori hedefi + 3 öğün öneri).
- **v2:** Tam kişisel AI plan + TR yemek DB + davranışa göre uyarlama.

v1'de AI yok ama **dil ve mimari hazırlanır** — "beslenme programı" terimi v1'de de yasak, yemek günlüğü ekranında disclaimer şimdiden konur.

---

## 7. v1 İddiası ve Başarı Kriterleri

### v1 ne kanıtlamalı?
**Sürdürülebilirlik motorunun gerçekten devamlılığı artırdığını** kardeşin 3-4 öğrencisi üzerinden gözlemlemek.

### Operasyonel hedef
- ~90 gün içinde teslim
- Kardeş ve 3-4 öğrencisi günlük kullanır
- Kardeş program yazma süresini mevcut WhatsApp/Word akışına göre azaltır

### Ürün hipotezi (test edilecek)
- Antrenman-bazlı streak + 1 gün tolerans + 3 katmanlı comeback üyeleri **kopma anında geri çekebilir**
- 14 gün sonra "kayıp risk" etiketi PT'nin gerçekten manuel iletişime geçmesini tetikler
- Program builder PT'nin sürtünmesini azaltır (mevcut WhatsApp/Word akışıyla karşılaştırma)

### v1 başarı sayılır eğer
- Kardeşin 3-4 öğrencisinden en az 3'ü 12 hafta boyunca app'i aktif kullanır
- Kardeş "yeni üyem olduğunda Alpfit'e ekliyorum" der
- Comeback bildirimleri en az 1 üyeyi geri çekmiştir (kanıtlanabilir vaka)

### v1 başarısız sayılır eğer
- Kardeşin öğrencileri 4 hafta içinde app'i kullanmayı bırakır
- Kardeş "WhatsApp + Word daha kolay" derse
- Comeback mekaniği gerçek hayatta motivasyon yerine demoralizasyon yarattıysa

Bu kriterler v1 launch sonrası **`/devflow:verify-phase`** oturumlarında ölçülür.

---

## 8. Disiplin: Yarım Kalma Deseni

Kurucu önceki projelerin yarım kaldığı bir desenin farkında. Bu **planlama disiplininin sebebi**.

Alpfit'in scope'unu büyütme dürtüsü gelirse:
- *"Bu özellik v1 mi v1.5 mi v2 mi?"* diye sor — VERSIONS.md'ye bak
- *"Şimdi koyarsak 90 günde biter mi?"* diye sor
- Yeni fikir ortaya çıkarsa `/devflow:prd-note` ile **kaydet, eklemiş gibi yap** — versiyon sonunda ele alınır

Bu kural ILKELER §"Pazarlık Konusu Olmayanlar" §3'te bağlayıcı olarak yazıldı.

---

**Son Güncelleme:** 2026-05-28
