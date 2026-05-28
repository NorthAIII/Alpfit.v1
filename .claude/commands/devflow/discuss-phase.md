# DevFlow — Kapsam Tartışması (Discuss Phase)

Bu komut faz planlamasından önce kullanıcının tercihlerini toplamak için kullanılır. Planlama oturumunda Claude'un varsayımlarla ilerlemesini önler. Ayrıca versiyon sonu tespiti yaparak teknik borç ve senaryo testi fazlarına geçişi yönetir.

**Kullanım:** `/devflow:discuss-phase [N]` — N = faz numarası

**Faz numarasının belirlenmesi (Just-in-Time):** (1) argüman verildiyse onu kullan; (2) yoksa ve DURUM Aktif Faz doluysa onu kullan; (3) ikisi de yoksa (örn. versiyon geçişi sonrası boş Aktif Faz) **yeni faz = Faz Durumu tablosundaki en büyük faz no + 1** (tablo boşsa 1). Faz numarası faza girince bu kuralla damgalanır — gelecek fazlar önceden numaralanmaz (bkz. PHASES.md → Faz Numaralandırma Kuralı).

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu dosyalar aşağıda tekrarlanmaz.

> Not: `_dev/DURUM.md`'yi protokol kapsamında okurken özellikle **Aktif Versiyon** alanına dikkat et.

### Komuta Özgü Ek Dosyalar

**Zorunlu (hepsini oku)**
1. `_dev/MODULE-MAP.md` — Feature-Faz Matrisi'ndeki **Versiyon sütununu** oku
2. `_dev/ILKELER.md` — Proje ilkeleri (gri alan kararlarını yönlendirir)

**Göreve Göre (ilgili adımlarda okunacak)**
- Fazın modül dokümanları → MODULE-MAP.md'den bu fazın feature'larına bak, ilgili modülleri tespit et, `_dev/modules/MX-*.md` dosyalarını oku
- Aktif faz dokümanı (`_dev/phases/PHASE-N.md`) → varsa oku, yoksa Adım 6'da oluşturulacak
- Önceki faz dokümanı → önceki faz varsa `_dev/phases/PHASE-(N-1).md` dosyasındaki "Retrospektif" bölümünü oku (öğrenimleri aktar)
- PHASE template → faz dokümanı yoksa oku: `.claude/commands/devflow/templates/PHASE.md`
- **Teknik borç fazında:** Bu versiyondaki **tüm tamamlanmış fazların** `_dev/phases/PHASE-*.md` dosyalarını oku — özellikle "Ne Kötü Gitti?" ve retrospektif bölümlerini

---

## Yapılacaklar

### 0. Versiyon Sonu Tespiti

Her çalıştırmada önce versiyon sonuna gelinip gelinmediğini kontrol et:

