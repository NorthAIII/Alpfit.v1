# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-31 — TASK-3.11 tamamlandı. expo-notifications kurulumu, usePushToken + useNotificationPermission hook'ları, NotificationPermissionModal + DisabledBanner, useCompleteWorkout izin akışı, logout token silme. 264 yeşil. Adım → run-task 3.12.

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 3 — Sürdürülebilirlik Motoru + Bildirim (M3 + M4)
**Milestone:** Streak doğru hesaplanır; telafi penceresi açılır/kapanır; T+2 push gider; T+7 PT uyarısı gider; sabah reminder çalışır; bildirim izni ilk antrenman bitince istenir
**Adım:** task
**İlerleme:** plan-phase tamamlandı (14 task). Önceki: Faz 2 ✅ ([PHASE-2.md](phases/PHASE-2.md))
**Faz Dokümanı:** [PHASE-3.md](phases/PHASE-3.md)

---

## Aktif Versiyon

**Versiyon:** v1
**Hedef:** Trainer + Member rolleriyle sürdürülebilirlik motoru iddiasının ilk testi — kardeş (1 PT) + 3-4 öğrencisi, ~90 gün pilot.
**Versiyon Sonu Durumu:** içerik_fazları

<!-- Versiyon geçişlerinde güncellenir. discuss-phase versiyon sonu tespitinde bu alanı okur. -->
<!-- Değerler: içerik_fazları | teknik_borç | senaryo_testi | prd_review_bekliyor -->

---

## Aktif Task

**Task:** TASK-3.12
**Durum:** TASK-3.11 ✅ tamamlandı. TASK-3.12 çalıştırmaya hazır.
**Sonraki Adım:** `/devflow:run-task` — TASK-3.12: Mobile: Ayarlar > Bildirimler ekranı.

---

## Task Durumu (Aktif Faz)

| # | Task | Durum | Açıklama |
|---|------|-------|----------|
| 3.01 | TASK-3.01 | ✅ Tamamlandı | Faz 2 teknik borç kapatma |
| 3.02 | TASK-3.02 | ✅ Tamamlandı | M3+M4 DB şeması (4 yeni tablo) |
| 3.03 | TASK-3.03 | ✅ Tamamlandı | Streak motoru: processWorkoutCompletion |
| 3.04 | TASK-3.04 | ✅ Tamamlandı | BullMQ + Expo Push altyapısı |
| 3.05 | TASK-3.05 | ✅ Tamamlandı | Nightly streak sıfırlama job |
| 3.06 | TASK-3.06 | ✅ Tamamlandı | Push token backend API |
| 3.07 | TASK-3.07 | ✅ Tamamlandı | Bildirim tercihleri backend API |
| 3.08 | TASK-3.08 | ✅ Tamamlandı | Sabah reminder push job |
| 3.09 | TASK-3.09 | ✅ Tamamlandı | Comeback T+2 push job |
| 3.10 | TASK-3.10 | ✅ Tamamlandı | Comeback T+7 PT uyarısı + T+14 flag + dismiss |
| 3.11 | TASK-3.11 | ✅ Tamamlandı | Mobile: push token + bildirim izni akışı |
| 3.12 | TASK-3.12 | ⬜ Bekliyor | Mobile: bildirim tercihleri ekranı |
| 3.13 | TASK-3.13 | ⬜ Bekliyor | Streak göstergesi backend + mobile UI |
| 3.14 | TASK-3.14 | ⬜ Bekliyor | T+7 PT in-app banner backend + mobile UI |

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

**TASK-3.11** (2026-05-31) — Mobile: push token kaydı + bildirim izni akışı ✅
- usePushToken (mount token + backend), useNotificationPermission (izin state), NotificationPermissionModal (açıklama + İzin Ver/Şimdi Değil), NotificationDisabledBanner (haftada bir, AsyncStorage).
- useCompleteWorkout: showPermissionModal state + AsyncStorage flag. settings.tsx: logout öncesi clearPushToken. home + tabs layout: usePushToken mount.
- 13 yeni test. 264 yeşil (mobile suite).

**TASK-3.10** (2026-05-31) — Comeback T+7 PT uyarısı + T+14 flag + dismiss ✅
- notification.service.ts: sendComebackT7Pt (ptT7AlertedAt idempotency, re-aktivasyon, trainer bulma, PT push) + setT14Flag (t14FlaggedAt, push yok). worker case'ler güncellendi.
- routes/pt-alerts.ts: PATCH /pt/member-alerts/:memberId/dismiss-t7 (ownership + ptT7DismissedAt). server.ts'e register eklendi.
- 12 yeni test. 308 yeşil (backend suite).

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** TASK-3.12 — Mobile: Ayarlar > Bildirimler ekranı
**Aktif Faz:** [PHASE-3.md](phases/PHASE-3.md) — Faz 3: Sürdürülebilirlik Motoru + Bildirim (M3+M4)
**Önceki Faz:** [PHASE-2.md](phases/PHASE-2.md) ✅
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task` — TASK-3.12: Mobile: Ayarlar > Bildirimler ekranı
