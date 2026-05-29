# TASK-1.16: Backblaze B2 yedek + restore drill prosedürü

**Durum:** ✅ Tamamlandı (2026-05-30)
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.10

---

## Hedef

Postgres staging DB için günlük Backblaze B2 off-site yedek kur (Coolify built-in backup B2 hedefine), restore drill prosedürünü dokümante et + bir kez staging üzerinde manuel test et. Hetzner tek-node SPOF (Araştırma §Tuzak #4) mitigation'ının uygulamasıdır.

---

## Bağlam

Araştırma §Tuzak #4: "Hetzner tek-node SPOF — sunucu çökerse 30-60 dk downtime." Mitigation: "Günlük Backblaze B2 yedek (Coolify built-in), ayda 1 manuel restore drill (faz retrosuna ekle)". Coolify Postgres resource'unu backup hedefi olarak B2'ye yönlendirir. Bu task'ta yedek konfigürasyonu + ilk restore drill yapılır; aylık drill'e başlama anlaşması faz retrosunda kayıt altına alınır.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §1, §7
- `_dev/phases/PHASE-1.md` — Araştırma → Dikkat Edilecekler #4 (Hetzner SPOF)
- TASK-1.10 — Coolify staging kurulumu

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — Backblaze B2 yedek + aylık drill kararı
- `_dev/memory/staging-infra.md` — B2 bucket adı + ilk drill tarihi
- `_dev/KVKK.md` — yedek lokasyonu KVKK notu (B2 EU region kullanılır mı; Backblaze EU Frankfurt sunucu)

---

## Alt Görevler

- [ ] **1. Backblaze B2 hesap + bucket (manuel — kullanıcı adımları)**
  - B2 hesabı aç (eğer yoksa), EU Central region (`eu-central-003`) bucket oluştur (`alpfit-staging-db-backup`)
  - B2 application key + ID (read+write bucket scope)
  - Lifecycle policy: 30 günden eski yedekler otomatik silinir (storage maliyet kontrolü)
  - Dosya: `_dev/docs/backblaze-setup.md` — manuel adım rehberi

- [ ] **2. Coolify backup konfigürasyonu**
  - Coolify Postgres resource → Backups → S3-compatible (B2 endpoint: `s3.eu-central-003.backblazeb2.com`)
  - Access key + secret Coolify UI'dan girilir
  - Schedule: günde 1 (03:00 TR — retention job sonrası)
  - Retention: Coolify 7 gün local + B2 30 gün lifecycle
  - Test: manuel "Backup Now" tetiklenir, B2 bucket'ında dump dosyası görünür

- [ ] **3. Restore drill prosedürü (dokümantasyon)**
  - `_dev/docs/restore-drill.md`:
    1. B2'den en son yedek dosyasını indir (`b2 download-file-by-name ...`)
    2. Staging'de `restore_test` adlı yeni DB oluştur
    3. `pg_restore -d restore_test backup.dump`
    4. Smoke query'ler: `SELECT count(*) FROM "User"`, `SELECT MAX("createdAt") FROM "AuditLog"`
    5. Veri bütünlüğü teyit edilir
    6. `restore_test` DB drop
    7. Drill kaydı: `_dev/memory/staging-infra.md`'ye drill tarihi + sonuç
  - Dosya: `_dev/docs/restore-drill.md`

- [ ] **4. İlk restore drill (kullanıcı ile birlikte)**
  - Bu task'ta bir kez staging üzerinde tam restore drill yapılır (kullanıcı + Claude ekran paylaşımı veya kullanıcı tek başına rehberi izleyerek)
  - Sonuç (başarılı/başarısız + süre) `staging-infra.md`'ye kaydedilir
  - Aksilik varsa prosedür güncellenir

- [ ] **5. KVKK yedek konum notu**
  - `_dev/KVKK.md`'ye not: "DB yedekleri Backblaze B2 EU Central (Amsterdam/Frankfurt region) — AB sınırı içinde; KVKK m.9 SCC kapsamında. Backblaze ile DPA imzası gerekir." TODO: Yakın 4 öncesi hukuki danışman.
  - Dosya: `_dev/KVKK.md` (UPDATE)

- [ ] **6. Aylık drill takvim hatırlatması**
  - `_dev/phases/PHASE-1.md` retrospektif bölümüne (gelecek review-phase'de) "Aylık restore drill her ayın 15'i" satırı eklenir
  - DURUM.md'de ya da review-phase çıktısında takvim kaydı
  - Memory'de "Süreç Disiplinleri" altında "Restore drill" giriş (proje genelinde geçerli süreç): `_dev/memory/restore-drill-disiplini.md` + MEMORY.md
  - Dosya: `_dev/memory/restore-drill-disiplini.md`, `_dev/MEMORY.md`

---

## Etkilenen Dosyalar

```
_dev/
├── docs/
│   ├── backblaze-setup.md                  # YENİ
│   └── restore-drill.md                    # YENİ
├── memory/
│   ├── staging-infra.md                    # GÜNCELLE (B2 bucket + ilk drill)
│   └── restore-drill-disiplini.md          # YENİ
├── MEMORY.md                               # GÜNCELLE
└── KVKK.md                                 # GÜNCELLE (B2 konum notu)
```

---

## Dikkat Noktaları

- **B2 maliyet:** ~$0.005/GB/ay; v1 DB'si küçük (~100 MB), aylık maliyet $0.001 düzeyinde — yok denecek kadar düşük.
- **DPA (Data Processing Agreement) Backblaze ile:** KVKK m.9 + GDPR uyumu için DPA imzası şart. Backblaze EU customers için DPA template sunar. KVKK.md TODO.
- **Restore time:** 100 MB dump ~30 saniye restore; production'da DB büyürse zaman artar (test ile ölçülmeli).
- **Şifrelenmiş yedek:** Coolify B2 dump'larını AES-256 ile şifreler (varsayılan); şifreleme anahtarı **Coolify backup secret**'ında — ayrı offline yedek (örn. kullanıcının password manager'ında) zorunlu, kaybedilirse restore imkansız.

---

## Test Kriterleri

- [ ] B2 bucket oluşturuldu, lifecycle 30 gün set
- [ ] Coolify backup konfigürasyonu kaydedildi, "Backup Now" çalışıyor
- [ ] İlk yedek dosyası B2'de görünür (`b2 ls`)
- [ ] Restore drill prosedürü bir kez yapıldı, başarılı (smoke query'ler doğru çıktı)
- [ ] Drill sonucu `staging-infra.md`'ye yazıldı
- [ ] B2 secret + Coolify backup encryption key kullanıcının password manager'ında (kullanıcı teyit)
- [ ] KVKK.md DPA + B2 EU konum notu eklendi
- [ ] Memory `restore-drill-disiplini.md` aylık drill kuralını içerir

---

## Karar Noktaları

- **Aylık drill kim yapar:** Kullanıcı (kurucu) tek başına mı, yoksa Claude ile birlikte mi? → Bu task'ta ilk drill birlikte; aylık drill kullanıcı kendisi (rehberi izleyerek) — Claude oturumu gerek yok.

---

## Risk ve Geri Dönüş Planı

- **Risk:** Backup encryption key kaybolursa tüm yedekler kullanılamaz hale gelir.
  - **Mitigation:** Key kullanıcının password manager'ında (1Password, Bitwarden vb.) + ek olarak başka bir yerde (sealed envelope veya ayrı device).
- **Risk:** B2 hesabı suspend olursa yedeklere erişim kesilir.
  - **Mitigation:** Coolify local 7 günlük yedek + (v1.5+) ikincil yedek hedefi (örn. AWS S3 Glacier Frankfurt).

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı (kullanıcı manuel adımları dahil)
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`docs(TASK-1.16): set up b2 backup and document restore drill`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — Backblaze B2 yedek + aylık drill kararı
- [ ] MEMORY.md + `memory/staging-infra.md` (UPDATE) + `memory/restore-drill-disiplini.md` (YENİ)
- [ ] KVKK.md DPA + B2 EU konum notu

---

## Oturum Kayıtları

### Oturum 2026-05-30
**Durum:** ✅ Tamamlandı

**Bağlam (kapsam ayarlaması):** TASK-1.10'da Coolify'dan docker-compose'a geçilmesiyle task tanımındaki "Coolify built-in backup B2 hedefi" varsayımı düştü. Mekanizma yeniden tasarlandı: host VPS crontab + `docker compose exec pg_dump` + `rclone` (B2 native driver + crypt overlay). AskUserQuestion 3 karar: (a) script + host crontab (önerilen, TASK-1.15 paterniyle aynı), (b) B2 hesabı sonra kurulacak (manuel adımlar TODO), (c) ilk drill sonraya ertelendi (kullanıcı kendisi yapacak). Sonuç: bu task **dokümantasyon + script template + DECISIONS + memory disiplini + KVKK güncellemesi** olarak teslim; B2 hesap/key/cron deploy/ilk drill kullanıcı follow-up'ı.

**Yapılanlar:**
- **`_dev/docs/backblaze-setup.md` (YENİ)** — Backblaze B2 manuel hesap+bucket+lifecycle+key kurulum rehberi: EU Central region zorunluluğu (geri alınamaz, ⚠️ bold), bucket private + SSE-B2, lifecycle 30 gün hide + 1 gün delete, scoped application key (master key kullanılmaz), client-side encryption password+salt üretimi, DPA imza formu, password manager pointer disiplini. Maliyet tablosu (~$0.02/ay v1), sorun giderme, kararlaştırılan değerler tablosu staging-infra.md'ye işaret.
- **`_dev/docs/staging-pg-backup-cron.md` (YENİ)** — rclone install + non-interaktif config (B2 + crypt overlay), config smoke test, `/usr/local/bin/alpfit-pg-backup.sh` template (pg_dump custom format + single-transaction + no-owner + no-privileges + compress=6 → /var/backups/alpfit/staging-YYYY-MM-DD.dump → rclone copy → local 7 gün cleanup), sanity guard (dump < 1KB ise exit 2), crontab `0 2 * * *` UTC (TR 05:00 — retention purge UTC 00:00'dan 2 saat sonra), logrotate haftalık×8, manuel smoke, doğrulama checklist. TASK-1.15 staging-retention-cron.md paterniyle hizalı (aynı host crontab + docker compose exec deseni).
- **`_dev/docs/restore-drill.md` (YENİ)** — Aylık restore drill prosedürü 7 adım: SSH → rclone B2'den son dump indir (PGDMP magic byte sanity) → `restore_test` ayrı DB oluştur (production'a dokunmaz) → `docker cp` + `pg_restore --exit-on-error --verbose` (elapsed ölçer) → smoke query (`\dt`, `User count`, `AuditLog count + MAX(occurredAt)`, `_prisma_migrations`) → temizlik (DB drop + dump dosyası sil) → drill kaydı `staging-infra.md`'ye (✅/❌ + süre + smoke özet). Hızlı komut özeti aşağıda referans için.
- **`_dev/memory/restore-drill-disiplini.md` (YENİ)** — Süreç Disiplinleri kategorisinde aylık drill kuralı: her ayın 15'i hedef tarih, prosedür restore-drill.md, drift sinyalleri (B2 boyutu sabit, log FAIL ardışık), aksilikte `/devflow:quick` task; faz review-phase'lerinde drill kontrolü; bu proje özgüsü (DevFlow geneli değil).
- **`_dev/memory/staging-infra.md` UPDATE** — "B2 Off-Site Yedek" tablosu (provider, region, endpoint, bucket, key/encryption pointer'ları, lifecycle, local buffer, cron schedule, script path, log path, DPA tarihi — TBD alanları kullanıcı follow-up'da doldurur) + "Restore Drill Kayıtları" bölümü (boş başlangıç) + "Yedekleme" satırı rehber link'lerine güncellendi + TODO listesi 3 follow-up satırına bölündü (B2 hesap kurulumu, cron deploy, ilk drill).
- **`_dev/MEMORY.md` UPDATE** — `restore-drill-disiplini.md` pointer'ı Süreç Disiplinleri altına eklendi; son güncelleme satırı TASK-1.16'ya çevrildi.
- **`_dev/KVKK.md` UPDATE** — "Üçüncü Taraf Sözleşmeler" listesinde "Backblaze B2 yedek region" satırı ✅ çevrildi (eu-central-003 Amsterdam kararı + rehber link'leri + mekanizma özeti + maliyet); ayrı bir DPA TODO satırı (kullanıcı follow-up, hukuki danışman onayı).
- **`_dev/docs/DECISIONS.md` UPDATE** — "2026-05-30 — TASK-1.16: Backblaze B2 EU Off-Site Yedek + rclone Crypt Overlay + Host Crontab + Aylık Drill" kararı eklendi (en üst). 5 seçenek matrisi (provider/mekanizma/encryption/lifecycle/drill sıklığı), 8 tamamlayıcı karar (rclone B2 driver vs S3, local 7 gün buffer, single-transaction, format=custom, restore_test izolasyonu, drill smoke query setü, cron 2 saat tampon, memory disiplini), ILKELER §"Kalıcılık önceliği" / §"Sır ve konfigürasyon yönetimi" / §"Kümülatif test altyapısı" / §"Pazarlık Konusu Olmayanlar" gerekçeleri, 6 risk-mitigation (encryption key kaybı, B2 suspend, silently fail, region yanlış, drill atlanır, B2 bandwidth çakışması), 6 follow-up kullanıcı manuel adımı.

**Kapsam Dışı (kullanıcı follow-up — bu task'tan sonra):**
- B2 hesap açılışı + bucket + lifecycle + application key + encryption password üretimi (`backblaze-setup.md` rehberi)
- Backblaze DPA imzası
- Sunucuda rclone install + config + script deploy + crontab (`staging-pg-backup-cron.md` rehberi)
- İlk restore drill (`restore-drill.md` rehberi)
- Sonuçlar `_dev/memory/staging-infra.md` "B2 Off-Site Yedek" + "Restore Drill Kayıtları" bölümlerine yazılır

**Test ve Doğrulama:**
- `bash -n` syntax check tüm script blokları (backup script 59 satır + rclone config snippet + drill snippet) — temiz
- Regresyon: backend 52 PASS + shared 41 PASS + mobile 23 PASS (snapshot dahil) — değişiklik yalnızca _dev/ dokümanları olduğundan baseline aynı
- `pnpm typecheck` (recursive) temiz, `pnpm lint` temiz, `pnpm format:check` temiz
- shellcheck dev container'da yüklü değil; bash -n syntax kontrolü yapıldı

**Karar Noktaları (AskUserQuestion ile netleşti):**
- Backup mekaniği: Script + host crontab (TASK-1.15 paterniyle hizalı)
- B2 hesabı: Henüz hazır değil → bu task dokümantasyon + script template + decisions + memory ile kapanır
- İlk drill: Sonraya ertele → kullanıcı kendi sürecinde, B2 cron çalıştıktan sonra; sonuç memory'ye yazılır

**Kalan İşler:** Yok — task tamamlandı. Follow-up'lar kullanıcı manuel adımları (yukarıda).

**Belirsizlikler:** Yok.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-30
