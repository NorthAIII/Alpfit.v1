# DevFlow — Kaldığı Yerden Devam (Resume)

Bu komut duraklatılmış bir oturumu kaldığı yerden devam ettirmek için kullanılır.

**Kullanım:** `/devflow:resume`

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu dosyalar aşağıda tekrarlanmaz.

> Not: `_dev/DURUM.md`'yi protokol kapsamında okurken duraklatma bilgisi ve aktif durumu tespit et.

### Komuta Özgü Ek Dosyalar

**Duruma Göre (DURUM.md'den belirle)**
- **Task duraklatılmışsa:** `_dev/tasks/TASK-X.YY.md` → oturum kaydındaki handoff bilgisini oku
- **Planlama duraklatılmışsa:** `_dev/phases/PHASE-N.md`
- **Review duraklatılmışsa:** `_dev/phases/PHASE-N.md` + `_dev/QUALITY.md`

---

## Yapılacaklar

### 1. Durumu Anla

DURUM.md'den:
- Hangi faz aktif?
- Hangi adımda duraklatıldı?
- Task oturumuysa: hangi task, ne kaldı?

### 2. Handoff Bilgisini Oku

- Task dokümanındaki son oturum kaydından "Son Yaklaşım" ve "Sonraki Adım Detayı"nı oku
- Veya DURUM.md'deki duraklatma notunu oku

### 3. Kullanıcıya Durumu Özetle

```
📋 Kaldığınız yer:
- Faz: [N]
- Adım: [task çalıştırma / planlama / vb.]
- Detay: [ne kaldı]

Devam ediyorum...
```

### 4. Kaldığı Yerden Devam Et

İlgili komutun (run-task, plan-phase vb.) akışını kaldığı yerden sürdür.

---

## Önemli Kurallar

- Handoff bilgisine güven — tekrar baştan başlama
- Eğer handoff bilgisi yetersizse, kullanıcıya sor
- Şüpheli durumlarda kullanıcıya ne kaldığını doğrula

---

## Beklenmedik Oturum Kesintisi

Oturum `/devflow:pause` ile değil, beklenmedik şekilde kesildiyse (crash, timeout, bağlantı kopması):

1. Yeni oturum aç
2. `/devflow:resume` çalıştır
3. Claude, DURUM.md'den durumu okur
4. Handoff bilgisi yoksa (pause yapılmamışsa), Claude durumu DURUM.md ve task dokümanından çıkarır
5. Task dokümanında oturum kaydı varsa kaldığı yerden devam eder
6. Belirsizlik varsa kullanıcıya sorar
