# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-31 — verify-phase 2 başlatıldı. 519 test ✅, güvenlik ✅; lint (35 hata) + format (25 dosya) + backend typecheck (2 hata) CI fail. TASK-2.15 açıldı — düzeltme sonrası UAT tekrar.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 2 — Program akışı uçtan uca (M2)
**Milestone:** PT üyeye program yazar → üye görür + tamamlar → backend'e kayıt düşer → offline çalışır
**Adım:** task (CI düzeltme)
**İlerleme:** 14/15 task tamamlandı. TASK-2.15 CI kalite düzeltmesi → ardından verify-phase 2 yeniden.
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

**Task:** TASK-2.15 — CI Kalite: Lint + Format + Backend Typecheck
**Durum:** ⬜ Bekliyor
**Sonraki Adım:** `/devflow:run-task TASK-2.15` → düzeltme sonrası `/devflow:verify-phase 2` yeniden.

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
| 2.15 | CI Kalite: Lint + Format + Backend Typecheck | ⬜ Bekliyor |

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

**TASK-2.14** (2026-05-31) — Mobile: Program Değişikliği Banner ✅
- `shared/src/schemas/program.ts`: `hasUnreadUpdate: z.boolean().optional()` eklendi.
- `mobile/test/mocks/async-storage.ts` (YENİ): In-memory AsyncStorage test mock'u + jest config + setup reset.
- `src/stores/memberBannerStore.ts` (YENİ): Zustand session banner state.
- `src/hooks/useMemberHome.ts`: `useProgramChangedBanner` hook — AsyncStorage dismiss persist, yeni publish → banner tekrar.
- `app/home/index.tsx`: Nötr mavi banner UI ("ℹ️ Programında güncelleme var") + ✕ dismiss.
- 14 yeni test. 251 mobile test 0 hata.

**verify-phase 2** (2026-05-31) — Otomatik kontroller ⚠️ kısmi
- 519 test ✅, güvenlik ✅. Lint 35 hata + format 25 dosya + backend typecheck 2 hata → TASK-2.15.
- 19 UAT senaryosu hazırlandı (faz dokümanında). TASK-2.15 sonrası UAT tekrar.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** TASK-2.15 — CI kalite düzeltmesi
**Aktif Faz:** Faz 2 — Program akışı uçtan uca (M2)
**Faz Dokümanı:** [PHASE-2.md](phases/PHASE-2.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-2.15` → ardından `/devflow:verify-phase 2`
