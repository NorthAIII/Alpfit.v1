# TASK-1.30: Profil oluşturma ekranı (üye + PT)

**Durum:** ✅ Tamamlandı
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.20, TASK-1.28, TASK-1.29

---

## Hedef

Yeni kullanıcılar için profil oluşturma ekranını implement et — ortak form: isim + soyisim (zorunlu), profil fotoğrafı (opsiyonel UI-only, upload backend Yakın 5'te); PT için ek opsiyonel alanlar: çalıştığı spor salonu + sertifika notu (opsiyonel serbest metin). "Hesabı oluştur" → `POST /auth/profile` (TASK-1.20) çağrılır, başarılı response'ta JWT + refresh + invitation accept (eğer flow `member_via_invite` ise — TASK-1.24) tetiklenir, home ekranına geçer.

---

## Bağlam

F1.1 PRD: "Telefon doğrulandıktan sonra: isim (zorunlu) + soyisim (zorunlu) + profil fotoğrafı (opsiyonel)", "PT profili: isim + soyisim (zorunlu), çalıştığı spor salonu (opsiyonel), sertifika notu (opsiyonel)". Discuss-phase Kapsam Dışı'nda: "Üye profil fotoğrafı upload backend altyapısı — bu fazda file upload backend kurulmaz, sadece UI'da alan görünür ama yüklenmesi v1.5'e ertelenir".

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 profil
- `_dev/phases/PHASE-1.md` — Kapsam Dışı (profil foto upload)
- `_dev/QUALITY.md` §7, §8

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. `/auth/profile` ekran route**
  - `mobile/app/auth/profile.tsx`
  - Header: "Hesabını oluştur"
  - Form alanları (üye + PT ortak):
    - İsim (TextInput, zorunlu, max 50 char)
    - Soyisim (TextInput, zorunlu, max 50 char)
    - Profil fotoğrafı (avatar circle, "Ekle" buton — UI-only, tap edince "Profil fotoğrafı v1.5'te eklenecek" toast veya sessiz disable)
  - PT-only alanlar (flow `pt` ise göster):
    - Çalıştığı spor salonu (opsiyonel TextInput, max 100 char)
    - Sertifika notu (opsiyonel TextInput multiline, max 500 char)
  - "Hesabı oluştur" butonu — sadece zorunlu alanlar dolu ise aktif
  - Dosya: `mobile/app/auth/profile.tsx`

- [ ] **2. Form validation**
  - zod schema: isim/soyisim 2-50 char, TR karakter izinli, sadece harf ve boşluk
  - Inline hata: yazarken validate, focus blur'da göster
  - Dosya: `mobile/src/auth/profile-schema.ts`

- [ ] **3. Submit aksiyonu**
  - `POST /auth/profile` (TASK-1.20) çağrılır
  - Body: `{ phone, code, role, firstName, lastName, kvkkConsent: true, healthConsent: ?, gymName?, certificateNote?, textVersion }`
  - Response 201 → JWT + refresh storage'a yazılır (TASK-1.33 helper)
  - Eğer `flow === 'member_via_invite'`: `POST /invitations/:code/accept` (TASK-1.24) çağrılır, başarısızsa hata göster (rare race)
  - Home ekranına navigate (`/(tabs)/home` veya rol bazlı path)
  - 409 "Bu telefon zaten kayıtlı" → login akışı (telefon ekranına geri + "Giriş yap" CTA)
  - Network/server hatası → toast
  - Dosya: `mobile/app/auth/profile.tsx` (UPDATE)

- [ ] **4. PT için ek alan açma**
  - Onboarding store'dan `flow` okunur; flow `pt` ise PT-only alanlar görünür
  - Üye akışı flow `member` veya `member_via_invite`'ta bu alanlar gizli
  - Dosya: `mobile/app/auth/profile.tsx` (UPDATE)

- [ ] **5. Component testleri**
  - `mobile/app/auth/profile.test.tsx`:
    - Üye akışı: isim/soyisim dolu → submit 201 → home'a
    - PT akışı: PT-only alanlar görünür, isim+soyisim zorunlu, ek alanlar boş submit edilebilir
    - Geçersiz isim (sayı içerir) → inline hata
    - 409 → telefon ekranına yönlendirme
    - Member via invite akışı: profil create + invitation accept ardışık çağrı
  - Dosya: `mobile/app/auth/profile.test.tsx`

- [ ] **6. i18n + Accessibility**
  - `auth.json`: `auth.profile.title`, `auth.profile.firstname`, `auth.profile.lastname`, `auth.profile.photo`, `auth.profile.gym`, `auth.profile.cert_note`, `auth.profile.cta`, errors
  - Input'lar `accessibilityLabel`
  - `autoComplete="name-given"`, `name-family"`, `keyboardType="default"`

- [ ] **7. Profile foto placeholder**
  - Avatar default ikon (initials veya nötr ikon)
  - Tap → toast "Profil fotoğrafı yakında eklenecek" (Yakın 5+; v1'de feature flag)
  - Dosya: `mobile/app/auth/profile.tsx` (UPDATE)

---

## Etkilenen Dosyalar

```
mobile/
├── app/auth/
│   ├── profile.tsx                         # YENİ
│   └── profile.test.tsx                    # YENİ
└── src/
    ├── auth/
    │   └── profile-schema.ts               # YENİ
    └── i18n/locales/tr/
        ├── profile.json                    # GÜNCELLE
        └── auth.json                       # GÜNCELLE
```

---

## Dikkat Noktaları

- **Profil foto UI-only:** Yanlışlıkla file upload başlatılmasın diye Pressable handler sadece toast gösterir; image picker import edilmez (gereksiz paket eklemeyiz).
- **TR karakter validation:** zod regex `^[\p{L}\s]+$` (Unicode letter — ş, ğ, ı, ç dahil) + max 50 char.
- **PT certificateNote serbest metin:** PT yanlışlıkla yasal sorun yaratan ifade yazabilir mi? v1'de PT doğrulama yok (PRD), bu alan sadece bilgilendirici — yasal sorumluluk PT'de.
- **Akış sonu home:** Home ekranı bu fazda iskelet (TASK-1.31'de PT dashboard; üye dashboard sonraki fazlarda). Bu task'ta `home/index.tsx` placeholder "Hoş geldin, [isim]" yeterli.

---

## Test Kriterleri

- [ ] 5 senaryo PASS
- [ ] TR karakter geçer validation
- [ ] 409 telefon clash → telefon ekranına geri
- [ ] Member via invite: profile + accept ardışık ve atomik; biri fail diğeri rollback (backend transaction); UI fail durumunda anlamlı hata
- [ ] Form alanları onboarding store'dan ön-dolmaz (yeni profil), ama önceki ekranlardan gelen state (phone, code) submit'te kullanılır

---

## Karar Noktaları

- **Profil foto v1'e konsun mu (basit URL girme ekranı):** Hayır, file upload backend yok; UI-only feature flag açık.
- **Member via invite akışında accept başarısızsa:** Profile zaten oluşmuş; mobile UI invite eksik durumu nasıl ele alıyor? → Otomatik retry (3 deneme) + user fail durumunda "Davet kabul edilemedi, PT'nden yeni link iste" mesajı + home'a gönder; PT bağı sonradan davet linkiyle kurulabilir.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.30): add profile creation screen for member and trainer`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-30
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- **Ekran (`mobile/app/auth/profile.tsx` YENİ)** — Onboarding son adımı. Ortak form: ad + soyad (zorunlu); avatar placeholder (UI-only, tap → image picker import YOK, sadece `photoHint` "yakında" metni). PT akışında (`flow === 'pt'`) ek opsiyonel alanlar: spor salonu + sertifika notu (multiline). "Hesabı oluştur" sadece ad+soyad geçerliyken aktif. KVKK rızaları KVKK ekranından `useLocalSearchParams` ile gelir (store değil — consent ekranlar-arası tek sıçrama). Submit → `createProfile` (kayıt jetonu Bearer); 201 → `member_via_invite` ise `acceptInvitation` ardışık (network'te 3 deneme; terminal hatada uyarı + manuel "Devam et" → home, profil zaten oluştu); diğer akışlarda doğrudan `/home` placeholder'ına `replace`. 409 → "Bu telefon zaten kayıtlı" + "Giriş yap" → `/auth/phone`; 401/403 → oturum hatası; network/invalid → jenerik.
- **Form şeması (`mobile/src/auth/profile-schema.ts` YENİ)** — zod `nameField`: trim + 2-50 char + `^[\p{L}\s]+$/u` (TR ş/ğ/ı/ç/İ + boşluk; rakam/sembol red). `validateName` inline feedback için `required`/`invalid` döner (blur'da gösterilir). `profileFormSchema` submit-öncesi bütün kontrol; gym ≤100, cert ≤500.
- **API (`mobile/src/api/auth.ts` GÜNCELLE)** — `createProfile` (201 created / 409 phone_taken / 403 kvkk_required / 401 unauthorized / 400 invalid / network; opsiyonel PT alanları boşsa gövdeye eklenmez) + `acceptInvitation` (200 connected / terminal failed / network). `ProfileUser` tipi eklendi.
- **Home placeholder (`mobile/app/home/index.tsx` YENİ)** — "Hoş geldin, [isim]" + "yakında" metni; gerçek içerik TASK-1.31/1.33. `/home` route'u.
- **i18n** — `auth.json` → `profile.*` (başlık, alanlar, hatalar, davet uyarısı, CTA'lar); `common.json` → `home.welcome`/`home.placeholder`.

**Test:** mobile **71 PASS** (`app/auth/profile.test.tsx` 7: üye→home replace, PT alanları görünür+boş submit, üyede PT alanları gizli, geçersiz isim blur→inline hata+CTA disabled, 409→Giriş yap→phone replace, member_via_invite create+accept ardışık→home, accept fail→uyarı+replace yok). typecheck/lint/format temiz. Lint TR `.toUpperCase()` yasağını yakaladı → avatar initial `trUpper` ile düzeltildi.

**Backend kontrat notu:** Task dokümanındaki body taslağı (`{ phone, code, ... textVersion }`) güncel değildi — gerçek `POST /auth/profile` kontratı (TASK-1.20) **kayıt jetonu Bearer** + body `{ role, firstName, lastName, kvkkConsent, healthConsent?, gymName?, certificateNote? }`; kod/telefon gövdede taşınmaz. Gerçek backend kontratı izlendi.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-30 (run-task)
