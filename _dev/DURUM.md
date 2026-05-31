# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-31 — verify-phase 2 yeniden tamamlandı. 12/22 UAT otonom ✅; 10 simülatör senaryosu ertelendi (simülatör yok). Güvenlik: TASK-2.16 düzeltmeleri doğrulandı. Adım → review.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 2 — Program akışı uçtan uca (M2)
**Milestone:** PT üyeye program yazar → üye görür + tamamlar → backend'e kayıt düşer → offline çalışır
**Adım:** review
**İlerleme:** 16/16 task tamamlandı. verify-phase 2 tamamlandı — 12/22 otonom ✅, 10 simülatör ertelendi.
**Faz Dokümanı:** [PHASE-2.md](phases/PHASE-2.md)

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
**Durum:** Tüm task'lar tamamlandı
**Sonraki Adım:** `/devflow:review-phase 2` — faz review ve retrospektif.

---

## Task Durumu (Aktif Faz)

| # | Task | Durum |
|---|------|-------|
| 2.01 | DB Schema + Migration + Seeder + Shared Zod | ✅ Tamamlandı |
| 2.02 | Exercises API | ✅ Tamamlandı |
| 2.03 | Programs API | ✅ Tamamlandı |
| 2.04 | WorkoutCompletions API | ✅ Tamamlandı |
| 2.05 | Mobile: TanStack Query + Offline Persist | ✅ Tamamlandı |
| 2.06 | Mobile: Exercises Hook + Bottom Sheet | ✅ Tamamlandı |
| 2.07 | Mobile: Builder Giriş + Şablon Çatısı | ✅ Tamamlandı |
| 2.08 | Mobile: Builder Egzersiz Listesi + ↑↓ | ✅ Tamamlandı |
| 2.09 | Mobile: Builder Auto-save + Publish + Kopyalama | ✅ Tamamlandı |
| 2.10 | Mobile: Üye Ana Ekranı Layout | ✅ Tamamlandı |
| 2.11 | Mobile: Antrenman Ekranı + Video Modal | ✅ Tamamlandı |
| 2.12 | Mobile: Tamamlama + Offline Senkron | ✅ Tamamlandı |
| 2.13 | Mobile: Geçmiş Sekmesi | ✅ Tamamlandı |
| 2.14 | Mobile: Program Değişikliği Banner | ✅ Tamamlandı |
| 2.15 | CI Kalite: Lint + Format + Backend Typecheck | ✅ Tamamlandı |
| 2.16 | Backend güvenlik düzeltmeleri (verify-phase bulgusu) | ✅ Tamamlandı |

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

**verify-phase 2** (2026-05-31, yeniden — TASK-2.16 sonrası) — 12/22 otonom ✅
- 523 test ✅, lint/typecheck/format temiz. 12 senaryo otonom, 10 simülatör senaryosu ertelendi.
- Güvenlik: TASK-2.16 düzeltmeleri doğrulandı; 3 bilgi düzey bulgu kalıyor (blokaj değil).

**TASK-2.16** (2026-05-31) — Backend güvenlik düzeltmeleri ✅
- `completeWorkout` ownership guard, `publishProgram` status guard, `patchProgram` soft-delete exercise check.
- 4 yeni test eklendi; 231 backend test ✅, lint temiz.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** (yok — tüm task'lar tamamlandı)
**Aktif Faz:** Faz 2 — Program akışı uçtan uca (M2)
**Faz Dokümanı:** [PHASE-2.md](phases/PHASE-2.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:review-phase 2` — faz review ve retrospektif
