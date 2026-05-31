# TASK-3.04: BullMQ + Expo Push Altyapısı Kurulumu

**Durum:** ✅ Tamamlandı
**Modül:** M4 — Bildirim Altyapısı (`modules/M4-bildirim-altyapisi.md`)
**Feature:** F4.1 — Bildirim Sistemi (Push) — altyapı katmanı
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.02 ✅

---

## Hedef

BullMQ queue + worker altyapısını kur ve Expo Push API bağlantısını yaz. Bu task'tan sonra TASK-3.05–3.10 job implementasyonları için altyapı hazır olacak. Bildirim gönderim katmanı kanal-agnostik bir interface arkasına sarılır; v1.5 WhatsApp kanalı ikinci implementation olarak eklenebilir.

---

## Bağlam

Araştırma kararı: Redis zaten `backend/src/redis/client.ts`'te mevcut → BullMQ ek altyapı gerektirmez. Expo Push API: backend `expo-server-sdk` ile Expo'nun HTTP endpoint'ine POST atar; FCM/APNs köprüsü Expo tarafında. Sessiz saat kontrolü worker katmanında (M3 job atar, M4 worker kontrol eder). `NotificationLog` yazımı da bu katmanda.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-3.md` §Araştırma Bulguları — BullMQ kararı, Expo API kararı, M3↔M4 entegrasyon mimarisi
- `_dev/modules/M4-bildirim-altyapisi.md` — F4.1 kabul kriterleri, sessiz saat, retry
- `backend/src/redis/client.ts` — mevcut Redis client

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [x] **1. Paket Kurulumu**
  - `pnpm -F backend add bullmq expo-server-sdk`
  - Versiyonlar package.json'a kaydedildi

- [x] **2. BullMQ Queue Tanımı**

  `backend/src/queue.ts` (yeni dosya):
  ```ts
  import { Queue } from 'bullmq';
  import { redisClient } from './redis/client.js';

  export const notificationQueue = new Queue('notifications', {
    connection: redisClient,
    defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5 * 60 * 1000 } },
  });

  // Job type union — TASK-3.05–3.10'da genişletilecek
  export type NotificationJobName =
    | 'morning-reminder'
    | 'comeback-t2'
    | 'comeback-t7-pt'
    | 't14-flag'
    | 'streak-reset-check';
  ```

- [x] **3. Kanal-Agnostik Push Interface + Expo Adapter**

  `backend/src/lib/push.ts` (yeni dosya):
  ```ts
  export interface PushChannel {
    send(opts: { token: string; title: string; body: string; data?: Record<string, unknown> }): Promise<'sent' | 'invalid_token'>;
  }
  ```

  `backend/src/lib/expo-push.ts` (yeni dosya):
  - `expo-server-sdk` `Expo` class'ını import et
  - `ExpoPushAdapter implements PushChannel`
  - `invalid_token` dönüşünde token DB'den sil (PushToken tablosu)
  - APNs/FCM hataları: `throw` et, BullMQ retry yakalar

- [x] **4. Sessiz Saat Util**

  `backend/src/lib/silent-hours.ts` (yeni dosya):
  ```ts
  // Europe/Istanbul 22:00–08:00 arası true döner
  export function isInSilentHours(): boolean
  // Comeback için: ertesi gün 09:00'a ms cinsinden delay
  export function msUntilTomorrowMorning(hour = 9): number
  ```

