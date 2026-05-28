# DURUM — Proje Dashboard

**Son Güncelleme:** [Tarih] — [son oturumun tek cümle özeti, max ~250 karakter]

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** Phase [X] — [Faz Adı]
**Milestone:** [Milestone kriteri]
**Adım:** [discuss / research / plan / verify-plan / task / verify / review]
**İlerleme:** [X]/[Y] task tamamlandı
**Faz Dokümanı:** `phases/PHASE-[X].md`

---

## Aktif Versiyon

**Versiyon:** [v0.1]
**Hedef:** [Versiyonun kısa hedefi]
**Versiyon Sonu Durumu:** içerik_fazları

<!-- Versiyon geçişlerinde güncellenir. discuss-phase versiyon sonu tespitinde bu alanı okur. -->
<!-- Değerler: içerik_fazları | teknik_borç | senaryo_testi | prd_review_bekliyor -->
<!-- - içerik_fazları: Normal faz döngüsü devam ediyor -->
<!-- - teknik_borç: Teknik borç kapatma fazı aktif -->
<!-- - senaryo_testi: Senaryo testi fazı aktif -->
<!-- - prd_review_bekliyor: Her iki sabit faz tamamlandı, prd-review bekleniyor -->

---

## Aktif Task

**Task:** TASK-[X.YY] — [Task Adı]
**Durum:** ⬜ Bekliyor / 🔄 Devam ediyor / ⏸️ Duraklatıldı
**İlerleme:** [Alt görev bilgisi veya kısa not]

---

## Task Durumu (Aktif Faz)

| # | Task | Durum |
|---|------|-------|
| X.01 | [Task Adı] | ✅ / 🔄 / ⬜ |
| X.02 | [Task Adı] | ✅ / 🔄 / ⬜ |
| X.03 | [Task Adı] | ✅ / 🔄 / ⬜ |

**Durum Kodları:** ⬜ Bekliyor | 🔄 Devam ediyor | ⏸️ Duraklatıldı | ✅ Tamamlandı | 🔴 Bloke | ❌ İptal

---

## Son Task Özetleri

> **KURAL:** Sadece son 2 task özeti tutulur, daha eskileri **gerçekten silinir** (HTML comment'e sarma, "Önceki:" prefix, üstü çizili etiket yasak — detay için git log + arşivlenmiş task dokümanı). Her özet kısa formatlı: paragraf yasak, **bullet zorunlu**, "Özet" alanı max 3 bullet.

### TASK-[X.YY] — [Tarih]

**Konu:** [Task adı]
**Durum:** ✅ Tamamlandı / 🔄 Devam ediyor
**Özet:**
- [yapılan 1, kısa]
- [yapılan 2, kısa]
- [kalan, varsa]
**Detay:** `tasks/TASK-[X.YY].md`

---

### TASK-[X.YY-1] — [Tarih]

**Konu:** [Task adı]
**Durum:** ✅ Tamamlandı
**Özet:**
- [yapılan 1]
- [yapılan 2]
**Detay:** `tasks/archive/TASK-[X.YY].md`

---

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Duraklatma Notu

<!-- Bu bölüm sadece /devflow:pause kullanıldığında doldurulur. Devam edildiğinde silinir. -->

> ⏸️ **Duraklatma yok** — Aktif çalışma devam ediyor.

<!-- Duraklatma durumunda format:
> ⏸️ **Duraklatıldı:** [tarih]
> **Adım:** [task çalıştırma / planlama / review / vb.]
> **Detay:** [Nerede kalındı, ne yapılacak]
> **Handoff:** [Task dokümanında mı, burada mı?]
-->

## Hızlı Erişim

**Aktif Task:** `tasks/TASK-[X.YY].md`
**Aktif Faz:** `phases/PHASE-[X].md`
**Task Sistemi:** `tasks/TASKS-README.md`

---

**Son Güncelleme:** [Tarih] — [son oturumun tek cümle özeti, max ~250 karakter]
