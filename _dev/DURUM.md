# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-31 — review-phase 2 tamamlandı. 16 task ✅, 523 test, M2 uçtan uca çalışıyor. F2.1+F2.2 ✅. Adım → Faz 3 discuss.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 3 — Sürdürülebilirlik motoru + Bildirim (M3+M4) *(geçici ad — discuss-phase'de netleşir)*
**Milestone:** (discuss-phase'de belirlenecek)
**Adım:** discuss
**İlerleme:** Henüz başlamadı. Önceki: Faz 2 ✅ Tamamlandı ([PHASE-2.md](phases/PHASE-2.md))
**Faz Dokümanı:** (discuss-phase'de oluşturulacak)

---

## Aktif Versiyon

**Versiyon:** v1
**Hedef:** Trainer + Member rolleriyle sürdürülebilirlik motoru iddiasının ilk testi — kardeş (1 PT) + 3-4 öğrencisi, ~90 gün pilot.
**Versiyon Sonu Durumu:** içerik_fazları

<!-- Versiyon geçişlerinde güncellenir. discuss-phase versiyon sonu tespitinde bu alanı okur. -->
<!-- Değerler: içerik_fazları | teknik_borç | senaryo_testi | prd_review_bekliyor -->

---

## Aktif Task

**Task:** —
**Durum:** Faz 2 tamamlandı. Faz 3 henüz başlamadı.
**Sonraki Adım:** `/devflow:discuss-phase 3` — Sürdürülebilirlik motoru + Bildirim (M3+M4) kapsam tartışması.

---

## Task Durumu (Aktif Faz)

Faz 3 henüz başlamadı — task listesi discuss-phase → plan-phase oturumlarında oluşturulacak.

**Durum Kodları:** ⬜ Bekliyor | 🔄 Devam ediyor | ⏸️ Duraklatıldı | ✅ Tamamlandı | 🔴 Bloke | ❌ İptal

---

## Engelleyici Ön-Koşullar

Aşağıdaki ön-koşullar ilgili fazlar başlamadan önce çözülmüş olmalı. Discuss-phase'de fazın milestone'una bunlardan birine bağımlıysa, faz bu blocker çözülmeden başlatılmaz.

| Ön-koşul | Blocker olduğu faz konusu | Notlar |
|---|---|---|
| 🔴 **KVKK aydınlatma + sağlık verisi açık rıza metni** (TR, hukuki danışman review'lu) | Yakın 4 (PT dashboard + Sağlık verisi) | Ölçüm + yemek günlüğü bu metin olmadan tamamlanamaz. `KVKK.md` boş şablon olarak duruyor. `/devflow:prd-refine` veya hukuki danışmanla erken oturum gerekir. |
| 🔴 **Çekirdek 50 egzersiz listesi + videolar** | Yakın 5 (UAT + Pilot launch) | Placeholder ile Yakın 2'de program builder'a başlanabilir, ama launch öncesi liste + video kararı şart. Kardeşle ortak liste + video çekim/lisans kararı. Bütçe + zaman karar gerekir. |
| 🟡 **Kardeşin "mevcut WhatsApp+Word program yazma süresi" baseline ölçümü** | Yakın 2 (Program akışı uçtan uca) | [[ilkeler]] §En Yüksek Öncelikli Eksen #2 "2× hız" hedefinin doğrulanması için gerekli. Basit ölçüm: kardeşten "yeni üye için kaç dakika sürdü" notu — pahalı değil ama unutulmasın. |

---

## Son Task Özetleri

> **KURAL:** Sadece son 2 task özeti tutulur, daha eskileri **gerçekten silinir** (HTML comment'e sarma, "Önceki:" prefix, üstü çizili etiket yasak — detay için git log + arşivlenmiş task dokümanı). Her özet kısa formatlı: paragraf yasak, **bullet zorunlu**, "Özet" alanı max 3 bullet.

**review-phase 2** (2026-05-31) — Faz 2 ✅ Tamamlandı
- Retrospektif + kalite kontrol yazıldı. F2.1+F2.2 ✅, 523 test, M2 milestone karşılandı.
- 3 bilgi düzeyi güvenlik borcu + 10 simülatör UAT sonraki fazda kapatılacak.

**verify-phase 2** (2026-05-31, yeniden — TASK-2.16 sonrası) — 12/22 otonom ✅
- 523 test ✅, lint/typecheck/format temiz. 12 senaryo otonom, 10 simülatör senaryosu ertelendi.
- Güvenlik: TASK-2.16 düzeltmeleri doğrulandı; 3 bilgi düzey bulgu kalıyor (blokaj değil).

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** (yok — Faz 3 henüz başlamadı)
**Aktif Faz:** Faz 3 — Sürdürülebilirlik motoru + Bildirim (M3+M4) *(discuss-phase'de açılacak)*
**Önceki Faz:** [PHASE-2.md](phases/PHASE-2.md) ✅
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:discuss-phase 3` — kapsam tartışması
