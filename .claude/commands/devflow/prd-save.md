# DevFlow — PRD Oturumunu Kaydet (PRD Save)

Bu komut uzayan PRD oturumlarında context dolmadan veya odak kaybını önlemek için o ana kadar tartışılanları **eksiksiz dokümante edip oturumu kapatmak** için kullanılır. Kalan konular bir sonraki oturumda kaldığı yerden devam eder.

**Kullanım:** `/devflow:prd-save`

**Not:** Bu komut yalnızca PRD oturumlarında (`prd`, `prd-refine`, `prd-review`) kullanılır. Faz döngüsü oturumları için mevcut `/devflow:pause` komutu kullanılmaya devam eder.

---

## Yapılacaklar

### 1. Oturum Bilgilerini Topla

Oturumda tartışılan tüm konuları **sistematik olarak, hiçbir detayı atlamadan** topla:
- Hangi alanlar tartışıldı
- Hangi kararlar alındı
- Hangi dokümanlar güncellenmeli

### 2. PRD Dokümanlarını Güncelle

Tartışılan ve karara bağlanan konuları ilgili PRD dokümanlarına yaz:
- Esnek içerik dosyaları
- Feature dokümanları
- VERSIONS.md (versiyon değişikliği varsa)

### 3. SESSION-NOTES.md Güncelle

prd.md'deki SESSION-NOTES güncelleme kurallarına göre güncelle. Özetle:
- Güncel durumla tutarsız olanları düzelt, yeni bilgi ekle, çözülmüş konuları sil
- Sadece değişmesi gereken kısmı değiştir (bütünsel tutarlılık bozulduysa yeniden yaz)
- PRD dokümanlarına aktarılmış bilgiyi SESSION-NOTES'tan **izsiz çıkar** (mezuniyet prensibi) — "X'e aktarıldı" / "✓ tamamlandı" gibi breadcrumb notu bırakma
- Hedef: tüm konular tartışılıp aktarıldıysa dosya boş veya yakın-boş kalmalı; açıkta kalan bir not olmamalı
- Mevcut içeriği hata/tutarsızlık açısından eleştirel değerlendir

### 4. Git Commit & Push

Tüm PRD doküman değişikliklerini commit & push yap:
```
docs: prd-save — PRD session saved
```

### 5. Kullanıcıya Özet Sun

```
✅ Oturum kaydedildi.
   Güncellenen dosyalar: [dosya listesi]
   Bir sonraki oturumda şu konulara bakabiliriz: [öneriler]
📋 Devam etmek için: /devflow:[aktif oturumun tipi]
```

Sıradaki komutu aktif oturumun tipine göre belirt:
- prd oturumundaysa → `/devflow:prd-refine`
- prd-refine oturumundaysa → `/devflow:prd-refine`
- prd-review oturumundaysa → `/devflow:prd-review`

---

## Önemli Kurallar

- **Eksiksiz ve dikkatli kayıt** — bu oturumda tartışılan hiçbir detayı atlama
- Sadece tartışılmış konuları kaydet, spekülasyon yapma
- Kullanıcının söylemediği şeyleri doküman olarak yazma
- **Kalan konular sonraki oturuma bırakılır** — bu komut oturumu kapatır, yeni keşif veya derinleştirme başlatmaz
