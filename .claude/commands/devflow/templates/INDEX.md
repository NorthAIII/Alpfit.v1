# INDEX — Doküman Yol Haritası

**Amaç:** Hangi durumda hangi dokümanı okuyacağını bilmek

---

<!-- KURAL: INDEX iki tür kayıt tutar:
     1. İÇERİK DOKÜMANLARI (modules/, docs/, PRD içerik dosyaları, projeye özgü sabitler) → TEK TEK enumere edilir, her birinin ne içerdiği yazılır. Konumu ve içeriği öngörülemez; hangi alanda doküman olduğu yalnızca burada bilinir. Yeni içerik dokümanı oluşturulduğunda INDEX güncellenir. Sadece mevcut dokümanlar listelenir, oluşturulmamışlar yazılmaz.
     2. SIRALI/ÖNGÖRÜLEBİLİR DOKÜMANLAR (tasks/, phases/) → TEK TEK enumere EDİLMEZ. Sadece klasör konumu ve isim deseni belirtilir. Güncel liste zaten DURUM.md (aktif task, task durumu) ve PHASES.md (faz özeti)'nde tutulur — burada tekrar edilmez. -->
<!-- NOT: Tüm dokümanlar _dev/ klasöründedir. Aşağıdaki yollar _dev/ klasörüne göredir. -->

## Tüm Dokümanlar

### Temel Dokümanlar (Her Oturum Başında OKU)

1. **OVERVIEW.md** — Proje kimliği, stack, amaç, kapsam
2. **INDEX.md** — Bu dosya (navigasyon haritası)
3. **DURUM.md** — Dashboard (aktif faz, aktif task, son ilerleme)
4. **MEMORY.md** — Proje hafızası index'i (öğrenim pointer'ları; detay `memory/<slug>.md` dosyalarında, gerekince lazy-load). `memory/` dosyaları tek tek burada listelenmez — güncel liste MEMORY.md index'indedir.

### Planlama Dokümanları (Planlama ve Review'da OKU)

