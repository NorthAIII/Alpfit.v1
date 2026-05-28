# DevFlow — Kullanıcı Kabul Testi (Verify Phase / UAT)

Bu komut fazdaki tüm task'lar tamamlandıktan sonra, otomatik doğrulama sonuçlarını (CI, otomatik araçlar) inceler ve UAT senaryolarıyla çıktıları kullanıcıyla birlikte test eder.

**Kullanım:** `/devflow:verify-phase [N]` — N = faz numarası (belirtilmezse DURUM.md'den aktif fazı al)

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu dosyalar aşağıda tekrarlanmaz.

### Komuta Özgü Ek Dosyalar

**Zorunlu (hepsini oku)**
1. `_dev/MODULE-MAP.md` — feature-faz matrisi, versiyon bilgisi
2. Aktif faz dokümanı (`_dev/phases/PHASE-N.md`) — milestone, kapsam tartışması, feature listesi

**Göreve Göre (test senaryoları çıkarırken oku)**
- Bu fazın task dokümanları → faz dokümanındaki task listesinden task numaralarını al, `_dev/tasks/` ve `_dev/tasks/archive/` klasörlerinde `TASK-N.*` dosyalarını oku
- Fazın modül dokümanları → MODULE-MAP.md'den bu fazın feature'larına bak, ilgili `_dev/modules/MX-*.md` dosyalarını oku (kabul kriterleri ve edge case'ler için)

---

## Yapılacaklar

### 1. Otomatik Kontroller

Bu fazda yapılan değişiklikler için otomatik doğrulamaları çalıştır ve sonuçlarını incele — bazıları zaten çalışmıştır (CI, bot'lar), security-review'ı sen çalıştırırsın:

**a) CI/CD workflow sonuçları:**
Bu fazda push edilen commit'lerde çalışan CI/CD workflow'larının durumunu kontrol et. Projenin kullandığı git provider ve toolchain'e göre uygun aracı (CLI, API, web UI) belirleyip sonuçlara eriş. Başarısız olanların log'larını incele, kök nedeni anla.

**b) Otomatik analiz araçları:**
Projede çalışan otomatik araçların (bağımlılık tarayıcı, security scanner, code quality bot vb.) çıktılarını gözden geçir. Uyarı, öneri veya açılmış PR varsa not al. Projede hangi araç kullanılıyorsa onu tespit et ve sonuçlarına bak.

**c) Security-review:**
Bu fazda yapılan değişiklikleri `/security-review` skill'i ile gözden geçir — güvenlik açıkları, exposed secret'lar, injection riskleri, auth/yetkilendirme sorunları açısından. Bu sistem-seviyesi bir bakış: tek başına güvenli görünen task değişiklikleri faz boyunca birikip etkileşime girince açık yaratabilir.

**d) Bulguları kaydet:**
Tespit ettiğin tüm bulguları (CI failure, bot önerisi, security-review bulgusu) not al. Bu bulgular Adım 7'de (Düzeltme Task'ları) manuel test bulgularıyla birlikte değerlendirilecek.

**Önemli:** Projede CI/automated tool yoksa kullanıcıya kısaca bildir ve adımı atla. Ama araştırma yapmadan "tool yok" diye geçme — projede gerçekten yoksa atla, varsa kontrol et. Read-only kontroller için kullanıcıya tek tek onay sorma, doğrudan çalıştır.

CI ciddi düzeyde başarısız olsa bile UAT'ye devam edilir; CI fix'i Adım 7'deki düzeltme task'ı setine dahil edilir.

### 2. Test Senaryolarını Çıkar

Şu kaynaklardan test senaryoları oluştur:

**a) Milestone kriterlerinden:**
Milestone'daki her kriter = en az bir test senaryosu

**b) Kapsam tartışmasındaki kararlardan:**
Kullanıcının aldığı her karar doğrulanabilir bir senaryoya dönüşür

**c) Feature kabul kriterlerinden:**
MODULE-MAP veya modül dokümanlarındaki kabul kriterleri

