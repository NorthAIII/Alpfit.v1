# DevFlow — Oturumu Durdur (Pause)

Bu komut bir oturumu düzgünce durdurmak ve sonraki oturumda kaldığı yerden devam edebilmek için handoff bilgisi yazmak amacıyla kullanılır.

**Kullanım:** `/devflow:pause`

---

## Yapılacaklar

### 1. Aktif Çalışmayı Tespit Et

DURUM.md'den aktif durumu oku:
- Hangi faz aktif?
- Hangi adımdayız? (discuss, research, plan, verify-plan, task, verify, review)
- Aktif task var mı?

### 2. Handoff Bilgisi Yaz

**Task oturumundaysa** → Task dokümanına zengin oturum kaydı yaz:

```markdown
### Oturum [tarih] — DURAKLATILDI

**Durum:** ⏸️ Duraklatıldı

**Yapılanlar:**
- [yapılan 1]
- [yapılan 2]

**Kalan İşler:**
- [kalan 1]
- [kalan 2]

**Son Yaklaşım:**
[Şu anda hangi yaklaşımla ilerliyordum, son düşüncelerim, nerede kaldım]

**Belirsizlikler:**
- [belirsizlik 1 — çözülmedi]

**Sonraki Adım Detayı:**
[Devam edildiğinde tam olarak ne yapılacak, hangi dosyadan, hangi satırdan devam]
```

**Planlama/review gibi bir oturumdaysa** → DURUM.md'ye kısa not ekle:
```
⏸️ Duraklatma: [tarih] — [hangi adımda, nerede kalındı, ne yapılacak]
```

### 3. Varsa Commit & Push

Eğer kaydetilmemiş değişiklik varsa:
```
chore: WIP — pause at [kısa açıklama]
```

### 4. DURUM.md Güncelle

Aktif duruma duraklatma bilgisi ekle.

### 5. Kullanıcıya Bilgi Ver

```
⏸️ Oturum duraklatıldı. Handoff bilgisi yazıldı.
📋 Devam etmek için: /devflow:resume
```

---

## Önemli Kurallar

- Handoff bilgisi detaylı olmalı — sonraki oturum bu bilgiyle başlayacak
- "Son yaklaşım" ve "sonraki adım detayı" en kritik alanlar
- Varsa ara commit at — yarım değişiklik bırakma
