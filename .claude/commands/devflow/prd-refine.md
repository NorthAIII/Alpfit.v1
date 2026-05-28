# DevFlow — PRD Geliştirme Oturumu (PRD Refine)

Bu komut mevcut PRD dokümanlarını okuyup eksikleri tespit etmek ve kullanıcıyla birlikte derinleştirmek için kullanılır. İstenildiği kadar tekrar çalıştırılabilir. Proje başlamadan önce kullanılır — PRD'yi olgunlaştırmak içindir.

**Kullanım:** `/devflow:prd-refine`

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu komut proje başlamadan önce (henüz `_dev/OVERVIEW.md` vb. yokken) de çalışabilir — protokol dosyaları eksikse atla.

### Komuta Özgü Ek Dosyalar

**Zorunlu (hepsini oku)**
1. `_dev/PRD/SESSION-NOTES.md` — PRD çalışma durumu notları
2. `_dev/PRD/VERSIONS.md` — Versiyon tanımları ve feature haritası
3. `_dev/ILKELER.md` — Proje ilkeleri (derinleştirmeyi yönlendirir; güncellemeye açık)

**Göreve Göre (durum tespitine göre oku)**
- Esnek içerik dosyaları → `_dev/PRD/` altındaki tüm `.md` dosyaları (sabit dosyalar hariç)
- Feature dosyaları → `_dev/PRD/features/` altındaki ilgili feature dokümanları
- Versiyon detay dosyaları → `_dev/PRD/versions/` altındaki dosyalar (varsa)

---

## Yapılacaklar

### 1. Durum Tespiti

Tüm PRD dokümanlarını oku ve mevcut durumu analiz et. Kullanıcıya durum tespiti sun:
- Hangi alanlar güçlü
- Hangi alanlar hâlâ sığ veya eksik
- Hangi perspektiflerden henüz bakılmamış
- Hangi konular derinleştirilmeli

Kullanıcıya sor: "Bugün hangi alana odaklanmak istersin? Yoksa benim önerimle mi gidelim?"

### 2. Derinleştirme

Kullanıcının seçtiği alana veya Claude'un önerisine göre ilerle:
- Perspektif bazlı sorgulama yaklaşımı kullan (sabit soru listesi değil)
- Mevcut bilgiler üzerine inşa et, sıfırdan başlama
- Yeni keşfedilen bilgiler diğer dokümanları etkiliyorsa onları da güncelle
- Gerektiğinde web araştırması yap
- Bir doküman çok uzadıysa modüler bölünme öner veya gerçekleştir
- **ILKELER.md'yi kullan (öner+onayla):** İlkelerle ilgili gri alanlarda cevabı ilkeye göre önceden doldur, teyit ettir. Derinleşme sırasında yeni bir projeye-özgü ilke (ufuk, öncelik, pazarlık-konusu-olmayan) belirginleşirse ILKELER.md'yi güncelle — sınırı koru (yön/öncelik burada, vizyon/feature PRD'de)

### 3. Versiyon Tartışması

Feature'lar belirginleştikçe versiyon önerilerinde bulun:
- "Şu feature'lar bir araya gelince kullanılabilir bir bütün oluşturur"
- Kullanıcıyla birlikte versiyonları şekillendir
- VERSIONS.md'deki feature-versiyon haritasını güncelle

### 4. Oturum Sonu

- Güncellenen dokümanları yaz
- SESSION-NOTES.md'yi güncelle (prd.md'deki SESSION-NOTES güncelleme kurallarına göre)
- Kullanıcıya oturumun özetini sun

### 5. Git Commit & Push

Tüm PRD doküman değişikliklerini commit & push yap:
```
docs: prd-refine — PRD deepened and updated
```

### 6. Sıradaki Adımı Öner

**Devam edilecekse:**
```
📋 Sıradaki adım: /devflow:prd-refine
   → PRD'yi derinleştirmeye devam etmek için yeni bir oturum başlat.
```

**Kickoff'a geçilecekse:**
```
📋 Sıradaki adım: /devflow:kickoff
   → PRD'den teknik yapıya dönüştürmek için yeni bir oturum başlat.
```

---

## Önemli Kurallar

- Her oturumda mutlaka durum tespiti ile başla
- Kullanıcı "bugün X konusuna bakalım" derse Claude'un önerisinden bağımsız oraya git
- Önceki oturumlarda keşfedilen bilgileri tekrar sorma
- SESSION-NOTES.md'yi dikkate al ama ona bağlı kalma — kendi değerlendirmeni yap
- **Konuya araştırarak gel.** SESSION-NOTES vb. notlar hatırlatıcıdır, varsayım kaynağı değil. Tartışacağın konuyu gerçekten anlamak için gerektiğinde grep/find/web araştırması/çapraz doküman okuması yap. Eksik bilgiyle çok konu açmaktansa, az konuyu hazırlanmış olarak getir — net ilerle.
- Olgunluk değerlendirmesini kullanıcıya sun ama kararı dayatma — kickoff'a geçme kararı kullanıcıda
- Context dolmadan önce kaydetmeyi öner (`/devflow:prd-save`)
- Feature dosyası silinir veya yeniden adlandırılırsa VERSIONS.md'deki haritayı güncelle
