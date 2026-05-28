# DevFlow — Faz Review, Retrospektif ve Kalite Kontrol (Review Phase)

Bu komut faz tamamlandıktan sonra bütüncül değerlendirme, retrospektif ve kalite kontrol yapmak için kullanılır.

**Kullanım:** `/devflow:review-phase [N]` — N = faz numarası (belirtilmezse DURUM.md'den aktif fazı al)

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu dosyalar aşağıda tekrarlanmaz.

### Komuta Özgü Ek Dosyalar

**Zorunlu (hepsini oku)**
1. `_dev/MODULE-MAP.md`
2. `_dev/QUALITY.md`
3. Aktif faz dokümanı (`_dev/phases/PHASE-N.md`) — tüm bölümler (kapsam, araştırma, task listesi, UAT)

**Göreve Göre (review sırasında oku)**
- Bu fazın task dokümanları → faz dokümanındaki task listesinden task numaralarını al, `_dev/tasks/archive/` klasöründe `TASK-N.*` dosyalarını oku
- Değişen kaynak kod dosyaları → task dokümanlarının "Etkilenen Dosyalar" bölümlerinden değişen dosyaları tespit et ve incele

---

## Yapılacaklar

### 1. Bütüncül Değerlendirme

Fazdaki tüm çıktıları birlikte değerlendir:
- Task'lar toplamda tutarlı bir bütün oluşturuyor mu?
- Feature'lar birbirleriyle uyumlu mu?
- Kapsam tartışmasındaki kararlar uygulanmış mı?
- Araştırma bulgularındaki dikkat noktalarına uyulmuş mu?

### 2. Milestone Kontrolü

Faz milestone'unu tekrar kontrol et:
- Tüm kriterler karşılanıyor mu?
- UAT'ta geçen senaryolar milestone'u karşılıyor mu?
- Eksik kalan bir şey var mı?

### 3. Kalite Kontrol

QUALITY.md'deki her kalite eksenini sistematik olarak kontrol et:

| Eksen | Sorular |
|-------|---------|
| Modülerlik | Kod mantıksal modüllere ayrılmış mı? Tek sorumluluk? |
| Güvenlik | Input validation? Yetkilendirme? XSS/CSRF? |
| Bakım Maliyeti | Okunabilir mi? Konfigürasyon esnek mi? |
| Performans | N+1? Pagination? Cache? |
| Hata Yönetimi | Try/catch? Anlamlı hata mesajları? |
| Test Kapsamı | Kritik mantık test edilmiş mi? Edge case'ler? |
| Erişilebilirlik | Semantik HTML? Keyboard nav? (UI projeleri) |
| [Projeye Özgü] | Projeye eklenen ek eksenler |

### 3b. Kullanıcı Yolculuğu Perspektifi ve Boşluk Tespiti

Kalite eksenlerinin ötesinde, bir adım geriye çekilip bütünsel bak:

**Kullanıcı yolculuğu:** Bu fazdan sonra kullanıcı deneyimi tutarlı mı? Kullanıcı olarak uygulamayı baştan sona kullanmaya çalışsan akış doğal mı, kopukluk var mı?

**Boşluk tespiti:** Uçtan uca baktığında feature'lar arasında sahipsiz kalan yer var mı? Hiçbir feature'ın veya task'ın sorumluluğunda olmayan ama kullanıcının karşılaşacağı durumlar tespit edildiyse raporla.

Bu QUALITY.md'ye eksen olarak eklenmez — review-phase'in doğal akışında düşünülür. Checklist değil, anlayış.

### 4. Retrospektif

Kullanıcıyla birlikte (veya kaynak koddan çıkararak) değerlendir:

**Ne iyi gitti?**
- Tekrarlanması gereken pratikler
- İyi çalışan yaklaşımlar

**Ne kötü gitti?**
- Sorunlar ve darboğazlar
- Beklenmedik zorluklar
- Uzayan veya tekrar edilen task'lar

**Sonraki faz için öneriler:**
- Bu fazdan çıkan dersler
- Sonraki fazda dikkat edilmesi gerekenler
- İyileştirme önerileri

**Süreç disiplini çıktı mı? (triyaj)**

"Ne kötü gitti"den bazen tekrar edilebilir bir iş-akışı kuralı doğar — "şunu yaparken şu kontrolü her zaman yap" tipinde (örn. "shared component eklerken mount-point'leri grep'le", "task closure'da e2e selector taraması yap"). Böyle bir disiplin belirdiğinde evini **bir an düşün:**

- **Bu projeye mi özgü** (projenin teknolojisi/yapısı/kod tabanıyla bağlı)? → memory'nin "Süreç Disiplinleri" kategorisi (Adım 6). Kanca'yı uygulama anını (plan/icra) belli edecek şekilde yaz.
- **DevFlow yönteminin geneline mi dair** (her projede geçerli; aracın kendisinin nasıl çalışması gerektiği)? → bu projenin işi değil. Faz retrosuna "DevFlow'a Öneri" olarak yaz (Adım 5) ve **kullanıcıya bildir** — DevFlow'a ayrı bir oturumda taşınır.

Bu bir checklist değil — çoğu retroda hiç disiplin çıkmaz. Sadece tekrar eden bir kalıp gördüğünde evini doğru seç. Disiplinleri TASKS-README'ye **yazma** — o dokunulmaz çekirdek protokoldür (CLAUDE.md → Dokunulmaz Dokümanlar).

### 5. Faz Dokümanını Güncelle

Faz dokümanına (`_dev/phases/PHASE-N.md`) şu bölümleri yaz:

```markdown
## Retrospektif

### Ne İyi Gitti?
- [...]

### Ne Kötü Gitti?
- [...]

### Sonraki Faz İçin Öneriler
- [...]

### Task-Spesifik Teknik Öğrenimler
<!-- Bu fazdaki task'larda öğrenilen ama proje genelinde geçerli olmayan teknik nüanslar (araç davranışı, framework bug'ı, vb.). MEMORY.md'nin değil, faz retrosunun evidir. -->
- [...]

### DevFlow'a Öneri
<!-- Bu fazda fark edilen, DevFlow yönteminin geneline dair (proje-özel OLMAYAN) iyileştirmeler — aracın kendisinin nasıl çalışması gerektiği. Buraya yazılır + kullanıcıya bildirilir; DevFlow'a ayrı oturumda taşınır. Disiplin çıkmadıysa bu alt bölümü tamamen sil. -->
- [...]

## Kalite Kontrol Sonuçları

| Eksen | Durum | Not |
|-------|-------|-----|
| Modülerlik | ✅ | ... |
| Güvenlik | ⚠️ | [dikkat noktası] |
| Bakım Maliyeti | ✅ | ... |
| Performans | ✅ | ... |
| Hata Yönetimi | ✅ | ... |
| Test Kapsamı | ✅ | ... |
| Erişilebilirlik | N/A | [bu fazda UI yok] |
```

### 6. Diğer Dokümanları Güncelle

- **PHASES.md:** Faz durumunu "✅ Tamamlandı" olarak güncelle. Faz Geçiş Notları tablosuna geçiş kaydı ekle (tarih + kısa not, tek satır max ~120 char). PHASES.md'ye faz detayı/retrospektif özeti yazma — detay zaten PHASE-N.md'dedir. "Son Güncelleme" satırını üzerine yaz.
- **DURUM.md:** "Son Güncelleme" satırını **üzerine yaz** (tek satır, ~250 char). Faz durumunu güncelle, eski fazın task'lerini tablodan **gerçekten temizle** (HTML comment'e sarma, "Önceki:" prefix yasak). Yeni faza geçildiyse Son Task Özetleri sıfırlanır. Aktif Faz ve Adım alanlarını sıradaki adıma göre güncelle:
  - Düzeltme task'ları oluşturulduysa → Aktif Faz aynı kalır, Adım = `task`
  - Sonraki faza geçiliyorsa (normal faz veya teknik borç → senaryo testi) → Aktif Faz = N+1 (= mevcut max + 1; adı Sıradaki Fazlar'ın ilk maddesinden, geçici), Adım = `discuss`. **Yeni fazı PHASES.md Faz Durumu tablosuna EKLEME ve Sıradaki Fazlar'dan çıkarma — bunu discuss-phase yapar (tek promosyon noktası).**
  - Versiyon sonu fazları tamamlandıysa (Versiyon Sonu Durumu = `prd_review_bekliyor`) → Aktif Faz ve Adım alanlarını boşalt (faz döngüsü dışına çıkılıyor)
  - Proje tamamlandıysa → Aktif Faz ve Adım alanlarını boşalt
- **MODULE-MAP.md:** Bu fazda tamamlanan feature'ların Durum sütununu ✅ olarak güncelle. Bir feature'ın tüm kabul kriterleri karşılanmış ve UAT'tan geçmişse ✅ yapılır. Feature kısmen tamamlandıysa (bazı task'ları sonraki fazlara kaldıysa) 🟡 olarak işaretle.
- **docs/DECISIONS.md:** Fazda alınan önemli kararları ekle (append-only — eski kararlar silinmez; bir karar geçersizleştiyse yenisi eklenir ve eski "Superseded by ..." notuyla işaretlenir).
- **MEMORY:** Retrospektiften çıkan çapraz öğrenimleri memory'ye ekle — her biri için `_dev/memory/<slug>.md` oluştur/güncelle ve `_dev/MEMORY.md` index'ine pointer ekle. Her review'da güncelleme zorunlu değil.
  - **Yazılır:** Tek faza/tek task'a ait olmayan, proje genelinde geçerli öğrenimler (kullanıcı tercihleri, ortam kuralları, kalıcı tuzak özetleri vb.)
  - **Yazılır (süreç disiplini):** Triyajda "bu projeye özgü" çıkan tekrar eden iş-akışı kuralları → memory'nin "Süreç Disiplinleri" kategorisi (kanca uygulama anını belli etsin). DevFlow-genel olanlar buraya değil, faz retrosunun "DevFlow'a Öneri" bölümüne gider.
  - **Yazılmaz:** Task icrasına özgü teknik nüanslar (araç davranışı, framework bug'ı vb.) — bu fazın retrospektifindeki "Task-Spesifik Teknik Öğrenimler" alt bölümüne yazılır.
  - Detay: CLAUDE.md → Doküman Disiplini → Bilginin Doğru Evi.
- **Archive kontrolü:** Tüm tamamlanan task'lar archive'da mı?

> Doküman Disiplini tam metni: CLAUDE.md → Doküman Disiplini.

### 7. Eksik/Sorun Tespiti

Eğer review sırasında eksik veya sorunlu bir şey tespit edildiyse:
- Sorunu açıkla
- Düzeltme task'ı öner (kullanıcı onaylarsa oluştur)
- Ciddi sorunlarda faz tamamlanmamış sayılabilir

### 8. Git Commit & Push

Tüm doküman değişikliklerini commit & push yap:
```
docs(phase-N): review — retrospective and quality control completed
```

### 9. Sıradaki Adımı Öner

**Düzeltme task'ları oluşturulduysa (faz tamamlanmadı):**
```
⚠️ Review'da sorun tespit edildi. X düzeltme task'ı oluşturuldu.
   Faz henüz tamamlanmadı.
📋 Sıradaki adım: /devflow:run-task
   → Düzeltme task'larını tamamla, sonra /devflow:verify-phase N ve /devflow:review-phase N tekrar çalıştır.
```

**Versiyon sonu kontrolü (Aktif Versiyon varsa):**
DURUM.md'deki Versiyon Sonu Durumu'nu kontrol et.

> **Otorite notu:** review-phase, Versiyon Sonu Durumu geçişlerinin birincil otoritesidir (`teknik_borç` → `senaryo_testi`, `senaryo_testi` → `prd_review_bekliyor`). Geçişi burada yap ve doğru sıradaki komutu öner. discuss-phase aynı geçişleri güvenlik ağı olarak tekrar kontrol eder (crash/atlanma durumunu yakalar).

> **Not:** Versiyon Sonu Durumu `teknik_borç` iken review edilen faz, tanım gereği teknik borç fazıdır. Aynı şekilde `senaryo_testi` iken review edilen faz, senaryo testi fazıdır. Bu ilişki state machine'in doğal sonucudur — ayrı bir etiket gerekmez.

Eğer `teknik_borç` ve bu faz teknik borç fazıysa:
- Versiyon Sonu Durumu'nu `senaryo_testi` olarak güncelle
- discuss-phase öner (senaryo testi fazına otomatik geçiş orada yapılacak):
```
✅ Faz N (Teknik Borç) review tamamlandı. Senaryo testi fazına geçiliyor.
📋 Sıradaki adım: /devflow:discuss-phase (N+1)
   → Senaryo testi fazının kapsam tartışması için yeni bir oturum başlat.
```

Eğer `senaryo_testi` ve bu faz senaryo testi fazıysa:
- Versiyon Sonu Durumu'nu `prd_review_bekliyor` olarak güncelle
- prd-review öner:
```
✅ Faz N (Senaryo Testi) review tamamlandı. Versiyon sonu fazları tamamlandı!
📋 Sıradaki adım: /devflow:prd-review
   → Versiyon değerlendirmesi için yeni bir oturum başlat.
```

**Sonraki faz varsa (faz tamamlandı):**
```
✅ Faz N review tamamlandı. Retrospektif ve kalite kontrol faz dokümanına yazıldı.
📋 Sıradaki adım: /devflow:discuss-phase (N+1)
   → Sonraki fazın kapsam tartışması için yeni bir oturum başlat.
```

**Son fazsa (proje tamamlandıysa):**
```
✅ Faz N review tamamlandı. Tüm fazlar başarıyla tamamlandı!
🎉 Proje tamamlandı. Tebrikler!
```

---

## Önemli Kurallar

- Review sırasında kod değiştirme — sadece değerlendir ve raporla
- Kalite eksenlerini atlama — her birini sistematik kontrol et
- Retrospektif dürüst olmalı — sadece olumlu değil, sorunları da yaz
- Önceki fazın retrospektifindeki önerilerin bu fazda uygulanıp uygulanmadığını kontrol et
