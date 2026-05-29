# Staging Retention Cron Kurulum Rehberi

**Bağlam:** TASK-1.15 — KVKK 30 gün retention purge job'u günlük tetiklenir. TASK-1.10'da Coolify yerine docker-compose seçildiği için (DECISIONS 2026-05-29 "TASK-1.10"), Coolify scheduled task yok. Tetikleme **host VPS crontab + curl** üzerinden yapılır — vendor-neutral, ek paket yok.

**Sunucu:** `deploy@178.104.140.36` (Hetzner CPX32, paylaşımlı VPS — [staging-infra memory](../memory/staging-infra.md)).

**Tetiklenecek endpoint:** `POST http://alpfit-backend:3000/admin/internal/retention-purge` — backend container'ı bunker docker network'üne attach (TASK-1.10). cron `deploy` user'ı + `docker compose exec` ile container ağına dahil olur; subdomain üzerinden değil container DNS adından çağırır (bunker-nginx katmanı atlanır).

---

## Ön Koşullar

- ✅ TASK-1.10 deploy akışı çalışıyor (`/opt/alpfit/_ops/staging/docker-compose.yml`)
- ✅ TASK-1.15 endpoint live (`POST /admin/internal/retention-purge`)
- ✅ `deploy` user docker group üyesi (manuel `docker ps` çalışıyor)
- ⬜ **Bu rehber:** `deploy` user crontab + log dizini + token env dosyası

---

## Adım 1 — `ADMIN_INTERNAL_TOKEN` üret ve `.env.staging`'e ekle

Sunucuda root veya deploy user ile:

```bash
# Token üret
TOKEN=$(openssl rand -hex 32)
echo "Token: $TOKEN"  # bir kez kopyala, sonra unutursun

# .env.staging'e ekle (eğer alan yoksa)
sudo -u deploy bash -c "
  grep -q '^ADMIN_INTERNAL_TOKEN=' /opt/alpfit/_ops/staging/.env.staging \
    || echo 'ADMIN_INTERNAL_TOKEN=$TOKEN' >> /opt/alpfit/_ops/staging/.env.staging
"

# chmod 600 zaten ayarlı olmalı (TASK-1.10)
ls -l /opt/alpfit/_ops/staging/.env.staging
# beklenen: -rw------- deploy deploy

# Backend container restart (yeni env değişkenini okusun)
sudo -u deploy bash -c "
  cd /opt/alpfit/_ops/staging && docker compose up -d alpfit-backend
"

# Smoke: env'in backend container'a geçtiğini doğrula
sudo -u deploy docker compose -f /opt/alpfit/_ops/staging/docker-compose.yml \
  exec alpfit-backend printenv ADMIN_INTERNAL_TOKEN
# beklenen: $TOKEN değerinin tamamı yazılı
```

---

## Adım 2 — Endpoint'i manuel olarak smoke et

```bash
# Container ağından (alpfit-backend hostname Docker DNS'iyle çözülür)
sudo -u deploy docker compose -f /opt/alpfit/_ops/staging/docker-compose.yml \
  exec alpfit-backend sh -c '
    curl -sS -X POST \
      -H "Authorization: Bearer $ADMIN_INTERNAL_TOKEN" \
      http://localhost:3000/admin/internal/retention-purge
  '
```

**Beklenen çıktı (200):**

```json
{"status":"ok","report":{"processedCount":0,"anonymizedCount":0,"healthDataPurgedCount":0,"deletedHealthRowsCount":0}}
```

`processedCount: 0` normal — şu an staging'de purge candidate yok. KVKK uyum: `AuditLog.retention_purge` event'i `count: 0` ile yazıldı (şeffaflık).

**401 alıyorsan:** ADMIN_INTERNAL_TOKEN değeri yanlış kopyalanmış. **503 alıyorsan:** env değişkeni container'a yansımamış — `docker compose up -d alpfit-backend` ile restart et.

---

## Adım 3 — `deploy` user crontab'ına ekle

```bash
# deploy user olarak
sudo -u deploy crontab -e
```

Aşağıdaki satırı ekle (TR saatiyle gece 03:00 → UTC 00:00, Hetzner sunucusu UTC çalışıyor):

```cron
# KVKK retention purge — TASK-1.15
# Her gün UTC 00:00 (Europe/Istanbul UTC+3 → 03:00 TR)
0 0 * * * /usr/local/bin/alpfit-retention-purge.sh >> /var/log/alpfit/retention-cron.log 2>&1
```

---

## Adım 4 — `alpfit-retention-purge.sh` script'i

