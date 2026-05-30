# TASK-1.32: Davet kabul banner + liste real-time güncellemesi

**Durum:** ✅ Tamamlandı
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.24, TASK-1.31

---

## Hedef

PT uygulama açıkken bir üye davet kabul ettiğinde in-app banner gösterilsin: "✅ [İsim] davetini kabul etti. Bekleyen davetler listende düştü". Banner tıklanırsa Üyeler tab'a navigate eder + yeni üye highlight olur. **Push bildirim YOK** (M4 fazında); bu task in-app polling veya SSE/WebSocket pattern ile gerçekleştirilir.

---

## Bağlam

F1.1 PRD: "Üye onboarding biter bitmez PT'ye push: '[Üye adı] davetini kabul etti. Programını oluştur →' (F4.1 üzerinden)". Discuss-phase: "Bu fazda push altyapısı yok. PT'ye davet kabulü sadece in-app banner (uygulama açıkken) + 'Bekleyen davetler' liste güncellemesi. APNs/FCM push altyapısı M4 fazına ertelenir." Bu task in-app yöntemle gerçekleştirir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 davet kabul bildirimi
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → Davet kabul push (M4'e ertelendi)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — In-app banner + polling/SSE kararı

---

## Alt Görevler

- [ ] **1. Backend SSE veya polling endpoint**
  - **Karar:** SSE (Server-Sent Events) modern, hafif (HTTP/2 stream); WebSocket overkill (bi-directional gerekmiyor); polling basit ama UX zayıf (30sn delay).
  - Önerim: **Polling**, çünkü v1'de 1 PT 5-10 üye → trafik düşük, SSE setup ek karmaşıklık. Polling interval 15-30 saniye yeterli (PT app'i odaklı tutarken).
  - **Alternatif:** Bu task'ta basit polling, M4'te push altyapısı kurulurken WebSocket/SSE'ye taşı.
  - `GET /trainers/me/events?since=<timestamp>` — yeni event'ler (invitation_accepted vb.) liste
  - Response: `[{ type: 'invitation_accepted', memberId, memberFirstName, occurredAt }]`
  - Dosya: `backend/src/routes/trainers-events.ts`, `.test.ts`

- [ ] **2. Mobile event polling hook**
  - `mobile/src/events/use-pt-events.ts` — `useEffect` interval 20s, `GET /trainers/me/events?since=<last>`
  - PT app focus'taysa aktif, blur'da pause (useFocusEffect)
  - Yeni event geldiğinde callback / event emitter tetiklenir
  - Dosya: `mobile/src/events/use-pt-events.ts`

- [ ] **3. In-app banner component**
  - `mobile/src/components/in-app-banner.tsx` — animated slide-down banner (üst kenarda 4 saniye görünür, sonra kayar)
  - Tap → liste tab'ına navigate + state highlight
  - "X" kapatma butonu
  - Dosya: `mobile/src/components/in-app-banner.tsx`

- [ ] **4. Banner stack (sıralı bildirimler)**
  - Aynı anda 2 davet kabul edilirse banner'lar sıralı görünür (üst üste binmez)
  - Queue yapısı zustand store'da
  - Dosya: `mobile/src/components/banner-stack.tsx`, `mobile/src/events/banner-store.ts`

- [ ] **5. Üyeler tab refresh integration**
  - Banner geldiğinde (TASK-1.31 ekranı) liste otomatik refresh
  - Yeni üye highlight (1 saniye boyunca subtle background pulse)
  - Dosya: `mobile/app/(tabs)/members.tsx` (UPDATE)

- [ ] **6. Tests**
  - `backend/src/routes/trainers-events.test.ts`:
    - PT'nin kendi event'lerini alır
    - `since` filter doğru
    - Başka PT'nin event'lerini ALMAZ
  - `mobile/src/events/use-pt-events.test.ts`:
    - Hook polling tetikler (fake timer + fetch mock)
    - Focus blur'da pause/resume
  - `mobile/src/components/in-app-banner.test.tsx`:
    - Render + tap callback
  - Dosya: `backend/src/routes/trainers-events.test.ts`, `mobile/src/events/use-pt-events.test.ts`, `mobile/src/components/in-app-banner.test.tsx`

- [ ] **7. i18n**
  - `notifications.json` (mobile): `notifications.invitation_accepted: "{{name}} davetini kabul etti"`

---

## Etkilenen Dosyalar

```
backend/
└── src/routes/
    ├── trainers-events.ts                              # YENİ
    └── trainers-events.test.ts                         # YENİ
mobile/
├── app/(tabs)/
│   └── members.tsx                                     # GÜNCELLE
└── src/
    ├── events/
    │   ├── use-pt-events.ts                            # YENİ
    │   ├── use-pt-events.test.ts                       # YENİ
    │   └── banner-store.ts                             # YENİ
    ├── components/
    │   ├── in-app-banner.tsx                           # YENİ
    │   ├── in-app-banner.test.tsx                      # YENİ
    │   └── banner-stack.tsx                            # YENİ
    └── i18n/locales/tr/
        └── notifications.json                          # GÜNCELLE
```

