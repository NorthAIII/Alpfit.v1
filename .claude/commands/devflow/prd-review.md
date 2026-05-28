# DevFlow — Versiyon Sonrası PRD Değerlendirmesi (PRD Review)

Bu komut bir versiyonu tamamladıktan (veya erken sonlandırdıktan) sonra, edinilen deneyimle PRD'yi yeniden değerlendirmek için kullanılır. Her versiyon geçişinde zorunlu olarak çalıştırılır. Tekrarlanabilirdir.

**Kullanım:** `/devflow:prd-review`

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu dosyalar aşağıda tekrarlanmaz.

### Komuta Özgü Ek Dosyalar

**Zorunlu (hepsini oku)**
1. `_dev/PRD/SESSION-NOTES.md` — PRD çalışma durumu notları
2. `_dev/PRD/NOTES.md` — Versiyon boyunca biriken notlar (varsa)
3. `_dev/PRD/VERSIONS.md` — Versiyon tanımları ve feature haritası
4. `_dev/PHASES.md` — Tamamlanan fazlar
5. `_dev/ILKELER.md` — Proje ilkeleri (deneyimle yeniden değerlendirilir; güncellemeye açık)

**Göreve Göre (değerlendirme sırasında oku)**
- Esnek içerik dosyaları → `_dev/PRD/` altındaki tüm `.md` dosyaları
- Feature dosyaları → `_dev/PRD/features/` altındaki dokümanlar
- Versiyon detay dosyaları → `_dev/PRD/versions/` (varsa)

---

## Ne Zaman Kullanılır

- Versiyon sonu sabit fazları (teknik borç + senaryo testi) tamamlandıktan sonra → **zorunlu**
- Erken versiyon sonlandırma durumunda → yarım kalan tasklar arşivlendikten sonra doğrudan çalıştırılır
- Tek oturumda bitmezse → `/devflow:prd-save` ile kaydedilip tekrar çalıştırılır

---

## Yapılacaklar

### 1. Durum Değerlendirmesi

Tamamlanan versiyonu değerlendir:
- Ne planlanmıştı vs ne tamamlandı
- Geliştirme sürecinde ne öğrenildi
- NOTES.md'deki biriken notları ele al — hepsini gözden geçir

Kullanıcıya durum tespiti sun ve sor: "Herhangi bir değişiklik veya eklemek istediğin bir şey var mı?"

### 1b. Statik Doküman Mutabakatını Öner

Versiyon boyunca statik dokümanlara (OVERVIEW, projeye-özgü sabitler) rutin işte dokunulmadı — bu yüzden sessizce gerçeklikten kopmuş olabilirler. Versiyon sonu, bunun doğal kontrol noktasıdır.

Kullanıcıya **`/devflow:audit-docs` çalıştırmasını öner** (statik gerçeklik mutabakatı + versiyon boyunca birikmiş drift). audit artık artımlı (rolling/canvas) çalışır — sürekli ilerleme için `/loop /devflow:audit-docs` formunu hatırlat, raporla+onayla disiplini değişmedi. Bu oturumda inline yapma — audit fresh oturumlarda daha sağlıklı çalışır (cold-start avantajı). Sıradaki adım önerisine ek olarak hatırlat.

### 2a. Değişiklik Varsa

- Kullanıcının nereleri değiştirmek istediğini anla
- Analist perspektifinden yaklaşarak değişiklikleri sorgula ve yol göster
- Perspektif bazlı sorgulama yaklaşımı kullan (deneyimle yeniden değerlendirme odaklı)
- İlgili PRD dokümanlarını güncelle
- **Proje ilkeleri değiştiyse ILKELER.md'yi güncelle:** Versiyon deneyimi bir ilkeyi yanlış çıkardıysa veya yeni bir öncelik/ufuk netleştiyse ILKELER.md'ye yansıt. Sınırı koru — yön/öncelik burada, vizyon/feature PRD'de
- Gerekirse web araştırması yap
- Ele alınan notları NOTES.md'den **sil** — ilgili bilgi PRD dokümanlarına aktarılmış olur
- SESSION-NOTES.md'yi güncelle (prd.md'deki SESSION-NOTES güncelleme kurallarına göre)

Oturum sonunda sıradaki adımı öner:
```
✅ PRD review tamamlandı. Değişiklikler PRD'ye yansıtıldı.
📋 Sıradaki adım: /devflow:kickoff
   → Değişiklikleri proje yapısına yansıtmak için re-kickoff oturumu başlat.
```

### 2b. Değişiklik Yoksa

