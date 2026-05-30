# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-31 — TASK-2.13 ✅. useWorkoutHistory (infinite query) + WorkoutHistoryScreen (FlatList, boş durum, isLate ikon) + WorkoutDetailScreen (okuma modu) + üye tab layout. 237 mobile test 0 hata.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 2 — Program akışı uçtan uca (M2)
**Milestone:** PT üyeye program yazar → üye görür + tamamlar → backend'e kayıt düşer → offline çalışır
**Adım:** task
**İlerleme:** verify-plan tamamlandı — 14 task dokümanı review edildi, düzeltmeler uygulandı; TASK-2.01 ile başlanacak
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

**Task:** TASK-2.14 — Mobile: Program Değişikliği Banner
**Durum:** Bekliyor
**Sonraki Adım:** Yeni oturumda `/devflow:run-task` ile TASK-2.14 başlat.

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
| 2.14 | Mobile: Program Değişikliği Banner | ⬜ Bekliyor |

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

**TASK-2.12** (2026-05-31) — Mobile: Tamamlama + Offline Senkron ✅
- `src/api/completions.ts` (YENİ): completeWorkout — POST /workout-completions, 409 sessizce return.
- `src/hooks/useCompleteWorkout.ts` (YENİ): useMutation, networkMode:'online', invalidateQueries.
- `app/workout/[programDayId].tsx`: finishState machine (idle/submitting/done/offline), success/offline toast, replace navigate, hasNavigated ref.
- 7 yeni test. 220 mobile test 0 hata.

**TASK-2.13** (2026-05-31) — Mobile: Geçmiş Sekmesi ✅
- `src/api/completions.ts`: fetchMyWorkoutHistory (GET /me/workout-completions, cursor-based) + WorkoutCompletionItem tipi eklendi.
- `src/api/programs.ts`: fetchProgramById (GET /programs/:id, 404 → null) eklendi.
- `src/hooks/useWorkoutHistory.ts` (YENİ): useInfiniteQuery, 30/sayfa, gcTime 7 gün.
- `app/home/_layout.tsx` (YENİ): Üye tab layout (Ana Sayfa + Geçmiş).
- `app/home/history.tsx` (YENİ): WorkoutHistoryScreen — FlatList infinite scroll, boş durum, isLate ikon.
- `app/workout-history/[programDayId].tsx` (YENİ): WorkoutDetailScreen — okuma modu, badge.
- 17 yeni test. 237 mobile test 0 hata.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** TASK-2.14
**Aktif Faz:** Faz 2 — Program akışı uçtan uca (M2)
**Faz Dokümanı:** [PHASE-2.md](phases/PHASE-2.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task` (TASK-2.14)
