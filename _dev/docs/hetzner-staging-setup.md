# Hetzner Staging Setup Rehberi

**Bağlam:** Alpfit staging deploy ortamı — paylaşımlı Hetzner CPX32 (`178.104.140.36`, Nuremberg, **bunker** sunucusu, `ops.kiwiailab.com`'da Bunker projesi çalışıyor).
**Mimari:** Coolify değil; docker-compose + bunker-nginx subdomain proxy + GitHub Actions SSH auto-deploy. Karar detayı: `_dev/docs/DECISIONS.md` 2026-05-29 "TASK-1.10 Staging Deploy".

**Önemli:** Bu rehberin her adımı sunucudaki Bunker projesini etkileyebilir. **Yalnız değil — Claude ile birlikte SSH oturumunda yürütün**, her komut çıktısını paylaşın, ondan sonra ilerleyin.

---

## Ön Koşullar (zaten var)

- ✅ Hetzner CPX32 sunucu erişilebilir (`ssh root@178.104.140.36`)
- ✅ SSH key kurulu (kullanıcı laptop'una `~/.ssh/id_ed25519`)
- ✅ Sunucuda Bunker 11 container çalışıyor (dokunulmayacak)
- ✅ Squarespace DNS yönetimi `kiwiailab.com` için açık

---

## Adım 1 — Swap 2 GB ekle

**Neden:** Sunucuda swap yok; Alpfit container'ları (backend + postgres + redis) Bunker'ın ~2.5 GB tüketimine ekleneceğinden OOM koruması için 2 GB swap dosyası.

```bash
# Root olarak (laptop'tan ssh root@178.104.140.36)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.d/99-swappiness.conf

# Doğrulama
swapon --show
free -h
```

**Beklenen çıktı:**
```
NAME      TYPE SIZE USED PRIO
/swapfile file   2G   0B   -2
```

---

## Adım 2 — `deploy` user oluştur

**Neden:** GitHub Actions SSH ile root olarak değil, sınırlı yetkili `deploy` user'ı ile bağlansın. `deploy` docker group üyesi (container yönetimi için) ama sudo değil.

```bash
# Root olarak
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy

# SSH key dizini hazırla (key Adım 4'te eklenecek)
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Doğrulama: deploy user docker çalıştırabilmeli
sudo -u deploy docker ps
```

**Beklenen çıktı:** `docker ps` — mevcut 11 Bunker container'ını listeler (permission error vermez).

---

## Adım 3 — /opt/alpfit dizini + repo clone

```bash
# Root olarak
mkdir -p /opt/alpfit
chown deploy:deploy /opt/alpfit

# deploy user olarak
sudo -u deploy -i
cd /opt/alpfit
git clone https://github.com/<KULLANICI>/Alpfit.v1.git .
# (repo henüz remote'a push edilmedi → push sonrası clone)

# Doğrulama
ls -la _ops/staging/
```

**Beklenen çıktı:** `docker-compose.yml` + `.env.staging.example` dosyaları görünür.

---

## Adım 4 — GitHub Actions SSH deploy key + GH secret

**4a. Sunucuda key üret** (`deploy` user'da, **passphrase YOK** — CI otomatik bağlanır):

```bash
# deploy user olarak (sudo -u deploy -i içinde)
ssh-keygen -t ed25519 -C "github-actions-deploy@alpfit" -f ~/.ssh/github_actions_deploy -N ""

# Public key'i authorized_keys'e ekle (deploy user'ın kendi sunucusuna giriş için)
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Private key'i GitHub'a kopyalamak için göster (Adım 4b'de kullanacağız)
cat ~/.ssh/github_actions_deploy
```

**4b. GitHub'da repo secret'larını ayarla** (laptop'tan):

GitHub repo → Settings → Secrets and variables → Actions → New repository secret. Üç secret ekle:

| Secret | Değer |
|--------|-------|
| `STAGING_SSH_HOST` | `178.104.140.36` |
| `STAGING_SSH_USER` | `deploy` |
| `STAGING_SSH_KEY` | Adım 4a'da `cat` ile gösterilen private key (BEGIN…END dahil tam içerik) |

**4c. Lokal test** — laptop'tan deploy user'a key ile bağlanma:

```bash
# Sunucudaki private key'i de laptop'a kopyalayıp test edebilirsin (opsiyonel)
# Veya direkt GitHub Actions ilk deploy denemesinde test olur
ssh deploy@178.104.140.36 'whoami && docker ps | head -3'
# (laptop key'i ile değil; GitHub key'i ile test isteniyorsa private key'i lokale geçici al)
```

---

## Adım 5 — `.env.staging` doldur (sunucuda)

**Önemli:** Sırlar — laptop'a indirme, repo'ya commit etme. Doğrudan sunucuda nano/vi ile yaz.

```bash
# deploy user olarak
cd /opt/alpfit/_ops/staging
cp .env.staging.example .env.staging
chmod 600 .env.staging

# Postgres password + JWT secret üret
openssl rand -hex 32  # POSTGRES_PASSWORD için
openssl rand -hex 32  # JWT_ACCESS_SECRET için
openssl rand -hex 32  # JWT_REFRESH_SECRET için

# .env.staging'i düzenle
nano .env.staging
```

Doldurulması gereken alanlar (`.env.staging.example` dosyasındaki yorumlara bak):
- `POSTGRES_PASSWORD` — üretilen rastgele 32+ char string
- `DATABASE_URL` — `postgresql://alpfit:<POSTGRES_PASSWORD>@alpfit-postgres:5432/alpfit` (POSTGRES_PASSWORD ile aynı)
- `JWT_ACCESS_SECRET` — üretilen rastgele 32+ char string
- `JWT_REFRESH_SECRET` — farklı rastgele 32+ char string
- Geri kalanlar default değerlerle kalabilir (NODE_ENV=staging, APP_ENV=staging-tr, vb.)

```bash
# Doğrulama
ls -la .env.staging
# -rw------- 1 deploy deploy ... .env.staging
```

---

## Adım 6 — Bunker keşfi (network adı + nginx config yolu)

`docker-compose.yml`'deki `bunker-net` external network'ünün gerçek adını doğrula:

```bash
# deploy user olarak
docker network ls --filter name=bunker
```

**Beklenen çıktı:** Bir veya birkaç bunker network'ü. Doğru olan büyük olasılıkla `bunker_default` (compose default) — eğer farklıysa, `/opt/alpfit/_ops/staging/docker-compose.yml`'deki `networks.bunker-net.name` satırını gerçek isimle güncelle.

```bash
# bunker-nginx config dosyalarını bul
docker exec bunker-nginx ls /etc/nginx/conf.d/
docker exec bunker-nginx ls /etc/nginx/sites-enabled/ 2>/dev/null || echo "sites-enabled yok"

# Mevcut config'lerden birini incele (yapıyı anlamak için)
docker exec bunker-nginx cat /etc/nginx/conf.d/<ilk-bulunan>.conf | head -40
```

**SSL nasıl yönetiliyor?** Bunker'ın certbot kullanıp kullanmadığını öğren:

```bash
# Host'ta certbot var mı
which certbot && certbot --version

# Veya container içinde
docker exec bunker-nginx which certbot 2>/dev/null

# Mevcut Let's Encrypt sertifikaları
ls /etc/letsencrypt/live/ 2>/dev/null
```

**Çıktıyı Claude ile paylaş** — config dosyasının yolu, mevcut server block deseni, SSL stratejisi netleştikten sonra Adım 8'e geç.

---

## Adım 7 — DNS A record (Squarespace, kullanıcı yapar)

Laptop'tan Squarespace paneline gir:

1. Settings → Domains → `kiwiailab.com` → DNS Settings → Custom Records
2. Yeni A record ekle:
   - **Host:** `alpfit-staging`
   - **Type:** `A`
   - **Data:** `178.104.140.36`
   - **TTL:** default (1 saat)
3. Kaydet

**DNS yayılma kontrolü** (laptop'tan veya sunucudan):

```bash
dig +short alpfit-staging.kiwiailab.com
# Beklenen çıktı: 178.104.140.36
```

Genelde 5-15 dakika içinde yayılır. SSL cert işlemi DNS yayıldıktan sonra yapılabilir.

---

## Adım 8 — bunker-nginx'e Alpfit server block ekle + SSL

> Bu adım Adım 6 çıktısına göre Claude ile birlikte özel hazırlanır. Aşağıdaki şablon **örnek** — gerçek dosya yolu ve SSL kuralı Bunker setup'ına göre uyarlanır.

**8a. Mevcut nginx config'in yedeğini al** (rollback için):

```bash
# Root olarak (config dosyaları root erişim ister)
cd /opt/bunker  # veya bunker repo'su nerede ise
cp <bunker-nginx-config-yolu> <bunker-nginx-config-yolu>.bak-$(date +%Y%m%d)
```

**8b. Yeni server block ekle** (HTTP first, sonra SSL):

```nginx
# /etc/nginx/conf.d/alpfit-staging.conf (veya bunker projesinde uygun yer)

# HTTP — Let's Encrypt cert için ACME challenge + HTTPS redirect
server {
  listen 80;
  listen [::]:80;
  server_name alpfit-staging.kiwiailab.com;

  # ACME challenge (Let's Encrypt cert renewal)
  location /.well-known/acme-challenge/ {
    root /var/www/certbot;  # bunker setup'ına göre değişebilir
  }

  # Geri kalan tüm trafiği HTTPS'e yönlendir
  location / {
    return 301 https://$host$request_uri;
  }
}

# HTTPS — Alpfit backend'e proxy
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name alpfit-staging.kiwiailab.com;

  ssl_certificate     /etc/letsencrypt/live/alpfit-staging.kiwiailab.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/alpfit-staging.kiwiailab.com/privkey.pem;

  # Modern TLS (Bunker setup'ında da benzer olmalı)
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  location / {
    proxy_pass http://alpfit-backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
  }
}
```

**8c. Config'i test et + reload:**

```bash
# bunker-nginx içinden syntax check
docker exec bunker-nginx nginx -t

# OK ise reload
docker exec bunker-nginx nginx -s reload
```

**Eğer `nginx -t` hata verirse:** Reload yapma. Yedek config'i geri al, Claude'a hata mesajını gönder.

**8d. Let's Encrypt cert al** (DNS yayıldıktan ve HTTP server block çalıştıktan sonra):

```bash
# bunker certbot kullanıyorsa (varsa)
certbot --nginx -d alpfit-staging.kiwiailab.com

# Veya standalone (önce port 80'i geçici boşaltarak)
# Bu yöntem Bunker setup'ına göre değişir; Claude ile birlikte karar verilir
```

---

## Adım 9 — İlk manuel deploy + smoke test

```bash
# deploy user olarak
cd /opt/alpfit/_ops/staging

# Image build (ilk seferde 3-5 dakika)
docker compose --env-file .env.staging build alpfit-backend

# Stack'i ayağa kaldır
docker compose --env-file .env.staging up -d

# Container durumlarını izle
docker compose --env-file .env.staging ps
docker compose --env-file .env.staging logs -f alpfit-backend
# Ctrl-C ile logs'tan çık (container çalışmaya devam eder)

# Migration uygula
docker compose --env-file .env.staging exec -T alpfit-backend \
  node_modules/.bin/prisma migrate deploy

# Internal healthz (sunucudan)
docker compose --env-file .env.staging exec -T alpfit-backend \
  node -e "require('http').get('http://127.0.0.1:3000/healthz',r=>r.pipe(process.stdout))"
```

**Beklenen çıktı:**
```json
{"status":"ok","db":"up",...}
```

**Internet'ten test** (laptop'tan):

```bash
curl -v https://alpfit-staging.kiwiailab.com/healthz
```

Beklenen: HTTP 200 + `{"status":"ok","db":"up",...}`.

---

## Adım 10 — GitHub Actions auto-deploy smoke

Repo'da küçük commit at, main'e push, GitHub Actions `Deploy Staging` workflow'unun tetiklendiğini gör:

```bash
# Laptop'tan, repo dizininde
git commit --allow-empty -m "chore: trigger staging auto-deploy smoke"
git push origin main
```

GitHub → repo → Actions → `Deploy Staging` workflow:
1. CI tamamlanmasını bekler
2. SSH ile sunucuya bağlanır
3. `git reset --hard` → build → up -d → prisma migrate deploy → healthz smoke
4. Yeşil mi?

Sunucuda:
```bash
ssh deploy@178.104.140.36 'cd /opt/alpfit && git log -1 --oneline'
# Yeni commit'i göstermeli
```

---

## Rollback Planı

**Bunker'ı kırdıysam:**

```bash
# Root olarak
cd /opt/bunker  # veya nginx config'in yerine
cp <config>.bak-<tarih> <config>
docker exec bunker-nginx nginx -s reload
```

**Alpfit deploy başarısız oldu:**

```bash
# deploy user olarak
cd /opt/alpfit
git log --oneline | head -10
git reset --hard <önceki-sha>
cd _ops/staging
docker compose --env-file .env.staging build alpfit-backend
docker compose --env-file .env.staging up -d
```

**Alpfit container'ları durdur (Bunker etkilenmez):**

```bash
cd /opt/alpfit/_ops/staging
docker compose --env-file .env.staging down
```

---

## İzleme + Bakım

- **Disk kullanımı:** `df -h /` — %85'i geçerse alarm. `docker system prune -af` veya Bunker temizliği.
- **RAM kullanımı:** `free -h` — swap kullanılıyorsa OOM yaklaşıyor demektir.
- **Container sağlık:** `docker compose --env-file .env.staging ps` — tüm container `healthy` olmalı.
- **Loglar:** `docker compose --env-file .env.staging logs --since 1h alpfit-backend`.
- **Migration:** Her main push otomatik. Migration başarısızsa GitHub Actions kırmızı; manuel `prisma migrate status` ile durum kontrol.

---

## TODO (sonraki task'lara aktarılan)

- [ ] **KVKK SCC (Yakın 4 öncesi):** Hetzner Cloud Standart Sözleşme imzası — hukuki danışman. `_dev/KVKK.md`'de TODO satırı.
- [ ] **Backblaze B2 off-site yedek (TASK-1.16):** `pg_dump` cron + rclone, restore drill.
- [ ] **Sentry kurulumu (TASK-1.11/1.12):** SENTRY_DSN env + source map upload deploy workflow'una.
- [ ] **Prod ortam (Yakın 5 öncesi):** Ayrı sunucu mı, ayrı subdomain mı, Coolify mi vs docker-compose mı — `prd-review`'da karar.
