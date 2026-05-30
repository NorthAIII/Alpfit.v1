# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.32 ✅: Davet kabul in-app banner + liste real-time. Backend `GET /trainers/me/events?since` (trainer-only, kaynak TrainerMember: startedAt>since + soft-delete hariç; `{type,memberId,memberFirstName,occurredAt}`; geçersiz since→400; AuditLog DEĞİL — DECISIONS). Mobile event katmanı: `src/api/trainers.ts` listPtEvents + `src/events/banner-store.ts` (zustand dedup+overflow) + `use-pt-events.ts` (foreground-only polling 20sn + backoff). UI: `in-app-banner.tsx` (slide-down + 4sn auto-dismiss) + `banner-stack.tsx`; `members.tsx` entegrasyon (refresh + yeni üye 1sn highlight). Yeni mobile i18n namespace `notifications`. Backend 167 PASS + mobile 89 PASS; typecheck/lint/format temiz. Lineer sıradaki TASK-1.33 (30 gün cihaz hatırlama + auto-login).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 32/34 task tamam (TASK-1.28 sıra dışı); lineer sıradaki TASK-1.33 (30 gün cihaz hatırlama + auto-login)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)

---

## Aktif Versiyon

**Versiyon:** v1
**Hedef:** Trainer + Member rolleriyle sürdürülebilirlik motoru iddiasının ilk testi — kardeş (1 PT) + 3-4 öğrencisi, ~90 gün pilot.
**Versiyon Sonu Durumu:** içerik_fazları

<!-- Versiyon geçişlerinde güncellenir. discuss-phase versiyon sonu tespitinde bu alanı okur. -->
<!-- Değerler: içerik_fazları | teknik_borç | senaryo_testi | prd_review_bekliyor -->

---

## Aktif Task

