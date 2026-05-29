# TASK-1.07: i18n shell (i18next mobile + backend, TR-only v1)

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.02, TASK-1.05, TASK-1.06

---

## Hedef

Mobile ve backend için i18next + react-i18next tabanlı i18n shell kur — `tr` namespace'lerini yapılandır (common, auth, errors, sms), runtime'da string lookup çalışır, eksik anahtar **dev'de hata fırlatır** (silent fallback yok). v1'de tek dil (TR) ama yapı v2 EN/global açılım için hazır ([[ilkeler]] §Proje Ufku). Sonraki UI task'ları bu shell'den `t('auth.welcome')` gibi string çekecek.

---

## Bağlam

Discuss-phase TR yerelleştirme baştan kurulu (i18n shell, +90 telefon, TR tarih). Research-phase i18next + react-i18next seçti (JS ekosistemi standardı, TR-only v1, shell v2 hazır). Backend'in i18n'e ihtiyacı: SMS mesaj string'leri, error mesajları, notification body'leri (M4). [[ilkeler]] §Proje Ufku: "EN/global açılım bilinçli karar olmadan yapılmaz, ama yapı izin verir" — shell şimdi kurulur, içeriği zenginleştirme task'larında dolar.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §5 (TR Locale Temeli)
- `_dev/phases/PHASE-1.md` — Araştırma → i18n kararı
- `_dev/ILKELER.md` §Proje Ufku
- `CLAUDE.md` → Projeye Özgü Kurallar → TR Yerelleştirme

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. Mobile i18next + react-i18next kurulumu**
  - `pnpm -F @alpfit/mobile add i18next react-i18next expo-localization`
  - `mobile/src/i18n/index.ts` — i18next init, namespaces: `common`, `auth`, `errors`, `kvkk`, `profile`
  - **Dev modda eksik anahtar → throw** (`saveMissing: true`, `missingKeyHandler: throw`). Production'da fallback to key (silent log + Sentry).
  - Dosya: `mobile/src/i18n/index.ts`, `mobile/app/_layout.tsx` (UPDATE — `<I18nextProvider>` wrap)

- [ ] **2. TR locale resource dosyaları (mobile)**
  - `mobile/src/i18n/locales/tr/common.json` — uygulama-geneli ortak string'ler (örn. "Devam", "İptal", "Yükleniyor...")
  - `mobile/src/i18n/locales/tr/auth.json` — onboarding ekranları string'leri (placeholder; UI task'larında dolar)
  - `mobile/src/i18n/locales/tr/errors.json` — hata mesajları
  - `mobile/src/i18n/locales/tr/kvkk.json` — KVKK ekran placeholder string'leri (gerçek metin Yakın 5'te hukuki review ile)
  - `mobile/src/i18n/locales/tr/profile.json` — profil ekranı string'leri
  - JSON yapısı namespace-key-value, nested obje destekli
  - Dosya: `mobile/src/i18n/locales/tr/*.json` (5 dosya)

- [ ] **3. Backend i18next kurulumu**
  - `pnpm -F @alpfit/backend add i18next`
  - `backend/src/i18n/index.ts` — i18next instance, namespaces: `sms`, `errors`, `notifications`
  - SMS gönderme servisi (TASK-1.18) `t('sms.otp', { code })` ile string çeker
  - Dosya: `backend/src/i18n/index.ts`

- [ ] **4. TR locale resource dosyaları (backend)**
  - `backend/src/i18n/locales/tr/sms.json` — örnek: `{ "otp": "Alpfit doğrulama kodun: {{code}}. 5 dakika geçerli." }`
  - `backend/src/i18n/locales/tr/errors.json` — backend error mesajları (API response body için)
  - `backend/src/i18n/locales/tr/notifications.json` — push body string'leri (M4 fazında dolar; placeholder)
  - Dosya: `backend/src/i18n/locales/tr/*.json` (3 dosya)

- [ ] **5. Type-safe i18next (opsiyonel ama önerilir)**
  - `mobile/i18next.d.ts` — `declare module 'i18next' { interface CustomTypeOptions { defaultNS: 'common'; resources: typeof import('./src/i18n/locales/tr/common.json') & ... } }`
  - `t('unknown.key')` typecheck'te yakalanır
  - Backend için aynı pattern
  - Dosya: `mobile/i18next.d.ts`, `backend/src/i18n/i18next.d.ts`

- [ ] **6. Cihaz dili algılama (mobile)**
  - `expo-localization` ile `Localization.locale` okunur; v1'de hep TR'ye düşülür (`fallbackLng: 'tr'`), ama yapı locale algılamayı destekler
  - Dosya: `mobile/src/i18n/index.ts` (locale detection)

---

## Etkilenen Dosyalar

