# DevFlow — Geliştirme Sırasında Not ve Analiz (PRD Note)

Bu komut faz döngüsü sırasında aklına gelen fikirleri, farkındalıkları ve değişiklik önerilerini araştırıp yapılandırılmış şekilde kaydetmek için kullanılır. Ham bir "not yaz" işlemi değil, mini bir analiz oturumudur.

**Kullanım:** `/devflow:prd-note`

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu dosyalar aşağıda tekrarlanmaz.

### Komuta Özgü Ek Dosyalar

**Göreve Göre (konuya bağlı olarak)**
- `_dev/PRD/NOTES.md` — Varsa mevcut notlar (dosya yoksa ilk not kaydedilirken oluşturulur)
- Konuyla ilgili proje dosyaları (mevcut yapıyla ilişki, etki analizi)

---

## Çalıştırma Kuralı

Bu komut **sadece faz döngüsü sırasında** çalıştırılabilir.

**PRD oturumlarında (prd, prd-refine, prd-review) çalıştırılırsa:**
Kullanıcıyı yönlendir: "Şu an zaten PRD oturumundasın, bu konuyu burada konuşabiliriz. Doğrudan PRD dokümanlarını güncelleyelim mi?"

---

## Yapılacaklar

### 1. Fikri Dinle

Kullanıcının fikrini/farkındalığını al. Ne aklına geldi, hangi bağlamda?

### 2. Araştır

Konuyu araştır:
- Gerekirse web araştırması yap (teknoloji, alternatif, best practice)
- Gerekirse proje dosyalarını incele (mevcut yapıyla ilişkisi, etki analizi)

### 3. Tartış

Kullanıcıyla tartış — fikri birlikte olgunlaştır. Hemen kaydetme, önce araştır ve tartış.

### 4. Kaydet

Mutabık kalınan sonucu `_dev/PRD/NOTES.md` dosyasına yapılandırılmış şekilde kaydet:

```markdown
---
### [Konu Başlığı]
**Tarih:** YYYY-MM-DD
**Bağlam:** [Hangi faz/task sırasında, ne yapılırken aklına geldi]
**Tartışma:** [Araştırma sonuçları dahil, fikrin olgunlaşma süreci]
**Sonuç:** [Mutabık kalınan karar veya öneri]
---
```

Dosya yoksa oluştur. Varsa en alta yeni not ekle.

### 5. Git Commit & Push

NOTES.md değişikliğini commit & push yap:
```
docs: prd-note — [konu başlığı]
```

### 6. Özet Sun

Kullanıcıya kayıt özetini sun ve normal faz döngüsüne geri dön.

```
✅ Not kaydedildi: [konu başlığı]
   Bu not versiyon sonu prd-review oturumunda ele alınacak.
   Faz döngüsüne devam edebilirsin.
```

---

## Önemli Kurallar

- Hemen kaydetme — önce araştır, tartış, olgunlaştır
- Not, kullanıcıyla mutabık kalınan sonucu yansıtmalı
- Araştırma sonuçlarını da nota dahil et (ileride referans olacak)
- PRD dokümanlarını değiştirme — sadece NOTES.md'ye yaz
- Versiyon ortasında PRD değişikliği yasak — bu komut tam da bunu yönetmek için var
