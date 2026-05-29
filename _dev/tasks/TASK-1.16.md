# TASK-1.16: Backblaze B2 yedek + restore drill prosedürü

**Durum:** ⬜ Bekliyor
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

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