5. **MODULE-MAP.md** — Modül ve feature haritası (özet/index)
6. **PHASES.md** — Faz durum özeti + sıradaki fazlar
7. **QUALITY.md** — Kalite eksenleri ve kontrol noktaları
8. **ILKELER.md** — Proje ilkeleri / yön (prd, prd-refine, prd-review, kickoff, discuss, research, plan'da OKU; kickoff yalnızca varsa)

### Projeye Özgü Sabitler (Her Oturumda OKU)

| Doküman | İçerik |
|---------|--------|
| [Projeye göre eklenecek — STYLE-GUIDE.md, ISLEYIS-VE-KURALLAR.md vb.] | |

### PRD Dokümanları (PRD Oturumlarında OKU)

| Doküman | İçerik |
|---------|--------|
| `PRD/VERSIONS.md` | Versiyon tanımları ve feature-versiyon haritası |
| `PRD/SESSION-NOTES.md` | PRD çalışma durumu notları (henüz olgunlaşmamış bilgi) |
| `PRD/NOTES.md` | Geliştirme sırasında biriken notlar (varsa) |
| `PRD/features/[feature-adı].md` | [Feature adı ve kısa açıklaması] |
| [Diğer mevcut feature dokümanları...] | [Açıklama] |
| `PRD/versions/[versiyon].md` | [Versiyon detayı — varsa] |
| [Diğer mevcut versiyon dokümanları...] | [Açıklama] |
| `PRD/[esnek içerik dosyaları]` | Vizyon, kısıtlamalar, iş kuralları vb. |

### Modül Dokümanları (İlgili Modül Gerektiğinde OKU)

| Doküman | Modül |
|---------|-------|
| `modules/M1-[Ad].md` | [Modül adı ve kısa açıklama] |
| [Diğer mevcut modül dokümanları...] | [Açıklama] |

### Faz Dokümanları (Aktif Faz OKU)

`phases/` klasöründe `PHASE-N.md` deseninde. Tek tek listelenmez — güncel faz listesi ve durumları **PHASES.md**'de, aktif faz **DURUM.md**'de.

### Task Dokümanları (Task Çalıştırırken OKU)

- **tasks/TASKS-README.md** — Task sistemi kuralları
- `tasks/TASK-X.YY.md` — Aktif task; tek tek listelenmez, güncel task **DURUM.md**'de
- `tasks/archive/` — Tamamlanmış task'lar (aynı isim deseni)
- `tasks/quick/` — Ad-hoc quick task kayıtları

### Bilgi Havuzu (İhtiyaca Göre)

| Doküman | İçerik |
|---------|--------|
| `docs/DECISIONS.md` | Önemli mimari ve tasarım kararları |
| `docs/TECH-STACK.md` | Teknoloji kararları, mimari |
| [Diğer mevcut dokümanlar...] | [Açıklama] |

---

## Senaryolar — Hangi Durumda Ne Oku?

### SENARYO: PRD Oturumu (prd, prd-refine, prd-review)
1. Temel dokümanlar
2. ILKELER.md — proje ilkeleri (Q&A'yi yönlendirir; güncellemeye açık)
3. `PRD/` altındaki tüm dokümanlar (SESSION-NOTES, VERSIONS, esnek içerik, features/)
4. Göreve göre: `PRD/versions/`, `PRD/NOTES.md`

### SENARYO: Geliştirme Sırasında Not (prd-note)
1. Temel dokümanlar
2. `PRD/NOTES.md` (varsa)
3. Konuyla ilgili proje dosyaları

### SENARYO: Task Çalıştırma
1. Temel dokümanlar
2. Projeye özgü sabitler
3. tasks/TASKS-README.md
4. tasks/[AKTİF-TASK].md
5. Task dokümanındaki "Referans Dokümanlar" bölümündeki dokümanlar
6. INDEX'ten göreve göre ek dokümanlar

### SENARYO: Kapsam Tartışması (Discuss Phase)
1. Temel dokümanlar
2. ILKELER.md — proje ilkeleri (gri alan kararlarını yönlendirir)
3. MODULE-MAP.md
4. Fazın kapsadığı modül dokümanları (modules/)
5. Aktif faz dokümanı (phases/PHASE-X.md)
6. Önceki fazın retrospektifi (varsa)

### SENARYO: Teknik Araştırma (Research Phase)
1. Temel dokümanlar
2. PHASES.md
3. QUALITY.md
4. ILKELER.md — proje ilkeleri (yaklaşım seçimini yönlendirir)
5. Aktif faz dokümanı — özellikle "Kapsam Tartışması" bölümü
6. Fazın kapsadığı modül dokümanları (modules/)
7. İlgili docs/ dokümanları

### SENARYO: Faz Planlama (Plan Phase)
1. Temel dokümanlar
2. MODULE-MAP.md
3. Aktif faz dokümanı — "Kapsam Tartışması" ve "Araştırma Bulguları"
4. Fazın kapsadığı modül dokümanları (modules/)
5. QUALITY.md
6. ILKELER.md — proje ilkeleri (task kapsamı ve kriterlerini yönlendirir)
7. tasks/TASKS-README.md — task format kuralları
8. `.claude/commands/devflow/templates/TASK.md` — task template

### SENARYO: Faz Review
1. Temel dokümanlar
2. MODULE-MAP.md
3. Aktif faz dokümanı (tüm bölümler)
4. QUALITY.md
5. Bu fazdaki tüm task dokümanları (archive dahil)
6. Kaynak kodu inceleme

### SENARYO: Hata Düzeltme / Bilgi Sorgulama
1. Temel dokümanlar
2. İlgili modül ve docs/ dokümanları

### SENARYO: Quick Mode (Ad-hoc Task)
1. Temel dokümanlar
2. İlgili modül ve docs/ dokümanları (işe göre)
3. `tasks/quick/` — mevcut quick task kayıtları (gerekirse)

[Projeye özgü senaryolar buraya eklenir — sadece mevcut dokümanları referans et]

---

## Doküman Hiyerarşisi

```
proje-repo/
├── CLAUDE.md ⭐ (repo kökünde — her oturum otomatik okunur)
│
└── _dev/
    ├── OVERVIEW.md ⭐
    ├── ILKELER.md            # proje ilkeleri (karar fazlarında okunur)
    ├── INDEX.md ⭐
    ├── DURUM.md ⭐
    ├── MEMORY.md ⭐           # proje hafızası index'i
    ├── memory/               # öğrenim dosyaları (ilk öğrenimde oluşur, lazy-load)
    ├── MODULE-MAP.md
    ├── PHASES.md
    ├── QUALITY.md
    ├── [Projeye Özgü].md
    │
    ├── PRD/                  # PRD dokümanları (varsa)
    │   ├── VERSIONS.md
    │   ├── SESSION-NOTES.md
    │   ├── NOTES.md
    │   ├── features/
    │   └── versions/
    │
    ├── modules/
    │   ├── M1-[Ad].md
    │   └── ...
    │
    ├── phases/
    │   ├── PHASE-1.md
    │   └── ...
    │
    ├── tasks/
    │   ├── TASKS-README.md
    │   ├── TASK-X.YY.md (aktif)
    │   ├── quick/ (ad-hoc task'lar)
    │   └── archive/ (tamamlanan)
    │
    └── docs/
        ├── DECISIONS.md
        └── [mevcut dokümanlar]
```

---

## Hızlı Erişim

**DevFlow Dokümanları:** `_dev/`
**Kaynak Kod:** [KAYNAK_KOD_YOLU]
**Çalışan Uygulama:** [URL]

---

**Son Güncelleme:** [Tarih] — [son eklenen/değişen dokümanın tek cümle özeti, max ~250 karakter]

<!-- KURAL: Bu satır her güncellemede ÜZERİNE YAZILIR. "Önceki:" prefix ile kümülatif yığma YASAK (CLAUDE.md → Doküman Disiplini). -->
<!-- KURAL: Tamamlanmış fazların task arşiv listesini INDEX'e ekleme — `ls _dev/tasks/archive/` zaten görür. INDEX yalnızca aktif klasör konumlarını gösterir; statik liste dokümanı değildir. -->
