# TASK-1.12: Mobile Sentry crash reporting + PII scrubber

**Durum:** ⬜ Bekliyor
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.05, TASK-1.08, TASK-1.11

---

## Hedef

Mobile workspace'ine `sentry-expo` (veya `@sentry/react-native`) kur, crash reporting + JS error capture aktif, PII scrubber backend ile **aynı PII alan listesini** (`shared/pii-fields.ts`) kullanarak event payload'ından sağlık verisi alanlarını siler, breadcrumb'larda telefon/isim sızmıyor. Bir test event fırlatıldığında staging Sentry'de görünür ama PII içermez.

---

## Bağlam

Research-phase: Sentry tek araç (Node + RN), free plan EU Frankfurt residency dahil. KVKK çerçevesi mobile crash report'larında da geçerli — kullanıcı ekranda kilo girmişken crash olursa stack trace + state'te kilo değeri Sentry'ye gitmemeli. Backend'le **aynı `PII_FIELDS` listesini paylaşmak** drift'i önler ([[ilkeler]] §"Kalıcılık önceliği").

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §4, §8
- `_dev/phases/PHASE-1.md` — Araştırma → Observability
- `_dev/QUALITY.md` §2 (Güvenlik & Gizlilik)
- TASK-1.11 — PII scrubber matrisi (referans)
- `_dev/memory/kvkk-pii-scrubbing-matrisi.md`

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. Sentry mobile SDK kurulumu**
  - `pnpm -F @alpfit/mobile add @sentry/react-native`
  - Expo SDK 56 ile uyumlu version (`expo install` ile uyumlu sürüm tespiti)
  - `mobile/app.config.ts` Sentry Expo plugin (build-time source map upload için Yakın 5'te aktive; bu fazda yapısı kurulu)
  - Dosya: `mobile/package.json`, `mobile/app.config.ts`

- [ ] **2. Sentry init (mobile entry)**
  - `mobile/src/observability/sentry.ts` — `Sentry.init({ dsn: EXPO_PUBLIC_SENTRY_DSN, environment, enabled: isProductionOrStaging, tracesSampleRate: 0.1, beforeSend: piiScrubber })`
  - DSN yoksa Sentry disabled, app çalışır (degrade)
  - `mobile/app/_layout.tsx` — `Sentry.wrap(RootLayout)` veya `<ErrorBoundary>` wrap
  - Dosya: `mobile/src/observability/sentry.ts`, `mobile/app/_layout.tsx` (UPDATE)

- [ ] **3. PII scrubber (shared list)**
  - `mobile/src/observability/pii-scrubber.ts` — backend ile aynı pattern: `event.user`, `event.extra`, `event.breadcrumbs[].data` üzerinde recursive PII siler
  - `shared/src/pii-fields.ts` import edilir (drift yok)
  - User ID hash'lenir (sha256, ilk 12 karakter; crypto-js veya expo-crypto)
  - Dosya: `mobile/src/observability/pii-scrubber.ts`

- [ ] **4. Breadcrumb policy**
  - Default Sentry breadcrumb'lar (navigation, network) → hassas URL'ler (`/me/measurements`, `/me/food-log`) için custom transformer URL path'i sansürler veya breadcrumb'ı drop eder
  - HTTP breadcrumb body **gönderilmez** (`Sentry.addBreadcrumb` policy)
  - Dosya: `mobile/src/observability/sentry.ts` (UPDATE breadcrumb config)

- [ ] **5. Test event (smoke)**
  - `mobile/src/observability/sentry.test.ts` — beforeSend mock event PII silme testi (backend test pattern'ine paralel)
  - Manuel staging smoke: `Sentry.captureMessage('test event', { extra: { phone: '+90555...' } })` → Sentry dashboard'da phone yok
  - Dosya: `mobile/src/observability/sentry.test.ts`

- [ ] **6. .env.example güncelle**
  - `EXPO_PUBLIC_SENTRY_DSN=https://...@o0.ingest.sentry.io/0` placeholder
  - Dosya: `mobile/.env.example` (UPDATE)

---

## Etkilenen Dosyalar

```
mobile/
├── package.json                              # GÜNCELLE
├── app.config.ts                             # GÜNCELLE (Sentry plugin)
├── .env.example                              # GÜNCELLE
├── app/_layout.tsx                           # GÜNCELLE (wrap)
└── src/observability/
    ├── sentry.ts                             # YENİ
    ├── pii-scrubber.ts                       # YENİ
    └── sentry.test.ts                        # YENİ
```

---

## Dikkat Noktaları

- **Source map upload Yakın 5'te:** EAS Build pipeline'ı bu fazda yok; source map'siz crash report'lar minified stack trace gösterir (dev'de kabul edilebilir, production'da pilot için gerekli).
- **Breadcrumb hassas URL filtrelemesi:** Sustain motoru ekran path'leri (`/measurements/123`) gibi navigation breadcrumb'ları içerik (üye ID) sızdırabilir; transformer breadcrumb'ı drop veya generic'leştirir.
- **`EXPO_PUBLIC_*` env client bundle'da görünür** — DSN public (gizli değil, Sentry kabul); secret olmamalı, DSN sadece ingest endpoint'i.
- **Mobile + backend aynı `shared/pii-fields.ts`** — yeni alan eklenirken TASK-1.11 memory disiplini ikisini birden kapsar.

---

## Test Kriterleri

- [ ] `pnpm -F @alpfit/mobile test` — pii-scrubber + sentry init testleri PASS
- [ ] DSN env eksikse app boot eder, Sentry disabled
- [ ] Mock event'te PII alanları silinmiş olarak `beforeSend` çıktısı
- [ ] Breadcrumb transformer hassas URL'leri generic'leştirir (`/me/measurements/123` → `/me/measurements/[id]`)
- [ ] Manuel staging smoke (Yakın 1 son task'inde uçtan uca smoke ile): test event Sentry dashboard'da görünür, payload'da PII yok

---

## Karar Noktaları

- **`sentry-expo` mi `@sentry/react-native` mi:** Expo SDK 56 ile `@sentry/react-native` doğrudan desteklenir (sentry-expo deprecated). → `@sentry/react-native` öneririm.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.12): add sentry crash reporting and pii scrubber to mobile`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
