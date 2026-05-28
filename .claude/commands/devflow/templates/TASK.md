# TASK-[X.YY]: [Task Adı]

**Durum:** ⬜ Bekliyor / 🔄 Devam ediyor / ✅ Tamamlandı
**Modül:** [Modül adı] (modules/MX-Ad.md referansı)
**Feature:** [Feature adı]
**Faz:** Phase [X] (phases/PHASE-X.md)
**Bağımlılıklar:** TASK-[X.YY] ✅ / Yok

---

## Hedef

[2-3 cümle: Bu task neyi başarmaya çalışıyor? Teknik olarak ne yapılacak? Ne zaman tamamlanmış sayılır?]

---

## Bağlam

<!-- OPSİYONEL: Bu bölüm sadece task'ın "neden"i açık değilse doldurulur. Basit task'lerde Hedef yeterliyse bu bölümü sil. Karmaşık kararların sonucu olan, mimari değişiklik içeren veya geçmişi bilmeden anlaşılamayacak task'lerde doldur. -->

[Neden bu task gerekli? Kapsam tartışmasından veya araştırmadan gelen ilgili kararlar ve dikkat noktaları.]

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/MX-[AD].md` — [Neden okunmalı]
- `_dev/docs/[DOKUMAN].md` — [Neden okunmalı]

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-X.md` — Task Listesi tablosunda durum ve commit güncelle
- `_dev/docs/[DOKUMAN].md` — [Ne güncellenecek, varsa]
- `_dev/docs/DECISIONS.md` — [Önemli karar alındıysa]

---

## Alt Görevler

- [ ] **1. [Alt Görev Adı]**
  - [Yapılacak işlem detayı]
  - [Dosya: `path/to/file.ts`]

- [ ] **2. [Alt Görev Adı]**
  - [Yapılacak işlem detayı]
  - [Dosya: `path/to/file.ts`]

- [ ] **3. [Alt Görev Adı]**
  - [Yapılacak işlem detayı]

---

## Etkilenen Dosyalar

```
[klasör]/
├── [dosya1.ts]     # [Ne değişecek / YENİ]
├── [dosya2.ts]     # [Ne değişecek]
└── [dosya3.test.ts] # [Test dosyası / YENİ]
```

---

## Dikkat Noktaları

- [Araştırma bulgularından gelen dikkat noktası]
- [Kapsam tartışmasından gelen tercih veya kısıtlama]
- [Edge case]
- [Bilinen tuzak]

---

## Test Kriterleri

- [ ] [Test 1 — somut, doğrulanabilir]
- [ ] [Test 2 — edge case veya hata durumu]
- [ ] [Test 3 — entegrasyon kontrolü]

---

## Karar Noktaları

<!-- OPSİYONEL: Bu bölüm sadece task'ta birden fazla geçerli yaklaşım varsa veya kullanıcıya sorulması gereken bir karar varsa doldurulur. Karar noktası yoksa bu bölümü sil. -->

- **[Karar konusu]:** [Seçenek A] vs [Seçenek B] → [Önerilen / Kullanıcıya sorulacak]

---

## Risk ve Geri Dönüş Planı

<!-- OPSİYONEL: Bu bölüm sadece mevcut çalışan kodu değiştiren, migration içeren, veri kaybı riski olan veya geri dönüşü zor olan task'larda doldurulur. Düşük riskli task'larda bu bölümü sil. -->

- **[Risk]:** [Ne olabilir] → [Ne yapılır]
- **Rollback:** [Geri dönüş adımları]

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (conventional commits formatı)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi

---

## Oturum Kayıtları

### Oturum — [TARİH]

**Durum:** ✅ Tamamlandı / 🔄 Devam edecek / ⏸️ Duraklatıldı

**Yapılanlar:**
- [Tamamlanan alt görevler ve detaylar]

**Sorunlar:**
- [Sorun]: [Nasıl çözüldü]

**Kararlar:**
- [Karar]: [Gerekçe]
- docs/DECISIONS.md'ye eklendi: [Evet/Hayır]

**Kalan İşler:** (varsa)
- [kalan 1]

**Son Yaklaşım:** (pause/devam durumunda kritik)
[Son düşünülen yaklaşım, nerede kaldığının detayı]

**Sonraki Adım Detayı:** (pause/devam durumunda kritik)
[Devam edildiğinde tam olarak ne yapılacak, hangi dosyadan devam]

**Dosya Değişiklikleri:**
- `dosya.ts` → [Ne değişti]

**Test Sonuçları:**
- [Hangi testler çalıştı, sonuçlar]

---

<!-- Task tamamlanınca doldurulacak: -->

## Sonuç Özeti

**Tamamlanma Tarihi:** [Tarih]

**Ne Yapıldı:**
- [Kısa özet]

**Öğrenilenler:**
- [Varsa notlar]

---

**Oluşturulma:** [Tarih]
