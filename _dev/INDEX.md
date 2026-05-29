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
3. **DURUM.md** — Dashboard (aktif faz, aktif task, son ilerleme, engelleyici ön-koşullar)
4. **MEMORY.md** — Proje hafızası index'i (öğrenim pointer'ları; detay `memory/<slug>.md` dosyalarında, gerekince lazy-load). `memory/` dosyaları tek tek burada listelenmez — güncel liste MEMORY.md index'indedir.

### Planlama Dokümanları (Planlama ve Review'da OKU)

5. **MODULE-MAP.md** — Modül ve feature haritası (özet/index)
6. **PHASES.md** — Faz durum özeti + sıradaki fazlar
7. **QUALITY.md** — Kalite eksenleri ve kontrol noktaları (8 eksen, 2 projeye özgü)
8. **ILKELER.md** — Proje ilkeleri / yön (prd, prd-refine, prd-review, kickoff, discuss, research, plan'da OKU)

### Projeye Özgü Sabitler (Her Oturumda OKU)

| Doküman | İçerik |
|---------|--------|
| `TECH-STACK.md` | Mobile / Backend / DB / SMS / Push / Hosting kararları (Yakın 1 öncesi research-phase doldurulacak — şu an boş şablon) |
| `KVKK.md` | KVKK aydınlatma metni + sağlık verisi açık rıza + saklama süresi + üye self-silme akışı (Yakın 4 öncesi hukuki danışman ile doldurulacak — şu an boş şablon) |

### PRD Dokümanları (PRD Oturumlarında OKU)

| Doküman | İçerik |
|---------|--------|
| `PRD/VERSIONS.md` | Versiyon stratejisi (v1 / v1.5 / v2) + feature-versiyon haritası — source of truth |
| `PRD/SESSION-NOTES.md` | PRD çalışma durumu notları (henüz olgunlaşmamış konular, açık sorular) |
| `PRD/00-VISION.md` | Vizyon, pazar, rakip analizi, 3 rol mimarisi, AI yasal çerçeve, v1 başarı/başarısızlık kriterleri |
| `PRD/features/01-sustainability-engine.md` | Sürdürülebilirlik motoru (streak + telafi + comeback) — ürünün kalbi |
| `PRD/features/02-program-builder.md` | PT program builder (haftalık şablon + çekirdek 50 egzersiz + custom) |
| `PRD/features/03-onboarding.md` | Davet linki + SMS OTP + KVKK rıza ekranı |
| `PRD/features/04-notifications.md` | Push bildirim sistemi (APNs + FCM, sessiz saat 22-08) |
| `PRD/features/05-member-program-view.md` | Üye program görüntüleme + tamamlama (motorun girdi katmanı) |
| `PRD/features/06-pt-dashboard.md` | PT dashboard (üye listesi + adaptif banner stack + üye detay) |
| `PRD/features/07-member-measurements.md` | PT'nin üye ölçümlerini girdiği akış (KVKK + 24h düzenleme + toggle) |
| `PRD/features/08-member-food-log.md` | Üyenin yemek günlüğü (yasal çerçeve + disclaimer + AI-ready) |

### Modül Dokümanları (İlgili Modül Gerektiğinde OKU)

| Doküman | Modül |
|---------|-------|
| `modules/M0-cekirdek-altyapi.md` | M0: Çekirdek Altyapı (cross-cutting — repo iskeleti, 3 rol veri modeli, env/secret, KVKK çerçevesi, test altyapısı, CI/CD, observability, TR locale) |
| `modules/M1-auth-onboarding.md` | M1: Auth & Onboarding (davet linki + SMS OTP + 30 gün cihaz hatırlama + KVKK açık rıza) |
| `modules/M2-program-domain.md` | M2: Program Domain (Builder + Viewer birleşik — haftalık şablon, çekirdek 50 egzersiz, üye tamamlama, video, offline cache) |
| `modules/M3-surdurulebilirlik-motoru.md` | M3: Sürdürülebilirlik Motoru (streak + telafi + T+2/T+7/T+14 comeback + motor → bildirim olayları) — **ürünün kalbi** |
| `modules/M4-bildirim-altyapisi.md` | M4: Bildirim Altyapısı (APNs + FCM, token yönetimi, sessiz saat, izin akışı, deep link payload) |
| `modules/M5-pt-dashboard.md` | M5: PT Dashboard (üye listesi + adaptif banner stack + üye detay + not düşme + WhatsApp deep link + üye çıkarma) |
| `modules/M6-saglik-verisi.md` | M6: Sağlık Verisi (Ölçüm + Yemek günlüğü birleşik — KVKK + gizlilik toggle + 24h audit + AI-ready) |

### Faz Dokümanları (Aktif Faz OKU)

`phases/` klasöründe `PHASE-N.md` deseninde. Tek tek listelenmez — güncel faz listesi ve durumları **PHASES.md**'de, aktif faz **DURUM.md**'de. Bu kickoff aşamasında henüz faz dokümanı yok.

### Task Dokümanları (Task Çalıştırırken OKU)

- **tasks/TASKS-README.md** — Task sistemi kuralları
- `tasks/TASK-X.YY.md` — Aktif task; tek tek listelenmez, güncel task **DURUM.md**'de
- `tasks/archive/` — Tamamlanmış task'lar (aynı isim deseni)
- `tasks/quick/` — Ad-hoc quick task kayıtları

### Bilgi Havuzu (İhtiyaca Göre)

| Doküman | İçerik |
|---------|--------|
| `docs/DECISIONS.md` | Mimari ve tasarım kararları (modül kesimi, faz sırası, projeye özgü doküman seti) |

### Repo Kökü

| Doküman | İçerik |
|---------|--------|
| `/CONTEXT-BRIEF.md` | 2026-05-28 planlama oturumu — PRD öncesi tek-kaynak özet (proje köküne kayıtlı, _dev/ dışı) |
| `/README.md` | Repo README'si (proje değil DevFlow setup için) |
| `/CLAUDE.md` | Claude Code talimatları — oturum başlangıç protokolü, doküman disiplini, projeye özgü kurallar (repo kökünde) |

---

## Senaryolar — Hangi Durumda Ne Oku?

### SENARYO: PRD Oturumu (prd, prd-refine, prd-review)
1. Temel dokümanlar
2. ILKELER.md — proje ilkeleri (Q&A'yi yönlendirir; güncellemeye açık)
3. `PRD/` altındaki tüm dokümanlar (SESSION-NOTES, VERSIONS, 00-VISION, features/)
4. Konuyla ilgili modül dokümanları (PRD değişikliği MODULE'lere yansır mı?)

### SENARYO: Geliştirme Sırasında Not (prd-note)
1. Temel dokümanlar
2. `PRD/SESSION-NOTES.md`
3. Konuyla ilgili proje dosyaları

### SENARYO: Task Çalıştırma
1. Temel dokümanlar
2. Projeye özgü sabitler (TECH-STACK, KVKK — doluysa)
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
7. TECH-STACK.md (Yakın 1 öncesi araştırma burada doldurulur)
8. İlgili docs/ dokümanları

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

### SENARYO: KVKK İlgili İş (Projeye Özgü)
1. Temel dokümanlar
2. KVKK.md — çerçeve + bekleyen kararlar
3. `PRD/00-VISION.md` §6 — yasal çerçeve
4. `modules/M0-cekirdek-altyapi.md` — KVKK altyapısı
5. `modules/M6-saglik-verisi.md` — sağlık verisi kullanımı
6. `PRD/features/03-onboarding.md` (rıza ekranı) + `PRD/features/07-member-measurements.md` + `PRD/features/08-member-food-log.md`

---

## Doküman Hiyerarşisi

```
Alpfit.v1/
├── CLAUDE.md ⭐ (repo kökünde — kickoff-verify'da oluşacak)
├── CONTEXT-BRIEF.md (planlama oturumu bağlamı)
├── README.md
│
└── _dev/
    ├── OVERVIEW.md ⭐
    ├── ILKELER.md            # proje ilkeleri (karar fazlarında okunur)
    ├── INDEX.md ⭐
    ├── DURUM.md ⭐
    ├── MEMORY.md ⭐           # proje hafızası index'i
    ├── memory/               # öğrenim dosyaları (ilk öğrenimde oluşur — şu an boş)
    ├── MODULE-MAP.md
    ├── PHASES.md
    ├── QUALITY.md
    ├── TECH-STACK.md         # projeye özgü — Yakın 1 öncesi doldurulacak
    ├── KVKK.md               # projeye özgü — Yakın 4 öncesi doldurulacak
    │
    ├── PRD/
    │   ├── 00-VISION.md
    │   ├── VERSIONS.md
    │   ├── SESSION-NOTES.md
    │   └── features/
    │       ├── 01-sustainability-engine.md
    │       ├── 02-program-builder.md
    │       ├── 03-onboarding.md
    │       ├── 04-notifications.md
    │       ├── 05-member-program-view.md
    │       ├── 06-pt-dashboard.md
    │       ├── 07-member-measurements.md
    │       └── 08-member-food-log.md
    │
    ├── modules/
    │   ├── M0-cekirdek-altyapi.md
    │   ├── M1-auth-onboarding.md
    │   ├── M2-program-domain.md
    │   ├── M3-surdurulebilirlik-motoru.md
    │   ├── M4-bildirim-altyapisi.md
    │   ├── M5-pt-dashboard.md
    │   └── M6-saglik-verisi.md
    │
    ├── phases/               # boş — ilk faz discuss-phase'de doğacak
    │
    ├── tasks/
    │   ├── TASKS-README.md
    │   ├── quick/            # boş
    │   └── archive/          # boş
    │
    └── docs/
        └── DECISIONS.md
```

---

## Hızlı Erişim

**DevFlow Dokümanları:** `_dev/`
**PRD:** `_dev/PRD/`
**Modül Dokümanları:** `_dev/modules/`
**Bağlam Brief'i:** `/CONTEXT-BRIEF.md`
**Kaynak Kod:** Henüz yok — Yakın 1'de açılacak (TECH-STACK kararından sonra)
**Çalışan Uygulama:** Henüz yok

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 3 (kickoff-verify): CLAUDE.md repo köküne eklendi; INDEX güncel.

<!-- KURAL: Bu satır her güncellemede ÜZERİNE YAZILIR. "Önceki:" prefix ile kümülatif yığma YASAK (CLAUDE.md → Doküman Disiplini). -->
<!-- KURAL: Tamamlanmış fazların task arşiv listesini INDEX'e ekleme — `ls _dev/tasks/archive/` zaten görür. INDEX yalnızca aktif klasör konumlarını gösterir; statik liste dokümanı değildir. -->