1. DURUM.md'den **aktif versiyonu** ve **Versiyon Sonu Durumu** alanını oku
2. **Aktif Versiyon yoksa veya boşsa** (PRD'siz proje) → versiyon sonu tespiti atlanır, doğrudan Adım 1'e geç

**Versiyon Sonu Durumu'na göre:**
- **`içerik_fazları`** → MODULE-MAP'teki Feature-Faz Matrisi'ni oku. Aktif versiyonun tüm feature'ları ✅ ise → DURUM.md'deki Versiyon Sonu Durumu'nu `teknik_borç` olarak güncelle ve Adım 0a'ya geç. Değilse → normal faz döngüsü, Adım 1'e geç.
- **`teknik_borç`** → Teknik borç fazının PHASES.md'deki durumunu kontrol et.
  - Faz ✅ tamamlanmışsa → Versiyon Sonu Durumu'nu `senaryo_testi` olarak güncelle ve Adım 0b'ye geç. *(Güvenlik ağı: review-phase bu geçişi zaten yapmış olmalı — burada tekrar yazılması idempotent, crash/atlanma durumunda yakalar.)*
  - Faz devam ediyorsa veya henüz başlamadıysa → Adım 0a'ya geç.
- **`senaryo_testi`** → Senaryo testi fazının PHASES.md'deki durumunu kontrol et.
  - Faz ✅ tamamlanmışsa → Versiyon Sonu Durumu'nu `prd_review_bekliyor` olarak güncelle ve kullanıcıyı bilgilendir: "Versiyon sonu fazları tamamlandı. Şimdi `/devflow:prd-review` çalıştırılmalı." *(Güvenlik ağı: review-phase bu geçişi zaten yapmış olmalı.)*
  - Faz devam ediyorsa veya henüz başlamadıysa → Adım 0b'ye geç.
- **`prd_review_bekliyor`** → Her iki sabit faz tamamlanmış. Kullanıcıyı bilgilendir: "Versiyon sonu fazları tamamlandı. Şimdi `/devflow:prd-review` çalıştırılmalı."

### 0a. Teknik Borç Kapatma Fazı

**Teknik borç fazı henüz başlamadıysa:**
"Bu versiyonun içerik fazları tamamlandı, şimdi teknik borç kapatma fazına geçiyoruz."

**Teknik borç fazı devam ediyorsa (önceki oturumdan kalan):**
"Teknik borç kapatma fazına devam ediyoruz."

1. Bu versiyondaki tüm tamamlanmış fazların PHASE-N.md dosyalarını oku — "Ne Kötü Gitti?" ve retrospektif bölümlerini
2. Birikmiş teknik borçları sistematik olarak topla
3. Kullanıcıya topladığı listeyi sun ve sor: "Başka teknik borç var mı?"
4. Listeyi önceliklendir
5. Faz dokümanını oluştur ve normal faz döngüsüyle ilerle (research-phase → plan-phase → verify-plan → run-task → verify-phase → review-phase)
6. **Bu faz tamamlandığında**, review-phase Versiyon Sonu Durumu'nu `senaryo_testi` olarak günceller ve discuss-phase'i önerir. Sonraki discuss-phase çağrıldığında Adım 0b'ye geçilir.

### 0b. Senaryo Testi Fazı

**Senaryo testi fazı henüz başlamadıysa:**
"Teknik borç fazı tamamlandı, şimdi senaryo testi fazına geçiyoruz."
DURUM.md'deki Versiyon Sonu Durumu'nu `senaryo_testi` olarak güncelle (review-phase yapmış olmalı — güvenlik ağı).

**Senaryo testi fazı devam ediyorsa (önceki oturumdan kalan):**
"Senaryo testi fazına devam ediyoruz."

1. MODULE dokümanlarındaki kabul kriterleri ve kullanıcı senaryolarından test senaryoları çıkar
2. Claude kendi test senaryolarını da önerir (teknik perspektif: edge case'ler, hata durumları, sınır değerleri)
3. **Sadece happy path değil:** Tüm giriş noktalarından ve tüm roller için test senaryoları oluştur
4. **Adversarial test:** Sistemi bütünsel olarak kırmaya çalışan senaryolar ekle (beklenmeyen URL'ler, yetki dışı erişim, token manipülasyonu, network kesintisi vb.)
5. Kullanıcıya sun ve sor: "Senin eklemek istediğin senaryolar var mı?" — asıl kullanım senaryoları kullanıcıdan gelmeli
6. Faz dokümanını oluştur ve normal faz döngüsüyle ilerle (research-phase → plan-phase → verify-plan → run-task → verify-phase → review-phase)
7. **Bu faz tamamlandığında**, review-phase Versiyon Sonu Durumu'nu `prd_review_bekliyor` olarak günceller ve doğrudan `/devflow:prd-review` önerir (discuss-phase'e gerek yok).

### 1. Faz Kapsamını Analiz Et

Faz dokümanı varsa feature listesini incele. **Yeni faz ise** (doküman henüz yok) konusu şuradan gelir: Sıradaki Fazlar listesinin ilk maddesi; liste boşsa (örn. yeni versiyona giriş) aktif versiyonun MODULE-MAP'teki henüz faza atanmamış (`—`) feature'larından türetilir; dinamik fazlarda (teknik borç / senaryo testi) versiyon sonu tespitinden gelir. Feature'ları MODULE-MAP'ten belirle. Her feature için:
- Ne yapılacak?
- Hangi modülü etkiliyor?
- Bağımlılıkları ne?

**MODULE-MAP Güncelleme:** Yeni faz başlatılırken MODULE-MAP'teki henüz faza atanmamış feature'ları (Faz sütunu "—" olanları) bu faza atayabilirsin. Mevcut atamaları değiştirme, sadece yeni atama yap. Bu fazın feature'larının Durum sütununu `🔄 Devam ediyor` olarak güncelle. MODULE-MAP'i güncelle. **Feature değişiklik kuralı:** Bir feature'a büyük değişiklik gelirse (yeni yetenek, kapsam genişlemesi) yeni bir feature satırı olarak ekle, mevcut satırı değiştirme. Yeni satırın Versiyon sütununa aktif versiyonu yaz. Küçük değişiklikler (bug fix, iyileştirme) task seviyesinde ele alınır.

### 2. Gri Alanları Tespit Et

Feature tipine göre farklı gri alanlar sor:

**UI/Frontend Feature'ları:**
- Layout tercihi (kart, tablo, liste, grid?)
- Bilgi yoğunluğu (minimal mi, detaylı mı?)
- Etkileşim modeli (modal, inline edit, ayrı sayfa?)
- Boş durum (veri yokken ne gösterilecek?)
- Responsive davranış
- Animasyon/geçiş tercihleri

**API/Backend Feature'ları:**
- Response formatı ve yapısı
- Hata yönetimi stratejisi
- Validation kuralları
- Rate limiting / throttling ihtiyacı
- Loglama detay seviyesi

**Veri/İçerik Feature'ları:**
- Veri yapısı ve ilişkileri
- İçerik akışı ve sıralaması
- Edge case'ler (boş, çok büyük, geçersiz veri)
- Filtreleme/sıralama ihtiyaçları

**Organizasyon/Altyapı Feature'ları:**
- Gruplama kriterleri
- İsimlendirme convention'ları
- İstisna durumları

### 3. Sahipsiz Alan Tespiti ve Çapraz Konular

Gri alanlar tartışıldıktan sonra, bir adım geriye çekilip bütünsel bak:

**Sahipsiz alan tespiti:** Bu fazın feature'ları bir araya geldiğinde arada sahipsiz kalan yer var mı? Hiçbir feature'ın sorumluluğunda olmayan ama kullanıcının karşılaşacağı durumlar (yönlendirmeler, giriş noktaları, hata sonrası kurtarma akışları). Eksik varsa kapsama ekle veya mevcut feature'a dahil et.

**Çapraz konuların erken düşünülmesi:** Bu fazın feature'ları güvenlik, performans, hata yönetimi açısından ne gerektiriyor? Bu konuları şimdi düşünmek, review'da "bunu düşünmeliydik" demekten çok daha verimli. Checklist değil — fazın doğasına göre hangi çapraz konular öne çıkıyorsa onları düşün.

### 4. Kullanıcıyla Tartış

Her gri alan ve tespit için:
1. Konuyu açıkla ve neden karar gerektiğini söyle
2. Varsa seçenekleri sun (tercihlerini göster ama dayatma)
3. Kullanıcının tercihini al
4. Emin değilse varsayılan öner, ama kararı kullanıcıya bırak

**ILKELER.md ile öner+onayla:** Bir gri alan projenin ilkelerinden biriyle ilgiliyse (kalıcılık, sır yönetimi, test, ufuk, öncelikli eksenler), boş soru sorma — ilkeye uygun cevabı **önceden doldur** ve teyit ettir ("İlkemiz X olduğu için Y öneriyorum"). İlkeyle gerçek bir gerilim doğarsa açıkça getir, sessizce bir tarafı seçme.

**Kurallar:**
- Tüm gri alanları tek seferde listeleme — grupla ve adım adım ilerle
- Kullanıcı "varsayılanla devam" derse, varsayılanı yaz ve geç
- Kullanıcı bir konuda derine inmek isterse, o konuyu detaylandır
- Tartışma bitmeden faz dokümanına yazma

### 5. Kapsam Dışını Netleştir

Feature'ların sınırlarını belirle:
- Bu fazda kesinlikle yapılmayacak şeyler
- Sonraki fazlara bırakılan şeyler
- Bilerek basit tutulan şeyler

### 6. Faz Dokümanını Oluştur veya Güncelle

Tüm tartışma tamamlandığında, faz dokümanına (`_dev/phases/PHASE-N.md`) "Kapsam Tartışması" bölümünü yaz.

**Faz dokümanı henüz yoksa:**
1. Önce oku: `.claude/commands/devflow/templates/PHASE.md`
2. Template'ten `_dev/phases/PHASE-N.md` oluştur
3. Genel bilgileri (amaç, milestone, feature listesi) doldur
4. "Kapsam Tartışması" bölümünü yaz
5. **PHASES.md güncelle (faz promosyonu — yalnızca yeni faz)** — Bu fazı Faz Durumu tablosuna **yeni satır** olarak ekle (no = yukarıda belirlenen numara = mevcut max + 1, durum 🔄 Devam ediyor). Konu Sıradaki Fazlar listesindeyse oradan **sil** (mezuniyet — iz bırakma: HTML comment/üstü çizili/"Önceki:" yok). Teknik borç / senaryo testi gibi dinamik fazlar Sıradaki Fazlar'da yer almaz; doğrudan tabloya ekle. discuss-phase, bir fazı Faz Durumu tablosuna ekleyen **tek** komuttur. **Mevcut/aktif bir fazı yeniden tartışıyorsan (doküman zaten var) numara sabit kalır ve yeni satır EKLENMEZ — sadece o fazın bilgisi güncellenir.**

```markdown
## Kapsam Tartışması

### Alınan Kararlar
- [Karar 1]: [Tercih ve gerekçesi]
- [Karar 2]: [Tercih ve gerekçesi]
- ...

### Kullanıcı Tercihleri
- [Tercih 1]: [Detay]
- ...

### Kapsam Dışı
- [Bu fazda yapılmayacak şey 1]
- [Bu fazda yapılmayacak şey 2]
- ...
```

### 7. DURUM.md Güncelle

- **Aktif Faz** alanını bu fazın numarasına set et (üzerinde çalışılan faz N). Normal akışta review-phase bunu zaten N'e yazmıştır — bu teyit idempotenttir; ama versiyon yeniden-girişinde review-phase alanı boşaltmış olur ([review-phase.md:139](review-phase.md#L139)), bu set onu doğru doldurur. Böylece DURUM sıradaki komutlar için tek yetkili kaynak kalır.
- **Adım** alanını `research` olarak güncelle (kapsam tartışması tamamlandı, sıradaki adım araştırma).

### 8. Git Commit & Push

Tüm doküman değişikliklerini commit & push yap:
```
docs(phase-N): discuss — scope discussion completed
```

### 9. Sıradaki Adımı Öner

```
✅ Kapsam tartışması tamamlandı. Kararlar faz dokümanına yazıldı.
📋 Sıradaki adım: /devflow:research-phase N
   → Teknik araştırma yapmak için yeni bir oturum başlat.
```

---

## Önemli Kurallar

- Bu oturumda task yazılmaz, araştırma yapılmaz — sadece kapsam tartışılır
- Varsayımda bulunma, kullanıcıya sor
- Her kararı gerekçesiyle kaydet
- Önceki fazın retrospektifindeki öğrenimleri göz önünde bulundur
- Versiyon sonu tespitini her çalıştırmada yap — atlanırsa teknik borç ve senaryo testi fazları çalıştırılmaz
- Versiyon Sonu Durumu geçişlerinde: `içerik_fazları` → `teknik_borç` geçişi discuss-phase'in birincil sorumluluğudur. `teknik_borç` → `senaryo_testi` ve `senaryo_testi` → `prd_review_bekliyor` geçişleri review-phase'in birincil sorumluluğudur — discuss-phase bu geçişleri güvenlik ağı olarak kontrol eder (idempotent).
- Sahipsiz alan tespiti ve çapraz konu farkındalığı checklist değil — fazın doğasına göre doğal olarak düşün
- ILKELER.md'yi referans al — ilkeyle ilgili gri alanlarda öner+onayla, varsayımla geçme