**Task:** Yok — TASK-1.32 ✅ tamamlandı (commit edildi). Lineer sıradaki TASK-1.33 (30 gün cihaz hatırlama + secure storage + auto-login) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.33` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 32 tamamlandı (TASK-1.28 sıra dışı). Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

| # | Task | Durum |
|---|------|-------|
| 1.01 | Monorepo iskeleti | ✅ Tamamlandı |
| 1.02 | Backend Fastify iskeleti + zod env + healthz | ✅ Tamamlandı |
| 1.03 | Prisma 7 + adapter-pg + ilk migration + generate smoke | ✅ Tamamlandı |
| 1.04 | Backend test altyapısı (Vitest + per-suite Postgres) | ✅ Tamamlandı |
| 1.05 | Mobile Expo SDK 56 + Expo Router iskelet | ✅ Tamamlandı |
| 1.06 | TR locale util + lint kuralı (toLowerCase yasağı) | ✅ Tamamlandı |
| 1.07 | i18n shell (i18next mobile + backend, TR-only) | ✅ Tamamlandı |
| 1.08 | Mobile test altyapısı (Jest + RTL + MSW) | ✅ Tamamlandı |
| 1.09 | CI PR pipeline (GitHub Actions: test + lint + typecheck) | ✅ Tamamlandı |
| 1.10 | Staging deploy (shared VPS — docker-compose + bunker-nginx + GH Actions) | ✅ Tamamlandı |
| 1.11 | Backend Sentry + PII scrubber + KVKK test | ✅ Tamamlandı |
| 1.12 | Mobile Sentry crash reporting + PII scrubber | ✅ Tamamlandı |
| 1.13 | 3 rol veri modeli (User + role enum + ilişki tabloları) | ✅ Tamamlandı |
| 1.14 | KVKK consent schema + audit log | ✅ Tamamlandı |
| 1.15 | Soft delete + 30 gün retention job | ✅ Tamamlandı |
| 1.16 | Backblaze B2 yedek + restore drill prosedürü | ✅ Tamamlandı |
| 1.17 | Mock SMS provider interface + dev_otp_log | ✅ Tamamlandı |
| 1.18 | OTP send endpoint (rate limit + Redis) | ✅ Tamamlandı |
| 1.19 | OTP verify endpoint (brute force 5→15dk kilit) | ✅ Tamamlandı |
| 1.20 | JWT access token + auth middleware + profil create | ✅ Tamamlandı |
| 1.21 | Refresh token rotation (opaque 30 gün + aile + replay detection) | ✅ Tamamlandı |
| 1.22 | Logout + tüm cihazlardan çıkış endpoint'leri | ✅ Tamamlandı |
| 1.23 | PT davet linki üretim endpoint (+ liste + iptal) | ✅ Tamamlandı |
| 1.24 | Davet kabul + preview endpoint (PT-Member ilişki) | ✅ Tamamlandı |
| 1.25 | M1 Auth backend (deep link) | ✅ Tamamlandı |
| 1.26 | Açılış ekranı (rol seçimi + manuel davet kodu + deep link dispatcher) | ✅ Tamamlandı |
| 1.27 | M1 Mobile UI (telefon girişi) | ✅ Tamamlandı |
| 1.28 | KVKK rıza ekranı (2 tickbox + placeholder metin) | ✅ Tamamlandı (sıra dışı) |
| 1.29 | OTP girişi ekranı (timer + yeniden gönder + dev lookup) | ✅ Tamamlandı |
| 1.30 | Profil oluşturma ekranı (üye + PT) | ✅ Tamamlandı |
| 1.31 | PT "Üyeler" sekmesi UI (Bekleyen + Aktif + Linki kopyala + QR) | ✅ Tamamlandı |
| 1.32 | Davet kabul banner + liste real-time (in-app polling) | ✅ Tamamlandı |
| 1.33–1.34 | M1 Mobile UI + akış + smoke (auto-login, e2e smoke) | ⬜ Bekliyor (2) |

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

### TASK-1.32 — Davet kabul banner + liste real-time (in-app polling) (2026-05-30) ✅

- **Backend (`trainers-events.ts` YENİ + `server.ts`)** — `GET /trainers/me/events?since=<ISO>` trainer-only; kaynak **`TrainerMember`** (`startedAt > since`, `endedAt:null`, soft-delete hariç), `{ type:'invitation_accepted', memberId, memberFirstName, occurredAt }` newest-first. `since` opsiyonel; geçersizse 400. **Kaynak kararı:** AuditLog DEĞİL — kabul eden üyenin hash'ini tutar (PT'nin değil) + trainerId/isim yok → PT-scoped sorgu yapılamaz (DECISIONS.md TASK-1.32). `trainers-events.test.ts` 8 PASS.
- **Mobile event katmanı** — `src/api/trainers.ts` `listPtEvents`; `src/events/banner-store.ts` (zustand: dedup `memberId:occurredAt` + MAX_VISIBLE 5 + overflow); `src/events/use-pt-events.ts` (`useFocusEffect` foreground-only polling 20sn + baseline=focus + 1s→5s→30s backoff). UI: `in-app-banner.tsx` (Animated slide-down + 4sn auto-dismiss, `useNativeDriver:false`) + `banner-stack.tsx` ("+N daha" rozeti). `members.tsx` entegrasyon: yeni event → `load('refresh')` + yeni üye 1sn highlight.
- **i18n + test** — mobile yeni `notifications` namespace (overflow `{{n}}` çoğul-tuzak kaçışı [[tr-locale]]). Mobile **89 PASS** (banner-store 4 + use-pt-events 4 + in-app-banner 3 + members +1) + backend **167 PASS**; typecheck/lint/format temiz.

### TASK-1.31 — PT "Üyeler" sekmesi UI (Bekleyen + Aktif + Linki kopyala + QR) (2026-05-30) ✅

- **Backend (`backend/src/routes/trainers-members.ts` YENİ + `server.ts`)** — `GET /trainers/me/members` trainer-only (`ensureTrainer`); `TrainerMember where trainerId + endedAt:null + member.deletedAt:null`, `startedAt desc`. Response sadece `{ id, firstName, lastName, joinedAt }` — telefon/sağlık verisi DÖNMEZ (KVKK; test sızıntı assert'i). `trainers-members.test.ts` 7 PASS (newest-first/boş/ended hariç/soft-deleted hariç/cross-trainer yok/member 403/token yok 401).
- **Mobile UI + modal'lar** — `app/(tabs)/members.tsx` + `_layout.tsx` (YENİ): tek scrollable liste — üstte Bekleyen davetler (kod + "X gün kaldı" + Paylaş + İptal), altta Aktif üyeler; boş → "İlk üyeni davet et" CTA. `useFocusEffect` + pull-to-refresh ile `Promise.all([listInvitations, listMembers])`. `src/components/members/InviteModal.tsx` (Clipboard kopyala + "Kopyalandı") + `QrModal.tsx` (`react-native-qrcode-svg`, `<QRCode value={url}>`). Gün-kalan i18next çoğul tuzağı için `{{days}}` ile geçirildi.
- **API + store + paket + i18n** — `src/api/trainers.ts` (YENİ `listMembers`) + `invitations.ts` (create/list/cancel GÜNCELLE) + `src/auth/session.ts` (YENİ in-memory zustand store). Paketler: expo-clipboard ~56.0.3, react-native-qrcode-svg ^6.3.21, react-native-svg 15.15.4. members.json i18n + namespace + `i18next.d.ts` augmentation. Test ✅ mobile **77 PASS** (members.test.tsx 6) + backend 7; typecheck/lint/format temiz. **Otonom karar:** session.ts in-memory; kalıcılık + role-guard TASK-1.33'e ertelendi (kullanıcıya bildirildi).

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.32 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.33` (30 gün cihaz hatırlama + auto-login)
