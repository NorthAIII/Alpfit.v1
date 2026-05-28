# DevFlow — Proje Başlatma Oturum 2: Dokümanları Oluştur (Kickoff Docs)

Bu komut kickoff oturumunun ikinci adımıdır. İlk oturumda belirlenen yapıyı dokümanlarla somutlaştırır. `_dev/` klasörünü ve tüm temel dokümanları oluşturur. Re-kickoff modunda sadece etkilenen dokümanları günceller.

**Kullanım:** `/devflow:kickoff-docs`

**Ön Koşul:** `/devflow:kickoff` oturumu tamamlanmış olmalı.

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (önce)
Bu komut `_dev/` yapısını oluşturmak için çalışır; ilk çalıştırmada OVERVIEW/INDEX/DURUM/MEMORY ve CLAUDE.md henüz **yoktur**. Re-kickoff modunda CLAUDE.md varsa Oturum Başlangıç Protokolü uygulanır (eksik dosyalar atlanır).

### Zorunlu (hepsini oku)
1. `_dev/KICKOFF-NOTES.md` — Önceki oturumda alınan kararlar (modüller, fazlar, stack vb.)

### PRD Dokümanları (PRD varsa oku)
2. `_dev/PRD/VERSIONS.md` — Feature-versiyon haritası (MODULE-MAP'e Versiyon sütunu aktarmak için)
3. `_dev/PRD/features/` altındaki feature dokümanları — MODULE dokümanlarına bilgi aktarımı için

### Mevcut İlkeler (varsa oku)
- `_dev/ILKELER.md` — PRD flow'da `prd` oluşturmuştur. Adım 3'te koruyup/doldurmadan önce mevcut içeriği **oku** (template'ten yeniden üretip ezme).

### Template'ler (doküman oluştururken oku)
Her dokümanı oluştururken ilgili template'i `.claude/commands/devflow/templates/` klasöründen oku:
- `OVERVIEW.md` → template: `.claude/commands/devflow/templates/OVERVIEW.md`
- `ILKELER.md` → template: `.claude/commands/devflow/templates/ILKELER.md`
- `INDEX.md` → template: `.claude/commands/devflow/templates/INDEX.md`
- `DURUM.md` → template: `.claude/commands/devflow/templates/DURUM.md`
- `MODULE-MAP.md` → template: `.claude/commands/devflow/templates/MODULE-MAP.md`
- `PHASES.md` → template: `.claude/commands/devflow/templates/PHASES.md`
- `QUALITY.md` → template: `.claude/commands/devflow/templates/QUALITY.md`
- `TASKS-README.md` → template: `.claude/commands/devflow/templates/TASKS-README.md`
- `DECISIONS.md` → template: `.claude/commands/devflow/templates/DECISIONS.md`
- `MEMORY.md` → template: `.claude/commands/devflow/templates/MEMORY.md`
- Modül dokümanları → template: `.claude/commands/devflow/templates/MODULE.md`

---

## Yapılacaklar — İlk Kickoff

### Adım 1: Önceki Oturumun Kararlarını Doğrula

`_dev/KICKOFF-NOTES.md` dosyasını oku. Kullanıcıya kısaca özetle:
- "Önceki oturumda şu yapıyı belirlemiştik: [özet]. Değişiklik var mı?"
- Değişiklik varsa not al, yoksa devam et.

### Adım 2: `_dev/` Yapısını Oluştur

Projenin repo'sunda aşağıdaki yapıyı oluştur:

```
_dev/
├── OVERVIEW.md
├── ILKELER.md             ← PRD flow'da prd zaten oluşturdu; PRD'siz flow'da burada doğar
├── INDEX.md
├── DURUM.md               ← Aktif Versiyon alanı dahil
├── MEMORY.md              ← Proje hafızası index'i (boş template; memory/ ilk öğrenimde oluşur)
├── MODULE-MAP.md           ← Versiyon sütunu dahil
├── PHASES.md
├── QUALITY.md
├── modules/
│   ├── M1-ModulAdi.md      ← PRD'den bilgi aktarımı dahil
│   └── ...
├── phases/                 (boş)
├── docs/
│   └── DECISIONS.md
└── tasks/
    ├── TASKS-README.md
    ├── quick/
    └── archive/
```

### Adım 3: Dokümanları Doldur

Her dokümanı template'e uygun oluştur:

> **KURAL yorumlarını koru:** Template'teki `<!-- KURAL: ... -->` yorumları üretilen dokümana **olduğu gibi aktarılır** — silinmez. Bunlar dokümanın yapısal kuralının **tek kaynağıdır** (audit-docs onları ground-truth alır). Yalnızca `[placeholder]` yer tutucuları doldurulur; `<!-- OPSİYONEL -->` strip-işaretleri ihtiyaca göre işlenir.

**DURUM.md** — Başlangıç durumu. **"Aktif Versiyon" alanı eklenir** — PRD'deki ilk versiyon yazılır. **"Versiyon Sonu Durumu" alanı `içerik_fazları` olarak başlatılır.** Aktif faz: Phase 1, adım: "discuss".

**MODULE-MAP.md** — Feature-Faz Matrisi'ne **Versiyon sütunu eklenir**:
```
| Feature | Modül | Versiyon | Faz | Durum |
|---------|-------|----------|-----|-------|
| F1.1: [Feature] | M1 | v0.1 | — | ⬜ |
| F2.1: [Feature] | M2 | v0.5 | — | ⬜ |
```
Versiyon sütunu PRD'deki VERSIONS.md'den feature-versiyon eşleştirmesi aktarılarak doldurulur. **PRD yoksa Versiyon sütunu eklenmez** — versiyon takibi PRD'ye bağlıdır. **Faz sütunu bu oturumda tüm feature'larda `—`'dir** — feature'a faz numarası, o faza girildiğinde (discuss-phase) atanır (just-in-time; bkz. PHASES.md → Faz Numaralandırma Kuralı).

**PHASES.md** — Faz Durumu tablosu **boş başlar** (henüz girilmiş faz yok). Kickoff'ta taslaklanan yakın faz konularını (konu + milestone) numarasız **Sıradaki Fazlar** listesine yaz — ilk faz dahil hiçbiri önceden numaralanmaz. İlk faz, discuss-phase 1'de numara (1) alıp Faz Durumu tablosuna geçer (bkz. PHASES.md → Faz Numaralandırma Kuralı).

**MEMORY.md** — Template'ten oluştur (index formatı). Boş başlangıç — proje ilerledikçe öğrenimler `_dev/memory/<slug>.md` dosyalarına yazılıp index'e pointer eklenerek dolar. `memory/` klasörü ilk öğrenimde oluşur (şimdi boş klasör açma).

**ILKELER.md** — **Güvenlik ağı:** PRD flow'da `prd` bunu zaten oluşturmuştur → varsa olduğu gibi koru, kickoff bağlamında belirginleşen projeye-özgü ilkeleri (ufuk, öncelikli eksenler, pazarlık-konusu-olmayanlar) teyit edip doldur. **PRD'siz flow'da yoksa template'ten oluştur** (evrensel taban ilkeleri gelir; projeye-özgü alanlar kickoff'ta konuşulduğu kadar doldurulur, gerisi boş kalır). Sınırı koru — yön/öncelik burada, somut teknik kural CLAUDE.md'de.

**Modül Dokümanları** — PRD'den bilgi aktarımı:
- PRD feature dokümanlarındaki **davranış kuralları** → MODULE dokümanlarındaki kabul kriterlerine dönüşür
- PRD feature dokümanlarındaki **edge case'ler** → MODULE dokümanlarına aktarılır
- PRD feature dokümanlarındaki **kullanıcı senaryoları** → MODULE dokümanlarında referans olarak yer alır
- PRD'deki **teknik kısıtlamalar ve tercihler** → ilgili MODULE dokümanlarına aktarılır
- Opsiyonel izlenebilirlik notu eklenebilir: `**PRD Referans:** _dev/PRD/features/xxx.md`
- **Çelişki veya belirsizlik varsa kullanıcıya sorulur** — sessizce bir tarafı tercih etme

**Diğer dokümanlar** — Mevcut davranışla aynı: OVERVIEW, INDEX, QUALITY, TASKS-README, DECISIONS.

### Adım 4: Projeye Özgü Dokümanlar

Önceki oturumda belirlenen ek dokümanları oluştur (STYLE-GUIDE, TECH-STACK, DATABASE vb.)

### Adım 5: INDEX.md'yi Güncelle

Oluşturulan tüm **içerik dokümanlarını** INDEX.md'ye ekle (modül, docs, PRD içerik, projeye özgü sabitler). ILKELER.md de INDEX'te yer alır (template'te zaten listeli). Task/faz gibi sıralı dokümanlar enumere edilmez — INDEX onlar için yalnızca klasör konumunu gösterir (bu oturumda zaten task/faz dokümanı oluşturulmaz).

### Adım 6: KICKOFF-NOTES.md'yi Sil

Tüm dokümanlar oluşturulduktan sonra `_dev/KICKOFF-NOTES.md` dosyasını sil.

### Adım 7: Git Commit & Push

Tüm oluşturulan dokümanları commit & push yap:
```
docs: kickoff-docs — project documents created
```

### Adım 8: Özet ve Sıradaki Adım

```
✅ Proje dokümanları oluşturuldu. KICKOFF-NOTES.md silindi.
📋 Sıradaki adım: /devflow:kickoff-verify
   → Oluşturulan dokümanları kontrol etmek ve CLAUDE.md'yi oluşturmak için yeni bir oturum başlat.
```

---

## Yapılacaklar — Re-Kickoff

Re-kickoff sadece delta ile ilgilenir ve **merge prensibiyle** çalışır:
- **Mevcut bilgi korunur** — MODULE'lerde faz döngüsü sırasında eklenmiş bilgiler aynen kalır
- **Yeni bilgi eklenir** — PRD'den gelen yeni bilgiler eklenir
- **Her çelişki için kullanıcıya sorulur** — Claude kendi başına karar vermez

### Güncellenen Dokümanlar
- **MODULE-MAP.md** — Yeni modüller, kaldırılan feature'lar, değişen bağımlılıklar, versiyon güncellemeleri
- **PHASES.md** — Yeni faz konularını **Sıradaki Fazlar**'a (numarasız) ekle; numara faza girince atanır. Girilmiş/tamamlanmış fazlara (Faz Durumu tablosu) dokunma.
- **Etkilenen modül dokümanları** — PRD'den güncellenen bilgiler merge prensibiyle aktarılır
- **DURUM.md** — Aktif durumu, aktif versiyonu güncelle, Versiyon Sonu Durumu'nu `içerik_fazları` olarak sıfırla
- **INDEX.md** — Yeni içerik dokümanı (modül, docs, PRD içerik) eklendiyse güncelle (task/faz enumere edilmez)
- Gerekirse projeye özgü dokümanlar

### Dokunulmayan Dokümanlar
- Tamamlanmış faz dokümanları
- OVERVIEW.md (vizyon değişmediyse)
- ILKELER.md (ilkeler değişmediyse — değişiklik prd/prd-review'da bilinçli yapılır)
- Değişiklikten etkilenmeyen modül dokümanları
- DECISIONS.md (mevcut kararlar korunur)

### Re-Kickoff Sonrası

KICKOFF-NOTES.md'yi sil, değişiklikleri commit & push yap:
```
docs: re-kickoff — documents updated
```

Sıradaki adımı öner:
```
✅ Re-kickoff tamamlandı. Değişiklikler dokümanlara yansıtıldı.
📋 Sıradaki adım: /devflow:kickoff-verify
   → Güncellenen dokümanları kontrol etmek için yeni bir oturum başlat.
```

---

## Önemli Kurallar

- Bu oturumda task çalıştırma — sadece doküman oluşturma/güncelleme
- Template'lere uy ama projeye göre uyarla — placeholder bırakma
- Bilgi tekrarı yapma — her bilgi tek yerde olmalı
- `_dev/` izolasyonunu koru — projenin kendi dokümanlarıyla karıştırma
- Faz dokümanı (PHASE-1.md) bu oturumda OLUŞTURULMAZ — o discuss-phase'de oluşturulacak
- INDEX.md'ye sadece oluşturulmuş **içerik dokümanlarını** yaz (task/faz enumere edilmez, klasör konumu yeterli)
- PRD→MODULE aktarımında perspektif dönüşümü yap: PRD'deki serbest format davranış kuralı → MODULE'de test edilebilir kabul kriterine dönüşür
- Çelişki gördüğünde varsayım yapma, kullanıcıya sor
