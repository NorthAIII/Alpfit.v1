# DevFlow — Proje Başlatma Oturum 1: Projeyi Anla (Kickoff)

Bu komut sıfırdan yeni bir proje başlatmanın veya PRD değişikliği sonrası projeyi güncellemenin ilk adımıdır. İki modda çalışır: ilk kickoff (sıfırdan) ve re-kickoff (PRD değişikliği sonrası delta güncelleme). **Bu oturumda doküman oluşturulmaz** — sadece konuşulur, anlaşılır ve onaylanır.

**Kullanım:** `/devflow:kickoff`

---

## Bu Oturumda Template OKUMA

Bu oturumda template'lere gerek yok. Sadece kullanıcıyla konuşulacak ve yapı belirlenecek. Template'ler bir sonraki oturumda (kickoff-docs) okunacak.

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
`_dev/` ve CLAUDE.md varsa (re-kickoff modu) CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY — eksik dosyalar atlanır). İlk kickoff modunda (`_dev/` yok) bu protokol uygulanmaz.

### Mod Tespiti İçin Kontrol Et
- `_dev/` klasörünün varlığını kontrol et
- `_dev/PRD/` klasörünün varlığını kontrol et

### İlk Kickoff Modunda
- `_dev/PRD/` altındaki **tüm dokümanları** oku (sabit dosyalar + esnek içerik dosyaları + feature dosyaları) — PRD varsa
- `_dev/ILKELER.md` — **varsa** oku (PRD flow'da `prd` oluşturmuştur; modül/faz yapısını ufuk/öncelik ilkelerine göre öner). PRD'siz flow'da bu dosya kickoff-docs'ta doğacağı için henüz yok — atla.

### Re-Kickoff Modunda (protokol zaten OVERVIEW/INDEX/DURUM/MEMORY'yi okudu)
- `_dev/PRD/` altındaki tüm dokümanları oku
- `_dev/MODULE-MAP.md`, `_dev/PHASES.md`
- Etkilenen modül dokümanları (`_dev/modules/`)
- `_dev/ILKELER.md` — proje ilkeleri (mimari/faz güncellemesini yönlendirir)

---

## Mod Tespiti

Otomatik tespit yerine kullanıcıya sor:

- **`_dev/` yok** → İlk kickoff (otomatik, soru sormaya gerek yok)
- **`_dev/` var, `_dev/PRD/` var** → Kullanıcıya sor: "Mevcut proje yapısı var. Bu bir re-kickoff mu (PRD değişikliği sonrası) yoksa sıfırdan mı başlamak istiyorsun?" Kullanıcı PRD'siz/sıfırdan devam etmek isterse: "Mevcut `_dev/PRD/` klasörü silinsin mi? İleride karışıklık yaratabilir."
- **`_dev/` var, `_dev/PRD/` yok** → PRD'siz mevcut proje. PRD kullanmak isteyip istemediğini sor.

Belirsiz durumda otomatik tespit yapma — kullanıcıya sor.

---

## Yapılacaklar — İlk Kickoff Modu

### Adım 1: PRD'yi Oku veya Projeyi Anla

**PRD varsa (`_dev/PRD/` mevcut):**
- Tüm PRD dokümanlarını oku
- Bilgileri özetle ve kullanıcıdan onayla
- PRD'de eksik görülen alanlar varsa uyar: "PRD'de şu alanlar eksik, devam mı edelim yoksa PRD'ye dönüp tamamlayalım mı?"
- Küçük düzeltmeler (feature'ın ikiye bölünmesi, eksik detay) kickoff'ta yapılabilir
- Büyük değişiklikler için "PRD'ye dönüp bunu güncelleyelim mi?" diye sor — kickoff PRD'nin teknik açıdan yeterliliğini doğrulayan bir kapı bekçisi gibi çalışır

**PRD yoksa:**
- Kullanıcıyı uyar ve `/devflow:prd` komutunu öner
- Kullanıcı PRD yapmak istemezse mevcut kickoff davranışıyla devam et (projeyi sıfırdan anlama):
  - Proje ne yapıyor? Amacı ne? Hedef kullanıcı kim?
  - Teknoloji stack'i ne?
  - Projenin kapsamı ne? Bilinen kısıtlamalar?

### Adım 2: Modül/Feature Yapısını Belirle

**PRD varsa:**
- PRD'deki feature dokümanlarını okuyarak modül yapısını öner
- Feature'lar zaten PRD'de tanımlı — bunları teknik modüllere organize et
- Modüller arası bağımlılıkları belirle

**PRD yoksa:**
- Mevcut davranış: modül ve feature yapısını sıfırdan öner

Yapıyı kullanıcıya göster ve onayını al. Gerekirse revize et.

**ILKELER varsa gözet (öner+onayla):** Modül ve faz yapısını önerirken proje ilkelerini — özellikle proje ufku ve en yüksek öncelikli eksenleri — hesaba kat (örn. uzun-ömürlü proje → genişletilebilir, gevşek-bağlı yapı; "kümülatif test" → test altyapısı erken faza). İlkeyle gerilim varsa kullanıcıya getir. (PRD'siz flow'da ILKELER henüz yoktur — bu adım atlanır.)

### Adım 3: Fazları Belirle

**PRD varsa:**
- PRD'deki versiyon tanımlarını (VERSIONS.md) referans alarak fazları belirle
- Versiyonlar = kullanılabilirlik birimi, fazlar = geliştirme birimi
- Her faz sonunda bir versiyona yaklaşılmalı ama bire bir eşleşme zorunlu değil

**PRD yoksa:**
- Mevcut davranış: projeyi fazlara böl, feature'ları fazlara ata

**Her iki durumda:**
- Faz sayısı önceden sabitlenmez
- Yakın faz konularını konu + milestone düzeyinde taslakla — ama **faz NUMARASI verilmez.** Konular numarasız "Sıradaki Fazlar" olarak durur; numara faza girince (discuss-phase) damgalanır (bkz. PHASES.md → Faz Numaralandırma Kuralı). İleriye dönük geniş plan versiyon düzeyinde (VERSIONS.md) kalır.
- İlk birkaç faz konusunu yine de düşün (kapsamı anlamak için) — uzak gelecek için faz değil, versiyon düzeyinde plan yeterli
- Her faz konusu için somut, test edilebilir milestone yaz
- Fazları kullanıcıya göster ve onayını al

### Adım 4: Projeye Özgü İhtiyaçları Belirle

Projenin ihtiyacına göre ek doküman ihtiyaçlarını tespit et (STYLE-GUIDE, TECH-STACK, DATABASE vb.)

### Adım 5: Kararları Kaydet

Tüm kararları `_dev/KICKOFF-NOTES.md` dosyasına yaz (`_dev/` klasörü yoksa oluştur). Bu dosya kickoff-docs oturumunda okunacak.

### Adım 6: Git Commit & Push

KICKOFF-NOTES.md dosyasını commit & push yap:
```
docs: kickoff — project analysis and decisions recorded
```

### Adım 7: Özet ve Sıradaki Adım

```
✅ Proje anlama tamamlandı. Modüller, feature'lar ve fazlar belirlendi.
   Kararlar _dev/KICKOFF-NOTES.md dosyasına kaydedildi.
📋 Sıradaki adım: /devflow:kickoff-docs
   → Dokümanları oluşturmak için yeni bir oturum başlat.
```

---

## Yapılacaklar — Re-Kickoff Modu

### Adım 1: Değişiklikleri Tespit Et

- `_dev/PRD/` ve mevcut `_dev/` dokümanlarını oku
- PRD'deki değişiklikleri mevcut yapıyla karşılaştır
- Neyin değiştiğini kullanıcıya özetle

### Adım 2: Modül Yapısını Güncelle

- Mevcut MODULE-MAP.md'yi oku
- Yeni eklenen veya değişen feature'ları modül yapısına entegre et
- Kaldırılan feature'ları temizle
- Etkilenmeyen modüllere dokunma
- Kullanıcıdan onay al

### Adım 3: Fazları Güncelle

- Mevcut PHASES.md'yi oku
- Tamamlanmış fazlara dokunma
- Gelecek fazları PRD değişikliklerine göre güncelle
- Yeni faz konularını **Sıradaki Fazlar** listesine ekle (numarasız) — numara faza girince (discuss-phase) damgalanır; faz no global/sürekli/append-only, versiyon değişse de sıfırlanmaz ve hiç kaydırılmaz (bkz. PHASES.md → Faz Numaralandırma Kuralı). Tamamlanmış (girilmiş) fazlara dokunma.
- Faz sayısı esnek — sadece yakın faz konuları taslaklanır, uzak plan versiyon düzeyinde kalır
- Kullanıcıdan onay al

### Adım 4: Projeye Özgü Dokümanları Kontrol Et

Mevcut projeye özgü dokümanları (STYLE-GUIDE, TECH-STACK vb.) kontrol et. PRD değişiklikleri bunları etkiliyor mu? Etkiliyorsa güncelleme planla.

### Adım 5: Kararları Kaydet

Tüm kararları `_dev/KICKOFF-NOTES.md` dosyasına yaz.

### Adım 6: Git Commit & Push

KICKOFF-NOTES.md dosyasını commit & push yap:
```
docs: re-kickoff — change analysis and decisions recorded
```

### Adım 7: Özet ve Sıradaki Adım

```
✅ Re-kickoff analizi tamamlandı. Değişiklikler belirlendi.
   Kararlar _dev/KICKOFF-NOTES.md dosyasına kaydedildi.
📋 Sıradaki adım: /devflow:kickoff-docs
   → Dokümanları güncellemek için yeni bir oturum başlat.
```

---

## Önemli Kurallar

- Bu oturumda doküman oluşturma/güncelleme yapma — sadece konuş, anla, onay al (KICKOFF-NOTES.md hariç)
- Kullanıcının onayı olmadan yapı kesinleştirme**me**
- Yakın faz konularını taslakla ama faz numarası verme — numara faza girince atanır (just-in-time); uzak plan versiyon düzeyinde
- Bilgi tekrarı olabilecek noktaları şimdiden planla (her bilgi tek yerde)
- **Çelişki yönetimi prensibi:** Çelişki gördüğünde varsayım yapma, kullanıcıya sor. Bu prensip tüm kickoff sürecinde (ilk kickoff ve re-kickoff) geçerlidir.
- Re-kickoff'ta **merge prensibi:** Mevcut bilgi korunur, yeni bilgi eklenir, her çelişki kullanıcıya sorulur. Hiçbir bilgi sessizce ezilmez.
