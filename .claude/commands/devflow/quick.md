# DevFlow — Hızlı İş (Quick Mode)

Bu komut faz döngüsü dışında tüm ad-hoc task'lar için kullanılır. Bug fix, küçük feature, config değişikliği, acil düzeltme gibi işleri DevFlow garantileriyle (commit, izleme) ama faz ağırlığı olmadan yapar. Task dışı her iş bu komutla yapılır.

**Kullanım:** `/devflow:quick` — Kullanıcıdan ne yapılacağını sor

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Quick mode için protokol dışında ek zorunlu dosya yoktur — istenen işe göre göreve-göre dosyalar okunur.

---

## Yapılacaklar

### 1. Kullanıcıdan İşi Al

Kullanıcıya ne yapmak istediğini sor. Kısa ve net bir açıklama yeterli.

### 2. İşi Yap

- Kodu yaz
- Gerekirse test et
- Kullanıcı oturum içinde ek iş eklerse aynı akışta devam et — yeni QUICK dosyası açma, mevcut iş kapsamını genişlet

### 3. Quick Task Kaydı Oluştur (Oturum Sonunda)

Kullanıcı oturum sonu sinyali verince (örn. "tamam", "kapat", "commit at"; veya `/devflow:pause` / `/devflow:double-check` çağrısı), `_dev/tasks/quick/` klasöründe oturumda yapılan tüm işi tek dosyada kaydet:

**Dosya adı:** `QUICK-NNN-[konu].md` (NNN = sıralı numara, klasördeki son numaradan devam eder; [konu] = işin kısa, dosya sistemi-güvenli özeti — kebab-case, ASCII karakterli. Örnek: `QUICK-007-login-yonlendirme-hatasi.md`)

```markdown
# QUICK-NNN: [Kısa açıklama]

**Tarih:** [tarih]
**Durum:** ✅ Tamamlandı / 🔄 Devam edecek / ⏸️ Duraklatıldı

## Ne Yapılacak
[Kullanıcının açıklaması — oturumda eklenen ek iş varsa onu da kapsa]

## Yapılanlar
- [yapılan 1]
- [yapılan 2]

## Değişen Dosyalar
- [dosya 1]
- [dosya 2]

## Not
[varsa ek not]
```

### 4. DURUM.md Güncelle

DURUM.md'de aktif faz bilgisini bozmadan, quick task'ı not et (son task özetleri bölümünde kısaca).

### 5. Git Commit & Push

Tüm değişiklikleri (kod + doküman) tek commit'te gönder.

**Commit formatı (scope'suz — quick mode):**
```
fix: kısa açıklama
feat: kısa açıklama
chore: kısa açıklama
refactor: kısa açıklama
```

---

## Önemli Kurallar

- Aynı oturumda yeni QUICK dosyası açma. Kullanıcı ek iş eklerse mevcut iş kapsamını genişlet — oturum sonunda tek bir QUICK dosyası tüm yapılanları kapsar (1 oturum = 1 QUICK dosya)
- Quick mode'da faz dokümanları oluşturulmaz/güncellenmez
- Quick task'lar archive'a taşınmaz — `_dev/tasks/quick/` içinde kalır
- İş başlangıçta quick gibi görünüp faz boyutunda bir kapsama doğru büyüyorsa → kullanıcıyı uyar, faz döngüsüne taşımayı öner
- Eğer quick task bir feature'ın davranışını değiştiriyorsa (yeni davranış kuralı, kapsam değişikliği), kullanıcıyı uyar: "Bu değişiklik feature davranışını etkiliyor. `/devflow:prd-note` ile kaydetmeni öneririm, böylece PRD ve MODULE dokümanları versiyon sonunda güncellenebilir."