**d) Edge case'lerden:**
Task dokümanlarında belirtilen edge case'ler

**e) Adversarial senaryolardan:**
Bu fazda yaptıklarımızı kırmaya çalışan senaryolar. Faz bazlı bakış: "Bu fazda yaptıklarımızı kırmaya çalışsam ne olur?" Beklenmeyen girdiler, yetki dışı erişim denemeleri, hata durumları ve kurtarma, sınır değerleri. Checklist değil — fazın doğasına göre hangi adversarial senaryolar öne çıkıyorsa onları düşün.

### 3. Senaryoları Faz Dokümanına Yaz

Test senaryolarını hemen faz dokümanına (`_dev/phases/PHASE-N.md`) yaz — sonuçlar henüz boş, sadece senaryo listesi:

```markdown
## UAT Senaryoları

| # | Senaryo | Sonuç | Not |
|---|---------|-------|-----|
| 1 | [Senaryo 1] | ⬜ | — |
| 2 | [Senaryo 2] | ⬜ | — |
| ... | ... | ... | ... |
```

Bu erken yazım, context dolması gibi olağan dışı durumlarda senaryoların kaybolmasını önler.

### 4. Test Modunu Sor

Senaryoları kullanıcıya göster ve test modunu sor:

```
📋 Bu faz için X test senaryosu hazırladım ve faz dokümanına yazdım.

Nasıl ilerleyelim?
  a) Manuel test — ben tek tek yönlendiririm, sen test edersin
  b) Otonom test — ben yapabildiğim testleri otonom çalıştırırım (kod, Playwright, API vb.),
     yapamadıklarım için sana sorarım
```

Kullanıcının tercihine göre Adım 5a veya 5b ile devam et.

### 5a. Manuel Test

Her senaryo için:

1. Kullanıcıya ne test edeceğini açıkla:
   ```
   🧪 Test 1/X: [Senaryo adı]
   Şunu dene: [Kullanıcının yapması gereken somut adımlar]
   Beklenen sonuç: [Ne olması gerekiyor]
   ```

2. Kullanıcıdan sonuç bekle:
   - **Geçti** → bir sonraki senaryoya geç
   - **Kaldı** → sorunu detaylı sor, analiz et
   - **Kısmen** → çalışan ve çalışmayan kısımları ayır

3. Başarısız senaryolar için:
   - Sorunu analiz et (kullanıcıdan detay al)
   - Kök nedeni tespit etmeye çalış
   - Başarısız senaryoyu ve analizi not al (düzeltme task'ı Adım 7'de oluşturulacak)

### 5b. Otonom Test

Her senaryoyu otonom olarak çalıştırmaya çalış:

**Yapılabilecek testler (doğrudan çalıştır):**
- Kod çalıştırma (unit test, integration test, script)
- Playwright / browser otomasyon testleri
- API çağrıları (curl, fetch)
- CLI komutları ve çıktı doğrulama
- Dosya/veritabanı durumu kontrolü

