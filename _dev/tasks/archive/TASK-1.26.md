# TASK-1.26: Açılış ekranı (rol seçimi + manuel davet kodu + deep link dispatcher)

**Durum:** ✅ Tamamlandı
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.07, TASK-1.08, TASK-1.25

---

## Hedef

App açılış ekranını implement et — "PT" / "Üyeyim" / "Davetim var" üç buton; "Davetim var"a basınca manuel davet kodu giriş alanı + "Davet linkim varsa otomatik tanı" hatırlatması; deep link ile gelen kullanıcı bu ekranı **atlar** ve davet kodu otomatik state'e geçer. i18n shell üzerinden TR string'ler.

---

## Bağlam

F1.1 PRD: "App açılışında 'PT' / 'Üye' / 'Davetim var' üç buton (davet linkiyle gelen üye doğrudan üye akışına girer, seçim sorulmaz)", "'Davet kodumu elle gir' alternatifi vardır (deep link çalışmadığında)". Davet linki dispatcher (TASK-1.25) bu ekranı atlayıp davet flow'una geçer.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 onboarding ekranları
- `_dev/PRD/features/03-onboarding.md` — varsa detaylı UI davranışı
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → PT "Üyeler" sekmesi vb.
- `_dev/QUALITY.md` §7 (TR yerelleştirme), §8 (PT sürtünme)
- `_dev/ILKELER.md` §En Yüksek Öncelikli Eksen #2

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. Onboarding state yönetimi (zustand veya context)**
  - `mobile/src/onboarding/store.ts` — `useOnboardingStore({ flow: 'pt' | 'member' | 'member_via_invite', invitationCode?: string, phone?: string, ... })`
  - Karar: zustand kütüphane (sade + RN uyumlu) → `pnpm -F @alpfit/mobile add zustand`
  - Dosya: `mobile/src/onboarding/store.ts`

- [ ] **2. Açılış ekranı UI**
  - `mobile/app/index.tsx` (TASK-1.05'teki placeholder'ı override et):
    - Üst: Alpfit logo placeholder + "Sürdürülebilir antrenman için" tag (i18n key)
    - 3 büyük buton: "Üyeyim", "Antrenörüm (PT)", "Davetim var"
    - "Davetim var" → modal veya inline expand "Davet kodunu gir" 6 karakter input
    - Boş durum minimal — TR sade dil
  - Dosya: `mobile/app/index.tsx`

- [ ] **3. Buton aksiyonları**
  - "Üyeyim" → `flow = 'member'` set + telefon ekranına navigate (`/auth/phone`)
  - "Antrenörüm" → `flow = 'pt'` set + telefon ekranına
  - "Davet kodu girildi (6 char valid)" → davet preview (TASK-1.24 endpoint) çağrılır; geçerliyse `flow = 'member_via_invite'` + kod kayıt + telefon ekranına
  - Dosya: `mobile/app/index.tsx` (UPDATE)

