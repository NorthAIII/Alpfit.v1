# TASK-2.05: Mobile — TanStack Query + AsyncStorage Offline Persist Altyapısı

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.2 — Üye Program Görüntüleme + Tamamlama (offline altyapı)
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** Yok (backend task'larından bağımsız — mobile kurulum)

---

## Hedef

Mobile uygulamaya TanStack Query v5 server state yönetimi ve AsyncStorage-tabanlı offline persist kurulur. Sonraki tüm mobile task'ları bu altyapının üstüne queryHook'lar yazacak. Task sonunda QueryClient 7 günlük gcTime + `alpfit-cache-v1` persist key ile konfigüre edilmiş, App root'ta `PersistQueryClientProvider` aktif ve `react-native-webview` paketi kurulu (TASK-2.11'de kullanılacak) durumdadır.

---

## Bağlam

Araştırma bulgusunda MMKV reddedildi (Expo Go kaybı); AsyncStorage + TanStack Query persister seçildi. Bu task yalnızca altyapıyı kurar — herhangi bir query hook veya UI bileşeni yazmaz.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → Kullanılacak Kütüphaneler + Teknik Kararlar (TanStack Query Persist Kurulumu)
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → Offline Cache → AsyncStorage persister kararı

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. Paket kurulumu**
  - `pnpm --filter mobile add @tanstack/react-query@^5`
  - `pnpm --filter mobile add @tanstack/react-query-persist-client`
  - `pnpm --filter mobile add @tanstack/query-async-storage-persister`
  - `pnpm --filter mobile add @react-native-async-storage/async-storage`
  - `npx expo install react-native-webview` (Expo SDK 56 uyumlu versiyon otomatik seçilir)
  - New Arch uyumluluğu kontrol et: `expo install` önerilen versiyonu kullanır — doğrula

- [ ] **2. QueryClient konfigürasyonu**
  - `apps/mobile/src/lib/queryClient.ts` oluştur:
    - `gcTime: 7 * 24 * 60 * 60 * 1000` (7 gün — haftalık program cache'de kalır)
    - `staleTime: 5 * 60 * 1000` (5 dk — arka planda refetch eşiği)
    - `retry: 2` (offline'da 3. retry'da sessizce fail eder)
    - AsyncStorage persister: `createAsyncStoragePersister({ storage: AsyncStorage, key: 'alpfit-cache-v1' })`

- [ ] **3. App root'a PersistQueryClientProvider entegre et**
  - `apps/mobile/src/app/_layout.tsx` (veya projenin App kök dosyası) düzenle:
    - `PersistQueryClientProvider` ile `QueryClientProvider`'ı wrap et
    - `persistOptions: { persister }` ile persist aktif
  - Expo dev build ile uygulamayı başlat — QueryClient'ın hata vermediğini doğrula

- [ ] **4. DevTools (opsiyonel — development only)**
  - `@tanstack/react-query-devtools` — React Native için `react-query-native-devtools` veya Flipper plugin incelenebilir; kurulum karmaşık görünüyorsa atla (pilot ölçeğinde gerekli değil)
  - `__DEV__` koşullu olarak dahil et

---

## Etkilenen Dosyalar

```
apps/mobile/
├── package.json                    # 5 yeni paket eklendi
├── src/lib/queryClient.ts          # YENİ — QueryClient + persister config
└── src/app/_layout.tsx             # PersistQueryClientProvider wrap eklendi
```

---

## Dikkat Noktaları

- **Expo SDK 56 + New Arch:** `npx expo install react-native-webview` Expo'nun uyumlu versiyonu seçmesini sağlar — manuel `pnpm add react-native-webview@X.Y.Z` yapma.
- **`alpfit-cache-v1` persist key versiyonlaması:** Schema değiştiğinde key bump edilir (örn. `alpfit-cache-v2`). TASK-2.01'daki DB schema değişikliği gibi kırıcı frontend schema değişikliği olmadıkça v1 kullanılır.
- **AsyncStorage vs Expo SecureStore:** Program JSON'u sağlık verisi değil (kilo/ölçüm değil) — AsyncStorage yeterli. KVKK memory'deki matris sağlık verisi için Secure storage gerektiriyor ama egzersiz programı bu kapsamda değil.
- **gcTime vs staleTime farkı:** `gcTime` cache'in bellekte ne kadar tutulacağı; `staleTime` refetch tetiklemeden önce "taze" sayılan süre. gcTime 7 gün = offline hafızada haftalık program kalır.
- **PersistQueryClientProvider:** TanStack Query v5'te API değişti — `@tanstack/react-query-persist-client` paketinden import et; v4 pattern değil.

---

## Test Kriterleri

- [ ] `pnpm --filter mobile build` (TypeScript typecheck) — 0 hata
- [ ] Expo dev build başlar ve crash yok (`npx expo start`)
- [ ] `queryClient.ts` import edildiğinde QueryClient, persister ve AsyncStorage doğru bağlandı (log ile doğrula: `console.log('QueryClient ready')`)
- [ ] `react-native-webview` paketi kuruldu ve Expo `expo-modules-core` ile uyumlu (`pnpm --filter mobile list react-native-webview` versiyonu gösterir)

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (conventional commits formatı)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi

---

## Oturum Kayıtları

*(Doldurulmadı — task henüz çalıştırılmadı)*

---

**Oluşturulma:** 2026-05-30 (plan-phase 2)
