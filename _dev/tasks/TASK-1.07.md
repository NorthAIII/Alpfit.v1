# TASK-1.07: i18n shell (i18next mobile + backend, TR-only v1)

**Durum:** ⬜ Bekliyor
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

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
