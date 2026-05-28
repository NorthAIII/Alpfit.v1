# DevFlow — Proje Durumu (Progress)

Bu komut projenin genel durumunu görmek için kullanılır.

**Kullanım:** `/devflow:progress`

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu dosyalar aşağıda tekrarlanmaz.

### Komuta Özgü Ek Dosyalar

**Zorunlu (hepsini oku)**
1. `_dev/PHASES.md`
2. `_dev/MODULE-MAP.md`
3. Aktif faz dokümanı (`_dev/phases/PHASE-N.md` — DURUM.md'deki faz numarasından bul)

---

## Yapılacaklar

Kullanıcıya kısa ve net bir durum raporu sun:

```
📊 Proje Durumu

🔹 Aktif Versiyon: [vX.X] (DURUM.md'den, yoksa "Versiyon tanımı yok")

🔹 Aktif Faz: Faz N — [ad]
   Milestone: [milestone açıklaması]
   Adım: [discuss / research / plan / verify-plan / task / verify / review]

🔹 Task İlerlemesi: X/Y tamamlandı
   ✅ Tamamlanan: [liste]
   🔄 Aktif: [aktif task]
   ⬜ Bekleyen: [liste]

🔹 Feature İlerlemesi: X/Y tamamlandı (MODULE-MAP'ten)
   ✅ Tamamlanan: [liste]
   🟡 Kısmen: [liste]
   🔄 Devam eden: [liste]
   ⬜ Bekleyen: [liste]

🔹 Faz Özeti: (PHASES.md → Faz Durumu = girilmiş fazlar)
   Faz 1: ✅ Tamamlandı
   Faz 2: 🔄 Devam ediyor
   Sıradaki (numarasız): [konu], [konu]   ← PHASES.md → Sıradaki Fazlar; numara faza girince atanır

📋 Sıradaki adım: /devflow:[ilgili komut]
```

---

## Önemli Kurallar

- Kısa ve öz tut — detay için ilgili dokümanları oku
- Sıradaki adımı mutlaka öner
