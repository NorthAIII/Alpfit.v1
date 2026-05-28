# TASKS SİSTEMİ — Kullanım Kılavuzu

**Amaç:** Task bazlı çalışma sistemi kuralları ve protokolü

---

## Task Sistemi Nedir?

Proje işleri küçük, bağımsız, otonom task'lara bölünür. Her task kendi dokümanında planlanır, çalıştırılır ve kayıt altına alınır.

**Avantajları:**
- Otonom çalışma: Task başlar, testler dahil tamamlanır, commit atılır
- Context izolasyonu: Sadece ilgili task ve dokümanlar okunur
- Temiz arşiv: Tamamlanan task → archive
- İzlenebilirlik: Her değişiklik kayıtlı

---

## Klasör Yapısı

```
_dev/tasks/
├── TASKS-README.md      ← Bu dosya (kurallar)
├── TASK-X.YY.md         ← Aktif/bekleyen task'lar (X=faz, YY=sıra)
├── quick/               ← Ad-hoc task kayıtları
└── archive/             ← Tamamlanan task'lar
```

Güncel task listesi ve aktif task bilgisi için: `DURUM.md`

---

## Task Numaralama

Format: `TASK-X.YY` — X = faz numarası, YY = task sırası

- Faz 1 task'leri: TASK-1.01, TASK-1.02, TASK-1.03...
- Faz 2 task'leri: TASK-2.01, TASK-2.02, TASK-2.03...
- Her faz değiştiğinde numara sıfırlanır

---

## Task Boyutu Felsefesi

**Task dokümanı detaylı, iş paketi küçük.**

Az context = yüksek kalite. Her task oturumunda mümkün olduğunca az dosya okunmalı ve dar bir alana odaklanılmalı.

Her task şu kriterlere uymalıdır:
- Tek bir feature'ın tek bir somut parçasını yapar
- 1-3 dosya değişikliği ile tamamlanabilir
- Baştan sona durmadan, tek oturumda bitirilir
- "Önce şunu sonra bunu yap" diye ikiye bölünebiliyorsa → bölünmeli
- Task sayısının fazla olması sorun değil — önemli olan her task'ın küçük ve odaklı olması

Yan yana yapılması gereken işler (birbirine bağımlı küçük değişiklikler) aynı task'te olabilir, ama bölünmesi mümkün olan işler ayrı task'lere konulmalı.

---

## Lineer Çalıştırma Kuralı

Task'lar her zaman sırayla çalıştırılır. Paralel task çalıştırma yoktur. Her task bir öncekinin tamamlanmasını bekler:
- Task sıralaması mantıksal yapım sırasına göre belirlenmeli
- Bağımlılık sırası: Bir task bir öncekinin çıktısını gerektiriyorsa, önceki ilk gelir
- DURUM.md'deki task tablosunda sıra numarası = çalıştırma sırası

---

## Oturum Disiplini

**Her task oturumunda sadece 1 task.** Task tamamlanınca oturum kapanır, ikinci task'e geçilmez.

**Planlama oturumunda task çalıştırılmaz.** Planlama biter, oturum kapanır.

---

## Çalışma Protokolü

### Task Başlatma

1. DURUM.md'den aktif task'ı öğren
2. Bu dosyayı (TASKS-README) oku
3. Aktif task dokümanını oku
4. Task'ın "Referans Dokümanlar" bölümündeki dokümanları oku
5. INDEX.md'den göreve göre ek dokümanları oku

### Task Çalıştırma