- [x] **5. Notification Worker Skeleton**

  `backend/src/workers/notification.worker.ts` (yeni dosya):
  - BullMQ `Worker` instance, `notificationQueue` dinler
  - Job dispatcher: `switch (job.name)` → her job tipi için handler çağrısı (TASK-3.05–3.10'da doldurulacak)
  - `NotificationLog` yazımı: her job tamamlanınca `status: 'sent' | 'failed' | 'skipped'` yaz
  - Worker başlatma fonksiyonu export edilir

- [x] **6. Fastify Başlangıcına Worker Ekle**

  `backend/src/server.ts` (veya `app.ts`) → `onReady` hook'unda:
  ```ts
  void startNotificationWorker(app.prisma);
  ```

---

## Etkilenen Dosyalar

```
backend/
├── package.json                      # bullmq + expo-server-sdk eklendi
src/
├── queue.ts                          # YENİ — BullMQ queue tanımı + job types
├── lib/
│   ├── push.ts                       # YENİ — PushChannel interface
│   ├── expo-push.ts                  # YENİ — Expo Push adapter
│   └── silent-hours.ts               # YENİ — sessiz saat util
├── workers/
│   └── notification.worker.ts        # YENİ — worker skeleton
└── server.ts                         # worker başlatma
```

---

## Dikkat Noktaları

- Redis connection BullMQ ve mevcut `ioredis` arasında paylaşılabilir — ancak BullMQ kendi connection option'ları ister; mevcut client'ı doğrudan geçirmek yerine `{ host, port }` config'den oluştur veya `duplicate()` kullan
- Worker `server.ts`'e `void startNotificationWorker(...)` olarak eklenir — await edilmez (background process)
- Worker crash → Fastify restart'ta otomatik yeniden başlar (onReady hook)
- `NotificationLog` kaydı her job sonunda yazılır; job başarısız → `status: 'failed'`, meta → hata detayı (PII içermez)
- `expo-server-sdk` WASM bağımlılığı olmadığından ESM uyumlu; import patikası `expo-server-sdk` (default export `Expo`)
- BullMQ `defaultJobOptions.attempts: 3`, `backoff: exponential 5min` → 3 denemede başarısız → job dead queue'ya düşer, log `status: 'failed'`
- Sessiz saat: `isInSilentHours()` worker'da her job başında çağrılır; `morning-reminder` → skip; `comeback-t2` → `msUntilTomorrowMorning()` ile yeniden zamanla

---

## Test Kriterleri

- [x] `notificationQueue` Redis'e bağlanıyor, `Queue` objesi oluşuyor (integration test)
- [x] `isInSilentHours()` — 22:01 Istanbul → `true`, 08:30 Istanbul → `false` (unit test)
- [x] `msUntilTomorrowMorning()` → pozitif ms değeri, 09:00'a kadar doğru (unit test)
- [x] `ExpoPushAdapter.send()` invalid token → `'invalid_token'` döner, PushToken silinir
- [x] Worker skeleton başlatılıyor, Fastify `onReady` sonrası çalışıyor
- [x] `pnpm -F backend test` — mevcut testler kırılmadı (256 ✅)

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-31
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `pnpm -F backend add bullmq expo-server-sdk` kurulumu (bullmq@5.77.6, expo-server-sdk@6.1.0)
- `backend/src/queue.ts`: `createBullMQConnection` + `createNotificationQueue` (BullMQ için `maxRetriesPerRequest: null, enableReadyCheck: false` zorunlu)
- `backend/src/lib/push.ts`: `PushChannel` kanal-agnostik interface
- `backend/src/lib/expo-push.ts`: `ExpoPushAdapter` — DeviceNotRegistered → PushToken sil, diğer hatalar → throw (BullMQ retry)
- `backend/src/lib/silent-hours.ts`: `isInSilentHours()` + `msUntilTomorrowMorning(hour)` — Istanbul UTC+3 sabit
- `backend/src/workers/notification.worker.ts`: Worker skeleton — sessiz saat kontrolü, job dispatcher (stub), NotificationLog yazımı
- `backend/src/server.ts`: `onReady` hook'una `void startNotificationWorker(app.prisma, opts.env.REDIS_URL)` eklendi
- Testler: 14 yeni test (silent-hours ×9, expo-push ×3, queue integration ×1, worker smoke ×1)
- 256 test yeşil

---

**Oluşturulma:** 2026-05-31