**Yapılamayan testler (kullanıcıya sor):**
- Görsel doğrulama gerektiren (UI'ın "doğru görünüyor mu?")
- Fiziksel cihaz gerektiren
- Üçüncü parti servis/hesap gerektiren (kullanıcı credential'ları)
- Subjektif değerlendirme gerektiren (UX, kullanılabilirlik)

**Akış:**
1. Her senaryoyu sırayla al
2. Otonom çalıştırılabiliyorsa çalıştır, sonucu kaydet
3. Otonom çalıştırılamıyorsa kullanıcıya sor: ne yapması gerektiğini açıkla, sonucu al
4. Başarısız senaryolar için kök neden analizi yap ve not al (düzeltme task'ı Adım 7'de oluşturulacak)

Her test sonucunu kullanıcıya bildir:
```
🧪 Test 1/X: [Senaryo adı] — ✅ Geçti (otonom)
🧪 Test 2/X: [Senaryo adı] — ❌ Kaldı (otonom) — [kısa hata açıklaması]
🧪 Test 3/X: [Senaryo adı] — 🔍 Manuel gerekli: [kullanıcıya ne yapacağını söyle]
```

### 6. Sonuçları Faz Dokümanına Güncelle

Adım 3'te yazılan senaryo tablosunu sonuçlarla güncelle:

```markdown
## UAT Sonuçları

**Tarih:** [tarih]
**Toplam Senaryo:** X
**Geçen:** Y
**Kalan:** Z

| # | Senaryo | Sonuç | Not |
|---|---------|-------|-----|
| 1 | [Senaryo 1] | ✅ Geçti | — |
| 2 | [Senaryo 2] | ❌ Kaldı | [Sorun açıklaması] → TASK-X.YY |
| 3 | [Senaryo 3] | ✅ Geçti | — |
| ... | ... | ... | ... |
```

Ayrıca Adım 1'de bulunan otomatik kontrol bulgularını da kayda al (kısa özetle, hangi düzeltme task'ına gittiğine işaret et).

### 7. Düzeltme Task'ları (Varsa)

İki kaynaktan gelen bulgular için düzeltme task'ları oluştur:
- **Adım 1**'de tespit edilen otomatik kontrol bulguları (CI failure'ları, bot önerileri, security-review bulguları vb.)
- **Adım 6**'daki başarısız UAT senaryoları

**Önce oku:** `.claude/commands/devflow/templates/TASK.md`

- Task dokümanını template'e uygun yaz
- Sorunun detaylı açıklamasını ekle (otomatik bulgu mu, UAT failure mı belirt)
- Beklenen davranışı yaz
- Faz dokümanındaki task listesine ekle

### 8. DURUM.md Güncelle

- UAT ve otomatik kontrol sonuçlarını kısa özetle
- Düzeltme task'ları varsa aktif task olarak işaretle, **Adım** alanını `task` olarak güncelle
- Tüm kontroller geçtiyse **Adım** alanını `review` olarak güncelle

### 9. Git Commit & Push

Tüm doküman değişikliklerini commit & push yap:
```
docs(phase-N): UAT — user acceptance testing completed
```

### 10. Sıradaki Adımı Öner

**Tüm kontroller geçtiyse:**
```
✅ Verify-phase tamamlandı. Otomatik kontroller ve UAT'den geçildi.
📋 Sıradaki adım: /devflow:review-phase N
   → Faz review ve retrospektif için yeni bir oturum başlat.
```

**Düzeltme task'ları varsa:**
```
⚠️ Verify-phase tamamlandı. Otomatik kontroller ve UAT'den X bulgu — Y düzeltme task'ı oluşturuldu.
📋 Sıradaki adım: /devflow:run-task
   → Düzeltme task'larını çalıştırmak için yeni bir oturum başlat.
   → Düzeltmeler tamamlandıktan sonra **/devflow:verify-phase N yeniden çalıştırılır** — bütün kontroller (otomatik + UAT) baştan yapılır.
```

---

## Önemli Kurallar

- Önce tüm test senaryolarını listele, sonra TEK TEK test et — kullanıcıya hepsini birden yaptırma
- Her senaryoda somut, uygulanabilir adımlar yaz
- Kullanıcı bir test için "çalışmıyor" derse, sorunu detaylı sor
- Düzeltme task'ları küçük ve odaklı olmalı
- Bu oturumda kod düzeltme yapılmaz — sadece test ve düzeltme task'ı oluşturma
- **Düzeltme task'ları tamamlandıktan sonra verify-phase yeniden çalıştırılır** — bütün kontroller (otomatik + UAT) baştan yapılır, sadece daha önce başarısız olanları değil
- Otonom test modunda: yapabildiğini yap, yapamadığını kullanıcıya sor — varsayımda bulunma
- Otonom test modunda: her testin sonucunu kullanıcıya bildir, sessizce geçme