```
mobile/
├── package.json                       # GÜNCELLE
├── i18next.d.ts                       # YENİ (typesafe)
├── app/_layout.tsx                    # GÜNCELLE (provider wrap)
└── src/i18n/
    ├── index.ts                       # YENİ
    └── locales/tr/
        ├── common.json                # YENİ
        ├── auth.json                  # YENİ
        ├── errors.json                # YENİ
        ├── kvkk.json                  # YENİ
        └── profile.json               # YENİ
backend/
├── package.json                       # GÜNCELLE
└── src/i18n/
    ├── index.ts                       # YENİ
    ├── i18next.d.ts                   # YENİ
    └── locales/tr/
        ├── sms.json                   # YENİ
        ├── errors.json                # YENİ
        └── notifications.json         # YENİ
```

---

## Dikkat Noktaları

- **Dev'de eksik anahtar → THROW:** Sessiz fallback üretim sonrası "şu yazı görünmüyor" bug'larına yol açar. Dev'de throw, production'da Sentry'ye log + fallback to key.
- **TR karakter encoding:** JSON UTF-8; Türkçe karakterler (ş, ğ, ı, ç, İ) doğru kaydedilir (editor encoding ayarı, `.editorconfig` TASK-1.01'de utf-8).
- **KVKK metni placeholder:** `kvkk.json`'da `aydinlatma_metni: "[Hukuki review bekliyor — Yakın 5 öncesi yerleşecek]"`. **String'in mevcut olması** zorunlu (UI render bozulmasın), gerçek içerik sonra dolacak.
- **Resource statically bundled:** Mobile'da i18next backend (HTTP) kullanılmaz — JSON'lar bundle'a dahil; offline calidad güvenliği için.
- **shared/ ile i18n çakışması:** `shared/` paketine i18n koymuyoruz — backend ve mobile farklı namespace'ler kullanır, paylaşılan i18n soyutlaması erken optimization olur (YAGNI).

---

## Test Kriterleri

- [ ] `pnpm -F @alpfit/mobile typecheck` hatasız geçer (i18n init + provider import edilebilir)
- [ ] `pnpm -F @alpfit/backend test` — `t('sms.otp', { code: '482931' })` doğru interpolation döner (backend Vitest TASK-1.04'te kurulu, test bu task'ta yazılabilir)
- [ ] Mobile boot smoke (manuel `pnpm -F mobile exec expo start`) — i18n provider initialize olur, landing screen TR string'ini key'den çeker
- [ ] Type-safe typecheck: `t('unknown.key')` typecheck FAIL eder
- [ ] TR karakter (`ş, ğ, ı, ç, İ`) JSON'dan editor'de doğru görünür (UTF-8 encoding)
- [ ] Eksik anahtar handler dev'de throw, prod'da fallback to key (kod inceleme + runtime smoke ile doğrulanır; Jest tabanlı test TASK-1.08'in görevi)

> **Not:** Mobile Jest test runner TASK-1.08'de kuruluyor. Bu task'ın mobile tarafı **kod ve typecheck** ile tamamlanır; runtime test verification TASK-1.08'in i18n smoke testinde olur.

---

## Karar Noktaları

- **Namespace bölünmesi:** Şu an 5 namespace (common/auth/errors/kvkk/profile mobile, 3 backend). Sonraki UI task'larında ekleyebiliriz (örn. dashboard, banner, sustain-engine). → Mevcut bölünme yeterli; yeni namespace gerekirse just-in-time eklenir.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.07): bootstrap i18next tr-only shell on mobile and backend`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-29 (run-task)
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- **Versiyon araştırması:** `pnpm view` ile latest dist-tags taranıp Expo SDK 56 `bundledNativeModules.json` ile çapraz doğrulandı — i18next 26.3.0 + react-i18next 17.0.8 (peer `i18next >= 26.2.0` ✓) + expo-localization ~56.0.6 (SDK 56 pin).
- **Paket kurulumu:** `pnpm -F @alpfit/mobile add i18next@^26.3.0 react-i18next@^17.0.8 expo-localization@~56.0.6` + `pnpm -F @alpfit/backend add i18next@^26.3.0`.
- **Mobile resource (5 namespace):** `mobile/src/i18n/locales/tr/common.json` (app/actions/states/landing), `auth.json` (welcome/phone/otp/role/invite), `errors.json` (generic/phone/otp/auth/invite), `kvkk.json` (placeholder `[Hukuki review bekliyor — Yakın 5 öncesi yerleşecek]`), `profile.json` (fields/actions/deleteAccount).
- **Backend resource (3 namespace):** `backend/src/i18n/locales/tr/sms.json` (otp/inviteWelcome/loginAlert), `errors.json` (validation/auth/invite/generic), `notifications.json` (streak/comeback {t2/t7/t14}/program — M4 fazında zenginleşir).
- **Mobile init (`mobile/src/i18n/index.ts`):** i18next + `initReactI18next` plugin; `lng: 'tr'`, `fallbackLng: 'tr'`, `supportedLngs: ['tr']`, `defaultNS: 'common'`, `react.useSuspense: false`, `interpolation.escapeValue: false`. `expo-localization`'dan `getLocales()` çağrılıyor ama v1'de daima `'tr'` döndürülüyor (v1.5 EN/global açılım için genişler — [[ilkeler]] §Proje Ufku).
- **Backend init (`backend/src/i18n/index.ts`):** `i18next.createInstance()` ile izole instance; `defaultNS: 'errors'`. JSON'lar `fs.readFileSync` + `fileURLToPath(import.meta.url)` ile yüklendi (NodeNext ESM, JSON import attribute uyumluluğundan bağımsız). `t` export'u `i18n.t.bind(i18n) as I18nInstance['t']` cast ile yapıldı — `.bind()` aksi halde overload signature'larını düşürüp typesafe key kontrolünü kaybediyordu.
- **Dev throw / prod warn:** Her iki taraf da `process.env['NODE_ENV'] !== 'production'` ⇒ `saveMissing: true` + `missingKeyHandler` throw. Mobile prod'da `console.warn` (Sentry hook TASK-1.12'de). Backend prod'da sessiz (log şu an için event seviyesinde değil — Sentry TASK-1.11'de).
- **Type-safe CustomTypeOptions:** `mobile/i18next.d.ts` (5 namespace) + `backend/src/i18n/i18next.d.ts` (3 namespace) `declare module 'i18next' { interface CustomTypeOptions { defaultNS; resources: typeof import(...) } }`. Smoke: geçici `__i18n_typesafe_smoke.ts` ile `@ts-expect-error` + `t('sms:nonexistent.key')` → boş çıktı (= ham hata yakalandı, directive geçerli); `t('sms:otp', { code: '123' })` ✓.
- **Layout wire:** `mobile/app/_layout.tsx` `<I18nextProvider i18n={i18n}>` ile sarıldı; `app/index.tsx` `useTranslation('common')` ile `t('landing.greeting')` + `t('landing.todayPrefix', { date: today })` çağırıyor — string'ler artık `common.json`'dan çekiliyor.
- **tsconfig:** `mobile/tsconfig.json` `include` array'ine `src/**/*` + `i18next.d.ts` eklendi (önceki yalnızca `app/**/*` içeriyordu).