---

## Dikkat Noktaları

- **Polling traffic:** 20s interval × PT count → backend load düşük (v1 1 PT). Battery cost: foreground polling acceptable; background polling iOS'ta yasak (BackgroundFetch quota). Foreground-only enough.
- **Events table mı join mı:** AuditLog'da `invitation_accepted` event var (TASK-1.14); `GET /trainers/me/events` AuditLog query yapar (PT'nin kendi event'leri). userIdHash bazlı join → backend'in `userId → userIdHash` map'i shared (TASK-1.14 hash helper).
- **PII:** `memberFirstName` event response'da var; bilinçli (PT zaten member ismini görür).
- **Network kesintisi:** Polling fail durumunda exponential backoff (1s → 5s → 30s); session connectivity loss göstergesi.
- **Banner queue overflow:** Çok hızlı 10 davet kabul edilirse stack 5'i göster, gerisini drop (counter "+5 daha" badge).

---

## Test Kriterleri

- [ ] Backend 3 senaryo PASS
- [ ] Hook test 2 senaryo PASS
- [ ] Banner component test 2 senaryo PASS
- [ ] Manuel test: PT app'i açıkken member başka cihazdan davet kabul → banner görünür + liste refresh

---

## Karar Noktaları

- **Polling vs SSE:** Polling öneririm (sade); M4'te push ile birlikte SSE/WebSocket'a taşınır.
- **Polling interval:** 20s öneririm (5-30 arası UX/load trade-off).

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.32): add in-app banner for invitation accepted events`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Polling pattern + M4 migration plan kararı

---

## Oturum Kayıtları

### Oturum 2026-05-30
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- **Backend** — `GET /trainers/me/events?since=<ISO>` (`backend/src/routes/trainers-events.ts` YENİ + `server.ts` register). Trainer-only (`ensureTrainer`); kaynak **`TrainerMember`** (`trainerId + endedAt:null + member.deletedAt:null + startedAt > since`, newest-first), `{ type:'invitation_accepted', memberId, memberFirstName, occurredAt }`. `since` opsiyonel; geçersizse 400. `memberFirstName` döner, telefon DÖNMEZ. i18n `errors.events.invalidSince`. **Kaynak kararı:** task taslağı AuditLog öneriyordu ama AuditLog kabul eden üyenin hash'ini tutar (PT'nin değil) + trainerId/isim yok → PT-scoped sorgu yapılamaz; TrainerMember doğal kaynak (DECISIONS.md TASK-1.32).
- **Mobile event katmanı** — `src/api/trainers.ts` `listPtEvents` (YENİ); `src/events/banner-store.ts` (YENİ zustand: dedup `memberId:occurredAt` + MAX_VISIBLE 5 + overflow sayacı); `src/events/use-pt-events.ts` (YENİ polling hook: `useFocusEffect` foreground-only, 20sn interval, baseline=focus anı, ağ hatasında 1s→5s→30s backoff, unauthorized→dur).
- **Mobile UI** — `src/components/in-app-banner.tsx` (YENİ: Animated slide-down + 4sn auto-dismiss + tap + "X"; `useNativeDriver:false`), `src/components/banner-stack.tsx` (YENİ: store'dan görünür banner'lar + "+N daha" rozeti, sabit üst overlay). `app/(tabs)/members.tsx` (GÜNCELLE): `usePtEvents` mount + `onNewEvents`→`load('refresh')`+highlight; `BannerStack` render; yeni üye satırı ~1sn highlight (rowHighlight).
- **i18n** — mobile yeni `notifications` namespace (`invitationAccepted`/`dismiss`/`moreCount`); index + d.ts + namespaces güncellendi. Overflow sayacında i18next çoğul tuzağından kaçınmak için `{{n}}` ([[tr-locale]] / members `{{days}}` deseni).

**Test:**
- Backend `trainers-events.test.ts` **8 PASS** (newest-first + since-filter strict> + since-yok + cross-trainer sızmaz + soft-deleted hariç + geçersiz since 400 + member 403 + token yok 401). Backend full suite **167 PASS**.
- Mobile: `banner-store.test.ts` (4: enqueue/dedup/dismiss-seen/overflow), `use-pt-events.test.ts` (4: interval-poll/enqueue+callback/blur-stop/token-yok), `in-app-banner.test.tsx` (3: render+tap/X-dismiss/auto-dismiss), `members.test.tsx` (+1 banner entegrasyon). Mobile full suite **89 PASS**. typecheck/lint/format temiz.

**Otonom kararlar:**
- Event kaynağı AuditLog → TrainerMember (yapısal gerekçe, DECISIONS).
- BannerStack `members.tsx` içinde mount (tek tab var); ileride çok-tab olunca overlay tab layout'a taşınır (kod yorumunda not).
- `useNativeDriver:false` (native animated test ortamında yok; kısa banner perf farkı önemsiz).

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
