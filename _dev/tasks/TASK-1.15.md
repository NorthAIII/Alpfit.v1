# TASK-1.15: Soft delete + 30 gün retention job

**Durum:** ⬜ Bekliyor
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.13, TASK-1.14

---

## Hedef

KVKK retention politikasının uygulayıcı katmanını kur: soft delete pattern (`User.deletedAt`, `TrainerMember.endedAt`) + 30 gün sonra otomatik hard delete batch job. İki tetikleyici: (a) PT üyeyi çıkardığında `TrainerMember.endedAt = now`, 30 gün sonra üyenin sağlık verileri (Yakın 4'te eklenecek tablolar) purge; (b) Kullanıcı `healthConsentAt` rızasını geri çekerse 30 gün içinde tüm sağlık verisi silinir + AuditLog `consent_revoked` + `retention_purge` event'leri. Cron sözleşmesi tanımlı, çalıştırıcı (Coolify scheduled task veya in-app interval) konfig dışında bırakılır.

---

## Bağlam

Discuss-phase: "Soft delete + 30 gün saklama. KVKK rızası aktif kaldıkça veri 30 gün saklanır; rıza geri çekilirse veya 30 gün dolarsa otomatik silinir." [[ilkeler]] §"Kalıcılık önceliği" — KVKK gereksinimi şimdi kurulmazsa Yakın 4'te (ölçüm + yemek günlüğü) acele edilir ve hata payı artar. Bu fazda henüz silinecek "sağlık verisi" yok (M6 tabloları Yakın 4'te), ama **interface + cron + audit logic** baştan kurulur; Yakın 4'te sadece silinecek tablo listesi genişler.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §4 (KVKK Çerçevesi — retention + self-silme)
- `_dev/modules/M6-saglik-verisi.md` — KVKK + gizlilik
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → "PT üye çıkarma — veri akıbeti" + Kapsam Dışı → cron altyapısı
- `_dev/ILKELER.md` §"Kalıcılık önceliği"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Soft delete + 30 gün retention politikası + cron sözleşme kararı
- `_dev/KVKK.md` — retention politikası bölümü

---

## Alt Görevler