**Test Kriterleri:**
- ✅ `pnpm typecheck` 3 paket temiz (mobile + shared + backend)
- ✅ `pnpm test` 50 passed (41 shared + 9 backend — 6 yeni i18n test: init flag + sms.otp interpolation + sms.inviteWelcome multi-variable + errors.auth.otpInvalid + TR karakter `doğrulama` / `Oturumun` + dev throw)
- ✅ `pnpm lint` temiz, `pnpm format:check` temiz
- ✅ `pnpm -F @alpfit/mobile run export:smoke` — 1221 modül, 1.7MB web bundle (i18n init + provider + useTranslation chain Metro tarafından çözüldü)
- ✅ Type-safe smoke (geçici dosya): `t('sms:nonexistent.key')` → `@ts-expect-error` directive geçerli (= ham hata var); `t('sms:otp', {code})` çağrısı tip-uyumlu
- ✅ TR karakter doğrulaması test seviyesinde (`doğrulama`, `Oturumun`)

**Karar Notu:**
- **Backend JSON yükleme:** Native ESM `import './x.json' with { type: 'json' }` yerine `fs.readFileSync + JSON.parse` tercih edildi. Sebep: NodeNext + TS 5.7'de import attribute davranışı paket-yöneticisi/runtime arası tutarsız (dev vs prod ESM loader); `fs` yolu deterministik ve testte sorunsuz. Cost: `dist/` paketlenirken locale dosyaları otomatik kopyalanmıyor — TASK-1.10/staging deploy task'ında build script (`tsc --build` post-step) eklenecek (`cp -r src/i18n/locales dist/i18n/`). v1'de runtime yalnızca dev/staging'de çalışacak; bu bir migration borç değil sadece deploy script TODO. Karar günü test/typecheck/lint hepsi temiz olduğu için Phase-1 sonuna bırakıldı.
- **i18next 26 `initImmediate` kaldırıldı:** İlk yazımda `initImmediate: false` set edildi → TS error TS2769 (option v26'da yok). Inline resources zaten sync — silindi.
- **`t` overload preservation:** `instance.t.bind(instance)` standart `Function.prototype.bind` tipi tek overload bırakıyor; explicit `as I18nInstance['t']` cast ile typesafe namespace:key kontrolü korundu. Test bunu doğruluyor.

**Sonraki Adım:** TASK-1.08 — Mobile test altyapısı (Jest + React Native Testing Library). Bu task'ın runtime smoke testi ("`<App>` mount → `useTranslation` çalışır → eksik anahtar dev'de throw eder") TASK-1.08'in i18n smoke ünite testi olarak kurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Son Güncelleme:** 2026-05-29 (run-task) — i18n shell mobile + backend kuruldu, 50 test passed.
