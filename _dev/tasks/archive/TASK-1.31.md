# TASK-1.31: PT "Üyeler" sekmesi UI (Bekleyen + Aktif liste + Linki kopyala + QR)

**Durum:** ✅ Tamamlandı
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.23, TASK-1.30

---

## Hedef

PT'nin home ekranındaki "Üyeler" sekmesini implement et — tek scrollable liste, iki başlık altında: üstte "Bekleyen davetler" (varsa), altta "Aktif üyeler". "+ Üye davet et" butonu PT davet linki üretir (TASK-1.23 endpoint) ve modal'da "Linki kopyala" + "QR göster" + "İptal" sunar. Aktif üye yoksa boş durum CTA: "İlk üyeni davet et →".

---

## Bağlam

Discuss-phase: "PT 'Üyeler' sekmesi UI: Tek scrollable liste, iki başlık altında — üstte 'Bekleyen davetler (varsa)', altta 'Aktif üyeler'. Bekleyen üstte çünkü PT'nin aksiyona ihtiyacı olabilir (linki tekrar paylaş, iptal et). Aktif üye yoksa boş durum CTA: 'İlk üyeni davet et →'." F1.1 PRD: "Linki kopyala", "QR göster" (yüz yüze paylaşım için QR kod modal'ı), "Davet kabul edildiğinde PT'ye banner".

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 PT davet üretimi UI
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → PT "Üyeler" sekmesi UI

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. PT home tabs iskelet**
  - `mobile/app/(tabs)/_layout.tsx` — Expo Router tab navigator
  - Tab: "Üyeler" (bu task), "Profil" (sonraki fazlarda)
  - Auth role guard: trainer dışındakiler bu tab'a giremez (üye home farklı; sonraki fazlarda)
  - Dosya: `mobile/app/(tabs)/_layout.tsx`

- [ ] **2. `/(tabs)/members` ekran (PT)**
  - `mobile/app/(tabs)/members.tsx`
  - "+ Üye davet et" sağ üst köşe FAB veya header buton
  - İki bölüm:
    - **Bekleyen davetler:** `GET /invitations` (TASK-1.23) → liste. Her satır: kod + "Geçerlilik X gün kaldı" + "Linki paylaş" + "İptal et"
    - **Aktif üyeler:** `GET /trainers/me/members` (yeni endpoint — bu task'ta backend eklenir VEYA placeholder; karar gerek)
  - Boş durum (her iki liste boş): CTA "İlk üyeni davet et" merkez büyük buton
  - Pull-to-refresh
  - Dosya: `mobile/app/(tabs)/members.tsx`

- [ ] **3. Backend: GET /trainers/me/members endpoint**
  - Authenticated + role trainer
  - PT'nin aktif üyelerini döner: `TrainerMember where trainerId AND endedAt IS NULL` join User
  - Response: `[{ id, firstName, lastName, joinedAt }]`
  - PII yok (sadece isim — PT zaten member listesinde isim ister)
  - Dosya: `backend/src/routes/trainers-members.ts`, `.test.ts`

- [ ] **4. Davet üret modal**
  - "+ Üye davet et" → `POST /invitations` (TASK-1.23) → modal aç:
    - Kod büyük gösterilir
    - URL altında (`alpfit.app/davet/{kod}`)
    - 3 buton: "Linki kopyala" (Clipboard.setStringAsync), "QR kodu göster" (yeni modal/sayfa), "Kapat"
  - Dosya: `mobile/app/(tabs)/members/invite-modal.tsx`

- [ ] **5. QR kod modal**
  - `mobile/app/(tabs)/members/qr-modal.tsx`
  - QR library: `react-native-qrcode-svg` (`pnpm -F mobile add`)
  - URL'i QR'a kodlar; tam ekran QR + altında kod (yedek)
  - Dosya: `mobile/app/(tabs)/members/qr-modal.tsx`

- [ ] **6. Component testleri**
  - `mobile/app/(tabs)/members.test.tsx`:
    - Boş liste → "İlk üyeni davet et" CTA görünür
    - Bekleyen + aktif liste mock → her iki bölüm render
    - "Davet et" tap → invitations API mock 201 → modal açılır
    - "Linki kopyala" tap → Clipboard mock çağrıldı
    - "QR göster" tap → QR modal'a navigate
    - "İptal et" tap → DELETE /invitations/:id çağrılır, liste yenilenir
  - Dosya: `mobile/app/(tabs)/members.test.tsx`

- [ ] **7. i18n + Accessibility**
  - `members.json`: `members.section.pending`, `members.section.active`, `members.empty.cta`, `members.invite.cta`, `members.invite.copy`, `members.invite.qr`, `members.cancel`
  - Liste item'ları semantic; QR modal "Davet kodu QR kod gösterimi" label

---

## Etkilenen Dosyalar

```
mobile/
├── package.json                                        # GÜNCELLE (qrcode-svg)
├── app/(tabs)/
│   ├── _layout.tsx                                     # YENİ
│   ├── members.tsx                                     # YENİ
│   ├── members.test.tsx                                # YENİ
│   └── members/
│       ├── invite-modal.tsx                            # YENİ
│       └── qr-modal.tsx                                # YENİ
└── src/i18n/locales/tr/
    └── members.json                                    # YENİ
backend/
└── src/routes/
    ├── trainers-members.ts                             # YENİ
    └── trainers-members.test.ts                        # YENİ
```

---

## Dikkat Noktaları

- **PT sürtünme:** "+ Üye davet et" → 1 tıklama + modal'da 1 tıklama (kopyala) = 2 tıklama davet linki paylaşıma hazır. WhatsApp+Word karşılaştırma ([[ilkeler]] §En Yüksek Öncelikli Eksen #2).
- **Linki kopyala mevcut Expo Clipboard API:** `expo-clipboard` (`pnpm -F mobile add`)
- **QR library:** `react-native-qrcode-svg` New Arch uyumlu mu? README'de teyit (Araştırma §Tuzak #2).
- **Liste boş durumlar:** Sadece bekleyen var + aktif boş → bekleyen üstte + aktif başlık altında "Henüz üye yok" küçük not. Her iki boş → büyük CTA.
- **Real-time update:** Davet kabul (TASK-1.32 banner) sonrası liste yenilenir; bu task pull-to-refresh + manuel refresh, gerçek real-time TASK-1.32'de.

---

## Test Kriterleri

- [ ] 6 senaryo PASS
- [ ] Clipboard mock çağrı doğrulanır
- [ ] QR kod render edilir, içerik URL doğru
- [ ] Backend endpoint testi PASS

---

## Karar Noktaları

- **Davet üretim modal mı page mi:** Modal sade (kullanıcı yarıda iptal edebilir).
- **`pull-to-refresh` veya `useFocusEffect`?** İkisi de — focus'ta otomatik refresh + manuel pull.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.31): add pt members tab with invitation modal and qr`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-30 ✅ Tamamlandı

**Yapılanlar:**
- **Backend — `GET /trainers/me/members`** (`backend/src/routes/trainers-members.ts` YENİ + `server.ts` register): trainer-only (`ensureTrainer`), `TrainerMember where trainerId + endedAt:null + member.deletedAt:null`, `startedAt desc`. Response sadece `{ id, firstName, lastName, joinedAt }` — telefon/sağlık verisi DÖNMEZ (KVKK; test `905...` sızıntısını assert eder). `trainers-members.test.ts` 7 PASS (newest-first, boş, ended hariç, soft-deleted hariç, cross-trainer sızıntı yok, member 403, token yok 401).
- **Mobile UI** — `app/(tabs)/_layout.tsx` (YENİ tab navigator, "Üyeler") + `app/(tabs)/members.tsx` (YENİ): tek scrollable liste, üstte Bekleyen davetler (kod + "X gün kaldı" + Paylaş + İptal), altta Aktif üyeler (ad+soyad); her iki liste boş → "İlk üyeni davet et" merkez CTA. `useFocusEffect` + pull-to-refresh ile `Promise.all([listInvitations, listMembers])`. "+ Üye davet et" → `createInvitation` → InviteModal.
- **Modal'lar** — `src/components/members/InviteModal.tsx` (RN Modal, `expo-clipboard.setStringAsync(url)` → "Kopyalandı" her açılışta sıfırlanır, QR göster, Kapat) + `QrModal.tsx` (`react-native-qrcode-svg`, `<QRCode value={url} size={240} />` + kod yedeği). Modal sade (karar: yarıda iptal edilebilir).
- **API + store + i18n** — `src/api/trainers.ts` (YENİ `listMembers` → ok/unauthorized/network + `TrainerMemberItem`); `src/api/invitations.ts` (GÜNCELLE: `PendingInvitation` + `createInvitation`/`listInvitations`/`cancelInvitation`); `src/auth/session.ts` (YENİ minimal in-memory zustand store: accessToken/refreshToken/role + setSession/clear); `src/i18n/locales/tr/members.json` (YENİ) + `i18n/index.ts` namespace + `i18next.d.ts` augmentation. Gün-kalan metni i18next çoğul tuzağından kaçınmak için `{{days}}` ile geçirildi.
- **Paket** — `expo-clipboard ~56.0.3`, `react-native-qrcode-svg ^6.3.21`, `react-native-svg 15.15.4` (kullanıcı onayıyla "ikisini de kur").

**Test ✅:** mobile **77 PASS** (9 suite; `app/(tabs)/members.test.tsx` 6: boş→CTA, bekleyen+aktif iki bölüm, davet et→201→modal, kopyala→Clipboard url, QR göster→URL kodlanır, iptal→DELETE+liste tazelenir) + backend trainers-members 7 PASS. typecheck/lint/format temiz (tümü exit 0).

**Otonom Karar (kullanıcıya bildirildi):** `src/auth/session.ts` şimdilik in-memory; kalıcılık (secure storage) + otomatik giriş + gerçek role-guard token bağlama **TASK-1.33**'e ertelendi (bu task'ın kapsamı değil; ekran token'ı store'dan okur).

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
