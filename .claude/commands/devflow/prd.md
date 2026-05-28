# DevFlow — İlk PRD Oturumu (PRD)

Bu komut projeyi ilk kez keşfetmek ve PRD dokümanlarının temelini atmak için kullanılır. Perspektif bazlı sorgulama yaklaşımıyla projeyi derinlemesine anlayarak `_dev/PRD/` klasörünü oluşturur.

**Kullanım:** `/devflow:prd`

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
`_dev/` ve CLAUDE.md varsa CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY — eksik dosyalar atlanır). İlk PRD oturumu senaryosunda (`_dev/` yok) bu protokol uygulanmaz; doğrudan aşağıdaki kontrollere geç.

### Başlangıçta Kontrol Et
- `_dev/PRD/` klasörünün varlığını kontrol et
- `_dev/` klasörünün varlığını kontrol et
- `_dev/ILKELER.md` varlığını kontrol et — **varsa oku** (Q&A'yi yönlendirir); yoksa Adım 3 başında evrensel tabanla oluşturulacak

### Senaryoya Göre Oku
- **`_dev/` var, `_dev/PRD/` yok** → Mevcut projeye sonradan PRD ekleme. Şu dosyaları oku: `_dev/MODULE-MAP.md`, `_dev/PHASES.md`, `_dev/modules/` altındaki modül dokümanları (OVERVIEW protokol kapsamında okunmuştur — tekrar etme)
- **`_dev/PRD/` zaten var** → Kullanıcıyı uyar ve yönlendir (bkz. Adım 1)

---

## Yapılacaklar

### 1. Başlangıç Durumunu Tespit Et

**`_dev/PRD/` yoksa ve `_dev/` de yoksa:**
- İlk PRD oturumu, sıfırdan başla → Adım 2'ye geç

**`_dev/PRD/` yoksa ama `_dev/` varsa:**
- Mevcut projeye sonradan PRD ekleme senaryosu → Adım 1b'ye geç

**`_dev/PRD/` zaten varsa:**
- Kullanıcıyı uyar: "Mevcut PRD dokümanları var. Sıfırdan mı başlamak istiyorsun yoksa `/devflow:prd-refine` mi kullanmak istersin?"
- Kullanıcının cevabına göre ilerle

### 1b. Mevcut Proje Analizi (sadece `_dev/` var `_dev/PRD/` yok senaryosunda)

Mevcut `_dev/` dokümanlarını oku ve kullanıcıyla durum analizi yap:
- Genelden başla: "Genel yön doğru mu? Hangi parçalar iyi gidiyor?"
- Yanlış giden yerlere odaklanarak derine in: "Hangi kısımlar sorunlu? Nelerin değişmesi gerekiyor?"
- Her şey doğru olan kısımları derinlemesine incelemeye gerek yok

Analiz sonucu SESSION-NOTES.md'ye "mevcut durum analizi" olarak not düşülür. Sonra normal keşfe **özgürce** geç — mevcut durumu bil ama ona bağlı kalma, PRD'yi ideal perspektiften yaz.

**Bu adım sadece ilk prd oturumunda çalışır**, sonraki prd-refine oturumlarında tekrarlanmaz.

### 2. Kullanıcının Başlangıç Noktasını Anla

Kullanıcıya sor: elinde ne var?
- **Ham fikir** → fikri netleştirme sorularıyla başla
- **Detaylı notlar** → bilgiyi al, eksikleri tespit et, derinleştir
- **Mevcut doküman** → oku, anla, üzerine inşa et

Hiçbir senaryoda gereksiz sorularla kullanıcıyı yavaşlatma.

### 3. Perspektif Bazlı Keşif

**Keşfe başlamadan ILKELER.md'yi hazırla:** `_dev/ILKELER.md` yoksa template'ten (`.claude/commands/devflow/templates/ILKELER.md`) evrensel tabanla oluştur (proje kökünde). Böylece keşif boyunca ilkeler öner+onayla'yı ilk sorudan itibaren yönlendirebilir; projeye-özgü alanlar keşif ilerledikçe Adım 4'te netleşir.

Projeyi farklı profesyonel perspektiflerden keşfet. **Sabit soru listesi KULLANMA** — projenin bağlamına göre en değerli soruları seç.

**Perspektifler (sınırlayıcı değil, yol gösterici):**
- **Ürün Yöneticisi:** Problem-çözüm uyumu, hedef kullanıcı, değer önerisi
- **UX Tasarımcısı:** Kullanıcı akışları, sürtünme noktaları, boş durumlar
- **İş Analisti:** İş kuralları, veri akışları, durum geçişleri
- **Sistem Mimarı:** Teknik kısıtlamalar, veri modeli, performans, bağımlılıklar
- **QA Mühendisi:** Bireysel feature kırılmaları, feature'lar arası boşluklar, sistemin bütünsel davranışı (tüm giriş noktalarından her yol tanımlı mı?)
- **Güvenlik Uzmanı:** Kimlik doğrulama, yetkilendirme, hassas veri
- **İş Stratejisti:** Ticarileştirme, büyüme, maliyet
- **DevOps:** Deployment, monitoring, yedekleme
- Proje tipine göre başka perspektifler de devreye girebilir

**Sorgulama kuralları:**
- Soruları konu bazında grupla, her grupta 2-4 soru
- Kullanıcının cevabına göre dal veya geç (adaptif derinleşme)
- Doğal akış — zorlama geçişler yapma
- Bilmediğin şeyi varsayma, sor
- Gerektiğinde web araştırması yap
- **ILKELER.md'yi kullan (öner+onayla):** Bir gri alan projenin ilkelerinden biriyle ilgiliyse (kalıcılık, sır yönetimi, test, proje ufku, öncelikli eksenler), soruyu boş sorma — ilkeye göre cevabı **önceden doldur** ve kullanıcıya teyit ettir ("İlkemiz X olduğu için Y öneriyorum, onaylıyor musun?"). İlkeyle gerçek bir gerilim varsa açıkça getir, sessizce bir tarafı seçme.

### 4. Doküman Oluşturma

**ILKELER.md'yi tamamla (`_dev/ILKELER.md`, proje kökünde):**
- Dosya Adım 3 başında evrensel tabanla oluşturuldu. Burada keşifte belirginleşen projeye-özgü ilkeleri ("Bu Projeye Özgü": proje ufku, en yüksek öncelikli eksenler, pazarlık konusu olmayanlar) netleştirip yaz. Konuşulmamış alanları boş bırak — uydurma. (Evrensel tabanda projeye uymayan varsa çıkar/uyarla.)
- **Sınırı koru:** ILKELER yalnızca yön/öncelik tutar. Ürün vizyonu/feature PRD dosyalarına, somut teknik kural CLAUDE.md'ye gider — burada tekrar etme.
- Bu dosya `_dev/PRD/` içinde değil, `_dev/` kökündedir (faz döngüsü de okur).

Keşif yeterince ilerlediğinde `_dev/PRD/` klasör yapısını kur:

**Sabit dosyalar:**
- `VERSIONS.md` — Versiyon özeti + feature-versiyon haritası tablosu:
  ```
  | Feature | Feature Dosyası | Versiyon |
  |---------|----------------|----------|
  | [Feature adı] | features/[dosya-adi].md | v0.1 |
  ```
- `SESSION-NOTES.md` — PRD'nin çalışma durumu kanvası (aşağıdaki kurallara göre)

**Esnek içerik dosyaları:**
Projenin doğasına göre organize et. Kılavuz olarak şu bilgi alanlarını ele al (hepsi zorunlu değil):
- Proje vizyonu ve problem tanımı
- Hedef kullanıcı
- Teknik kısıtlamalar ve tercihler
- İş kuralları ve sınırlar
- Kapsam dışı bırakılanlar
- Güvenlik ve gizlilik gereksinimleri
- Rakip analizi (varsa)

Dosya organizasyonu projeye adapte olmalı — küçük projede tek dosya, büyük projede her alan ayrı dosyada.

**Feature dosyaları:**
`features/` altında her feature için ayrı doküman. Template'i oku: `.claude/commands/devflow/templates/PRD-FEATURE.md`

**Versiyonlar:**
Büyük projelerde `versions/` klasörü + detay dosyaları. Küçük projelerde VERSIONS.md tek başına yeterli.

### 5. Oturum Sonu

- Kullanıcıya durum özeti sun
- SESSION-NOTES.md'yi güncelle (SESSION-NOTES güncelleme kurallarına göre — bkz. aşağıda)

### 6. Git Commit & Push

Tüm PRD dokümanlarını commit & push yap:
```
docs: prd — initial PRD documents created
```

### 7. Sıradaki Adımı Öner

```
✅ İlk PRD oturumu tamamlandı. _dev/PRD/ yapısı oluşturuldu.
📋 Sıradaki adım: /devflow:prd-refine
   → PRD'yi derinleştirmek için yeni bir oturum başlat.
```

---

## Önemli Kurallar

- Bu oturumda mükemmellik bekleme — ilk taslak yeterli
- Tüm konuları tek oturumda bitirmeye çalışma
- Kullanıcının enerjisini ve ilgisini takip et
- Context dolmadan önce kaydetmeyi öner (`/devflow:prd-save`)
- Dosya organizasyonu projeye adapte olmalı — sabit dosya isimleri dayatma (VERSIONS.md, SESSION-NOTES.md, features/ hariç)
- PRD'de kod blokları bulunmaz — davranış kuralları ve senaryolarla anlat
- PRD self-contained olmalı — dış link kritik bilgi taşıyıcısı olarak kullanılmaz
- Sabit soru listesi kullanma — perspektif bazlı düşün, projenin ihtiyacına göre soru seç
- ILKELER.md ilk prd oturumunda doğar ve Q&A'yi yönlendirir; sonraki prd adımlarında (prd-refine, prd-review) güncellemeye açıktır
- **Konuya araştırarak gel.** SESSION-NOTES vb. notlar hatırlatıcıdır, varsayım kaynağı değil. Tartışacağın konuyu gerçekten anlamak için gerektiğinde grep/find/web araştırması/çapraz doküman okuması yap. Eksik bilgiyle çok konu açmaktansa, az konuyu hazırlanmış olarak getir — net ilerle.

---

## SESSION-NOTES Güncelleme Kuralları

SESSION-NOTES.md bir oturum günlüğü değil, **PRD'nin anlık çalışma durumu kanvasıdır**. Henüz olgunlaşmamış, açık konuları tutar. **Olgun hâli boş veya yakın-boştur** — tüm konular tartışılıp PRD dokümanlarına aktarıldığında bu dosyada açıkta kalan bir not olmamalı, sadece henüz konuşulmamış konular kalmalı. Şişmiş bir SESSION-NOTES her zaman mezuniyet borcunun göstergesidir.

**Ne girer / ne girmez:**
- **Girer:** açık sorular, keşfedilmemiş alanlar, gözlemler ve hipotezler, henüz konuşulmamış belirsizlikler. Açık konular **detaylı yazılır** — bir sonraki oturumun konuya hazırlıklı gelmesi için yeterli bağlam içerir.
- **Girmez:** tartışma günlüğü, "şu konu şu oturumda konuşuldu" tarzı kayıtlar, "X'e aktarıldı" / "✓ tamamlandı" gibi breadcrumb'lar, geçmiş kararların izleri.

**İzsiz mezuniyet:** Bir bilgi olgunlaşıp PRD dokümanlarına (feature dosyası, VERSIONS.md, esnek içerik dosyası vb.) aktarıldıysa SESSION-NOTES'tan **tamamen silinir** — "X'e aktarıldı", "✓ tamamlandı" veya benzeri hiçbir iz/breadcrumb bırakılmaz. SESSION-NOTES'a bakan biri o bilginin bir zamanlar burada olduğunu bilmek zorunda değil; tek kaynak hedef dokümandır. Aynı şekilde artık gerekli olmayan bilgiler (kullanıcı tarafından reddedilen fikirler, güncelliğini yitirmiş gözlemler) da doğrudan silinir. Dosya uzuyorsa bu mezuniyetin yeterince uygulanmadığının sinyalidir — olgunlaşmış bilgileri tespit et, PRD dokümanlarına aktar ve SESSION-NOTES'tan izsiz çıkar.

**Yapı:** Sabit bölüm başlıkları yok — Claude projenin doğasına göre kendi yapısını kurar ve oturumlar arasında organik olarak evrilir. Yön gösterici tipik bölümler (zorunlu değil, projeye göre adapte edilir):
- **Açık Sorular** — yanıt bekleyen, karar gerektiren sorular
- **Keşfedilmemiş Alanlar** — henüz dokunulmamış konu veya perspektifler
- **Gözlemler ve Hipotezler** — Claude'un fark ettiği ama henüz kullanıcıyla konuşulmamış konular

**Güncelleme prensibi:** Dosyayı oku. Güncel durumla tutarsız olan kısımları düzelt, yeni bilgi ekle, çözülmüş konuları sil. **Sadece değişmesi gereken kısmı değiştir.** Eğer dosyanın bütünsel tutarlılığı bozulduysa (çelişen bilgiler, anlamsız kalan bölümler) yeniden yaz. Her güncellemede mevcut içeriği eleştirel gözle değerlendir — çelişen bilgiler, güncelliğini yitirmiş notlar, birbirine uymayan ifadeler tespit et ve düzelt.

**Notların niteliği:** Notlar **hatırlatıcı**, yönlendirici/kısıtlayıcı değil. "Bu soruyu sor" değil, "bu alan keşfedilmedi" şeklinde. Claude'un kendi gözlem ve hipotezleri de yazılabilir (örn: "kullanıcı X konusunda kararsız ama Y'ye eğilim var") — bunlar da hatırlatıcı niteliğindedir, bağlayıcı değil. Sonraki oturumda Claude bu notlara bağlı kalmak zorunda değil — dikkate alır ama kendi değerlendirmesini yapar.
