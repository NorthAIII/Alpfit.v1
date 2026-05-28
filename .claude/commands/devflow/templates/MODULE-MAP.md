# MODULE-MAP — Modül ve Feature Haritası

**Amaç:** Projenin modüler yapısını ve feature haritasını özetlemek
**Ne zaman okunmalı:** Planlama ve review sırasında
**Not:** Modül detayları `modules/` klasöründeki ayrı dosyalardadır. Bu doküman sadece genel harita ve matristir.

---

## Modül Haritası

```
[PROJE_ADI]
├── M1: [Modül Adı]
│   ├── F1.1: [Feature Adı]  → Phase [X]
│   ├── F1.2: [Feature Adı]  → Phase [X]
│   └── F1.3: [Feature Adı]  → Phase [Y]
├── M2: [Modül Adı]
│   ├── F2.1: [Feature Adı]  → Phase [X]
│   └── F2.2: [Feature Adı]  → Phase [Y]
└── M3: [Modül Adı]
    ├── F3.1: [Feature Adı]  → Phase [Y]
    └── F3.2: [Feature Adı]  → Phase [Z]
```

---

## Modüller Arası Bağımlılıklar

```
[M1] → [M2] → [M3]
```
[Bağımlılık açıklamaları]

---

## Modül Dokümanları

| Modül | Doküman | Açıklama |
|-------|---------|----------|
| M1 | `modules/M1-[Ad].md` | [Kısa açıklama] |
| M2 | `modules/M2-[Ad].md` | [Kısa açıklama] |
| M3 | `modules/M3-[Ad].md` | [Kısa açıklama] |

---

## Feature-Faz Matrisi

| Feature | Modül | Versiyon | Faz | Durum |
|---------|-------|----------|-----|-------|
| F1.1: [Feature Adı] | M1 | v0.1 | Phase 1 | ✅ / 🔄 / ⬜ |
| F1.2: [Feature Adı] | M1 | v0.1 | Phase 1 | ⬜ |
| F2.1: [Feature Adı] | M2 | v0.1 | Phase 1 | ⬜ |
| F1.3: [Feature Adı] | M1 | v0.5 | Phase 2 | ⬜ |
| F3.1: [Feature Adı] | M3 | v1.0 | — | ⬜ |

**Durum simgeleri:**
- ⬜ **Bekliyor** — Fazı henüz başlamadı
- 🔄 **Devam ediyor** — Fazı aktif, task'lar çalışılıyor (discuss-phase'de faz başlatıldığında set edilir)
- 🟡 **Kısmen tamamlandı** — Bazı task'ları bitti ama tamamı değil (bazıları sonraki fazlara kaldı)
- ✅ **Tamamlandı** — Tüm kabul kriterleri karşılandı, UAT'tan geçti (review-phase'de set edilir)

> Modül detayları (sorumluluk, feature kabul kriterleri, edge case'ler) → `modules/MX-ModulAdi.md`
> Versiyon sütunu PRD'deki VERSIONS.md'den aktarılır. Faz sütunu sadece planlanmış fazlar için doldurulur, henüz planlanmamış feature'lar "—" kalır.

---

**Son Güncelleme:** [Tarih]
