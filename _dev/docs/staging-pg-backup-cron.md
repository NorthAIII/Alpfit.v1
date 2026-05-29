# Staging Postgres → Backblaze B2 Yedek Cron Kurulum Rehberi

**Bağlam:** TASK-1.16 — Hetzner tek-node SPOF (PHASE-1 Araştırma §Tuzak #4) mitigation'ı. Günde 1 kez Postgres staging DB → host'a `pg_dump` → rclone ile B2'ye şifreli yükleme. Coolify built-in backup yok (TASK-1.10 sapması), `pg_dump` + `rclone` + host crontab.

**Ön gereksinim:** [`backblaze-setup.md`](backblaze-setup.md) tamamlanmış olmalı (B2 hesabı + bucket + application key + encryption password).

**Sunucu:** `deploy@178.104.140.36` (Hetzner CPX32, paylaşımlı VPS — [staging-infra memory](../memory/staging-infra.md)).

---

## Genel Akış

```
host crontab (deploy user)
  └─ /usr/local/bin/alpfit-pg-backup.sh
       ├─ docker compose exec alpfit-postgres pg_dump
       │    └─ /var/backups/alpfit/staging-YYYY-MM-DD.dump (custom format, sıkıştırılmış)
       ├─ rclone copy → alpfit-b2-crypt:alpfit-staging-db-backup/
       │    └─ B2 bucket'a şifreli (rclone crypt overlay)
       └─ local 7 günden eski dump'ları sil
```

**Neden bu akış?**
- `pg_dump` Postgres'in resmi backup aracı; row-level consistent snapshot (`--single-transaction`); custom format (`-Fc`) selective restore destekler
- Host'a önce yazıp sonra rclone ile yüklemek: (a) network hatası durumunda local 7 günlük buffer (b) rclone retry/log mantığı pg_dump'ı engellemiyor
- **rclone crypt overlay:** B2 SSE-B2 server-side AES-256 yapar ama B2 hesabına erişen biri dosyaları okuyabilir; crypt overlay client-side encryption ekler → encryption key yoksa B2 dosyaları işe yaramaz
- Local 7 günlük buffer: B2 hesabı suspend olursa son hafta hemen elde

---

## Ön Koşullar

- ✅ TASK-1.10 deploy akışı çalışıyor (`/opt/alpfit/_ops/staging/docker-compose.yml`)
- ✅ [`backblaze-setup.md`](backblaze-setup.md) tamamlandı (bucket + key + encryption password password manager'da)
- ✅ `deploy` user docker group üyesi (`docker ps` çalışıyor)
- ⬜ **Bu rehber:** rclone install + config + script + crontab

---

## Adım 1 — rclone Kur

rclone Backblaze B2'yi native destekler (S3 API uyumlu, ama B2-native API daha hızlı + ucuz: B2 API call'ları daha az ücretlendirilir).

```bash
# rclone son stabil release (Debian/Ubuntu apt eski olabilir)
curl -fsSL https://rclone.org/install.sh | sudo bash

# Versiyon teyit (1.65+ olmalı)
rclone --version
# beklenen: rclone v1.6X.X
```

---

## Adım 2 — rclone Config: B2 Remote + Crypt Overlay

rclone config interaktif başlatma yerine **non-interaktif** dosya yazımı (idempotent, audit edilebilir):

```bash
# deploy user olarak çalıştır
sudo -u deploy mkdir -p /home/deploy/.config/rclone

# Hassas değerleri ENV'den oku (password manager'dan elle giriyorsun):
read -srp "B2 keyID: " B2_KEY_ID; echo
read -srp "B2 applicationKey: " B2_APP_KEY; echo
read -srp "rclone crypt password (Adım 5 backblaze-setup): " RCLONE_PWD; echo
read -srp "rclone crypt salt (password2): " RCLONE_SALT; echo

# rclone obscure → config dosyasında plain text yerine obscured
B2_APP_KEY_OBS=$(rclone obscure "$B2_APP_KEY")
RCLONE_PWD_OBS=$(rclone obscure "$RCLONE_PWD")
RCLONE_SALT_OBS=$(rclone obscure "$RCLONE_SALT")

# Config yaz
sudo -u deploy tee /home/deploy/.config/rclone/rclone.conf > /dev/null <<EOF
[alpfit-b2]
type = b2
account = $B2_KEY_ID
key = $B2_APP_KEY_OBS
hard_delete = true

[alpfit-b2-crypt]
type = crypt
remote = alpfit-b2:alpfit-staging-db-backup/
filename_encryption = standard
directory_name_encryption = true
password = $RCLONE_PWD_OBS
password2 = $RCLONE_SALT_OBS
EOF

# Permission tighten
sudo chown deploy:deploy /home/deploy/.config/rclone/rclone.conf
sudo chmod 600 /home/deploy/.config/rclone/rclone.conf

# Plain-text değerleri shell history'den temizle
unset B2_KEY_ID B2_APP_KEY RCLONE_PWD RCLONE_SALT
unset B2_APP_KEY_OBS RCLONE_PWD_OBS RCLONE_SALT_OBS
history -c
```

> ⚠️ **`rclone obscure` cryptographic security DEĞİL** — sadece "shoulder surfing" karşıtı obfuscation. Asıl güvenlik dosya permission (chmod 600 deploy:deploy) + sunucu erişim kontrolü. Encryption key'in asıl korunması password manager'da.

---

## Adım 3 — rclone Config Smoke Test

```bash
# B2 bağlantısı çalışıyor mu?
sudo -u deploy rclone lsd alpfit-b2:
# beklenen: bucket listesinde alpfit-staging-db-backup görünür

# Bucket içi listele (boş ya da test dosyası)
sudo -u deploy rclone ls alpfit-b2:alpfit-staging-db-backup
# beklenen: boş veya önceki test

# Crypt overlay çalışıyor mu? (test dosyası)
echo "test $(date -u +%s)" | sudo -u deploy rclone rcat alpfit-b2-crypt:smoke-test.txt
sudo -u deploy rclone cat alpfit-b2-crypt:smoke-test.txt
# beklenen: yukarıdaki test içeriği aynen geri okur

# Cleanup
sudo -u deploy rclone delete alpfit-b2-crypt:smoke-test.txt
```

**Hata: `401 Unauthorized`** → keyID/applicationKey yanlış kopyalandı; Adım 2 tekrar et.
**Hata: `bucket not found`** → bucket adı yanlış veya account region farklı; backblaze-setup Adım 2 doğrula.
**Hata: `Decrypt: bad data`** → password/salt yanlış; password manager'dan tekrar gir.

---

## Adım 4 — Backup Script

```bash
# Local dump dizini
sudo mkdir -p /var/backups/alpfit
sudo chown deploy:deploy /var/backups/alpfit
sudo chmod 700 /var/backups/alpfit

# Log dizini (varsa TASK-1.15'ten kalır)
sudo mkdir -p /var/log/alpfit
sudo chown deploy:deploy /var/log/alpfit

# Script
sudo tee /usr/local/bin/alpfit-pg-backup.sh > /dev/null <<'SH'
#!/bin/bash
# Postgres staging backup → B2 (rclone crypt) — TASK-1.16
# Her gün pg_dump → local dump → rclone copy → 7 günden eski local sil
set -euo pipefail

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE_TAG=$(date -u +"%Y-%m-%d")
DUMP_FILE="/var/backups/alpfit/staging-${DATE_TAG}.dump"
LOG_PREFIX="[$TIMESTAMP]"

echo "$LOG_PREFIX pg-backup starting"

# Adım 1: pg_dump (custom format, single transaction, no owner/privileges — restore portability)
cd /opt/alpfit/_ops/staging

if ! docker compose exec -T alpfit-postgres pg_dump \
      --username="${POSTGRES_USER:-alpfit}" \
      --dbname="${POSTGRES_DB:-alpfit}" \
      --format=custom \
      --single-transaction \
      --no-owner \
      --no-privileges \
      --compress=6 \
      > "$DUMP_FILE"; then
  echo "$LOG_PREFIX FAIL pg_dump exit code $?"
  rm -f "$DUMP_FILE"
  exit 1
fi

DUMP_SIZE=$(stat --printf="%s" "$DUMP_FILE")
echo "$LOG_PREFIX dump written: $DUMP_FILE ($DUMP_SIZE bytes)"

# Sanity: 1 KB altı dump şüpheli (boş DB değil, hata)
if [[ "$DUMP_SIZE" -lt 1024 ]]; then
  echo "$LOG_PREFIX FAIL dump too small ($DUMP_SIZE bytes) — pg_dump may have errored silently"
  exit 2
fi

# Adım 2: rclone copy → B2 (crypt overlay)
if ! rclone copy --config /home/deploy/.config/rclone/rclone.conf \
      "$DUMP_FILE" alpfit-b2-crypt: \
      --b2-hard-delete \
      --transfers=1 \
      --retries=3 \
      --low-level-retries=5; then
  echo "$LOG_PREFIX FAIL rclone copy exit code $?"
  # Local dump dosyası kalır — yarın retry, manuel inceleme
  exit 3
fi

echo "$LOG_PREFIX uploaded to b2: staging-${DATE_TAG}.dump"

# Adım 3: 7 günden eski local dump'ları sil (B2'de lifecycle 30 gün ayrı)
find /var/backups/alpfit -name "staging-*.dump" -type f -mtime +7 -delete
LOCAL_COUNT=$(find /var/backups/alpfit -name "staging-*.dump" -type f | wc -l)
echo "$LOG_PREFIX local retention: $LOCAL_COUNT dumps remaining"

echo "$LOG_PREFIX pg-backup OK"
exit 0
SH

sudo chmod +x /usr/local/bin/alpfit-pg-backup.sh
sudo chown deploy:deploy /usr/local/bin/alpfit-pg-backup.sh
```

**Script tasarım notları:**
- `--single-transaction` — pg_dump tüm tabloları **tek transaction**'da okur, ortada yazma olursa snapshot bozulmaz
- `--no-owner --no-privileges` — restore_test DB'sinde role mismatch olmasın diye; restore'da `--role=$USER` ile fix edilir
- `--format=custom` (`-Fc`) — sıkıştırılmış + selective restore (pg_restore -t tablo) imkanı
- `--compress=6` — zlib seviye 6 (default 0 sıkıştırma yok); CPU/IO trade-off optimal
- `rclone --transfers=1` — tek dosya zaten; paralel transfer overhead'i yok
- Local dump exit 3'ten sonra silinmez — manuel retry imkanı; ertesi gün yeni dump üretilir, 7 gün sonra otomatik silinir

---

## Adım 5 — Manuel Smoke Test (crontab'a güvenmeden önce)

```bash
# Script'i deploy user olarak elle çalıştır
sudo -u deploy /usr/local/bin/alpfit-pg-backup.sh

# Log inceleme (script stdout'a yazar; crontab >> ile dosyaya yönlendirir)
# Manuel çalıştırmada doğrudan terminale çıkar

# Local dump var mı?
ls -lh /var/backups/alpfit/
# beklenen: staging-2026-MM-DD.dump (~100 KB v1 boş schema)

# B2'de görünüyor mu?
sudo -u deploy rclone ls alpfit-b2-crypt:
# beklenen: staging-2026-MM-DD.dump (~aynı boyut)

# B2'de gerçek dosya (encrypted name) görünür mü?
sudo -u deploy rclone ls alpfit-b2:alpfit-staging-db-backup
# beklenen: 1 satır, encrypted filename (uzun base64-like string) — bu rclone crypt çalıştığının kanıtı
```

---

## Adım 6 — Crontab Ekle

```bash
sudo -u deploy crontab -e
```

Aşağıdaki satırı ekle (mevcut TASK-1.15 retention satırının ALTINA):

```cron
# Postgres → B2 backup — TASK-1.16
# Her gün UTC 02:00 (Europe/Istanbul UTC+3 → 05:00 TR)
# Retention purge (00:00 UTC) sonrası — purge sonuçlanmış olsun
0 2 * * * /usr/local/bin/alpfit-pg-backup.sh >> /var/log/alpfit/pg-backup.log 2>&1
```

> 💡 **Neden 02:00 UTC değil 00:00?** TASK-1.15 retention purge 00:00 UTC'de çalışıyor; backup retention purge'den **sonra** olmalı ki "purge edilmiş hali" yedeklensin (silinmiş veriyi yedeklersek retention amacı bozulur). 2 saatlik tampon retention job'a zaman bırakır.

---

## Adım 7 — Logrotate

```bash
sudo tee /etc/logrotate.d/alpfit-pg-backup > /dev/null <<'EOF'
/var/log/alpfit/pg-backup.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
  copytruncate
}
EOF

# Mevcut config syntax check
sudo logrotate -d /etc/logrotate.d/alpfit-pg-backup
```

---

## Adım 8 — İlk Gerçek Crontab Çalıştırması

İlk crontab tetiklenmesi UTC 02:00 (TR 05:00). Ertesi sabah:

```bash
sudo -u deploy tail -50 /var/log/alpfit/pg-backup.log

# Backup gerçekten geçti mi?
sudo -u deploy rclone ls alpfit-b2-crypt:
# beklenen: bir gün önceki + bugünün dump'ı

# Local dump (7 gün buffer)
ls -lh /var/backups/alpfit/
```

---

## Yedekleme + Rollback

- **Script bozulursa:** `sudo rm /usr/local/bin/alpfit-pg-backup.sh` + cron satırını sil → manuel pg_dump elle çalıştırılabilir.
- **rclone config kayıp:** Adım 2'yi password manager'dan yeniden yap.
- **B2 quota / billing problem:** rclone exit code 3 dönerse log incele; B2 console'da "Caps Exceeded" uyarısı varsa billing fix → kapasiteyi artır.

---

## Doğrulama Checklist (TASK-1.16 Test Kriterleri)

- [ ] `rclone lsd alpfit-b2:` → bucket görünür
- [ ] `rclone ls alpfit-b2-crypt:` → liste döner (boş veya dump)
- [ ] Manuel `alpfit-pg-backup.sh` exit 0 + B2'de dump dosyası görünür
- [ ] B2 console: encrypted filename + lifecycle policy aktif (Bucket → Lifecycle Settings)
- [ ] crontab satırı `crontab -l` ile listede
- [ ] Logrotate config `logrotate -d` ile syntax OK
- [ ] Encryption password + B2 key, kullanıcının password manager'ında (kullanıcı teyit eder)

---

## İlgili Dokümanlar

- [`backblaze-setup.md`](backblaze-setup.md) — Manuel B2 hesap/bucket/key kurulum (ön gereksinim)
- [`restore-drill.md`](restore-drill.md) — Restore drill prosedürü (bu backup'tan geri yükleme)
- [`staging-retention-cron.md`](staging-retention-cron.md) — KVKK retention cron (kardeş job; aynı host pattern)
- [`_dev/memory/staging-infra.md`](../memory/staging-infra.md) — Sunucu + network + env
- [`_dev/memory/restore-drill-disiplini.md`](../memory/restore-drill-disiplini.md) — Aylık drill disiplini
- [`_dev/docs/DECISIONS.md`](DECISIONS.md) — "2026-05-30 — TASK-1.16"

---

**Son Güncelleme:** 2026-05-30 — TASK-1.16: rehber oluşturuldu, pg_dump + rclone (B2 + crypt overlay) + host crontab deseniyle Coolify-bağımsız off-site backup.