Task alınır ve durmadan tamamlanır:
1. Alt görevleri sırayla yap
2. Her alt görevde ilgili testleri çalıştır
3. Tüm alt görevler bitince son test kontrolü
4. Dokümanları güncelle (task dokümanı, DURUM.md, faz dokümanı)
5. Git commit & push (kod + doküman tek commit'te)

**Durma koşulları** (sadece bunlarda dur, kullanıcıya sor):
- **Teknik belirsizlik:** Birden fazla geçerli yaklaşım var
- **Kapsam belirsizliği:** Task'ın sınırları net değil
- **Bağımlılık sorunu:** Gerekli bir şey hazır değil
- **Risk:** Mevcut çalışan kodu bozma olasılığı
- **Karar gereksinimi:** Tasarım/mimari/iş kuralı kararı

Bunlar dışında durma. Yanlış yapmaktansa sormaktan çekinme. Riskli komutlar çalıştırmaktan kaçın.

### Task Tamamlama

Her task bittiğinde sırasıyla (bu sıra ATLANMAZ):
1. **Test:** Testleri çalıştır (yoksa yaz ve çalıştır)
2. **Task Dokümanı:** Oturum kaydı ekle, durumu ✅ yap, sonuç özetini doldur
3. **DURUM.md ve Faz Dokümanı:** Aktif task pointer güncelle, task özeti ekle (son 2 task, eski özetleri sil). Faz dokümanındaki task tablosunda durumu güncelle.
4. **Archive:** Task dokümanını `tasks/archive/` klasörüne taşı
5. **Commit & Push:** Tüm değişiklikleri (kod + doküman) tek commit'te gönder
6. **Oturum Kapanır** — İkinci task'e geçilmez

---

## Durum Kodları

- ⬜ **Bekliyor:** Henüz başlanmadı
- 🔄 **Devam ediyor:** Üzerinde çalışılıyor
- ⏸️ **Duraklatıldı:** Pause ile durdurulmuş
- ✅ **Tamamlandı:** Kod yazıldı, test edildi, commit atıldı
- 🔴 **Bloke:** Bağımlılık sebebiyle bekliyor
- ❌ **İptal:** İptal edilmiş task

---

## Commit Convention

**Faz task'ları (scope ile):**
```
feat(TASK-X.YY): kısa açıklama          # Yeni özellik
fix(TASK-X.YY): kısa açıklama           # Bug fix
refactor(TASK-X.YY): kısa açıklama      # Refactor
docs(TASK-X.YY): kısa açıklama          # Doküman değişikliği
test(TASK-X.YY): kısa açıklama          # Test ekleme/düzeltme
chore(TASK-X.YY): kısa açıklama         # Build, config vb.
```

**Quick mode task'ları (scope'suz):**
```
fix: kısa açıklama                      # Bug fix (quick mode)
feat: kısa açıklama                     # Küçük feature (quick mode)
chore: kısa açıklama                    # Config vb. (quick mode)
```

Kurallar:
- Type prefix zorunlu
- Faz task'larında scope olarak task numarası yazılır
- Quick mode'da scope yazılmaz
- Açıklama İngilizce, küçük harfle başlar, nokta ile bitmez

---

## Quick Task'lar

Faz döngüsü dışı tüm ad-hoc işler (bug fix, küçük feature, config değişikliği, acil düzeltme) `/devflow:quick` komutuyla yapılır ve `_dev/tasks/quick/` klasöründe izlenir. Quick task'larda commit scope'u yoktur, sadece type prefix kullanılır. Quick task'lar archive'a taşınmaz, `quick/` içinde kalır.

---

## Sorun Giderme

**Task çok büyük oldu, bitiremiyorum:**
→ `/devflow:pause` ile durdur. Handoff bilgisi yaz. Sonraki oturumda `/devflow:resume` ile devam et.

**Task'ın kapsamı belirsiz:**
→ Dur, kullanıcıya sor. Varsayımda bulunma.

**Mevcut kodu kırdım:**
→ Önce `git stash` ile değişiklikleri kaydet ve sorunu tespit et. Son çare olarak `git checkout -- .` kullanılabilir ama tüm uncommitted değişiklikleri geri dönüşsüz siler — dikkatli ol. Kullanıcıya bildir.

**Bağımlılık eksik (API hazır değil, paket yüklü değil vb.):**
→ Task'ı bloke olarak işaretle (🔴). Kullanıcıya bildir.

---

## Özet Kurallar

1. **Task = Detaylı, DURUM = Kısa** — Tüm detaylar task dokümanında, DURUM'da özet
2. **Tek task odağı** — Bir oturumda tek task, ikinciye geçilmez
3. **Test zorunlu** — Her task'ın tamamlanma kriteri teste bağlı
4. **Commit zorunlu** — Her task sonunda git commit & push
5. **Archive** — Tamamlanan task `tasks/archive/` klasörüne taşınır
6. **Küçük task'lar** — Büyük iş? Böl. Task sayısı sorun değil, iş paketi küçük olsun.
7. **DURUM.md temiz** — Sadece aktif fazın task'leri ve son 2 task özeti tutulur

---

**Son Güncelleme:** [Tarih]