- "Baktık, değiştirmedik" kararını SESSION-NOTES.md'ye kayıt altına al
- NOTES.md'deki ele alınan notları **sil**
- SESSION-NOTES.md'yi güncelle (prd.md'deki SESSION-NOTES güncelleme kurallarına göre)
- **DURUM.md'deki Aktif Versiyonu sıradaki versiyona güncelle** (VERSIONS.md'den sıradaki versiyonu belirle). Sıradaki versiyon yoksa Aktif Versiyon alanını boş bırak.
- **DURUM.md'deki Versiyon Sonu Durumu'nu `içerik_fazları` olarak sıfırla**

Sıradaki adımı öner:

**Sıradaki versiyon varsa:**
```
✅ PRD review tamamlandı. Değişiklik yapılmadı — bilinçli karar olarak kaydedildi.
   Aktif versiyon [vX.X]'e güncellendi.
📋 Sıradaki adım: /devflow:discuss-phase
   → Sıradaki versiyonun ilk fazının kapsam tartışması için yeni bir oturum başlat.
      Faz numarası just-in-time atanır (Faz Durumu tablosundaki en büyük faz no + 1); faz önceden numaralanmaz (bkz. PHASES.md → Faz Numaralandırma Kuralı).
```

**Sıradaki versiyon yoksa:**
```
✅ PRD review tamamlandı. Değişiklik yapılmadı — bilinçli karar olarak kaydedildi.
   Tüm planlanan versiyonlar tamamlandı.
📝 Yeni versiyon planlanması beklenecek.
   Hazır olduğunda: /devflow:prd-refine ile yeni versiyon tanımlayıp /devflow:kickoff ile re-kickoff yapılabilir.
```

### 2c. Erken Sonlandırma Sonrası

**Önce arşivleme yap:**
- Commit edilmemiş değişiklikler varsa WIP commit yap: `chore: WIP — early termination at [kısa açıklama]`
- Tamamlanmamış task dosyalarını `_dev/tasks/archive/`'a taşı
- Her tamamlanmamış task dosyasının başına şu notu ekle: "⚠️ Bu task erken sonlandırma nedeniyle tamamlanmadı."
- Faz dokümanına (`_dev/phases/PHASE-N.md`) "Erken Sonlandırma" bölümü ekle: hangi tasklar tamamlandı, hangileri yapılmadı, neden sonlandırıldı
- PHASES.md'deki erken sonlandırılan fazın durumunu `⚠️ Erken sonlandırıldı` olarak güncelle
- MODULE-MAP.md'deki kısmen tamamlanmış feature'ların Durum sütununu `🟡` olarak güncelle
- DURUM.md'deki Versiyon Sonu Durumu'nu `içerik_fazları` olarak sıfırla

**Sonra değerlendirme yap:**
- Tamamlanan fazları ve arşivlenen (tamamlanmamış) taskları gözden geçir
- Neden erken sonlandırıldığını kullanıcıyla tartış
- PRD'yi buna göre güncelle
- Erken sonlandırma bir ilkeyi etkilediyse (yön/öncelik/ufuk yanlış çıktı) ILKELER.md'yi de güncelle — sınırı koru (yön/öncelik burada, vizyon/feature PRD'de)

Sıradaki adım: re-kickoff (Aktif Versiyon ve faz yapısı re-kickoff sırasında güncellenecek)
```
✅ PRD review tamamlandı. Erken sonlandırma sonrası PRD güncellendi.
📋 Sıradaki adım: /devflow:kickoff
   → Re-kickoff ile proje yapısını güncelle.
```

### 3. Git Commit & Push

Tüm doküman değişikliklerini (PRD dokümanları, SESSION-NOTES.md, NOTES.md, DURUM.md) commit & push yap:
```
docs: prd-review — version review completed
```

---

## Önemli Kurallar

- Bu oturum her versiyon geçişinde zorunludur — atlanamaz
- Tekrarlanabilir: tek oturumda bitmezse `/devflow:prd-save` ile kaydet, tekrar çalıştır
- Biriken notlar (NOTES.md) ana girdi — hepsini ele al
- **Konuya araştırarak gel.** SESSION-NOTES vb. notlar hatırlatıcıdır, varsayım kaynağı değil. Tartışacağın konuyu gerçekten anlamak için gerektiğinde grep/find/web araştırması/çapraz doküman okuması yap. Eksik bilgiyle çok konu açmaktansa, az konuyu hazırlanmış olarak getir — net ilerle.
- Değişiklik kararını kullanıcıya bırak, dayatma yapma
- "Değişiklik yok" da bilinçli bir karardır ve kayıt altına alınır
- Ele alınan notlar NOTES.md'den silinir — NOTES.md'de sadece henüz işlenmemiş notlar kalır
- Context dolmadan önce kaydetmeyi öner (`/devflow:prd-save`)
