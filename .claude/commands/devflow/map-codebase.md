# DevFlow — Mevcut Kodu Analiz Et (Map Codebase)

Bu komut mevcut bir projeye DevFlow'u eklemek için kullanılır. Kodu analiz eder, modül yapısını tespit eder ve _dev/ yapısını oluşturur.

**Kullanım:** `/devflow:map-codebase`

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (uygulanmaz)
Bu komut mevcut kodbaza DevFlow'u eklemek için `_dev/` yapısını **oluşturur**. Çalıştığı anda `_dev/OVERVIEW.md`, `_dev/INDEX.md`, `_dev/DURUM.md`, `_dev/MEMORY.md` ve CLAUDE.md henüz yoktur — Oturum Başlangıç Protokolü uygulanmaz, doğrudan aşağıdaki adımlarla ilerle.

### Proje Analizi (önce bunları tara)
- `README.md` (varsa)
- `package.json` / `requirements.txt` / `go.mod` vb. (bağımlılıklar)
- Kaynak kod klasör yapısı
- Config dosyaları (`.env.example`, `docker-compose` vb.)
- Mevcut test dosyaları
- Mevcut dokümanlar

### Template'ler (doküman oluştururken oku)
- `.claude/commands/devflow/templates/` klasöründeki TÜM template dosyaları (CLAUDE-MD hariç — CLAUDE.md kickoff-verify'da oluşturulur)

---

## Yapılacaklar

### 1. Projeyi Tara

Kaynak kodu incele ve şunları tespit et:
- **Teknoloji stack:** Diller, framework'ler, kütüphaneler
- **Mimari:** Klasör yapısı, katmanlar, pattern'ler
- **Modüller:** Doğal modül sınırları, sorumluluk alanları
- **Convention'lar:** Kullanılan isimlendirme, dosya organizasyonu, commit formatı
- **Test altyapısı:** Mevcut testler, test framework'ü
- **Bağımlılıklar:** Modüller arası ilişkiler

### 2. Bulgularını Kullanıcıyla Doğrula

Tespit ettiğin yapıyı kullanıcıya sun:
- "Projenizi şöyle anladım: [özet]"
- "Şu modülleri tespit ettim: [liste]"
- "Stack: [tespit edilen stack]"

Kullanıcıdan doğrulama al. Eksik veya yanlış varsa düzelt.

### 3. `_dev/` Yapısını Oluştur

`.claude/commands/devflow/templates/` klasöründeki template'leri oku ve projeye göre doldur:

> **KURAL yorumlarını koru:** Template'teki `<!-- KURAL: ... -->` yorumları üretilen dokümana **olduğu gibi aktarılır** — silinmez. Bunlar dokümanın yapısal kuralının **tek kaynağıdır** (audit-docs onları ground-truth alır). Yalnızca `[placeholder]` yer tutucuları doldurulur.

```
_dev/
├── OVERVIEW.md            # Mevcut projenin analiz sonucu
├── ILKELER.md             # Proje ilkeleri (evrensel taban; projeye-özgü alanlar prd/kickoff'ta dolar)
├── INDEX.md               # Navigasyon haritası
├── DURUM.md               # Başlangıç durumu
├── MEMORY.md              # Proje hafızası index'i (boş template; memory/ ilk öğrenimde oluşur)
├── MODULE-MAP.md          # Tespit edilen modül/feature yapısı
├── PHASES.md              # Faz Durumu tablosu boş başlar; önerilen yakın faz konularını numarasız "Sıradaki Fazlar"a yaz (konu + milestone). Numara faza girince atanır (PHASES.md → Faz Numaralandırma Kuralı)
├── QUALITY.md             # Projeye göre düzenlenmiş kalite eksenleri
├── modules/               # Tespit edilen her modül için doküman
│   ├── M1-ModulAdi.md
│   └── ...
├── phases/                # (boş — faz dokümanı discuss-phase'de oluşturulacak)
├── docs/
│   └── DECISIONS.md       # Mevcut kararlar (varsa tespit edilen)
└── tasks/
    ├── TASKS-README.md
    ├── quick/
    └── archive/
```

**ILKELER.md notu:** Evrensel taban ilkeleri template'ten gelir. "Bu Projeye Özgü" alanlarını (ufuk, öncelikli eksenler, pazarlık-konusu-olmayanlar) koddan **varsayımla doldurma** — boş bırak; bunlar prd/kickoff Q&A'sinde konuşulur.

### 4. Mevcut Sorunları/İhtiyaçları Not Al

Kullanıcıya sor:
- Bu projeye DevFlow'u neden ekliyorsun?
- Şu anda ne yapmak istiyorsun? (yeni feature, refactoring, bug fix serisi?)
- Bilinen sorunlar veya teknik borçlar var mı?

Cevapları OVERVIEW.md'ye veya ilgili dokümanlara yaz.

### 5. Git Commit & Push

Tüm oluşturulan dokümanları commit & push yap:
```
docs: map-codebase — project structure created from existing codebase
```

### 6. Sıradaki Adımı Öner

```
✅ Codebase analizi tamamlandı. _dev/ yapısı oluşturuldu.
📋 Sıradaki adım: /devflow:prd
   → PRD hazırlamak için yeni bir oturum başlat.
   → PRD tamamlandıktan sonra /devflow:kickoff (re-kickoff modu) ile devam edilecek.
```

---

## Önemli Kurallar

- Mevcut kodu değiştirme — sadece analiz et ve _dev/ oluştur
- Mevcut dokümanları (README.md vb.) silme veya üzerine yazma
- Varsayımda bulunma — emin olmadığın her şeyi kullanıcıya sor
- Mevcut convention'lara saygı göster — projenin stilini değiştirme