```bash
# Log dizini
sudo mkdir -p /var/log/alpfit
sudo chown deploy:deploy /var/log/alpfit

# Script
sudo tee /usr/local/bin/alpfit-retention-purge.sh > /dev/null <<'SH'
#!/bin/bash
# KVKK retention purge cron — TASK-1.15
# Her gün backend container'ı içinden retention-purge endpoint'ini çağırır.
# Token .env.staging'den okunur (printenv container içinde).
set -euo pipefail

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[$TIMESTAMP] retention-purge starting"

cd /opt/alpfit/_ops/staging

# Container içinden çağır (DNS: localhost backend portuna; token: env'den)
RESPONSE=$(docker compose exec -T alpfit-backend sh -c '
  curl -sS -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $ADMIN_INTERNAL_TOKEN" \
    http://localhost:3000/admin/internal/retention-purge
')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "[$TIMESTAMP] OK $BODY"
  exit 0
else
  echo "[$TIMESTAMP] FAIL http=$HTTP_CODE body=$BODY"
  exit 1
fi
SH

sudo chmod +x /usr/local/bin/alpfit-retention-purge.sh
sudo chown deploy:deploy /usr/local/bin/alpfit-retention-purge.sh
```

---

## Adım 5 — Manuel test (crontab'a güvenmeden önce)

```bash
# Script'i deploy user olarak elle çalıştır
sudo -u deploy /usr/local/bin/alpfit-retention-purge.sh

# Log'a yazıldı mı?
sudo -u deploy tail /var/log/alpfit/retention-cron.log
```

**Beklenen:** `[2026-MM-DDTHH:MM:SSZ] OK {"status":"ok","report":{"processedCount":0,...}}`

---

## Adım 6 — İlk gerçek çalıştırmayı bekle

İlk crontab tetiklenmesi UTC 00:00 (TR 03:00). Bir sonraki sabah:

```bash
sudo -u deploy tail -50 /var/log/alpfit/retention-cron.log
```

Backend log'undan da doğrulayabilirsin:

```bash
sudo -u deploy docker compose -f /opt/alpfit/_ops/staging/docker-compose.yml \
  logs --since 1h alpfit-backend | grep retention-purge
```

---

## Yedekleme + Rollback

- **Script bozulursa:** `sudo rm /usr/local/bin/alpfit-retention-purge.sh` + cron satırını sil → endpoint elle çağırılabilir (Adım 2).
- **Token yenilenirse:** Adım 1'i tekrar et + backend restart. Eski token'ı not'tan çıkar.
- **Log şişerse:** logrotate kuralı: `/etc/logrotate.d/alpfit-retention`:
  ```
  /var/log/alpfit/retention-cron.log {
    weekly
    rotate 8
    compress
    missingok
    notifempty
  }
  ```

---

## v1'de Pratik Durum

Şu an staging'de henüz **sağlık verisi tablosu yok** (M6 Yakın 4'te eklenecek) ve aktif `softDeleteUser` çağrısı yok (M1 onboarding henüz tamamlanmadı). Yani cron her gün `processedCount: 0` raporlar. **Bu beklenen davranış** — kurulum şimdi yapılır ki Yakın 4'te ölçüm + yemek günlüğü eklenince retention zaten çalışıyor olsun.

**KVKK uyumu (denetim sorusu olursa):** "30 gün retention policy kuruldu mu?" → AuditLog.retention_purge event'leri günlük yazılıyor; `count: 0` da bir kanıt.

---

## İlgili Dokümanlar

- [`backend/src/kvkk/soft-delete.ts`](../../backend/src/kvkk/soft-delete.ts) — softDeleteUser / endTrainerMember / revokeHealthConsent
- [`backend/src/kvkk/retention-job.ts`](../../backend/src/kvkk/retention-job.ts) — runRetentionPurge + purgeDeletableTablesForUser
- [`backend/src/routes/admin-internal.ts`](../../backend/src/routes/admin-internal.ts) — endpoint + bearer auth
- [`_dev/KVKK.md`](../KVKK.md) §"Veri Saklama Politikası"
- [`_dev/docs/DECISIONS.md`](DECISIONS.md) "2026-05-29 — TASK-1.15"
- [`_dev/memory/staging-infra.md`](../memory/staging-infra.md) — sunucu, network, env dosyası konumları

---

**Son Güncelleme:** 2026-05-30 — TASK-1.15: rehber oluşturuldu, host crontab + docker exec deseniyle Coolify-bağımsız tetikleme.
