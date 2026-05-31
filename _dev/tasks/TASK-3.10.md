# TASK-3.10: Comeback T+7 PT Uyarısı + T+14 Kayıp Risk Flag

**Durum:** ⬜ Bekliyor
**Modül:** M3 — Sürdürülebilirlik Motoru (`modules/M3-surdurulebilirlik-motoru.md`)
**Feature:** F3.1 — Comeback T+7 + T+14
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.04 ✅, TASK-3.05 ✅

---

## Hedef

T+7 (PT'ye in-app banner + push backup) ve T+14 (kayıp risk flag) job handler'larını yaz; PT'nin "Okudum" endpoint'ini ekle. TASK-3.05 T+2 delayed job'ı kuyruğa ekliyor; bu task T+7 ve T+14 için de benzer delayed job'ları TASK-3.05'in sıfırlama servisine ekler.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M3-surdurulebilirlik-motoru.md` — F3.1 T+7 + T+14 kabul kriterleri ("Okudum" davranışı, re-aktivasyon temizlemesi)
- `_dev/phases/PHASE-3.md` §Araştırma Bulguları + §Kapsam Tartışması (T+7 in-app banner mevcut banner-store üzerinden)
- `backend/src/services/notification.service.ts` — mevcut job handler'lar

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [ ] **1. TASK-3.05'te T+7 ve T+14 Delayed Job'larını da Kuyruğa Ekle**

  `backend/src/services/streak-reset.service.ts` → sıfırlama sonrası:
  ```ts
  // T+2: zaten TASK-3.05'te eklendi
  await notificationQueue.add('comeback-t2', { memberId }, { delay: 2 * 24 * 60 * 60 * 1000 });
  // T+7:
  await notificationQueue.add('comeback-t7-pt', { memberId }, { delay: 7 * 24 * 60 * 60 * 1000 });
  // T+14:
  await notificationQueue.add('t14-flag', { memberId }, { delay: 14 * 24 * 60 * 60 * 1000 });
  ```

- [ ] **2. T+7 Job Handler**

  `backend/src/services/notification.service.ts` → `sendComebackT7Pt` fonksiyonu:
  - `ptT7AlertedAt` set mi? → skip (idempotent)
  - `currentStreak > 0`? → re-aktive, skip
  - `ptT7AlertedAt = now()` yaz → StreakState güncelle
  - PT'ye push backup: PT'nin push tokenlarına `"Manuel iletişim önerilir"` bildirimi
  - NotificationLog yaz

- [ ] **3. T+14 Job Handler**

  `backend/src/services/notification.service.ts` → `setT14Flag` fonksiyonu:
  - `t14FlaggedAt` set mi? → skip (idempotent)
  - `currentStreak > 0`? → re-aktive, skip
  - `t14FlaggedAt = now()` yaz → StreakState güncelle
  - NotificationLog yaz (flag set edildi, push yok — kayıp risk UI M5 fazında)

- [ ] **4. Worker Dispatcher'a Handler'lar Ekle**

  `backend/src/workers/notification.worker.ts`:
  ```ts
  case 'comeback-t7-pt': await sendComebackT7Pt(prisma, expoAdapter, job.data.memberId); break;
  case 't14-flag': await setT14Flag(prisma, job.data.memberId); break;
  ```

- [ ] **5. PT "Okudum" Endpoint'i**

  `backend/src/routes/pt-alerts.ts` (yeni dosya):

  **`PATCH /pt/member-alerts/:memberId/dismiss-t7`** — PT "Okudum" tıklar
  - Auth: `app.authenticate`, trainer rolü
  - `trainerId = claims.sub`, `memberId = params.memberId`
  - Trainer-member aktif ilişki kontrolü (PT yalnızca kendi üyesini dismiss edebilir)
  - `ptT7DismissedAt = now()` set → StreakState güncelle
  - Response: 200

  **Güvenlik checklist:**
  - Ownership: trainer-member aktif ilişki kontrolü (`TrainerMember WHERE endedAt IS NULL`)
  - Role guard: yalnızca trainer
  - Status guard: kullanıcı `deletedAt IS NULL`
  - Input bounding: `memberId` string.cuid() validasyonu

- [ ] **6. Test Yaz**

  `notification.service.test.ts` → T+7 + T+14 testler:
  - T+7: `ptT7AlertedAt` set, PT push gönderildi
  - T+7 idempotent: zaten set → skip
  - T+7 re-aktivasyon → skip
  - T+14: `t14FlaggedAt` set, push yok
  - T+14 idempotent + re-aktivasyon → skip

  `pt-alerts.test.ts` (yeni dosya):
  - `PATCH dismiss-t7` geçerli üye → 200, `ptT7DismissedAt` set
  - Trainer başka üyeye dismiss → 403
  - Auth yok → 401

---

## Etkilened Dosyalar

```
backend/src/services/
├── streak-reset.service.ts       # T+7 + T+14 delayed job ekleme
├── streak-reset.service.test.ts  # T+7 + T+14 job kuyruğa ekleme testleri güncelle
└── notification.service.ts       # sendComebackT7Pt + setT14Flag

backend/src/routes/
├── pt-alerts.ts                  # YENİ — PATCH dismiss-t7
└── pt-alerts.test.ts             # YENİ — testler

backend/src/workers/
└── notification.worker.ts        # comeback-t7-pt + t14-flag case'ler
```

---

## Dikkat Noktaları

- **`ptT7DismissedAt` sıfırlanmaz:** Re-aktivasyon `ptT7AlertedAt` sıfırlar ama `ptT7DismissedAt` sıfırlamaz — PRD kararı. Yeni kopma = yeni `ptT7AlertedAt` set edilir, PT tekrar banner görür. Bu davranış TASK-3.03'ün `processWorkoutCompletion` fonksiyonunda zaten korunuyor.
- T+7 "Okudum" sonrası banner kaybolur, tekrar belirmez (aynı kopma döngüsünde)
- T+14 UI (⚠️ kayıp risk etiketi) → M5 fazında; bu task sadece DB flag set eder
- PT'ye T+7 push backup: PT bildirim izni kapalıysa yalnızca in-app banner (banner görünümü TASK-3.14'te)
- Re-aktivasyon: `processWorkoutCompletion` (TASK-3.03) `ptT7AlertedAt` sıfırlar → yeni T+7 job kuyruğa girebilir (yeni kopma sonrası)

---

## Test Kriterleri

- [ ] T+7 job → `ptT7AlertedAt` set, PT'ye push gönderildi, log `sent`
- [ ] T+7 idempotent → `ptT7AlertedAt` önceden set, skip
- [ ] T+7 re-aktivasyon (`currentStreak > 0`) → skip
- [ ] T+14 job → `t14FlaggedAt` set, push yok (yalnızca flag)
- [ ] T+14 idempotent + re-aktivasyon → skip
- [ ] `PATCH dismiss-t7` → `ptT7DismissedAt` set
- [ ] Başka PT'nin üyesi dismiss → 403
- [ ] Sıfırlama sonrası T+7 ve T+14 delayed job'ları da kuyruğa eklendi (streak-reset.service.test.ts güncellendi)
- [ ] Tüm testler yeşil

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
