# TASK-2.03: Programs API — Tüm Program Endpoint'leri

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.1 Program Builder + F2.2 Üye Program Görüntüleme
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.01 ✅

---

## Hedef

Programs resource'un tüm endpoint'leri implement edilir: yeni program oluşturma (POST, draft), auto-save (PATCH — tüm yapı), üyeye yayınlama (POST publish), başka üyeye kopyalama (POST copy), tam program okuma (GET), PT ve üye view'ları (GET). Task sonunda PT tarafından program yazılıp yayınlanabilir; üye kendi aktif programını çekebilir; in-app banner event'i publish sırasında tetiklenir.

---

## Bağlam

PATCH endpoint'i auto-save için tasarlanmış: client 1 sn debounce sonra tüm program yapısını (days + exercises) gönderir, backend olduğu gibi upsert eder. Bu "tüm yapı gönder" yaklaşımı diff mantığı karmaşıklığını ortadan kaldırır — pilot ölçeğinde performans sorunu yok (küçük JSON).

Program değişikliği bildirimi (publish + update) için M4 push yok; bunun yerine in-app banner event store'a yazılır. Backend publish endpoint'i response body'sinde `bannerEvent: "program_changed"` döner — mobile TASK-2.14'te bunu banner-store'a yazar.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → API Endpoint Tasarımı (Programs kısmı)
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → Auto-save Mimarisi
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → Program kaydetme UX, Builder giriş noktası
- `_dev/modules/M2-program-domain.md` §F2.1 Kabul Kriterleri — program yapısı + üye atama + PT verimlilik kuralları

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. Program Service katmanı**
  - `apps/backend/src/services/program.service.ts` oluştur:
    - `createProgram(trainerId, memberId)` — status: draft; trainer sadece kendi üyelerine program yazabilir (trainer-member relationship check Faz 1'den)
    - `patchProgram(trainerId, programId, body)` — tüm yapı upsert: `ProgramDay`'leri sil+yeniden oluştur (veya upsert by dayOfWeek+position); `ProgramDayExercise`'leri aynı şekilde; status: draft korunur
    - `publishProgram(trainerId, programId)` — status: active, publishedAt: now; üye için in-app banner event döner
    - `copyProgram(trainerId, sourceProgramId, targetMemberId)` — kaynak program days+exercises deep copy; yeni program draft olarak oluşur
    - `getProgram(requesterId, programId)` — PT: kendi programı; Member: kendi aktif programı; tam yapı (days + exercises + exercise detayları)
    - `getMemberActiveProgram(trainerId, memberId)` — PT view: üyenin aktif programı
    - `getMyActiveProgram(memberId)` — üye view: kendi aktif programı

- [ ] **2. Programs Route Handler**
  - `apps/backend/src/routes/programs.ts` oluştur:
    - `POST /programs` — body: `{ memberId }` → `createProgram()`; sadece Trainer
    - `PATCH /programs/:id` — body: `patchProgramSchema` → `patchProgram()`; sadece Trainer + ownership
    - `POST /programs/:id/publish` → `publishProgram()`; sadece Trainer + ownership
    - `POST /programs/:id/copy` — body: `{ targetMemberId }` → `copyProgram()`; sadece Trainer
    - `GET /programs/:id` → `getProgram()`; Trainer veya üye kendi programı
    - `GET /members/:memberId/program` → `getMemberActiveProgram()`; sadece Trainer + kendi üyesi
    - `GET /me/program` → `getMyActiveProgram()`; sadece Member

- [ ] **3. Integration Testler**
  - `apps/backend/src/routes/programs.test.ts` oluştur:
    - `POST /programs` — draft program oluşur
    - `POST /programs` (başka trainer'ın üyesi için) → 403
    - `PATCH /programs/:id` — tüm yapı kaydedilir; ikinci PATCH üzerine yazar (idempotent yapı)
    - `POST /programs/:id/publish` — status active olur; publishedAt set edilir
    - `POST /programs/:id/copy` — yeni draft program oluşur, days+exercises kopyalanır
    - `GET /programs/:id` (Trainer) — tam yapı döner
    - `GET /me/program` (Member) — kendi aktif programı döner
    - `GET /me/program` (program yokken) — 404 veya empty state
    - `GET /members/:memberId/program` (başka trainer) → 403

---

## Etkilenen Dosyalar

```
apps/backend/src/
├── services/program.service.ts     # YENİ
├── routes/programs.ts              # YENİ
└── routes/programs.test.ts         # YENİ
```

---

## Dikkat Noktaları

- **PATCH "tüm yapı" stratejisi:** Basitlik için `ProgramDay`'leri önce `programId`'e göre hepsini sil, sonra body'den yeniden oluştur. Alternatif upsert daha verimli ama pilot ölçeğinde fark yok — basit sil+yeniden-oluştur tercih edilir.
- **Auto-save ve publish race condition:** Sunucu tarafında özel bir önlem yok — PATCH/publish birbirini override eder; son gelen kazanır. Client tarafındaki debounce mekanizması (TASK-2.09) bu önlemi üstlenir.
- **Copy deep clone:** ProgramDay + ProgramDayExercise'lerin hepsini yeni program altında oluştur; orijinal programın status/publishedAt bilgileri kopyalanmaz — yeni program her zaman draft.
- **Trainer-member relationship:** `createProgram` ve `getMemberActiveProgram`'da trainer sadece kabul ettiği üyesine ulaşabilir — `TrainerMember` junction table (Faz 1) kontrolü şart.
- **publishProgram response:** `{ program, bannerEvent: "program_changed" }` — mobile TASK-2.14'te kullanır.
- **Status geçişleri:** draft → active (publish); active → archived (yeni program publish edilince eskisi archived olur). Bir üyenin aynı anda tek active programı olabilir.

---

## Test Kriterleri

- [ ] `POST /programs` → 201 draft program, trainerId + memberId doğru
- [ ] `PATCH /programs/:id` iki kez → ikinci PATCH ilk içeriğin üzerine yazar, gereksiz duplicate yok
- [ ] `POST /programs/:id/publish` → status "active", publishedAt doldu, response'da bannerEvent
- [ ] `GET /me/program` (Member) → yayınlanmış programı tam yapıyla alır
- [ ] `POST /programs/:id/copy` → yeni program oluştu, kaynak programın days/exercises kopyalandı
- [ ] Üyenin birden fazla active programı olamaz: yeni publish eskiyi archived yapmalı
- [ ] Backend typecheck + tüm test'ler geçer: `pnpm --filter backend test`

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
