# TASK-3.08: Sabah Reminder Push Bildirimi (BullMQ Repeatable Job)

**Durum:** ⬜ Bekliyor
**Modül:** M4 — Bildirim Altyapısı (`modules/M4-bildirim-altyapisi.md`)
**Feature:** F4.1 + F3.1 (Reminder bildirimi)
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.04 ✅, TASK-3.07 ✅

---

## Hedef

Her saat başında çalışan sabah reminder BullMQ repeatable job'ı yaz. Job: mevcut Istanbul saatini alır, o saati `morningHour` olarak ayarlamış ve bugün planlı antrenmanı olan üyelere push gönderir. Bu sayede her üye kendi belirlediği saatte reminder alır (milestone: "Üye reminder saatini değiştirebilir"). Sessiz saat kontrolü yapar, `NotificationLog` yazar.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M3-surdurulebilirlik-motoru.md` — F3.1 reminder kabul kriterleri (sessiz saat, içerik formatı)
- `_dev/modules/M4-bildirim-altyapisi.md` — F4.1 bildirim tipleri, sessiz saat kuralı, içerik formatı
- `_dev/phases/PHASE-3.md` §Araştırma Bulguları — BullMQ job tipi, sessiz saat worker katmanında
- `backend/src/lib/push.ts` — push interface (TASK-3.04)
- `backend/src/lib/silent-hours.ts` — sessiz saat util (TASK-3.04)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [ ] **1. Morning Reminder Job Handler Yaz**

  `backend/src/services/notification.service.ts` (yeni dosya, sonraki job'lar da buraya eklenecek):

  ```ts
  export async function sendMorningReminders(prisma: PrismaClient, pushChannel: PushChannel): Promise<void>
  ```

  Mantık:
  - Mevcut Istanbul saatini al (`currentHour` = 0–23)
  - Aktif programlı, `NotificationPreference.morningHour = currentHour` ve `reminderEnabled = true` olan üyeleri bul
    - Aynı sorguda: bugün planlı antrenmanı olan üyeler (`ProgramDay.dayOfWeek = bugünün günü`)
    - `isOneOff` günler → `specificDate` karşılaştırması
  - Her üye için:
    - Üyenin push tokenları → hiç yoksa skip (log: skipped, `status: no_token`)
    - Sessiz saat kontrolü: `isInSilentHours()` → true ise bu reminder atılmaz (log: skipped, `status: silent_hours`; M4 kuralı: reminder sessiz saatte ertelenmez, iptal)
    - Push gönder: başlık `"Antrenman günün 💪"`, body `"Planını gör ve başla →"`
    - `NotificationLog` yaz: `{ userId: memberId, jobType: 'morning-reminder', status: 'sent' | 'failed' | 'skipped' }`

- [ ] **2. Worker Dispatcher'a Handler Ekle**

  `backend/src/workers/notification.worker.ts` → `case 'morning-reminder'`:
  ```ts
  case 'morning-reminder':
    await sendMorningReminders(prisma, expoAdapter);
    break;
  ```

- [ ] **3. Repeatable Job Kaydı**

  Worker başlatılınca `notificationQueue.add('morning-reminder', {}, { repeat: { pattern: '0 * * * *', tz: 'Europe/Istanbul' } })` ile saatlik job'ı kaydet. Her saat başında çalışır; mantık `morningHour = currentHour` filtresi ile hangi üyelerin o saat için reminder alacağını belirler.

- [ ] **4. Test Yaz**

  `backend/src/services/notification.service.test.ts` (yeni dosya):
  - `morningHour = currentHour` eşleşen, bugün planlı antrenmanı olan, reminder açık, token kayıtlı üye → push gönderildi, log `sent`
  - `morningHour ≠ currentHour` → push gönderilmedi (farklı saat tercihli üye)
  - `reminderEnabled: false` → skip, log `skipped`
  - Token yok → skip, log `skipped` (`no_token`)
  - Sessiz saatteyse (mock `isInSilentHours` → true) → skip, log `skipped` (`silent_hours`)
  - Bugün planlı antrenmanı olmayan üye → push gönderilmedi

---

## Etkilenen Dosyalar

```
backend/src/services/
├── notification.service.ts       # YENİ — sendMorningReminders + sonraki job'lar
└── notification.service.test.ts  # YENİ — testler

backend/src/workers/
└── notification.worker.ts        # morning-reminder case + repeatable job kaydı
```

---

## Dikkat Noktaları

- Reminder sessiz saatte denk gelirse: **atılmaz** (ertelenmez) — M4 kuralı "bir sonraki açık pencerede de atılmaz (geç hatırlatma kafa karıştırıcı)"
- Saatlik job geç başlarsa (örn. 07:30 → 07:00 için): job timestamp ile `currentHour` başlangıcını karşılaştır, 30 dakikadan geç ise o saat için skip (log: skipped, `status: late`)
- `morningHour` filtresi tek satır DB sorgusu: `NotificationPreference WHERE morningHour = currentHour AND reminderEnabled = true` — performans sorun değil (30 üye)
- Çoklu cihaz: aynı üyenin tüm tokenlarına push gönder
- `PushChannel.send()` → `'invalid_token'` dönerse token DB'den sil (TASK-3.04'te Expo adapter zaten yapıyor)
- v1 pilot (30 üye) için batch push yeterli; future: M4 rate limit 600 msg/s
- Bildirim içeriğinde üye adı yok (M4 gizlilik basitliği kuralı)

---

## Test Kriterleri

- [ ] `morningHour = currentHour` eşleşen, bugün planlı, reminder açık, token var → push gönderildi, NotificationLog `sent`
- [ ] `morningHour ≠ currentHour` → push yok (farklı saatte reminder tercih eden üye)
- [ ] `reminderEnabled: false` → push yok, NotificationLog `skipped`
- [ ] Token yok → push yok, NotificationLog `skipped`
- [ ] Sessiz saat (mocked) → push yok, NotificationLog `skipped`
- [ ] Bugün planlı antrenman yok → push yok
- [ ] Job 30 dakikadan geç başladı (mocked) → o saat için skip
- [ ] Tüm yeni ve mevcut testler yeşil

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi

---

## Oturum Kayıtları

*(Task çalıştırılınca doldurulacak)*

---

**Oluşturulma:** 2026-05-31
