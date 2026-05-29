# Restore Drill Prosedürü — Staging

**Bağlam:** TASK-1.16 — Yedek aldığını sanmak ≠ yedek almak. Aylık restore drill aktif sigortadır: B2'den son yedek indirilir, ayrı `restore_test` DB'sinde pg_restore yapılır, smoke query'lerle veri bütünlüğü teyit edilir. Drill aksaklığı = backup süreci kırık demektir, restore gerektiğinde fark etmek geç olur.

**Sıklık:** Ayda 1 (her ayın 15'i hedef tarih — [`_dev/memory/restore-drill-disiplini.md`](../memory/restore-drill-disiplini.md)).

**Süre:** ~10-15 dk (v1 DB ~100 MB için).

**Ön gereksinim:**
- ✅ [`backblaze-setup.md`](backblaze-setup.md) tamamlandı
- ✅ [`staging-pg-backup-cron.md`](staging-pg-backup-cron.md) crontab aktif, en az 1 başarılı backup B2'de
- ✅ `deploy@178.104.140.36` SSH erişimi

---

## Drill Akışı Özet

```
1. SSH staging sunucuya
2. rclone ile B2'den en son dump'ı indir
3. Postgres container'ında restore_test DB oluştur
4. pg_restore ile dump'ı yükle
5. Smoke query'ler — veri bütünlüğü teyit
6. restore_test DB drop, indirilen dump dosyasını sil
7. Drill sonucunu staging-infra.md'ye yaz (tarih + süre + başarı/başarısızlık)
```

---

## Adım 1 — SSH

```bash
ssh deploy@178.104.140.36
```

---

## Adım 2 — Son B2 Dump'ını Listele + İndir

```bash
# B2'deki tüm dump'lar
rclone ls alpfit-b2-crypt:

# beklenen format:
# 102400 staging-2026-MM-DD.dump
# ...

# En yeni dump dosyasını seç (boyut + tarih kontrolü)
# DATE_TAG değişkenini en son tarihe göre set et
DATE_TAG="2026-MM-DD"  # ← son backup tarihi

# Drill çalışma dizini
mkdir -p ~/restore-drills
cd ~/restore-drills

# İndir
rclone copy --config /home/deploy/.config/rclone/rclone.conf \
  "alpfit-b2-crypt:staging-${DATE_TAG}.dump" .

ls -lh "staging-${DATE_TAG}.dump"
# beklenen: ~50-200 KB (v1 boş schema); MB+ ise data var

# Hızlı integrity check — dump dosyasının başı pg_dump custom format magic byte mı?
head -c 5 "staging-${DATE_TAG}.dump" | xxd
# beklenen ilk 5 byte: PGDMP (50 47 44 4d 50)
```

**Hata: `rclone: Decrypt: bad data`** → rclone crypt password/salt yanlış. Password manager'dan kontrol. backblaze-setup Adım 5.

**Hata: `head` magic byte PGDMP değil** → dump corrupt veya crypt overlay bozuk. Backup logunu incele (`/var/log/alpfit/pg-backup.log`).

---

## Adım 3 — `restore_test` DB Oluştur

```bash
cd /opt/alpfit/_ops/staging

# Postgres container'ında restore_test DB oluştur
# (eğer var ise önce drop)
docker compose exec -T alpfit-postgres psql \
  -U "${POSTGRES_USER:-alpfit}" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS restore_test;"

docker compose exec -T alpfit-postgres psql \
  -U "${POSTGRES_USER:-alpfit}" \
  -d postgres \
  -c "CREATE DATABASE restore_test;"

# Teyit
docker compose exec -T alpfit-postgres psql \
  -U "${POSTGRES_USER:-alpfit}" \
  -l | grep restore_test
# beklenen: restore_test | alpfit | UTF8 | ...
```

> 💡 **Neden ayrı DB?** Production DB üstüne restore yapmak felaket reçetesi — drill var olan veriyi siler. Ayrı DB güvenli + drill production'ı etkilemez.

---

## Adım 4 — pg_restore

```bash
# Dump dosyasını container'a kopyala
docker cp ~/restore-drills/staging-${DATE_TAG}.dump \
  $(docker compose ps -q alpfit-postgres):/tmp/restore.dump

# Restore başlangıç zamanı
START_TS=$(date +%s)

# pg_restore (verbose, exit-on-error)
docker compose exec -T alpfit-postgres pg_restore \
  -U "${POSTGRES_USER:-alpfit}" \
  -d restore_test \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  --verbose \
  /tmp/restore.dump 2>&1 | tail -50

RESTORE_EXIT=$?
END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

echo "Restore exit code: $RESTORE_EXIT"
echo "Elapsed: ${ELAPSED}s"

# Temizle
docker compose exec -T alpfit-postgres rm /tmp/restore.dump
```

**Beklenen exit code: 0**

`pg_restore` bazı warning'leri (örn. eksik role) kabul eder, ama `--exit-on-error` ile critical hata anında durur. Warning'ler tail'de okunur ama exit 0 olmalı.

---

## Adım 5 — Smoke Query'ler (Veri Bütünlüğü)

```bash
# Schema tabloları beklendiği gibi mi?
docker compose exec -T alpfit-postgres psql \
  -U "${POSTGRES_USER:-alpfit}" \
  -d restore_test \
  -c '\dt'

# beklenen tablolar (TASK-1.13/1.14/1.15'ten):
# User, TrainerMember, GymOwnership, ConsentRecord, AuditLog, ...

# User sayısı (v1'de 0; auth tamamlandığında > 0)
docker compose exec -T alpfit-postgres psql \
  -U "${POSTGRES_USER:-alpfit}" \
  -d restore_test \
  -c 'SELECT count(*) FROM "User";'

# Audit log son event tarihi (cron çalışıyorsa retention_purge event'i olmalı)
docker compose exec -T alpfit-postgres psql \
  -U "${POSTGRES_USER:-alpfit}" \
  -d restore_test \
  -c 'SELECT MAX("occurredAt") AS last_event, count(*) AS total FROM "AuditLog";'

# Schema migration durumu (Prisma _prisma_migrations tablosu)
docker compose exec -T alpfit-postgres psql \
  -U "${POSTGRES_USER:-alpfit}" \
  -d restore_test \
  -c 'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;'

# beklenen: en az TASK-1.13/1.14 migration'ları (rol modeli + KVKK schema)
```

**Beklenen sonuçlar:**
- Tüm production tabloları (`\dt`) listelenir
- `User` count canlı DB ile uyumlu (drill anında karşılaştır)
- Son `_prisma_migrations` migration son uygulanan migration ile uyumlu
- `AuditLog` boş değil (retention cron çalışıyorsa günlük event var)

---

## Adım 6 — Temizlik

```bash
# restore_test DB drop
docker compose exec -T alpfit-postgres psql \
  -U "${POSTGRES_USER:-alpfit}" \
  -d postgres \
  -c "DROP DATABASE restore_test;"

# Indirilen dump dosyasını sil (local + drills dizini)
rm ~/restore-drills/staging-${DATE_TAG}.dump
rmdir ~/restore-drills 2>/dev/null || true

# Teyit: restore_test artık yok
docker compose exec -T alpfit-postgres psql \
  -U "${POSTGRES_USER:-alpfit}" \
  -l | grep restore_test
# beklenen: hiçbir satır (DB silindi)
```

---

## Adım 7 — Drill Kaydı

[`_dev/memory/staging-infra.md`](../memory/staging-infra.md) → "Restore Drill Kayıtları" bölümüne ekle:

```markdown
- **2026-MM-DD:** ✅ Başarılı — dump `staging-YYYY-MM-DD.dump` (XXX KB), restore süresi Ys, smoke query: User count=0, AuditLog count=Z, son migration `20260529205040_kvkk_consent_audit`. Aksilik yok.
```

Aksilik olduysa:

```markdown
- **2026-MM-DD:** ❌ Başarısız — `<hata özeti>`. Müdahale: `<yapılan>`. Drill prosedüründe güncelleme: `<varsa>`.
```

---

## Sorun Giderme

**Smoke query: User sayısı production ile uyuşmuyor:**
→ Dump tarihi production'dan farklı (dump alındığı andan beri yeni kayıt eklenmiş olabilir). `_prisma_migrations` listesi aynı olmalı; veri sayıları yaklaşık aynı.

**pg_restore exit code 1 ama smoke query'ler çalışıyor:**
→ Warning'i tail'den oku. Sık nedenler: missing role (rol container env'de eksik), uyumsuz extension. Smoke query'ler doğru sonuç dönüyorsa drill başarılı sayılır ama warning kaydı `staging-infra.md`'ye eklenir.

**Restore süresi beklenenden uzun (>5 dk v1):**
→ DB büyümüş veya disk IO darboğazı. Drill kaydına süreyi yaz; trend analizi için.

**Hiç dump yok B2'de:**
→ Cron çalışmıyor; `/var/log/alpfit/pg-backup.log` incele. **Bu kritik** — backup süreci kırık demek.

---

## Hızlı Komut Özeti (rehber referansı için kısa form)

```bash
# 1. SSH
ssh deploy@178.104.140.36

# 2. Dump indir
DATE_TAG="2026-MM-DD"
mkdir -p ~/restore-drills && cd ~/restore-drills
rclone copy --config /home/deploy/.config/rclone/rclone.conf \
  "alpfit-b2-crypt:staging-${DATE_TAG}.dump" .

# 3. restore_test DB oluştur
cd /opt/alpfit/_ops/staging
docker compose exec -T alpfit-postgres psql -U alpfit -d postgres \
  -c "DROP DATABASE IF EXISTS restore_test; CREATE DATABASE restore_test;"

# 4. Restore
docker cp ~/restore-drills/staging-${DATE_TAG}.dump \
  $(docker compose ps -q alpfit-postgres):/tmp/restore.dump
START=$(date +%s)
docker compose exec -T alpfit-postgres pg_restore -U alpfit -d restore_test \
  --no-owner --no-privileges --exit-on-error /tmp/restore.dump
echo "Elapsed: $(($(date +%s) - START))s"
docker compose exec -T alpfit-postgres rm /tmp/restore.dump

# 5. Smoke
docker compose exec -T alpfit-postgres psql -U alpfit -d restore_test -c '\dt'
docker compose exec -T alpfit-postgres psql -U alpfit -d restore_test \
  -c 'SELECT count(*) FROM "User"; SELECT count(*) FROM "AuditLog";'

# 6. Temizlik
docker compose exec -T alpfit-postgres psql -U alpfit -d postgres \
  -c "DROP DATABASE restore_test;"
rm ~/restore-drills/staging-${DATE_TAG}.dump

# 7. Drill kaydını _dev/memory/staging-infra.md'ye yaz
```

---

## İlgili Dokümanlar

- [`backblaze-setup.md`](backblaze-setup.md) — Manuel B2 hesap/bucket/key kurulum
- [`staging-pg-backup-cron.md`](staging-pg-backup-cron.md) — Backup cron + script
- [`_dev/memory/restore-drill-disiplini.md`](../memory/restore-drill-disiplini.md) — Aylık disiplin
- [`_dev/memory/staging-infra.md`](../memory/staging-infra.md) — Drill kayıt yeri
- [`_dev/docs/DECISIONS.md`](DECISIONS.md) — "2026-05-30 — TASK-1.16"

---

**Son Güncelleme:** 2026-05-30 — TASK-1.16: restore drill prosedürü oluşturuldu; ilk drill B2 hesabı + cron kurulduktan sonra.
