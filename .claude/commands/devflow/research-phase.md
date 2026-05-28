# DevFlow — Teknik Araştırma (Research Phase)

Bu komut faz için teknik araştırma yapmak ve bulguları kaydetmek için kullanılır. Kapsam tartışmasındaki kararlar araştırmayı yönlendirir.

**Kullanım:** `/devflow:research-phase [N]` — N = faz numarası (belirtilmezse DURUM.md'den aktif fazı al)

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu dosyalar aşağıda tekrarlanmaz.

### Komuta Özgü Ek Dosyalar

**Zorunlu (hepsini oku)**
1. `_dev/PHASES.md`
2. `_dev/QUALITY.md`
3. `_dev/ILKELER.md` — Proje ilkeleri (yaklaşım seçimini yönlendirir)
4. Aktif faz dokümanı (`_dev/phases/PHASE-N.md`) — özellikle "Kapsam Tartışması" bölümünü oku

**Göreve Göre (araştırma konusuna göre oku)**
- Fazın modül dokümanları → MODULE-MAP.md'den bu fazın feature'larına bak, ilgili modülleri tespit et, `_dev/modules/MX-*.md` dosyalarını oku
- Mevcut teknik dokümanlar → INDEX.md'den araştırma konusuyla ilgili `_dev/docs/` dosyalarını tespit et ve oku (TECH-STACK, DATABASE, API vb.)

---

## Yapılacaklar

### 1. Araştırma Alanlarını Belirle

Faz kapsamı ve kapsam tartışmasındaki kararları analiz ederek araştırılması gereken konuları belirle:

**Tipik araştırma alanları:**
- **Stack/Kütüphane araştırması:** Kapsam tartışmasında belirlenen ihtiyaçlara uygun araç ve kütüphaneler
- **Mimari yaklaşımlar:** Feature'ların nasıl yapılandırılacağı, pattern'ler
- **Bilinen sorunlar ve tuzaklar:** Seçilen teknolojilerin yaygın hataları
- **Best practice'ler:** Benzer uygulamalarda kanıtlanmış yaklaşımlar
- **Performans ve ölçeklenebilirlik:** Seçilen yaklaşımın sınırları
- **Güvenlik:** Feature'a özgü güvenlik riskleri

### 2. Araştırmayı Yap

Her alan için:
1. Konuyu araştır
2. Alternatif yaklaşımları karşılaştır
3. Önerisini gerekçesiyle belirle
4. Dikkat edilmesi gereken noktaları not al

**Kurallar:**
- Kapsam tartışmasındaki kararları baz al (mesela "kart layout" kararı varsa, kart component yaklaşımlarını araştır)
- Mevcut projede zaten kullanılan teknolojilerle uyumu göz önünde bulundur (OVERVIEW.md'deki stack)
- Sadece bu faz için gerekli olanları araştır, kapsamı aşma

### 3. Önemli Kararları Belirle

Araştırma sırasında ortaya çıkan karar noktalarını kullanıcıya sun:
- Birden fazla geçerli yaklaşım varsa seçenekleri sun
- Her seçeneğin artı/eksi yönlerini belirt
- Önerisini söyle ama kararı kullanıcıya bırak
- **ILKELER.md'ye göre öner:** Önerini projenin ilkeleriyle hizala (örn. kalıcılık önceliği → daha sağlam yaklaşıma eğil; öncelikli eksenler → o ekseni güçlendiren yaklaşımı öne çıkar). Bir yaklaşım bir ilkeyle çelişiyorsa bunu açıkça belirt.

### 4. Faz Dokümanını Güncelle

Araştırma tamamlandığında, faz dokümanına (`_dev/phases/PHASE-N.md`) "Araştırma Bulguları" bölümünü yaz:

```markdown
## Araştırma Bulguları

### Değerlendirilen Yaklaşımlar
- [Yaklaşım 1]: [Açıklama, artılar, eksiler]
- [Yaklaşım 2]: [Açıklama, artılar, eksiler]
- **Seçilen:** [Hangisi ve neden]

### Kullanılacak Araçlar/Kütüphaneler
- [Araç 1]: [Versiyon, ne için kullanılacak]
- [Araç 2]: [Versiyon, ne için kullanılacak]

### Dikkat Edilecekler
- [Tuzak/Risk 1]: [Nasıl kaçınılacak]
- [Tuzak/Risk 2]: [Nasıl kaçınılacak]

### Teknik Kararlar
- [Karar 1]: [Gerekçe]
- [Karar 2]: [Gerekçe]
```

### 5. Gerekirse docs/ Güncelle

Araştırmadan çıkan kalıcı bilgileri (veritabanı yapısı, API tasarımı vb.) ilgili `_dev/docs/` dokümanlarına yaz. Önemli kararları `_dev/docs/DECISIONS.md`'ye ekle.

### 6. DURUM.md Güncelle

DURUM.md'deki **Adım** alanını `plan` olarak güncelle (araştırma tamamlandı, sıradaki adım planlama).

### 7. Git Commit & Push

Tüm doküman değişikliklerini commit & push yap:
```
docs(phase-N): research — technical research completed
```

### 8. Sıradaki Adımı Öner

```
✅ Araştırma tamamlandı. Bulgular faz dokümanına yazıldı.
📋 Sıradaki adım: /devflow:plan-phase N
   → Task yazımı için yeni bir oturum başlat.
```

---

## Önemli Kurallar

- Bu oturumda task yazılmaz — sadece araştırma yapılır
- Kapsam tartışmasındaki kararları referans al
- Önerilerini ILKELER.md ile hizala — ilkeyle çelişen yaklaşımı sessizce seçme, açıkça getir
- Araştırma bulgularını somut ve uygulanabilir tut (genel bilgi değil, bu projeye özgü)
- Karar gerektiren noktalarda kullanıcıya sor
