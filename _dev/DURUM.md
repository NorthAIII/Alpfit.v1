# DURUM — Proje Dashboard

**Son Güncelleme:** 2026-05-30 — TASK-1.33 ✅: 30 gün cihaz hatırlama + auto-login. `expo-secure-store ~56.0.4`; `src/auth/storage.ts` (refresh token+rol Keychain/Keystore, access saklanmaz), `src/api/client.ts` (refresh TEK-uçuş singleton + `authedFetch` 401-interceptor + `fetchMe`), `src/auth/auth-actions.ts` (`persistLogin`/`bootstrapSession`/`homePathForRole`), `session.ts` `clearSession`; logout/logout-all api; login persisti bağlandı (otp+profile artık session store'a YAZIYOR); `_layout.tsx` boot gate (in-app overlay); `(tabs)/settings.tsx` Ayarlar sekmesi (çıkış 2-adım onay); i18n `settings`. Reuse: `GET /auth/me` (yeni backend yok), session.ts extend. Mobile 110 PASS (+21); backend dokunulmadı (167); typecheck/lint/format temiz. Lineer sıradaki TASK-1.34 (uçtan uca smoke).

<!-- KURAL: Bu satır her oturum sonunda ÜZERİNE YAZILIR — tek satır, tek cümle. "Önceki:" / "Eski:" prefix ile kümülatif yığma YASAK; HTML comment'e sarma da yasak (CLAUDE.md → Doküman Disiplini). Tarih + kısa özet yeterli; detay için git log + ilgili PHASE/TASK dokümanları. -->

---

## Aktif Faz

**Faz:** 1 — Çekirdek altyapı + Auth (M0 + M1)
**Milestone:** PT ve üye telefon + mock SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye otomatik bağlanır; KVKK rızası (placeholder metinli iki-tickbox ekran) alınır; backend unit+integration + mobile component test altyapısı kurulu; CI yeşil (test+lint+typecheck); main → staging otomatik deploy çalışıyor; backend error tracking + mobile crash reporting kurulu; 3 rol veri modeli (Member + Trainer + Gym Owner) yerleşti; TR locale temeli ayakta.
**Adım:** task
**İlerleme:** 33/34 task tamam (TASK-1.28 sıra dışı); lineer sıradaki TASK-1.34 (uçtan uca smoke testi)
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

**Task:** Yok — TASK-1.33 ✅ tamamlandı (commit edildi). Lineer sıradaki TASK-1.34 (uçtan uca smoke testi: Mock SMS → OTP → profil → bağlanma) henüz başlatılmadı.
**Durum:** —
**Sonraki Adım:** Yeni oturumda `/devflow:run-task TASK-1.34` ile başla.

---

## Task Durumu (Aktif Faz)

34 task yazıldı, 33 tamamlandı (TASK-1.28 sıra dışı). Detay listesi `phases/PHASE-1.md` → Task Listesi tablosunda.

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
| 1.33 | 30 gün cihaz hatırlama (secure storage + auto-login) | ✅ Tamamlandı |
| 1.34 | Uçtan uca smoke testi (Mock SMS → OTP → profil → bağlanma) | ⬜ Bekliyor |

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

### TASK-1.33 — 30 gün cihaz hatırlama (secure storage + auto-login) (2026-05-30) ✅

- **Kalıcılık + client katmanı** — `expo-secure-store ~56.0.4` (app.config plugin). `src/auth/storage.ts` (YENİ): refresh token + rol Keychain/Keystore'da; **access token saklanmaz** (kısa ömürlü, her boot'ta refresh). `src/api/client.ts` (YENİ): `refreshAccessToken` **TEK-uçuş singleton** (eşzamanlı 401'ler tek refresh paylaşır → backend replay tetiklenmez), `authedFetch` (401→bir kez refresh+retry), `fetchMe`/`requestMe`. `src/auth/auth-actions.ts` (YENİ): `persistLogin` (rol biliniyorsa direkt, OTP login'de `/auth/me` ile çözer), `bootstrapSession` (refresh→/me→role), `homePathForRole`. `session.ts` `clearSession`; `api/auth.ts` logout/logout-all.
- **UI + bağlama** — login persisti **bağlandı**: otp.tsx (logged_in) + profile.tsx (created) artık session store'a YAZIYOR (önceden hiç yazılmıyordu — members tab token boştu). `_layout.tsx` boot gate (in-app "Yükleniyor" overlay; `expo-splash-screen` EKLENMEDİ). `(tabs)/settings.tsx` (YENİ) + Ayarlar sekmesi: çıkış + tüm cihazlardan çıkış, 2-adım satır-içi onay. i18n `settings` namespace.
- **Reuse + test** — `GET /auth/me` (TASK-1.20) yeniden kullanıldı (yeni backend yok); `auth-store.ts` yerine `session.ts` extend; client.ts interceptor kuruldu ama mevcut trainer/invitation çağrıları henüz authedFetch'e taşınmadı (sonraki faz). `test/mocks/expo-secure-store.ts` (bellek-içi). Mobile **110 PASS** (+21: storage 5 + client 7 + auth-actions 6 + settings 3); backend dokunulmadı (167); typecheck/lint/format temiz.

