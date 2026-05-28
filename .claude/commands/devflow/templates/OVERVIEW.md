# [PROJE_ADI] — Proje Özeti

**Proje Sahibi:** [İsim/Şirket]
**Başlangıç Tarihi:** [Tarih]

---

## Bu Doküman Hakkında

**OVERVIEW.md** projenin genel referans dokümanıdır. Her oturum başında mutlaka okunmalıdır. **Yalnızca statik bilgi** içerir — proje kimliği, stack, amaç, kapsam. Dinamik bilgi (aktif faz/task, ilerleme, faz numarası, durum) buraya **yazılmaz**; onların evi DURUM.md'dir. OVERVIEW yalnızca daha genel değişikliklerde (vizyon, stack, kapsam) güncellenir — nadiren.

**Not:** Bu dosya projenin kendi README.md'si değildir. Bu, DevFlow geliştirme sürecine yönelik bir özettir ve `_dev/` klasöründe yaşar.

---

## Proje Özeti

### Ne Yapıyor?
[2-3 cümle: Projenin amacı ve ne yaptığı]

### Hangi Problemi Çözüyor?
[Çözülen problem ve motivasyon]

### Hedef Kitle
[Kim kullanacak?]

### Kapsam
**Dahil:** [Neler dahil]
**Dahil değil:** [Neler kapsam dışı]

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | [framework, dil] |
| Backend | [framework, dil] |
| Veritabanı | [DB teknolojisi] |
| Styling | [CSS framework] |
| Deployment | [platform] |
| Diğer | [önemli kütüphaneler] |

**Detaylar:** `docs/TECH-STACK.md` (varsa)

---

## Temel Özellikler

- [Özellik 1]
- [Özellik 2]
- [Özellik 3]

**Detaylar:** `MODULE-MAP.md` (modül ve feature haritası), `modules/` (modül detayları)

---

## Kaynak Kod Yapısı

```
src/
├── [klasör açıklaması]
└── ...
```

---

## Proje Konumları

| Açıklama | Yol |
|----------|-----|
| Repo Kökü | `[REPO_YOLU]` |
| DevFlow Dokümanları | `[REPO_YOLU]/_dev/` |
| Kaynak Kod | `[REPO_YOLU]/src/` (veya projeye göre) |
| Çalışan Uygulama | `[URL veya yol]` |

---

## Doküman Yapısı

```
_dev/
├── OVERVIEW.md        # Bu dosya
├── ILKELER.md         # Proje ilkeleri (yön/öncelik — karar fazlarında okunur)
├── INDEX.md           # Navigasyon haritası
├── DURUM.md           # Canlı dashboard
├── MEMORY.md          # Proje hafızası index'i
├── memory/            # Öğrenim dosyaları (ilk öğrenimde oluşur, lazy-load)
├── MODULE-MAP.md      # Modül/feature haritası (özet)
├── PHASES.md          # Faz durum özeti + sıradaki fazlar
├── QUALITY.md         # Kalite eksenleri
│
├── PRD/               # PRD dokümanları (varsa)
│   ├── VERSIONS.md
│   ├── SESSION-NOTES.md  # PRD çalışma durumu notları
│   ├── features/
│   └── ...
│
├── modules/           # Modül detay dokümanları
├── phases/            # Faz dokümanları (her faz ayrı)
├── docs/              # Detay dokümanları, karar günlüğü
└── tasks/             # Task dokümanları ve arşiv
```

CLAUDE.md repo kökündedir (`/CLAUDE.md`).

---

> Operasyonel talimatlar (oturum başlangıç protokolü, task tamamlama sırası, numaralama) burada tekrarlanmaz — onların evi CLAUDE.md'dir. OVERVIEW yalnızca proje kimliğini taşır; tekrar = drift kaynağı.

---

**Son Güncelleme:** [Tarih]