- [ ] **4. Deep link entry**
  - TASK-1.25 `app/davet/[code].tsx` → davet preview yapar + `useOnboardingStore.setState({ flow: 'member_via_invite', invitationCode })` + telefon ekranına geçer
  - Açılış ekranı **bypass** edilir
  - Dosya: `mobile/app/davet/[code].tsx` (UPDATE — TASK-1.25 placeholder'a aksiyon ekle)

- [ ] **5. Geçersiz davet kodu girişi**
  - Manuel kod 6 char ama backend `GET /invitations/:code` 404/410 dönerse → inline hata mesajı "Bu davet geçerli değil veya süresi dolmuş"
  - Hata feedback i18n key
  - Dosya: `mobile/app/index.tsx` (UPDATE)

- [ ] **6. Component testleri**
  - `mobile/app/index.test.tsx`:
    - 3 buton render edilir, doğru i18n key'ler
    - "Davetim var" tıklayınca kod input görünür
    - Kod input 6 char valid → preview çağırır (MSW veya manual fetch mock)
    - Preview success → flow state set + navigate (router mock)
    - Preview fail → hata mesajı
  - Dosya: `mobile/app/index.test.tsx` (TASK-1.05'tekini extend)

- [ ] **7. Accessibility**
  - Butonlar `accessibilityRole="button"` + `accessibilityLabel` TR
  - Kod input `accessibilityLabel="Davet kodu, 6 karakter"`

---

## Etkilenen Dosyalar

```
mobile/
├── package.json                            # GÜNCELLE (zustand)
├── app/
│   ├── index.tsx                           # GÜNCELLE
│   ├── index.test.tsx                      # GÜNCELLE
│   └── davet/[code].tsx                    # GÜNCELLE (aksiyon)
└── src/
    └── onboarding/
        └── store.ts                        # YENİ
        └── store.test.ts                   # YENİ
```

---

## Dikkat Noktaları

- **TR sade dil:** Hiçbir ekranda "Authentication", "Verification" gibi karşılığı olmayan İngilizce yok. "Üye girişi", "Doğrulama" vb.
- **PT sürtünme ölçümü ([[ilkeler]] §2):** Açılış 3 buton → tek tap; minimum ekran geçişi. Tıklama sayısını sayan analytics gelecekte (Yakın 5+).
- **API base URL:** `EXPO_PUBLIC_API_BASE_URL` env (TASK-1.05'te tanımlı); fetch wrapper helper'da kullanılır.
- **Fetch helper:** `mobile/src/api/client.ts` — base URL + JSON parse + error handling — bu task'ta basit fetch wrapper kurulur, sonraki API çağrıları kullanır.

---

## Test Kriterleri

- [ ] Component test: 5 senaryo PASS
- [ ] i18n key'leri eksiksiz (`common.role.member`, `common.role.trainer`, `common.role.invite`, `errors.invitation_invalid`)
- [ ] Snapshot testi: ekran layout snapshot
- [ ] Accessibility: screen reader önemli elementleri okur (manuel)
- [ ] Manuel cihaz testi: 3 buton tıklama akışları telefon ekranına geçer

---

## Karar Noktaları

- **State management seçimi:** zustand mı Context API mı? → zustand (lighter, action helpers).
- **Davet kodu input format:** 6 char tek input mı, 6 ayrı 1-char input mı? → Tek input + auto-uppercase + format (`XXX-XXX` mask) öneririm.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.26): add onboarding landing screen with role and invite code`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-30
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- **Onboarding store (`src/onboarding/store.ts` YENİ)** — zustand 5 (kullanıcı onayı 2026-05-30). State: `flow: 'pt' | 'member' | 'member_via_invite' | undefined`, `invitationCode`, `phone`; action'lar `selectRole` (davet kodunu temizler), `selectInvite` (flow=member_via_invite + kod), `setPhone`, `reset`. `exactOptionalPropertyTypes` açık olduğu için alanlar `| undefined` union (opsiyonel `?` değil) — reset/selectRole `undefined`'a set ediyor.
- **Açılış ekranı (`app/index.tsx` GÜNCELLE)** — TASK-1.05 placeholder'ı override. Logo (app.name) + tagline; "Üyeyim" / "Antrenörüm" / "Davetim var" üç buton. Rol butonları `selectRole` + `/auth/phone` navigate. "Davetim var" inline expand → davet kodu input (TR-güvenli `trUpper`, ASCII alfanümeriğe indirgeme, 6 char, `ABC-123` mask) + "Devam" (6 char'da aktif). Geçerli kod → `fetchInvitationPreview` → valid ise `selectInvite` + navigate; değilse inline hata (`errors:invitation_invalid`).
- **Deep link dispatcher (`app/davet/[code].tsx` GÜNCELLE)** — "Devam et" artık `selectInvite(code)` + `/auth/phone` (açılış ekranı bypass); eski `{pathname:'/', params}` TODO'su kaldırıldı.
- **i18n** — `common.json`: `role.{member,trainer,invite}` + `landing.{tagline,inviteHint,inviteCodeLabel,invitePlaceholder,inviteSubmit,checking}` (eski `landing.greeting/todayPrefix` placeholder'ları silindi). `errors.json`: `invitation_invalid`.
- **Accessibility** — butonlar `accessibilityRole="button"` + TR `accessibilityLabel`; "Davetim var" `accessibilityState.expanded`; kod input `accessibilityLabel="Davet kodu, 6 karakter"`; hata `accessibilityRole="alert"`.

**Karar Notları:**
- **State yönetimi:** zustand seçildi (kullanıcı onayı — AskUserQuestion). KVKK ekranının ertelediği "store kararı ayrı task/onay konusu" notu bu task'ta çözüldü.
- **Test konumu:** Eski `__tests__/landing-screen.test.tsx` (TASK-1.05, silinen string'leri test ediyordu) + snapshot'ı silindi; yeni test co-location ile `app/index.test.tsx`'e taşındı (kvkk/davet deseni — kullanıcı onayı).

**Test ✅** — mobile **50 PASS** (yeni: `app/index.test.tsx` 9 senaryo [3 buton render, rol navigate ×2, input expand, valid→navigate+store, 404→inline hata, <6 disabled, normalize, snapshot] + `store.test.ts` 7). `davet/[code].test.tsx` navigate/store assertion'ı güncellendi. typecheck/lint/format temiz.

**Kalan (sonraki task'lar):** `/auth/phone` ekranı TASK-1.27'de; davet kabulü (`POST /invitations/:code/accept`) profil adımında; auto-login dallanması TASK-1.33. Manuel cihaz/screen-reader testi launch öncesi (Yakın 5).

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