- [ ] **1. Soft delete pattern uygulayıcı**
  - `User.deletedAt`, `User.retentionDeadline` (TASK-1.13'te eklendi)
  - `TrainerMember.endedAt` (TASK-1.13'te eklendi)
  - `backend/src/kvkk/soft-delete.ts`:
    - `softDeleteUser(userId)` — `deletedAt = now`, `retentionDeadline = now + 30 days`, AuditLog `member_removed`
    - `endTrainerMember(relationId)` — `endedAt = now`, member'ın `retentionDeadline = now + 30 days` (sağlık verisi için), AuditLog `member_removed`
    - `revokeHealthConsent(userId)` — ConsentRecord `revoked` event + `retentionDeadline = now + 30 days`, AuditLog `consent_revoked`
  - Dosya: `backend/src/kvkk/soft-delete.ts`

- [ ] **2. Retention job (cron sözleşmesi)**
  - `backend/src/kvkk/retention-job.ts`:
    - `runRetentionPurge()` — `retentionDeadline < now` olan kullanıcıların hassas verisini hard-delete (v1'de henüz hassas veri tablosu yok; **interface boş ama doğru imza**: silinecek tablo listesi sonraki fazlarda eklenir)
    - `User`'ı tamamen mi silmeli yoksa "anonimize" mi etmeli? → Discuss-phase'de tartışılmadı; öneri: User row korunur ama `firstName/lastName/profilePhotoUrl/phoneE164` anonimize edilir (`phoneE164 = 'deleted_<hash>'`); FK'lar bozulmaz, AuditLog'da kim olduğu hash üzerinden bilinir. **Karar noktası aşağıda.**
    - AuditLog `retention_purge` event'i her purge sonrası yazılır
  - Dosya: `backend/src/kvkk/retention-job.ts`

- [ ] **3. Çalıştırıcı altyapı (sade)**
  - Discuss-phase: "M0'da cron / scheduled job altyapısı — bu fazda gerek yok (lazy-check)"
  - Ama retention job **periyodik çalışmak zorunda**; lazy-check yetmez (kullanıcı app'e girmediği müddetçe veri silinmez = KVKK ihlal).
  - **Karar:** Bu task'ta `runRetentionPurge()` çağrılan endpoint (`POST /admin/internal/retention-purge`) + Coolify scheduled task (günde 1 çağırır) → cron framework eklemiyoruz, hosting katmanından çözüyoruz.
  - Endpoint admin token ile korunur (env'den `ADMIN_INTERNAL_TOKEN`); production'da Coolify scheduled task token'i kullanır.
  - Dosya: `backend/src/routes/admin-internal.ts`, `_dev/docs/coolify-scheduled-task.md` (Coolify scheduled task kurulum rehberi)

- [ ] **4. Integration testler**
  - `backend/src/kvkk/retention-job.test.ts`:
    - `softDeleteUser` → `deletedAt` + `retentionDeadline` set
    - Deadline geçmemiş user → `runRetentionPurge()` purge etmez
    - Deadline geçmiş user → `runRetentionPurge()` anonimize eder, AuditLog `retention_purge` yazar
    - Health consent revoke → 30 gün retention deadline set, AuditLog `consent_revoked`
    - **v1.5 ready:** Sağlık verisi tablosu yokken purge job hata fırlatmaz (boş silinecek liste)
  - Dosya: `backend/src/kvkk/retention-job.test.ts`

- [ ] **5. KVKK.md retention politika bölümü**
  - `_dev/KVKK.md` → "Veri Saklama Politikası" bölümü:
    - Soft delete: PT üye çıkardığında 30 gün
    - Health consent revoke: 30 gün
    - User row anonimizasyon vs full delete kararı
    - Audit log retention sınırsız (v1)
    - Coolify scheduled task günlük tetikleme
  - Dosya: `_dev/KVKK.md` (UPDATE)

---

## Etkilenen Dosyalar

```
backend/
└── src/
    ├── kvkk/
    │   ├── soft-delete.ts                                # YENİ
    │   ├── retention-job.ts                              # YENİ
    │   └── retention-job.test.ts                         # YENİ
    └── routes/
        └── admin-internal.ts                             # YENİ
_dev/
├── docs/
│   └── coolify-scheduled-task.md                         # YENİ
└── KVKK.md                                               # GÜNCELLE
```

---

## Dikkat Noktaları

- **Hassas veri tablosu Yakın 4'te:** Bu task'ta `measurements`, `food_log` tabloları henüz yok; retention job interface'i `getDeletableTablesForUser(userId)` helper'a göre purge ediyor — boş liste hata vermez. Yakın 4'te bu helper'a tablo eklenir.
- **`ADMIN_INTERNAL_TOKEN` env'de** — `.env.example`'a eklenir.
- **Coolify scheduled task** UI'dan günde 1 (örn. 03:00 TR) → `curl -H "Authorization: Bearer ${TOKEN}" https://api.staging.../admin/internal/retention-purge`
- **User anonimizasyon stratejisi:** Tam delete FK'ları bozar (AuditLog'da userIdHash duruyor zaten, ama TrainerMember.memberId FK düşer). Anonimizasyon FK'ları korur. Bu, KVKK denetiminde "kullanıcı verisi silindi" beyanını destekler (PII silindi, anonim referans kaldı).
- **AuditLog purge edilmez** — append-only retention sınırsız (KVKK denetim için).
- **Soft delete query filtering:** Tüm User queries `where: { deletedAt: null }` filter ekler; Prisma middleware ile global filter koymak iyi pattern ama bu task'ta scope dışı (helper'larla manuel).

---

## Test Kriterleri

- [ ] Migration gerekmez (schema TASK-1.13'te); kod-only task
- [ ] `retention-job.test.ts` 5 senaryo PASS
- [ ] `POST /admin/internal/retention-purge` admin token ile çalışır, anonim olarak 401
- [ ] Anonimize user query'lerden filtrelenmiş gelir (`deletedAt IS NOT NULL` ile gelmez normal query'lere)
- [ ] AuditLog `retention_purge` event'i metadata'da silinen kullanıcı sayısı içerir (PII yok, sadece sayı)
- [ ] Coolify scheduled task rehber doküman var

---

## Karar Noktaları

- **Anonimizasyon vs hard delete:** Anonimizasyon öneririm (FK'lar bozulmaz + KVKK denetim beyanı tutar). Kullanıcıya teyit ettir.
- **Cron altyapısı:** Discuss-phase "M0'da cron yok" demişti ama retention için **periyodik tetikleme şart**. Coolify scheduled task çözümü cron framework eklemeden çalışır — discuss kararıyla uyumlu. Eğer kullanıcı in-app cron istiyorsa `node-cron` paketi eklenir; ama Coolify yaklaşımı daha sade. → Kullanıcıya sor.

---

## Risk ve Geri Dönüş Planı

- **Risk:** Retention job'unda yanlış kullanıcı purge edilirse veri kaybı.
  - **Mitigation:** Coolify scheduled task'i staging'de 1 ay test edilir → production'a Yakın 4 öncesi geçilir. Backblaze yedek (TASK-1.16) restore drill prosedürü hazır.
- **Risk:** Sağlık consent revoke event'i unutulursa veri 30 gün sonrası silinmez.
  - **Mitigation:** `revokeHealthConsent()` helper'a `recordConsent` + `setRetentionDeadline` atomik transaction; tek dosyada tutar.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.15): add soft delete and 30-day retention purge skeleton`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Soft delete + retention + cron sözleşme + anonimizasyon kararı
- [ ] KVKK.md retention politika bölümü eklendi

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