### TASK-1.32 — Davet kabul banner + liste real-time (in-app polling) (2026-05-30) ✅

- **Backend (`trainers-events.ts` YENİ + `server.ts`)** — `GET /trainers/me/events?since=<ISO>` trainer-only; kaynak **`TrainerMember`** (`startedAt > since`, `endedAt:null`, soft-delete hariç), `{ type:'invitation_accepted', memberId, memberFirstName, occurredAt }` newest-first. `since` opsiyonel; geçersizse 400. **Kaynak kararı:** AuditLog DEĞİL — kabul eden üyenin hash'ini tutar (PT'nin değil) + trainerId/isim yok → PT-scoped sorgu yapılamaz (DECISIONS.md TASK-1.32). `trainers-events.test.ts` 8 PASS.
- **Mobile event katmanı** — `src/api/trainers.ts` `listPtEvents`; `src/events/banner-store.ts` (zustand: dedup `memberId:occurredAt` + MAX_VISIBLE 5 + overflow); `src/events/use-pt-events.ts` (`useFocusEffect` foreground-only polling 20sn + baseline=focus + 1s→5s→30s backoff). UI: `in-app-banner.tsx` (Animated slide-down + 4sn auto-dismiss, `useNativeDriver:false`) + `banner-stack.tsx` ("+N daha" rozeti). `members.tsx` entegrasyon: yeni event → `load('refresh')` + yeni üye 1sn highlight.
- **i18n + test** — mobile yeni `notifications` namespace (overflow `{{n}}` çoğul-tuzak kaçışı [[tr-locale]]). Mobile **89 PASS** (banner-store 4 + use-pt-events 4 + in-app-banner 3 + members +1) + backend **167 PASS**; typecheck/lint/format temiz.

<!-- KURAL: Sadece son 2 task özeti tutulur, daha eskileri silinir (gerçek silme — HTML comment yasak). -->
<!-- KURAL: Sadece aktif fazın task'leri gösterilir. Geçmiş fazların bilgileri phases/ klasöründedir. -->
<!-- KURAL: "Son Tamamlanan Faz", "Son Tamamlanan Sprint" gibi ek özet bölümleri EKLEME — faz durum özeti PHASES.md'de, faz detayları PHASE-N.md'de. DURUM yalnızca aktif durum + son 2 task özeti. -->
<!-- KURAL: Faz alt-fazlarının (verify-plan/plan/research/discuss) ayrı oturum özetlerini DURUM'a yazma — onlar faz dokümanına ait. -->

## Hızlı Erişim

**Aktif Task:** Yok — TASK-1.33 ✅ tamamlandı
**Aktif Faz:** Faz 1 — Çekirdek altyapı + Auth (M0 + M1)
**Faz Dokümanı:** [PHASE-1.md](phases/PHASE-1.md)
**Task Sistemi:** `tasks/TASKS-README.md`
**Sıradaki:** `/devflow:run-task TASK-1.34` (uçtan uca smoke testi)
