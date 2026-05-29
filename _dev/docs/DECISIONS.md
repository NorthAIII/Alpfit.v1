# DECISIONS — Karar Günlüğü

**Amaç:** Önemli mimari ve tasarım kararlarının kaydı. "Neden X yerine Y tercih edildi?" sorusunun cevabı burada.
**Ne zaman güncellenir:** Önemli bir teknik, mimari veya tasarım kararı alındığında.

---

## Kararlar

<!-- Her yeni karar aşağıdaki formatta en üste eklenir (en yeni en üstte) -->

### 2026-05-30 — TASK-1.20: JWT Access Token + Kayıt Jetonu + Auth Middleware + Profil Create

**Bağlam:** TASK-1.19 verify yalnızca doğruluyordu; bu task oturum/kayıt token'larını ve profil oluşturmayı ekler. JWT kararı TECH-STACK'te netti (`@fastify/jwt` + HS256, access 15dk; refresh 30dk opaque DB-stored TASK-1.21). Plan dokümanında bir **çelişki** vardı: `POST /auth/profile` gövdesinde OTP kodunu "tekrar doğrula" diyordu, ama TASK-1.19 doğru kodu atomik `GETDEL` ile **anında tüketiyor** — profil adımında kod artık yok. Akış kararı kullanıcıya soruldu (auth/security mimari kararı; [[feedback-no-assumptions]]).

**Karar 1 — Kayıt jetonu (registration token) deseni (kullanıcı onaylı).** Yeni üye için OTP verify adımında OTP **tüketilir** (tek-kullanımlık korunur), karşılığında kısa ömürlü (10dk) bir **kayıt jetonu** verilir. `POST /auth/profile` bu jetonu `Authorization: Bearer` ile alır; OTP kodu gövdede taşınmaz (kod ağ üzerinde iki kez gezmez). Jeton tek-amaçlı, telefon sahipliğini profil adımına güvenle taşıyan kanıttır.
- *Alternatif (red):* "Aynı kodu profil adımında tekrar kullan" — verify'ı yeni üyede peek (silmeme) davranışına çevirip TASK-1.19'un consume semantiğini + 3 testini değiştirmeyi gerektirirdi; tek-kullanımlık invariant'ını zayıflatırdı.

**Karar 2 — İki token tipi tek secret, `typ` claim'iyle ayrışır.** `access` (sub=userId, role, 15dk) ve `registration` (sub=phoneE164, 10dk) aynı `JWT_ACCESS_SECRET` (HS256) ile imzalanır; `typ` claim'i ayırır. `authenticate` middleware yalnızca `typ:'access'` kabul eder (registration jetonu korumalı route'a giremez); `/auth/profile` yalnızca `typ:'registration'`. Her token'a `jti` (UUID) eklenir — ileride jti-bazlı revoke için hazır, v1'de kullanılmaz. `jti` `crypto.randomUUID` ile üretilir (cuid yerine — yeni bağımlılık eklemez). **Ampirik not:** `@fastify/jwt` `expiresIn` **saniye** cinsindedir (`900` → `exp-iat=900`), ms değil.
- *Alternatif (red):* RS256 (public-key verify) — solo dev + tek backend için gereksiz; HS256 yeterli (TASK karar notu).

**Karar 3 — `authenticate` decorator + DB aktiflik kontrolü.** `app.decorate('authenticate', ...)` → `req.jwtVerify()` → `typ` kontrolü → `prisma.user.findFirst({ id, deletedAt: null })`. Role JWT'de cache'li ama **soft-delete'li hesap** her istekte DB'den elenir (TASK-1.15 uyumu; perf maliyeti kabul). Tüm hata yolları aynı 401 + sızdırmayan mesaj. Middleware'in canlı tüketicisi `GET /auth/me` (oturum kontrolü; mobile auto-login TASK-1.33) — bu task'ta eklendi ki guard'ın HTTP entegrasyon yüzeyi olsun.

**Karar 4 — Profil create tek `$transaction` (atomik).** `POST /auth/profile`: User + ConsentRecord(`kvkk_aydinlatma` zorunlu, `saglik_verisi` opsiyonel) + AuditLog (`user_created` + `consent_granted`) tek transaction'da — biri fail → hepsi rollback. `kvkkConsent !== true` → 403; aktif telefon zaten varsa → 409 (ayrıca `P2002` unique-race yakalanıp 409). `kvkkConsentAt`/`healthConsentAt` denormalized cache transaction içinde set edilir (truth source ConsentRecord — [[prisma-partial-unique-index]] komşusu `recordConsent` deseni inline). `KVKK_TEXT_VERSION='v2026-05-29-placeholder'` mobile `kvkk.json` ile hizalı. v1 onboarding yalnızca `member`/`trainer` açar (`gym_owner` kayıt yolu yok; model slot'u korunur). Mevcut user verify → `accessToken` + `user_login` audit.

### 2026-05-30 — TASK-1.19: OTP Verify Endpoint — Atomik Consume + Brute-Force Lockout + Hatalı-Deneme Sayacı Ayrı Key

**Bağlam:** F1.1 PRD: "5 hatalı kod girişinden sonra 15 dakika kilit (brute force koruması)". `POST /auth/otp/verify` send'in (TASK-1.18) ürettiği `otp:send:` kaydını doğrular. İki güvenlik invariant'ı gerekir: (a) doğru kod **yalnızca bir kez** tüketilebilmeli (replay/concurrent-race koruması), (b) hatalı denemeler atomik sayılıp eşikte telefon kilitlenmeli. Bu task JWT issue/user-create **yapmaz** (TASK-1.20) — yalnızca doğrula + lockout + audit + dev_otp_log consume.

**Karar 1 — Hatalı-deneme sayacı ayrı atomik key (`otp:attempts:<phone>` INCR), `OtpRecord` içinde DEĞİL.** TASK-1.18 `otp:send:` value'sunu `{ code, attempts: 0 }` olarak tutuyordu; sayacı bu JSON içinde artırmak **read-modify-write yarışı** yaratırdı (concurrent iki hatalı deneme aynı değeri okuyup 1 artırır → sayım kaçar). Çözüm: sayım ayrı `otp:attempts:<phone>` key'inde `INCR` (atomik), ilk denemede `EXPIRE` OTP TTL'iyle (300sn — kod-başına sayım; yeni `send` zaten OTP key'ini sıfırlar). `OtpRecord` `{ code }`'a indirildi (vestigial `attempts` alanı kaldırıldı; `auth-otp-send.test.ts`'teki `attempts===0` assertion'ı buduldu).
- *Alternatif (red):* Lua script / WATCH-MULTI ile JSON içi atomik artış — tek `INCR` key'ine kıyasla gereksiz karmaşık.

**Karar 2 — Doğru kod atomik `GETDEL` ile tüketilir (consume-once).** Eşleşmede `GETDEL otp:send:<phone>` değeri döndürür **ve** aynı anda siler; concurrent iki verify aynı doğru kodu denerse yalnızca biri kaydı alır (200), diğeri `null` görür → 410 expired. Karşılaştırma `crypto.timingSafeEqual` (uzunluk farkı önce elenir — `timingSafeEqual` eşit-uzunluk şartı). Kilit kontrolü **kod kontrolünden önce** gelir: kilitliyken doğru kod bile 423.
- *Alternatif (red):* `GET` sonra ayrı `DEL` — iki komut arası başka istek araya girer, race penceresi açık.

**Karar 3 — HTTP statü haritası.** 400 `invalid_phone` (TR-dışı/geçersiz, sızdırmaz) · 423 `locked` (kilit aktif **veya** bu denemede 5'e ulaşıldı; `Retry-After: <ttl>`) · 410 `expired` (aktif OTP yok / zaten tüketildi) · 401 `invalid_code` (yanlış, attempts < 5) · 200 `{ verified, userExists, isNew }`. 423 (Locked) WebDAV statüsüdür ama "geçici kilit" semantiği 429'dan ayrışsın diye seçildi (429 send rate-limit'e ait). i18n: `auth.otpExpired` eklendi; `auth.otpInvalid`/`auth.otpTooManyAttempts` mevcut.

**Karar 4 — Audit + dev_otp_log consume.** Her hatalı deneme `otp_verify_failed` (`metadata.attemptCount` ya da kilit halinde `reason:'locked'`); başarı `otp_verified` (yalnız `ip`). Telefon audit metadata'ya YAZILMAZ (TASK-1.14 zod whitelist; `userId=e164` zaten hash'lenir). Doğru verify'da en yeni `dev_otp_log` row'u `consumedAt=now` (tarihsel kayıt; production'da tablo boş → no-op). User lookup `findFirst({ phoneE164, deletedAt: null })` — soft-delete'li hesap "yok" sayılır.

**Karar 5 — Lockout sonrası attempts reset (kümülatif DEĞİL).** Kilit düşünce (15dk TTL) yeni `send` → yeni `otp:send:` + sıfır sayaç. "1 saatte toplam 5 hatalı = kilit" gibi kümülatif sayım v1'de YOK (basit + UX iyi); IP-bazlı rate limit ile birlikte Yakın 5 (gerçek SMS) öncesi yeniden değerlendirilir. v1 mock SMS — kabul edilebilir risk.

**Test:** backend 81 PASS (önceki 70 + 11 auth-otp-verify: 200 consume+audit / userExists:true / dev_otp_log consumed / 401 attempts=1 / 5→423+5 fail-audit / locked→423 / lockout-sonrası 200 / 410 expired / 400 yabancı / concurrent 200+410 / brute-force smoke 1000-kod). typecheck + lint + format temiz.

**Sonuç:** Auth verify akışı uçtan uca; TASK-1.20 bu endpoint'in `{ userExists, isNew }` çıktısını alıp JWT issue + user create/profil akışına bağlar.

---

### 2026-05-30 — TASK-1.18: OTP Send Endpoint — Redis Storage + Telefon-Bazlı Rate Limit + Gerçek-Redis Test İzolasyonu

**Bağlam:** F1.1 PRD: "6 haneli OTP SMS gönderilir, 5 dakika geçerli, 1 dakika sonra 'Yeniden gönder' aktif". `POST /auth/otp/send` bu akışın backend tarafı. OTP storage için TTL + hız gerekir (her istekte DB yazıp cron'la temizlemek yerine); rate limit için atomik bir "1dk'da 1 send" garantisi gerekir. Redis bu task'ta tanıtılıyor (`REDIS_URL` env + devcontainer servisi zaten mevcuttu).

**Karar 1 — OTP storage + rate limit Redis'te (kalıcı kayıt değil).** `otp:send:<phoneE164>` → `{ code, attempts: 0 }` JSON, TTL 300sn (otomatik expire, ayrı purge yok). Rate limit `otp:rate:<phoneE164>` → `SET NX EX 60`: set başarısız (zaten var) → 429 + `Retry-After: 60`. `SET NX` **atomik** → concurrent 100 send tek telefonda yalnızca 1 kazanır (test ile doğrulandı). Tarihsel kalıcı kayıt Redis'te DEĞİL — `dev_otp_log` (TASK-1.17) + `audit_log` (TASK-1.14).
- *Alternatif (red):* OTP'yi sadece Postgres'te tutmak — TTL manuel cron temizliği + rate limit için ekstra sorgu/lock; Redis NX tek satırda atomik + TTL otomatik.

**Karar 2 — Kod üretimi `crypto.randomInt(100_000, 1_000_000)`.** Güvenli rastgele (QUALITY §2; `Math.random` yasak). Üst sınır dışlandığı için 999999'u kapsamak adına `1_000_000` verildi — task taslağının `999_999` değeri off-by-one'dı (999999 hiç üretilmezdi), düzeltildi.

**Karar 3 — Bilgi sızdırmama: send aşamasında telefon varlığı kontrolü YOK.** Geçersiz/TR-dışı numara → 400 `invalid_phone` (generic). "Bu telefon zaten kayıtlı, giriş yap" yönlendirmesi **verify** tarafında (TASK-1.19). Brute-force kilidi (5 hatalı → 15dk) de verify'de. Bu task yalnızca **send** + telefon-bazlı rate limit.

**Karar 4 — Redis lifecycle `db/prisma.ts` desenini birebir izler.** `createRedisClient(url, opts?)` (her çağrı yeni instance) + `getRedis(url)` (production singleton); `server.ts` `opts.redis ?? getRedis(env.REDIS_URL)` ile çözer ve `app.redis`'i decorate eder. ioredis bir EventEmitter olduğundan dinlenmeyen `error` event'i Node'da throw eder → server `redis.on('error', …)` ile pino'ya loglar (redact PII'yi maskeler). `/healthz` Redis PING ekler: db **veya** redis down → `degraded` + 503, payload'a `redis: 'up'|'down'` alanı.

**Karar 5 — Test izolasyonu: gerçek Redis 7 + per-suite `keyPrefix` (Testcontainers DEĞİL).** "Backend Test İzolasyonu: Per-Suite Postgres" (2026-05-29) kararının Redis karşılığı — Testcontainers Docker daemon gerektirir (aynı gerekçeyle reddedildi); devcontainer'daki gerçek Redis servisine bağlanılır, her suite `test:<rastgele>:` keyPrefix'i alır (paralel suite çakışmaz). Artık anahtarlar TTL ile temizlenir; teardown yalnızca `quit()`. **Gerçek Redis TTL'i fake-timer ile ilerletilemez** → "1dk sonra yeniden send" senaryosu rate kilidini `del()` ile silerek deterministik simüle edilir. `test/redis.ts` `createTestRedis()` helper'ı; testler client'ı server'a enjekte eder (route + test aynı prefixli client → çift-prefix tuzağı yok).
- *Task taslağından sapma:* Task "Testcontainers Redis 7" diyordu; ortam Docker daemon'ı desteklemediği için (Postgres'te alınmış mevcut karar) gerçek-servis yaklaşımı izlendi.

**Test:** backend 70 PASS (önceki 63 + 6 auth-otp-send: 200 tutarlılık / 400 yabancı / 400 boş body / 429 rate / 60sn-sonrası 200 / concurrent-100 + 1 healthz redis-down). PII redaction route seviyesinde tekrarlanmadı — MockSmsProvider'a delege edildiği için `mock-sms-provider.test.ts` (TASK-1.17) kapsamını miras alır. typecheck + lint + format temiz. shared 41 + mobile 30 regresyon yeşil.

**Sonuç:** OTP send akışı uçtan uca; verify (TASK-1.19) `otp:send:` kaydını okuyup `attempts` sayacını kullanacak. Redis backend'e tanıtıldı — sonraki rate-limit/session işleri aynı client'ı kullanır.

---

### 2026-05-30 — TASK-1.17: SMS Provider Interface + Driver Pattern + dev_otp_log + Dev OTP Lookup

**Bağlam:** M1 Auth, telefon + SMS OTP üzerine kurulu. Gerçek SMS provider (Netgsm/Twilio) kararı `TECH-STACK.md`'de ve entegrasyonu Yakın 5 (UAT + Pilot) öncesi. Geliştirme/staging boyunca gerçek SMS'e ihtiyaç yok — ama OTP gönderim kodu (TASK-1.18+) provider'a bağımlı yazılırsa Yakın 5'te dağınık değişiklik gerekir. Bu task SMS katmanını **şimdiden** soyutlar; sonradan provider eklemek tek dosya değişikliği olur ([[ilkeler]] §"Kalıcılık önceliği").

**Karar 1 — Soyutlama: `SmsProvider` interface + 2 driver (factory).** `SmsProvider.sendOtp(phoneE164, code, ttlSec)` tek arayüz; tüm SMS çağrıları bundan geçer. `createSmsProvider(env, deps)` factory `env.SMS_PROVIDER`'a göre driver döner. `mock` → `MockSmsProvider`; `live` → şimdilik `throw` (Yakın 5'te `LiveSmsProvider` eklenir). `SMS_PROVIDER` env zod enum `['mock','live']`, default `mock`.
- *Alternatif (red):* Provider'ı doğrudan OTP route'una gömmek — Yakın 5'te her çağrı yerini bulup değiştirmek; migration ağrısı. ❌

**Karar 2 — Mock mekanizması: `dev_otp_log` tablosu + dev lookup endpoint.** `MockSmsProvider` gerçek SMS yerine OTP'yi `dev_otp_log` tablosuna (`phoneE164`, `code` plaintext, `ttlSec`, `createdAt`, `consumedAt`) yazar ve pino'ya bir satır düşer. `GET /internal/dev-otp/:phoneE164` son OTP'yi döner — mobile dev cihazının otomatik OTP girişi için (TASK-1.30).
- **Production'da tablo BOŞ** (Live driver row üretmez) + **endpoint hard-404** (`NODE_ENV === 'production'`). İkinci savunma: bunker-nginx production'da `/internal/` proxy etmez.
- *Alternatif (red):* OTP'yi sadece console.log'a yazmak — staging'de mobile dev cihazı OTP'yi okuyamaz; tablo + endpoint dev akışını gerçekçi kılar.

**Karar 3 — Endpoint guard: TASK-1.15 `ADMIN_INTERNAL_TOKEN` Bearer (paylaşımlı).** Yeni sır eklemeden mevcut internal token tekrar kullanılır; guard sırası: production→404, token yok→503, token eksik/yanlış→401, kayıt yok→404, aksi→200. `extractBearer` helper'ı `admin-internal.ts`'ten `routes/bearer.ts`'e çıkarıldı (DRY; iki internal endpoint paylaşır).

**Karar 4 — PII: OTP `otpCode` adıyla loglanır; ham generic `code` BİLİNÇLİ redact edilmez.** OTP plaintext'i DB'de `code` kolonunda durur ama log/Sentry/HTTP yüzeylerine her zaman **`otpCode`** alan adıyla verilir (MockSmsProvider log satırı + lookup endpoint cevabı). `PII_FIELDS`'te `otpCode`/`otp_code` zaten var → redact eder. Generic `code` alanı listeye **eklenmedi**: Prisma/pg hata kodları (P2002, 23505) ve HTTP statusCode gibi `code` alanlarının log'da okunabilir kalması için (over-redaction debug görünürlüğünü öldürür). Task subtask 7 "code veya otpCode" seçeneği sunmuştu; `otpCode` seçildi.
- *Doğrulama:* `mock-sms-provider.test.ts` log satırında `phoneE164` + `otpCode` = `[REDACTED]`, ham kod/telefon plaintext görünmüyor.

**Test:** backend 63 PASS (önceki 52 + 11 yeni: 2 mock insert/log-redact + 2 factory mock/live + 7 endpoint dev/prod/auth/503). typecheck + lint + format temiz. shared 41 + mobile 23 regresyon yeşil.

**Sonuç:** SMS katmanı driver-agnostik; Yakın 5'te `LiveSmsProvider` + factory `live` case'i = tek dosya + env değeri. dev/staging OTP akışı gerçek SMS maliyeti olmadan uçtan uca test edilebilir.

---

### 2026-05-30 — TASK-1.16: Backblaze B2 EU Off-Site Yedek + rclone Crypt Overlay + Host Crontab + Aylık Drill

**Bağlam:** PHASE-1 Araştırma §Tuzak #4 "Hetzner tek-node SPOF — sunucu çökerse 30-60 dk downtime" mitigation'ı: günlük off-site DB yedeği + ayda 1 manuel restore drill. Task doc'u orijinal olarak "Coolify built-in backup B2'ye yönlendirir" diyordu; TASK-1.10'da Coolify'dan docker-compose'a geçildi (DECISIONS 2026-05-29 "TASK-1.10"), Coolify built-in yedek yok → yedek mekaniği baştan tasarlanmalı. Bu task TASK-1.15'in `staging-retention-cron.md` deseniyle hizalı, vendor-neutral bir backup pipeline kurar; B2 hesap açılışı + key + ilk drill kullanıcının manuel adımları olarak doküman + rehber halinde teslim edilir.

**Seçenekler — Yedek hedefi (off-site storage):**

1. **Backblaze B2 EU Central (Amsterdam, `eu-central-003`) (seçilen)** — $0.005/GB/ay storage + $0.01/GB download; v1 DB ~100 MB → ~$0.02/ay; AB region (KVKK m.9 SCC + DPA savunulabilir); S3 API uyumlu (rclone native B2 driver da var, biraz daha ucuz); DPA template hazır. ✅
2. **AWS S3 Glacier Frankfurt** — $0.004/GB/ay + Glacier retrieval ücreti; AB region; managed; ama drill için Glacier retrieval delay 1-12 saat → aylık drill workflow'una uymuyor (ya Standard tier → daha pahalı). Hesap setup karmaşık (IAM roles, KMS). ❌
3. **Hetzner Storage Box** — €3.20/ay 1TB fix (overkill); SFTP/SMB only (S3 API yok → rclone alternatif backend ama daha kırılgan); AB region. v1 maliyet/fayda dengesizliği. ❌
4. **Aynı sunucu (host disk)** — ❌ SPOF tamamen aşılmaz; mitigation amacı off-site.

**Seçenekler — Yedek mekanizması (Coolify yok → ne kullanılır):**

1. **Host crontab + `docker compose exec pg_dump` + rclone (seçilen)** — TASK-1.15 `staging-retention-cron.md` deseniyle ayni; vendor-neutral; rclone resmi B2 driver; bash script audit edilir + git'te (markdown'da gömülü). ✅
2. **Container içi backup job (alpfit-backend'de node + node-cron)** — ❌ Backup container'la aynı yaşam döngüsünde; restart sırasında kaçırma riski; pg_dump'a `docker exec` yerine direkt postgres protokolüyle bağlanma daha karmaşık (DB user + connection string container-internal); node-cron PHASE-1 araştırma "cron framework eklemiyoruz" disiplinine aykırı.
3. **Sadece Hetzner snapshot (manuel/scheduled)** — ❌ Snapshot tüm sunucudur, granular DB restore zor; Hetzner snapshot'lar aynı bölgede (off-site değil); maliyet €/GB.
4. **Postgres streaming replication → ikinci sunucu** — ❌ Aşırı (v1 1 PT + 4 üye); ikinci sunucu maliyeti + ops yükü; basitlik prensibini aşıyor.

**Seçenekler — Encryption stratejisi:**

1. **B2 SSE-B2 (server-side AES-256) only** — B2 transparent encryption; ama B2 hesabına erişen biri (key leak, hesap kompromisi) tüm dump'ları okuyabilir. ❌ Tek katman.
2. **rclone crypt overlay (client-side AES) + B2 SSE-B2 (seçilen)** — Dump host'ta plain, rclone yüklerken AES-256 ile şifreler, B2'ye şifreli yükler; B2 hesabı kompromise olsa bile encryption key olmadan dosyalar işe yaramaz. Filename de şifrelenir (B2 console'da hangi tarihte yedek olduğu görünmez). Key password manager'da. ✅
3. **GPG sign + encrypt** — ❌ Asymmetric overkill; key rotation zorlu; rclone crypt yeterli (drop-in symmetric AES).
4. **Cloud-side KMS (AWS KMS, B2 yok)** — ❌ B2 KMS desteği yok; AWS'e geçmek gerek.

**Seçenekler — Lifecycle policy:**

1. **30 gün hide + 1 gün delete (seçilen)** — 30 gün yeterli retention (aylık drill arası); KVKK veri minimizasyonu prensibi; v1 DB küçük → maliyet etkisi yok. ✅
2. **7 gün hide + 1 gün delete** — Drill için yeterli (aylık) ama beklenmedik incident'ta "iki hafta önceki yedek" bulunamaz.
3. **90 gün hide + 1 gün delete** — Aşırı; v1 DB 100 MB için maliyet etkisi yok ama "ne kadar geri dönebiliriz?" sorusu için yön yok; KVKK denetiminde "neden 90 gün?" cevabı zayıf.
4. **Sınırsız** — ❌ KVKK veri minimizasyonu ihlali; sonsuza birikir.

**Seçenekler — Drill sıklığı:**

1. **Ayda 1 — her ayın 15'i (seçilen)** — Hatırlanması kolay sabit tarih; ay ortası → her ay garanti tetiklenir; backup-pipeline drift'ini fark etmek için makul yatay aralık. ✅
2. **Haftada 1** — Aşırı; v1'de pratik olarak kullanıcı yorulur, drift'i fark etmek için 30 gün penceresi yeterli.
3. **Faz sonunda 1** — ❌ Düzenli değil; faz uzayınca drill gecikir.
4. **Sadece incident'tan sonra** — ❌ "Drill yapmadığımız için fark edemedik" tuzağı.

**Karar:**
- **Provider:** Backblaze B2 EU Central (Amsterdam) — bucket `alpfit-staging-db-backup`, private, SSE-B2 server-side encryption.
- **Mekanizma:** Host VPS crontab (`deploy` user) → `/usr/local/bin/alpfit-pg-backup.sh` → `docker compose exec alpfit-postgres pg_dump --format=custom --single-transaction --no-owner --no-privileges --compress=6` → `/var/backups/alpfit/staging-YYYY-MM-DD.dump` (local 7 gün buffer) → `rclone copy alpfit-b2-crypt:` (B2 + crypt overlay).
- **Encryption:** rclone crypt overlay (client-side AES) üzerine B2 SSE-B2 (server-side AES). Password + salt password manager'da (kayıp = tüm yedekler kullanılamaz, ayrı kopya zorunlu).
- **Lifecycle:** 30 gün hide + 1 gün delete (B2 console).
- **Cron schedule:** UTC 02:00 = TR 05:00 (retention purge UTC 00:00 → 2 saat sonra; purge edilmiş hali yedeklenir).
- **Drill:** Ayda 1 (her ayın 15'i), `_dev/docs/restore-drill.md` rehberi, kullanıcı tek başına yapar (Claude oturumu gerekmez), sonuç `_dev/memory/staging-infra.md` "Restore Drill Kayıtları"na yazılır.
- **Manuel adımlar (kullanıcı tarafından, follow-up):** B2 hesap + bucket + lifecycle + application key + encryption password üretimi + DPA imzası + rclone install/config + cron deploy + ilk drill. Bu task'ta sadece **rehber + script template + doküman + DECISIONS + KVKK güncellemesi + memory disiplini** yazıldı.

**Tamamlayıcı kararlar:**
- **rclone B2 driver (S3 API değil)** — B2 native API rclone'da iki form sunar: `b2` type (B2 native, API call başına daha ucuz) ve `s3` type (S3-compatible). `b2` seçildi — daha az API ücreti, B2-spesifik flag'ler (`--b2-hard-delete`, lifecycle integration). S3 form'una geçmek 1 satır config değişikliği.
- **Local 7 günlük buffer (`/var/backups/alpfit/`)** — B2 yüklemesi başarısız olursa script exit 3 + local dump kalır; ertesi gün retry; 7 gün sonra `find -mtime +7 -delete`. B2 hesabı suspend olursa son hafta hemen elde.
- **`pg_dump --single-transaction`** — pg_dump tek transaction'da tüm tabloları okur; backup sırasında DB'ye yazma olursa snapshot bozulmaz (Postgres MVCC). `--no-owner --no-privileges` restore_test DB'sinde role mismatch'i önler.
- **`pg_dump --format=custom --compress=6`** — zlib seviye 6 (default 0 → sıkıştırma yok), custom format selective restore destekler (`pg_restore -t tablo`).
- **Drill `restore_test` DB ayrı, production'a dokunmaz** — restore production DB üstüne yapılırsa veri silinir; ayrı DB drill'i production'dan tamamen izole eder.
- **Drill smoke query: `\dt` + `User count` + `AuditLog count + MAX(occurredAt)` + `_prisma_migrations`** — schema bütünlüğü (tablo var mı) + veri bütünlüğü (sayı plausible mı) + migration drift (en son migration adı production ile uyumlu mu). v1'de User=0 normal (M1 onboarding henüz tamamlanmadı); AuditLog cron başladıktan sonra > 0 olacak.
- **Backup cron retention purge'den 2 saat sonra (UTC 02:00 vs UTC 00:00)** — Retention purge önce → silinen sağlık verisi backup'a girmez. KVKK "yedekte de silinmiş veri yok" ilkesi (KVKK denetiminde önemli).
- **Aylık drill memory disiplini** (`_dev/memory/restore-drill-disiplini.md`) — Süreç Disiplinleri kategorisinde; faz review-phase'lerinde "son drill başarılı mı" kontrolü; drill başarısızsa `/devflow:quick` ile task aç.
- **Aylık drill faz review-phase'inde de kontrol** — PHASE-1 retrospektifine "Aylık restore drill 15'inci" satırı eklenir (faz sonu hatırlatma).

**Gerekçe:**
- **ILKELER §"Kalıcılık önceliği":** Yedek altyapısı şimdi kurulursa Yakın 4 (sağlık verisi) öncesi "off-site yedek + drill aktif" denetlenebilir durumda olur; veri kaybı = ürün ölümü riski mitigated.
- **ILKELER §"Sır ve konfigürasyon yönetimi":** İki katman encryption (rclone crypt + B2 SSE); key password manager'da + ayrı kopya; B2 application key bucket-scope (master key kullanılmaz); `.gitignore` rclone config dosyasını dışlar (chmod 600 deploy:deploy host'ta).
- **ILKELER §"Kümülatif test altyapısı":** Aylık drill sürdürülebilir disiplin — backup pipeline'ın test'i drill'in kendisidir, sessiz drift'i yakalar.
- **ILKELER §"Pazarlık Konusu Olmayanlar":** KVKK m.9 + Madde 6 (sağlık verisi) → AB region zorunluluğu (m.9 SCC ile savunulabilir AB hosting); DPA + lifecycle 30 gün veri minimizasyonu.

**Risk + Mitigation:**
- **Risk:** rclone crypt encryption password/salt kaybedilirse tüm yedekler kullanılamaz (B2'de şifreli, çözülemez). **Mitigation:** Password manager (1Password/Bitwarden) + ayrı kopya (sealed envelope veya ayrı device); `backblaze-setup.md` Adım 5 + 7 + task doc Risk bölümü 3 yerde uyarıyor.
- **Risk:** B2 hesabı suspend olursa (billing problem, ToS ihlali iddiası) yedeklere erişim kesilir. **Mitigation:** Local 7 günlük buffer `/var/backups/alpfit/` host'ta; v1.5+'da ikincil yedek hedefi (AWS S3 Glacier Frankfurt) eklenebilir (TASK-1.16 follow-up değil, v1.5 PRD-refine).
- **Risk:** Backup script silently fail eder (pg_dump exit 0 ama dump boş; rclone exit 0 ama upload yok). **Mitigation:** Script `if [[ "$DUMP_SIZE" -lt 1024 ]]` sanity check; aylık drill = manuel teyit; `/var/log/alpfit/pg-backup.log` logrotate 8 hafta.
- **Risk:** Region yanlış seçilir (ABD), KVKK m.9 ihlali. **Mitigation:** `backblaze-setup.md` Adım 1 region uyarısı *bold + ⚠️*; "geri alınamaz" notu açık; ilk açılış password manager'a kayıt anında region da not edilir.
- **Risk:** Drill kullanıcı tarafından unutulur, backup pipeline sessizce çürür. **Mitigation:** `restore-drill-disiplini.md` memory'de süreç disiplini (her oturumda yüklenir); faz review-phase'inde drill kontrolü; B2 bucket boyutu sabit kalırsa cron çalışmıyor demek (drift sinyali memory'de yazılı).
- **Risk:** Aynı sunucu (Bunker container'ları) bir gün B2 bandwidth'ini büyük dosya transfer'iyle tüketirse backup gecikir. **Mitigation:** rclone `--transfers=1 --retries=3 --low-level-retries=5`; backup zamanı saat 02:00 UTC (TR 05:00) — gece düşük trafik.

**İlgili Task/Faz:** TASK-1.16 (bu task). TASK-1.10 (Coolify yerine docker-compose — bu task'in pipeline'ı bu sapmaya uyumlu). TASK-1.15 (retention purge — drill smoke query'leri AuditLog'u kullanır; cron schedule purge sonrası 2 saat). TASK-1.13/1.14 (3 rol veri modeli + KVKK schema — drill smoke query tabloları kullanır). PHASE-1 Araştırma §Tuzak #4 (Hetzner SPOF mitigation kaynağı). KVKK.md "Üçüncü Taraf Sözleşmeler" (DPA TODO ✅).

**Follow-up (kullanıcı tarafından manuel):**
1. Backblaze hesap + bucket + lifecycle ([`_dev/docs/backblaze-setup.md`](backblaze-setup.md))
2. B2 application key + encryption password üretimi + password manager
3. Backblaze DPA imzası
4. rclone install + config + script deploy + crontab ([`_dev/docs/staging-pg-backup-cron.md`](staging-pg-backup-cron.md))
5. İlk restore drill ([`_dev/docs/restore-drill.md`](restore-drill.md))
6. Sonuçlar `_dev/memory/staging-infra.md` "B2 Off-Site Yedek" + "Restore Drill Kayıtları" bölümlerine yazılır.

---

### 2026-05-30 — TASK-1.15: 30 Gün Retention Purge + Anonimizasyon vs Hard Delete + Host Crontab Tetikleme

**Bağlam:** KVKK Madde 6 (sağlık verisi özel nitelikli) + Madde 11 (silme hakkı) → "rıza geri çekilirse 30 gün içinde sağlık verisi silinir" ve "üye hesap kapatma → 30 gün retention sonrası purge". TASK-1.13 schema'sındaki `User.deletedAt` + `retentionDeadline` + `TrainerMember.endedAt` alanları bu task'in tetikleyicisi. Discuss-phase-1 §"PT üye çıkarma — veri akıbeti": *"Soft delete + 30 gün saklama. ... KVKK rızası aktif kaldıkça veri 30 gün saklanır; rıza geri çekilirse veya 30 gün dolarsa otomatik silinir."* Yakın 4'te (M6 sağlık verisi) silinecek tablolar eklenir; bu task'ta interface + cron sözleşmesi şimdi kurulur ki Yakın 4 sadece silinecek tablo listesini genişletir.

**Seçenekler — Retention süresi sonunda User satırı:**

1. **Hard delete + cascade** — User row + FK'lar (TrainerMember.memberId, ConsentRecord) cascade silinir. AuditLog.userIdHash bağımsız → orada kayıt kalır ama "kim" geri çözülemez. ❌ TrainerMember FK düşer (PT geçmişinde "Bu üyeydi" bilgisi kaybolur). Veri minimizasyonuyla en uyumlu ama KVKK denetimde "verisi silinen kullanıcının PT geçmişini gösterebilir misin?" sorusuna cevap veremiyor.
2. **Anonimize (seçilen)** — User row korunur; PII alanları temizlenir (`firstName=''`, `lastName=''`, `profilePhotoUrl=null`, `gymName=null`, `certificateNote=null`); `phoneE164 = 'deleted_<sha256-prefix-12>'` (global unique constraint için collision-safe — canlı E.164 ile `+` prefix farkından çakışmaz). FK'lar korunur. AuditLog.userIdHash sha256 hash zinciri **anonimizasyon sonrası hala aynı** → "bu kullanıcı X tarihinde Y eylemini yaptı, sonra anonimize edildi" denetim zinciri kurulabilir. `deletedAt` korunur (denetim kanıtı). ✅ KVKK "PII silindi, anonim referans kaldı" beyanı tutar.
3. **Hibrit (PII delete + row keep)** — User row durur ama alanları null/boş. ❌ phoneE164 unique constraint NULL kabul etmez (TASK-1.13 schema'da `String` not nullable); değiştirmek migration borcu. Seçenek 2'nin "deleted_<hash>" deseni bunu çözüyor zaten.

**Seçenekler — `User.retentionDeadline` paylaşımlı semantik:**

3 akış (softDeleteUser, endTrainerMember, revokeHealthConsent) hepsi aynı 30 günlük geri sayımı set ediyor — fakat akıbet farklı (sadece sağlık-data purge vs full anonimize):

1. **Üç ayrı field** (`accountRetentionAt`, `healthRetentionAt`, `relationRetentionAt`) — ❌ schema şişer; her field için index ayrı; concurrency açısından "hangisi önce" karmaşıklığı.
2. **Tek `retentionDeadline` + akıbet `deletedAt`'a göre (seçilen)** — `deletedAt IS NOT NULL` ise anonimize yolu (sağlık-purge + PII temizleme), null ise sadece sağlık-purge (hesap kalır, deadline reset). Schema sade; iş mantığı `deletedAt` üzerinden okunur. ✅ Mevcut TASK-1.13 schema'sıyla migration gereksiz.

**Seçenekler — Cron tetikleme altyapısı:**

1. **Coolify scheduled task** — Task doc'unun öngördüğü; ama TASK-1.10'da Coolify'dan docker-compose'a geçildi (mimari sapma — DECISIONS 2026-05-29 "TASK-1.10"). ❌ Mevcut altyapıda Coolify yok.
2. **Host VPS crontab (deploy user) → docker compose exec → curl (seçilen)** — `deploy@178.104.140.36` crontab + shell script + `docker compose exec alpfit-backend curl` → endpoint container DNS'inden çağrılır (bunker-nginx + SAN cert + dış expose ATLANIR; KVKK denetim için endpoint hiç internet'e çıkmaz). Vendor-neutral, ek paket yok. ✅
3. **In-app `node-cron` paketi** — ❌ PHASE-1 araştırma "cron framework eklemiyoruz" diyor; ek paket; container restart'larda kaçırılma riski.
4. **GitHub Actions scheduled workflow** — ❌ admin endpoint'i bunker-nginx önünden internet'e açılması gerekir (KVKK saldırı yüzeyi artar); GitHub Actions outage'da çalışmaz.
5. **Ek `cron` container'ı docker-compose'da** — ❌ Ek operasyon yüzeyi orantısız.

**Karar:**
- **Akıbet:** Anonimize (Seçenek 2). FK'lar korunur; AuditLog zinciri sürer.
- **retentionDeadline semantiği:** Tek alan + `deletedAt` üzerinden akıbet ayrımı. Migration yok.
- **Cron tetikleme:** Host VPS crontab + `docker compose exec` + curl. Kurulum rehberi `_dev/docs/staging-retention-cron.md`. Kullanıcı kurulumu rehberi takip ederek manuel yapacak (AskUserQuestion ile kararlaştırıldı — SSH'a Claude oturumundan dokunulmuyor).

**Tamamlayıcı kararlar:**
- **`logAuditEvent` imzası genişletildi** — `AuditLogClient = Pick<PrismaClient, 'auditLog'>` yapısal tipi; hem full `PrismaClient` hem `$transaction` callback tx'i kabul eder. Soft-delete helper'ları audit event'ini state değişikliğiyle aynı transaction'da yazar → audit ↔ state drift YOK. Eski testler değişmeden geçer (PrismaClient → AuditLogClient widening).
- **`anonymizedPhone(userId)` deterministik** — `deleted_${sha256(userId).slice(0,12)}`. İdempotent: aynı user ikinci kez anonimize edilse aynı değer üretilir; retentionDeadline null'a çekildiği için ikinci işlem zaten olmaz.
- **`purgeDeletableTablesForUser(_tx, _userId)` interface v1'de boş** — Yakın 4'te `measurement.deleteMany({where: {userId}})` + `foodLog.deleteMany(...)` eklenir. Underscore-prefix param konvansiyonu: imza şimdiden sabit kalır (Yakın 4'te sözleşme değişimi yok), TS noUnusedParameters geçer.
- **`runRetentionPurge` her kullanıcıyı kendi transaction'ında işler** — biri hata verirse diğerlerini etkilemez. Toplu `AuditLog.retention_purge` event'i en sonda `count` + `reason` ile yazılır.
- **AuditLog `retention_purge` event'i `userId = "retention-job"` sentinel'i ile yazılır** — hash'lenir (`userIdHash = sha256("retention-job").slice(0,12)`), broad disclosure riski yok; sadece "retention-job aksiyonu" izi. Aynı sentinel'in tüm event'leri tek hash altında gruplanır → grafana/sentry'de cron izi takip edilebilir.
- **ADMIN_INTERNAL_TOKEN env optional + 32+ char minimum** — dev/test'te eksik olabilir (endpoint 503 döner, smoke test bu davranışı doğrular); staging/production'da set edilir (`.env.staging.example` + `_ops/staging/.env.staging.example`'da satır eklendi).
- **Endpoint container DNS'inden çağrılır, internet'e açılmaz** — bunker-nginx server block'unda `/admin/internal/` path'i bilinçli olarak proxy edilmedi. Tek erişim yolu container içinden `docker compose exec`. KVKK saldırı yüzeyi → 0.

**Gerekçe:**
- **ILKELER §"Kalıcılık önceliği":** KVKK retention altyapısı şimdi kurulursa Yakın 4 öncesi hukuki review'a "retention pipeline ayakta + audit log var" diye gidilir. Yakın 4'te sadece `purgeDeletableTablesForUser`'a 2-3 satır eklenir, mimari değişmez.
- **ILKELER §"Sır ve konfigürasyon yönetimi":** Endpoint internet'e açık değil (container DNS), token env'de + chmod 600, sentinel hash'leniyor. Üç katman.
- **ILKELER §"Kümülatif test altyapısı":** 14 yeni integration test (3 soft-delete + 5 runRetentionPurge + 6 endpoint) — `phoneE164 = deleted_<hash>` deseni test'te doğrulandı; anonimizasyon idempotent; v1.5-ready (sağlık tablosu yokken fail etmiyor).

**Risk + Mitigation:**
- **Risk:** Endpoint internet'e expose edilirse (bunker-nginx config'ine yanlışlıkla satır eklenirse), 32 char token brute force güvencesi sınırlı kalır. **Mitigation:** Rehber doküman (staging-retention-cron.md) "bunker-nginx server block'unda /admin/internal/ proxy ETMEME" satırı; future audit-docs taraması bunu görür.
- **Risk:** `phoneE164 = 'deleted_<hash>'` deseni bir gün canlı E.164 ile çakışırsa, unique constraint patlar. **Mitigation:** Canlı phoneE164 her zaman `+` ile başlar; `deleted_` prefix `+` taşımaz → çakışma matematiksel olarak imkansız. Test bu deseni regex ile yakalar.
- **Risk:** Cron sunucu offline ise retention 1 gün gecikir. KVKK Madde 7 "makul süre" — 30 gün sınırı yumuşak. **Mitigation:** Backblaze yedek (TASK-1.16) + Hetzner billing alert. Kritik olduğunda systemd timer `OnBootSec=` desenine geçilebilir.
- **Risk:** Helper'lar bypass edilip kullanıcı `prisma.user.update({deletedAt: now})` ile elle silinirse audit log + retention deadline atlanır. **Mitigation:** Convention olarak yasak (helper'larda JSDoc); v1.5'te custom ESLint kuralı `noRestrictedSyntax` ile `user.update(... deletedAt ...)` yakalanır (TASK-1.14 audit.create yasağıyla aynı patern).

**İlgili Task/Faz:** TASK-1.15 (bu task). TASK-1.13 (3 rol veri modeli — `deletedAt`/`retentionDeadline`/`endedAt` alanlarını bu task kullanır). TASK-1.14 (KVKK audit — event tipleri ve hash deseni). TASK-1.10 (Coolify yerine docker-compose — cron tetikleme bu sapmayla uyumlu). TASK-1.16 (Backblaze yedek). TASK-1.22 (Logout — `softDeleteUser` ile UI Ayarlar > Hesap > "Hesabımı sil" CTA Yakın 1 mobile UI fazında entegre olacak).

**Yan fix (TASK-1.15 oturumunda yakalandı):** Mobile `landing-screen.test.tsx` snapshot'ı `formatTrDate(new Date())` çıktısını sabitliyordu → her gün CI fail. Fix: `jest.useFakeTimers().setSystemTime(2026-05-29 12:00 UTC)` ile tarih pin'lendi. Süreç disiplini memory'ye eklendi (`_dev/memory/feedback-snapshot-tarih-pin.md`): tarih/zaman bağımlı UI snapshot'larında fake timer şart.

---

### 2026-05-29 — TASK-1.14: KVKK Consent Versiyonlu Append-Only + AuditLog Whitelist Metadata + UserIdHash

**Bağlam:** KVKK Madde 6 (sağlık verisi özel nitelikli) + Madde 11 (veri sahibi hakları: erişim/silme/itiraz) denetlenebilir kayıt zorunluluğu. Discuss-phase-1 kararı: *"log'lara üye sağlık verisi YAZILMAZ (sadece event tip + üye ID hash)"*. KVKK metni hukuki danışman onayıyla zaman içinde **sürüm değiştirir** (Yakın 5 öncesi v1 metni gelir; sonra eklemeler) → rızanın hangi sürüme verildiği denetlenebilir olmalı. AuditLog v1'de 16 event tipi taşır (login/logout/otp/consent/invitation/refresh-token/member-removed/retention-purge); metadata alanına **PII sızması en büyük risk**: helper bypass edilirse veya zod atlanırsa sağlık/telefon verisi DB'ye düşer.

**Seçenekler — Consent kaydı:**

1. **Yalnızca `User.kvkkConsentAt`/`healthConsentAt` (anlık-durum)** — ❌ KVKK denetiminde "hangi metin sürümüne onay verildi?" sorulamıyor; geri çekme tarihi kaybediliyor; audit zinciri yok.
2. **`ConsentRecord` append-only + `User` denormalized cache (seçilen)** — Versiyonlu (`textVersion`), append-only (granted/revoked/auto_revoked yeni satır); User cache hot-path için (mevcut UI/auth check'leri kırmaz); truth source query. ✅ KVKK denetim + UX hızı dengesi.
3. **Tek tablo, durum UPDATE** — ❌ Geri çekme tarihi kaybediliyor; audit zinciri yok; KVKK Madde 11 yanıt veremiyor.

**Seçenekler — textVersion formatı:**

1. **Tarih-bazlı `v2026-05-29` (seçilen)** — Hukuki metin tarihsel referans → KVKK.md'deki metin "29 Mayıs 2026" tarihiyle imzalandı; tarih insan-okur, kronolojik sıralanır. ✅
2. **Semver `v1.0` / `v1.1`** — ❌ Hukuki metin "minor/patch" mantığı taşımaz; v2.0 mı v1.1 mi sorusu öznel; tarih daha doğal.

**Seçenekler — AuditLog metadata PII koruma:**

1. **Blacklist (`refuse if contains 'phone'`)** — ❌ Yeni PII alanı eklendiğinde listeyi güncellemeyi unutmak default-açık kapı (KVKK ihlali silently sızar).
2. **Whitelist (`allow only ['ip', 'deviceType', ...]`) zod `.strict()` (seçilen)** — Default-kapalı; yeni alan eklemek için bilinçli karar gerekir; bilinmeyen anahtar runtime'da ZodError fırlatır (compile zamanı `@ts-expect-error` ile test'te yakalanır). ✅
3. **Hiç metadata yok (sadece eventType + userIdHash)** — ❌ Çok kaba; debug ve KVKK denetim için "neden başarısız?" cevaplanamaz (örn. otp_verify_failed → attemptCount kayıp).

**Seçenekler — AuditLog userId saklama:**

1. **Ham `userId` FK (relation)** — ❌ DB sızıntısında "kim audit edildi?" sorusu **hesap**+audit zinciriyle birleşir → broad disclosure (KVKK ihlali genişler).
2. **`userIdHash` sha256 prefix 12 hex (seçilen)** — Anonimizasyon yeterli (1e14 entropi); audit zinciri kullanıcı içinde sıralanabilir (correlation), broad disclosure önler. **Aynı algoritma** Sentry user.id hash'i ile (pii-scrubber.ts) → audit ↔ Sentry hash hizalı (incident response için). ✅
3. **HMAC + secret rotate** — ❌ Aşırı (Sentry'de bile sha256 yetiyor); secret rotate audit zincirini kırar (geçmiş hash'ler yeniden hesaplanamaz).

**Karar:**
- **Consent:** `ConsentRecord` append-only + `User.kvkkConsentAt`/`healthConsentAt` denormalized cache; `recordConsent()` Prisma `$transaction` ile ikisini tek atomik adımda günceller (drift olmaz).
- **textVersion:** Tarih-bazlı `v2026-05-29` (KVKK.md metni güncellendiğinde yeni tag).
- **AuditLog metadata:** zod `.strict()` whitelist 10 alan (`ip`/`deviceType`/`userAgent`/`invitationId`/`refreshTokenId`/`consentType`/`textVersion`/`attemptCount`/`count`/`reason`); helper `logAuditEvent()` tek giriş noktası; doğrudan `prisma.auditLog.create(...)` convention olarak yasak.
- **userIdHash:** sha256 prefix 12 hex; `hashUserId` helper'ı `observability/pii-scrubber.ts`'ten re-use (Sentry event correlation hizalı).

**Tamamlayıcı kararlar:**

- **`pazarlama_iletisim` consent v1'de cache YOK** — User üzerinde alan yok; ConsentRecord truth source. v1.5'te eklenirse (campaign opt-in için) `User.marketingConsentAt` field + recordConsent'e ekleme.
- **`auto_revoked` event** — TASK-1.15 retention job'u 30 gün retention sonrası bu event tipini yazar; recordConsent helper bunu da granted/revoked gibi cache'i null'a çeker.
- **`ipAddress`/`userAgent` ConsentRecord'da bilinçli toplanır** — KVKK denetim "kim ne zaman nereden onay verdi" sorusu için. Aynı alanlar pino redact + Sentry beforeSend listesinde (PII_FIELDS'e eklendi) → DB'ye yazılır AMA log/Sentry yoluna sızarsa redaktedir. Memory `kvkk-pii-scrubbing-matrisi.md`'ye "IP audit nüansı" eklendi.
- **AuditLog metadata `Json?` null yazma — `Prisma.DbNull` vs field-omit:** Prisma 7 strict tip `null` literal'i reddeder. `validated === undefined` durumda field-omit (DB default NULL) seçildi — `Prisma.DbNull` import'u eklemekten daha sade.

**Gerekçe:**
- **ILKELER §"Kalıcılık önceliği":** KVKK denetim zincirini şimdi kurarsak Yakın 4 (sağlık verisi) öncesi hukuki review'a "audit log + versiyonlu consent ayakta" diye gidilir; sonradan retro-audit imkansız.
- **ILKELER §"Sır ve konfigürasyon yönetimi":** AuditLog whitelist default-kapalı (yeni PII alanı eklemeyi unutmak ihlal değil — zod reddeder); Sentry event correlation hash hizalı (incident response tek araç).
- **Memory `kvkk-pii-scrubbing-matrisi.md` disiplini:** Yeni schema alanı (`ipAddress`/`userAgent`) eklendiğinde PII_FIELDS güncellendi — disiplin somut bir görev olarak yaşadığını kanıtlıyor.

**Risk + Mitigation:**
- **Risk:** Helper bypass — geliştirici `prisma.auditLog.create({ data: { metadata: { phone: ... } } })` yazarsa zod devre dışı. **Mitigation:** Convention olarak yasak (DECISIONS.md + audit.ts JSDoc); v1.5'te custom ESLint kuralı eklenir (`no-restricted-syntax`: `auditLog.create` çağrısı kod-tabanında yalnızca `audit.ts`'te).
- **Risk:** `pazarlama_iletisim` v1'de cache yok → ileride alan eklenince recordConsent helper'ı genişletmeyi unutmak. **Mitigation:** recordConsent içinde `consentType` switch defaults yok (sessiz drop yok); v1.5 eklendiğinde explicit case eklenir.
- **Risk:** `ipAddress` log'a accidentally sızabilir (örn. Fastify request hook). **Mitigation:** PII_FIELDS'e eklendi → pino redact + Sentry beforeSend bunu `[REDACTED]`'lar. Test bu kanıtı henüz tutmuyor (TASK-1.14 kapsamı: schema + helper); pii-scrubber.test.ts'e ip senaryosu Yakın 1 son task'inde toplu KVKK smoke ile eklenir.

**İlgili Task/Faz:** TASK-1.14 (bu task — schema + helper + integration test). TASK-1.13 (3 rol veri modeli — User.kvkkConsentAt/healthConsentAt alanları bu task'in cache'i). TASK-1.15 (retention job — `auto_revoked` event tipi ve `User.deletedAt`/`retentionDeadline` alanlarını kullanacak; 30 gün sayacı KVKK Madde 11). TASK-1.18+ (OTP/login akışı — `logAuditEvent(prisma, { userId, eventType: 'otp_sent', metadata: { ip, deviceType }})` çağrıları). TASK-1.28 (KVKK rıza ekranı — `recordConsent` çağrısı).

---

### 2026-05-29 — TASK-1.13: 3 Rol Veri Modeli + Telefon Tekliği + Aktif İlişki Partial Unique Index

**Bağlam:** ILKELER §"Pazarlık Konusu Olmayanlar §1" + 00-VISION §5: veri modeli ilk günden Member + Trainer + **Gym Owner** üç rolü taşır (v1 UI'da Gym Owner görünmez, model destekler). Diyetisyen 4. rolü ASLA eklenmez. PRD F1.1 davranışı: "Aynı telefon iki kez kayıt → bu telefon zaten kayıtlı, giriş yap." Discuss-phase-1: bir üye herhangi bir anda yalnızca BİR aktif PT'ye bağlı olabilir (v1; PT değiştirme = v1.5 adayı). Soft-delete (`endedAt` nullable) PT üye çıkarma akışı için baştan tasarlandı (TASK-1.15'te retention job kullanır).

**Seçenekler — phone uniqueness:**

1. **Global `phoneE164` UNIQUE (seçilen)** — Bir hesap = bir telefon. Aynı kişi iki rol istiyorsa ikinci numara kullanır. PRD F1.1 mesajıyla doğrudan uyum: "telefon zaten kayıtlı, giriş yap." ✅ Schema sade, application logic'i basit.
2. **`@@unique([phoneE164, role])` composite** — Aynı telefon iki rolde ayrı hesap. ❌ Kimlik kafa karışıklığı (hangi rolle giriş yapacak?), PRD F1.1 mesajını anlamsız kılar, KVKK self-silmede ambiguity (hangi hesap silinir?).

**Seçenekler — aktif PT-üye tekliği DB enforcement:**

1. **`@@unique([trainerId, memberId, endedAt])` Prisma DSL** — ❌ PostgreSQL NULL semantiği: iki satırda `(t1, m1, NULL)` ve `(t2, m1, NULL)` "farklı" sayılır (NULL ≠ NULL). Aktif çoklu PT engellenmez.
2. **Yalnızca application-level kontrol** — ❌ Race condition (iki paralel davet kabul) DB seviyesinde patlamaz; KVKK + müşteri güvenliği için son güvence şart.
3. **Raw SQL partial unique index (seçilen):** `CREATE UNIQUE INDEX ... ON "TrainerMember" ("memberId") WHERE "endedAt" IS NULL` — Yalnızca aktif (endedAt IS NULL) satırlar üzerinde unique. Race-safe, çoklu PT engellenir. Aynı pattern `GymOwnerTrainer` için trainer-bazlı (v1.5+ için baştan kuruldu). Prisma DSL bunu üretmez → `migrate dev --create-only` + manuel SQL.
4. **Trigger-based check** — ❌ Aşırı; partial unique index daha basit, atomic, dökümante.

**Karar:**
- **Phone uniqueness:** Global `phoneE164` UNIQUE.
- **Aktif ilişki tekliği:** Raw SQL **partial unique index** (`WHERE "endedAt" IS NULL`) — TrainerMember için memberId, GymOwnerTrainer için trainerId.
- **ID stratejisi:** `cuid()` (k-sorted, kompakt; UUID'ye göre DB index performansı + chronological ordering).
- **Gym Owner v1 boş slot:** Model + ilişki tablosu + partial unique index baştan kuruldu (v1.5+ migration yükü yok). UI engelleme application katmanında (TASK-1.20+ auth middleware role kontrolü).
- **`endedAt` nullable + soft-delete deseni:** PT-üye ilişkisi sonlandığında hard-delete değil `endedAt = now()`; arşiv erişimi + 30 gün retention (TASK-1.15) için zorunlu.

**Tamamlayıcı kararlar:**
- **PII_FIELDS SSOT güncelleme disiplini:** Schema'ya yeni "kişisel veri" alanı eklendiğinde `shared/src/pii-fields.ts` listesine **aynı PR'da** eklenir (memory disiplini `kvkk-pii-scrubbing-matrisi.md`). Bu task'ta `gymName`, `certificateNote`, `phoneE164` (camelCase + snake_case) eklendi.
- **Application helper (`assertSingleActivePtForMember`):** DB partial index son güvence; helper okunaklı hata mesajı (`ActiveTrainerRelationExistsError`) için TASK-1.24'te kullanılacak placeholder. DB-only enforcement kullanıcıya `Unique constraint violated...` ham hatası verir — UX için yetersiz.

**Gerekçe:** ILKELER §"Kalıcılık önceliği": 3 rol slot şimdi kurulur, v1.5+'da migration yükü yok. Partial unique index PostgreSQL'in dokümante özelliği — ORM-agnostik, raw SQL'i okumak hala mümkün. Phone uniqueness PRD F1.1 mesajıyla birebir hizalı; composite unique işlevsel borç yaratır.

**Risk + Mitigation:**
- **Risk:** Raw SQL migration index'i CI/staging deploy'da unutulursa application doğru çalışır ama race condition kapısı açık kalır. **Mitigation:** Bu task'ta migration dosyasında raw SQL **migration.sql'in son satırı**; `migrate deploy` her ortamda otomatik uygular. `relations.test.ts` partial index'in deploy'unu test eder (`relations.test.ts` her suite kendi izole DB'sini `prisma migrate deploy` ile kurar → raw SQL atlandıysa test FAIL).
- **Risk:** `phoneE164` global unique sonradan "aynı kişi PT+Member için ayrı hesap istiyor" deseniyle çelişirse migration ağır. **Mitigation:** PRD F1.1 net; kullanıcı senaryosunda ayrı telefon = ayrı hesap netleşti.

**İlgili Task/Faz:** TASK-1.13 (bu task — schema + migration + integration test). TASK-1.14 (KVKK consent audit log — User'daki `kvkkConsentAt`/`healthConsentAt`'ı ayrı audit tabloyla zenginleştirir). TASK-1.15 (soft-delete + retention job — `deletedAt`/`retentionDeadline` alanlarını kullanır). TASK-1.20+ (auth middleware role guard — `gym_owner` v1'de hesap açamaz, request reddedilir).

---

### 2026-05-29 — TASK-1.11: 3 Katmanlı KVKK PII Scrubbing Matrisi (Backend Sentry + pino redact)

**Bağlam:** Backend Sentry kurulumu (EU Frankfurt) ve KVKK Madde 6 sağlık verisi (kilo, boy, ölçüm, yemek/kalori) sızıntı koruması. PHASE-1 araştırma §Tuzak #3: "Sentry varsayılan PII gönderir" — `req.body` tam payload event'e gider; KVKK ihlali. Discuss-phase-1 kararı: "log'lara üye sağlık verisi YAZILMAZ (sadece event tip + üye ID hash)". İki katman (yalnız Sentry SDK default veya yalnız pino redact) yetersiz: ilki integration'lar bypass ederse, ikincisi Sentry yolundan PII'ı yakalamaz.

**Seçenekler:**

1. **Yalnızca Sentry SDK `sendDefaultPii: false`** — Native koruma yeterli varsayımı. ❌ Integration (ör. `requestDataIntegration`) ile body yine event'e girer; pino log'larda da koruma yok.
2. **Sadece pino redact + `sendDefaultPii: false`** — Log'lar güvende ama Sentry event'lere manuel `Sentry.setUser(...)` veya integration ile sızabilir.
3. **3 katmanlı (seçilen):** (a) Sentry SDK `sendDefaultPii: false`, (b) `beforeSend` custom scrubber (recursive walk + user ID hash), (c) pino fast-redact paths (4 seviye wildcard). PII alan listesi `@alpfit/shared` SSOT.
4. **Allow-list yaklaşımı** — sadece beyaz listelenmiş alanlar Sentry'ye. ❌ Bilinen Fastify exception/breadcrumb yapısı sürekli değişir; hata trace'i kaybolur.

**Karar:** **Seçenek 3 — 3 katmanlı savunma derinliği + SSOT PII listesi.**

**Tamamlayıcı kararlar:**

- **PII_FIELDS Single Source of Truth:** `shared/src/pii-fields.ts` — backend ve mobile (TASK-1.12) ortak. Hem camelCase hem snake_case. Yeni schema/zod alanı eklendiğinde liste güncelleme **memory disiplini** (`_dev/memory/kvkk-pii-scrubbing-matrisi.md`).
- **User ID hash:** sha256(rawId).slice(0, 12) — anonimizasyon yeterli (1e14 entropi), secret rotate gerekmez. HMAC + secret yerine sade sha256 — KVKK denetimi açısından "ham veri Sentry'ye gitmiyor" beyanı için yeterli.
- **Sentry beforeSend kapsamı:** `event.request.{data, cookies, query_string, headers}`, `event.user` (id hash, email/username/ip_address silinir), `event.extra`, `event.contexts`, `event.breadcrumbs[].data`. Event tamamen drop edilmez — exception type, stack frame yolları korunur (debug edilebilirlik).
- **pino redact paths:** `getPinoRedactPaths()` her PII alanı için 4 seviye wildcard üretir (`field`, `*.field`, `*.*.field`, `*.*.*.field`). Pratikte Fastify req/res log objelerinin tüm derinliği yakalanır.
- **tracesSampleRate:** production'da 0.1 (free plan 5K event/ay quota koruması — Araştırma §Tuzak #7); staging/dev'de 1.0.
- **DSN env eksikse degrade mode:** `initSentry()` no-op döner, app çalışmaya devam eder. Staging/production'da DSN eksikse stderr'e warning; hata fırlatılmaz (BSOD pattern yerine graceful). Local'de DSN gerek yok.
- **Test izolasyonu:** `pii-scrubber.test.ts` Sentry SDK'yı gerçekten init etmez (network/global state riski). Scrubber doğrudan fonksiyon olarak çağrılır — 11 test (Sentry beforeSend, pino redact, hashUserId, scrubPii, cyclic ref, breadcrumb).

**Gerekçe:**

- **Savunma derinliği (defense in depth):** Bir katman bypass edilse diğeri yakalar. KVKK denetiminde "tek koruma vardı, bypass edildi" değil "üç bağımsız katman" beyanı güçlü.
- **SSOT discipline:** Liste tek dosyada → backend + mobile + Sentry UI sensitive fields (üçü senkron tutulur). Çoklu liste = drift kaynağı.
- **[[ilkeler]] §En Yüksek Öncelikli Eksen #1** sürdürülebilirlik motoru, ama §"Kümülatif test altyapısı" → KVKK için test-first: 11 test scrubber zincirini doğrular, regression yakalanır.
- **Maliyet:** Free Developer plan + EU Frankfurt residency (KVKK m.9 reformu sonrası AB en savunulabilir). 5K event/ay aşılırsa quota webhook (sentry-setup.md §3) ile uyarı; sonra $26/ay Team plan değerlendirme — şimdi acele etmiyoruz.

**Tradeoff'lar:**

- **scrubPii recursive walk performansı:** Her event için O(field count × depth) — sıradan event boyutlarında (1-10 KB) negligible. Aşırı büyük event'lerde (binlerce nested) yavaşlar; bilinçli ödün — KVKK > microsec.
- **PII_FIELDS liste bakımı:** Yeni alan eklenince liste güncellenmesi **manuel** — unutulursa sessizce sızar. Mitigation: memory disiplini + faz review'da toplu kontrol + Sentry UI sensitive fields redundansı.
- **Wildcard'ın 4 seviye sınırı:** 5+ nested PII pino redact'a girmez (Sentry tarafı recursive güvenli). Pratikte Fastify log objelerinde 5+ nesting nadir; gerekirse `getPinoRedactPaths()` parametreleştirilir (şimdi gerek yok).
- **Sentry UI "Additional Sensitive Fields"** ile redundant scrub: tek doğru kaynak prensibine biraz aykırı ama UI tarafı server-side defense — kod düşerse UI ayakta. Bilinçli redundansı.

**İlgili:**
- Kod: `backend/src/observability/{sentry.ts, pii-scrubber.ts}`, `shared/src/pii-fields.ts`, `backend/src/server.ts` (pino redact), `backend/src/index.ts` (initSentry call).
- Test: `backend/src/observability/pii-scrubber.test.ts` (11 test).
- Doküman: `_dev/docs/sentry-setup.md` (manuel UI adımları + quota webhook), `_dev/memory/kvkk-pii-scrubbing-matrisi.md` (disiplin).
- PHASE-1 Araştırma §Tuzak #3 + §Tuzak #7 mitigation.

---

### 2026-05-29 — TASK-1.10 Staging Deploy: Coolify Yerine Docker Compose + bunker-nginx Subdomain Proxy (Shared VPS)

**Bağlam:** TASK-1.10 başlarken kullanıcı maliyet optimizasyonu için var olan Hetzner CPX32 sunucusunu (178.104.140.36, Nuremberg, `ops.kiwiailab.com`) Alpfit staging için de kullanmak istedi. Sunucuda halihazırda Bunker projesi (11 Docker container: nginx:alpine 80/443'ü tutuyor, Next.js dashboard 3000, n8n 5678, Postgres 15, Redis 7, Qdrant, Ollama, Adminer, Umami) çalışıyor. SSH ile keşif yapıldı (Senaryo A: Bunker tamamen Docker'da, bare metal nginx yok); 80/443 portları `bunker-nginx` container'ı tarafından tutuluyor. RAM 7.6 GB → 5.2 GB serbest, disk 150 GB → 34 GB serbest (%77 dolu), swap 0. Üst karar (2026-05-29 Hosting+Staging DECISIONS) "Hetzner Cloud + Coolify, Falkenstein/Nuremberg" diyordu — sunucu zaten Hetzner Nuremberg, AB konum gereği korunuyor; sapma yalnızca **orkestrasyon katmanı** (Coolify yerine docker-compose) ve **paylaşımlı VPS** boyutunda.

**Seçenekler:**

1. **Yeni CPX22 aç (~€10/ay) — Coolify temiz kurulum** — Task doc'un öngördüğü orijinal yol. İki proje tamamen izole, Coolify avantajları korunur. Maliyet artışı.
2. **Mevcut sunucuya Coolify kur (8080/8443) + bunker-nginx ile manuel routing** — Coolify Traefik'i default 80/443 yerine alternatif portta. bunker-nginx önde reverse proxy. Karmaşık install + iki reverse proxy.
3. **Bunker'ı Coolify'a taşı** — Önce Coolify kurulumu sonra Bunker compose'unu Coolify'a import. Bunker kesintisi + multi-tenant veri riski + emek.
4. **Coolify'sız: docker-compose + bunker-nginx subdomain proxy + GitHub Actions SSH deploy** — Backend Dockerfile + `/opt/alpfit/docker-compose.yml` (postgres17 + redis7 + backend) + bunker-nginx'e `alpfit-staging.kiwiailab.com` server block + GH Actions `appleboy/ssh-action` ile `docker compose pull && up -d`. Bunker'a sıfır dokunma.

**Karar:** **Seçenek 4 — Coolify'sız docker-compose.** Kullanıcı `AskUserQuestion` ile onayladı (CLAUDE.md feedback §"Varsayım Yok").

**Tamamlayıcı uygulama kararları:**

- **Staging subdomain:** `alpfit-staging.kiwiailab.com` (DNS: Squarespace A record → 178.104.140.36). Yakın 5'te `alpfit.app` alındığında staging buraya taşınır; geçici subdomain disposable.
- **Backend Dockerfile** (`backend/Dockerfile`) — Multi-stage: `node:22-bookworm` builder (pnpm install --frozen-lockfile + shared build + prisma generate + tsc) + `node:22-bookworm-slim` runner (sadece dist + production node_modules). Non-root user, `dumb-init` PID 1.
- **`docker-compose.staging.yml`** (`_ops/staging/docker-compose.yml`) — `alpfit-backend` (build context: repo root, env from `.env.staging`) + `alpfit-postgres` (postgres:17-alpine, named volume `alpfit-pgdata`, **portsuz** — sadece internal network) + `alpfit-redis` (redis:7-alpine, named volume `alpfit-redisdata`, portsuz). Healthcheck'ler her servis için. Restart policy `unless-stopped`. Internal docker network `alpfit-net`; bunker network'üne dokunulmaz.
- **bunker-nginx config ekleme** — Bunker repo'sundaki nginx config'e yeni server block: `server_name alpfit-staging.kiwiailab.com`, Let's Encrypt sertifikası (bunker zaten certbot var muhtemelen), `location / { proxy_pass http://alpfit-backend:3000; }`. **Backend container bunker network'üne external attach edilir** (`networks: { default: { external: true, name: bunker_default } }` veya benzer) — bunker-nginx Alpfit'i hostname ile çağırabilsin diye. Bu manuel adım hetzner-staging-setup.md'de adım-adım.
- **CI/CD — GitHub Actions** (`.github/workflows/deploy-staging.yml`) — Trigger: `push: main` (CI yeşil koşulu olarak `needs: [quality, shared, mobile, backend]` aynı workflow içinde değil; ayrı dosya, `workflow_run` ile chain). SSH-action: appleboy/ssh-action@v1, `host: 178.104.140.36`, `username: deploy` (ayrı düşük yetkili user; root değil), `key: ${{ secrets.STAGING_SSH_KEY }}`. Script: `cd /opt/alpfit && git pull && docker compose -f _ops/staging/docker-compose.yml --env-file .env.staging build && up -d && docker compose run --rm alpfit-backend pnpm prisma migrate deploy`.
- **Swap (2 GB)** — `/swapfile` 2 GB, `swappiness=10`, `/etc/fstab` persistent. OOM koruması; iki proje 8 GB RAM paylaşacak.
- **deploy user** — Root yerine `deploy` user; `/opt/alpfit` sahibi, docker group üyesi, `sudo` yok. GH Actions SSH key sadece bu user'a. Root SSH erişimi key-only kalır (zaten öyle).

**Gerekçe (Seçenek 4):**

- **Maliyet:** Ek sunucu yok (€10/ay tasarruf). İki demo proje paylaşımlı VPS'de mantıklı.
- **Risk düşüklüğü:** Bunker'a hiç dokunulmuyor; Coolify install'ın Docker daemon'a yapacağı değişiklikler (daemon.json override, systemd unit, network plugin) **yok**. Mevcut 11 Bunker container'ı etkilenmiyor.
- **Hareketli parça azlığı:** Coolify ~800 MB RAM + Traefik + UI + dahili Postgres = ek operasyon yüzeyi. Demo aşamasında değer üretmiyor.
- **CI/CD zaten kurulu:** TASK-1.09'da GH Actions yeşil; deploy job eklemek küçük adım. Coolify webhook + dashboard öğrenmeye kıyasla daha az öğrenme eğrisi.
- **[[ilkeler]] §"Kalıcılık önceliği":** docker-compose + nginx stack'i 10+ yıllık, vendor-neutral; Coolify (Mayıs 2026 itibarıyla 4 yaşında) zamanla yön değiştirebilir. Vendor lock azaltıldı.
- **[[ilkeler]] §"Sır ve konfigürasyon yönetimi":** `.env.staging` `/opt/alpfit/.env.staging` ownership `deploy:deploy` `chmod 600`; repo'da `.env.staging.example`. Coolify env UI gibi opaque katman yok — env'in nerede olduğu net.

**Tradeoff'lar:**

- **Coolify avantajları kayıp:** Otomatik SSL, web UI ile env mgmt, deploy preview, rollback UI, log viewer. → Manuel: certbot komutu (bunker zaten kullanıyor olabilir), `.env.staging` SSH ile, `git checkout <prev-sha>` ile rollback, `docker compose logs -f` ile log. Demo ölçeğinde tolere edilir; v1.5 prod öncesi yeniden değerlendirilir.
- **Bunker bağımlılığı:** bunker-nginx hayati — düşerse Alpfit de düşer. Tek SPOF (zaten Hetzner CPX32 SPOF olduğu için ek değil).
- **Network external attach:** Alpfit backend bunker docker network'üne dahil olur → izolasyon yarı geçirgen. Bunker projesinden Alpfit DB'sine erişim mümkün (ama postgres portu external değil, sadece network içinden). KVKK açısından **iki proje aynı sunucuda zaten ortak**; network paylaşımı bunu artırmıyor. KVKK SCC notu KVKK.md'de TODO olarak takip ediliyor (Yakın 4 hukuki danışman).
- **Disk %77 dolu:** Alpfit container imajları + Postgres veri ~5-10 GB ekleyecek. `_dev/memory/staging-infra.md`'de disk izleme notu; %85'i geçerse Hetzner volume eklenir veya Bunker temizlenir.

**Risk + Mitigation:**

- **Risk:** bunker-nginx config değişikliği yanlış yapılırsa Bunker düşer. **Mitigation:** Config ekleme sadece **yeni server block** (mevcut block'lara dokunma); önce `nginx -t` (container içinden) + `nginx -s reload`. Yedek: değişikliği rollback edebilmek için config dosyasının önce kopyası alınır.
- **Risk:** GH Actions deploy script fail-fast olmazsa kısmi deploy. **Mitigation:** Script `set -euo pipefail`, her komut başarı zorunlu; migration fail olursa backend container restart loop'ta kalır, GH Actions step kırmızı.
- **Risk:** `deploy` user yetkisi yetmez veya docker group olmaz → permission denied. **Mitigation:** hetzner-staging-setup.md'de user oluşturma + group ekleme + smoke `docker ps` adımları yazılı, ilk manuel deploy doğrular.
- **Risk:** `prisma migrate deploy` ilk deploy'da boş şemada çalışır; migration dosyası TASK-1.03'te oluşturuldu. Sonraki migration'lar TASK-1.13'te (3 rol model) gelecek. **Mitigation:** Migration başarısızsa deploy fail; ilk deploy schema-only smoke (boş tablolar) yeterli.
- **Risk:** Hetzner ödeme gecikmesi → sunucu suspend. **Mitigation:** Hetzner billing alert (kullanıcı sorumluluğu); Backblaze yedek TASK-1.16'da off-site garanti.
- **Risk:** Bunker'ın bunker-postgres'i 5432'yi 0.0.0.0'da expose ediyor (keşifte görüldü) — güvenlik açığı ama **Bunker projesinin sorunu, Alpfit'in değil**. Memory'ye not düşülmedi (Alpfit bilgisi değil); kullanıcıya keşifte sözlü bildirildi.

**Üst kararla ilişki:** 2026-05-29 "Hosting + Staging: Hetzner Cloud + Coolify" kararının **Coolify boyutu bu karar tarafından supersede edilir**; Hetzner + AB konum + tek-node SPOF kabulü + Backblaze yedek planı korunur. Üst karar tarihsel kayıt; pratikte bu DECISIONS girdisi yetkili (staging). Prod (v1 launch Yakın 5) ayrı sunucuda Coolify mi docker-compose mı kararı `prd-review` zamanı yeniden değerlendirilir.

**İlgili Task/Faz:** TASK-1.10 (bu task) → TASK-1.11/1.12 (Sentry — staging deploy job'unda SENTRY_DSN env + source map upload) → TASK-1.13 (3 rol veri modeli — yeni migration staging `prisma migrate deploy` adımında otomatik uygulanır) → TASK-1.16 (Backblaze off-site yedek — Coolify built-in yok, manuel `pg_dump` cron + rclone gerekecek) → tüm sonraki backend task'ları (her main push staging'e deploy).

---

### 2026-05-29 — CI PR Pipeline: 4 Paralel Job + Job-Container Postgres + Manuel Branch Protection

**Bağlam:** TASK-1.09 — PHASE-1 §Kapsam Tartışması "her PR'da test+lint+typecheck otomatik, kırıksa merge bloke" + §Araştırma Tuzaklar #1.c (Prisma 7 `migrate dev`/`db push` artık `generate` çalıştırmıyor) mitigation'ı. Üst kararlar: GitHub Actions (research-phase tablosu), pnpm workspaces, Vitest+per-suite Postgres (TASK-1.04 DECISIONS), `node:22-bookworm` runtime, `postgres:17-alpine` (devcontainer ile aynı majör).

**Seçenekler (Job kesimi):**

1. **4 paralel job: `quality` (lint+format:check) + `shared` + `mobile` + `backend`** — Root lint script (`eslint .`) + Prettier check tek noktada koşar (workspace-başına lint script eklemek gerekmiyor); typecheck+test her workspace'in kendi job'unda. Backend kendi job'unda Postgres servisini kullanır.
2. **3 paralel job (backend + mobile + shared) — lint job içinde herhangi birine yapışır** — Task doc'taki orijinal şema; ama her workspace'in kendi lint script'i yok, root `pnpm lint`'i bir job'a koymak o job'u "özel" yapar (mantıksal kayma).
3. **Tek monolitik job** — En basit; ama paralelliği kaybeder (CI süresi 3-4× artar) ve fail-feedback olarak hangi katmanın kırıldığı tek bakışta görünmez.

**Seçenekler (Backend job + Postgres erişimi):**

1. **Job-container (`node:22-bookworm`) + service container (`postgres:17-alpine`) hostname `postgres`** — `backend/test/setup.ts` `DATABASE_URL` stub'u (`postgres://dev:dev@postgres:5432/dev`) hiçbir değişiklik olmadan çalışır; devcontainer ile birebir paralel.
2. **Host runner (ubuntu-latest) + service container, `localhost:5432` ile erişim** — `setup.ts` stub'unu environment-aware yapmak gerekirdi (`process.env.CI` veya `process.env.DATABASE_URL` override); test kodu CI'ya bağımlı hale gelirdi.
3. **Host runner + manuel Postgres install + `apt install`** — Service container'dan daha ağır, cache'lenmez; her run'da setup süresi artar.

**Seçenekler (Branch protection):**

1. **Manuel UI + rehber doküman (`.github/CI-SETUP.md`)** — Repo henüz remote'a push edilmedi; pratik yol. `gh` CLI token + admin yetkisi gerekmez; kullanıcı bir kez 5 dk içinde Settings → Branches'tan set eder.
2. **`gh api branches/main/protection` script (`.github/CI-SETUP.sh`)** — Otomatik ama: (a) repo push edilmeden çalışmıyor; (b) `gh auth` + admin token şartı; (c) tek seferlik kurulum için yeterli değer üretmiyor.

**Karar:** Üç başlıkta da **1**. Kullanıcı branch protection seçimini `AskUserQuestion` ile onayladı (CLAUDE.md feedback §"Varsayım Yok"). Job kesimi ve Postgres erişimi karar noktaları implementation-time mimari ayrıntılar; task doc'un "3 paralel job" şeması root lint için workspace-başına lint script gerektirirdi — kalıcılık önceliği ile uyumlu en sade yapı 4 paralel job + tek root lint job.

**Tamamlayıcı uygulama kararları:**

- **`.github/workflows/ci.yml`** — Trigger: `pull_request` (tüm dallar) + `push` (main); `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }` (aynı PR'a yeni commit eskiyi iptal eder).
- **Setup steps (her job ortak):** `actions/checkout@v4` → `pnpm/action-setup@v4` (versiyon root `package.json` `packageManager: pnpm@10.11.0` field'ından otomatik) → `actions/setup-node@v4` `node-version: '22'` + `cache: pnpm` (pnpm CLI önce kurulu olmalı, sıra önemli) → `pnpm install --frozen-lockfile` (lockfile drift FAIL).
- **`backend` job** — `container.image: node:22-bookworm` + `services.postgres` (`postgres:17-alpine`, env `POSTGRES_USER/PASSWORD/DB=dev`, `--health-cmd "pg_isready -U dev -d dev"`); job-level `env.DATABASE_URL: postgres://dev:dev@postgres:5432/dev`; adımlar: `pnpm -F @alpfit/backend db:generate` (Prisma 7 tuzak #1.c explicit mitigation, `pretest` hook'undan bağımsız) → `typecheck` (`pretypecheck` hook'u shared build + db:generate'i tekrar eder, redundant ama deterministik) → `test:coverage` (vitest run --coverage).
- **`mobile` / `shared` / `quality` job'ları** — `ubuntu-latest`, service container yok; `mobile` typecheck shared'i `moduleResolution: bundler` ile node_modules'tan resolve eder (build adımı gerekmiyor), `shared` typecheck self-contained.
- **Coverage upload** — Her test job'unda `actions/upload-artifact@v4` `if: always()` + `if-no-files-found: ignore`; artifact isimleri: `backend-coverage`/`mobile-coverage`/`shared-coverage`; path `<workspace>/coverage/lcov.info` (Vitest config'i `reporter: ['text', 'lcov']`, Jest default lcov reporter).
- **Branch protection rehberi** — `.github/CI-SETUP.md` adım-adım GitHub Settings → Branches → Add rule yolunu, status check isim listesini ("Lint & Format", "Shared (typecheck + test)", "Mobile (typecheck + test)", "Backend (db:generate + typecheck + test)"), "Require branches up to date" + "Do not allow bypassing" + doğrulama smoke testi (kasten kırık PR ile koruma test'i) yönergesini içerir.
- **`.github/PULL_REQUEST_TEMPLATE.md`** — Özet + bağlantı (task/modül/faz) + değişiklik türü (commit prefix'i ile eşleşen 6 tip) + test planı checklist + DevFlow doküman güncellemeleri checklist + KVKK/gizlilik checklist (sağlık verisi dokunan PR'larda zorunlu).

**Gerekçe (4 job kesimi):** [[ilkeler]] §"Kalıcılık önceliği" — workspace-başına lint script eklemek package.json drift riski (her workspace'in lint'i ayrı tutulurdu); tek root lint job daha az drift + daha hızlı feedback (3-4 workspace × ESLint boot vs 1 boot). [[ilkeler]] §"Kümülatif test altyapısı" — her workspace kendi test job'unda izole hata noktası gösterir; tek monolitik job'da hangi katmanın kırıldığını bulmak ek wall-time.

**Gerekçe (job-container Postgres):** Devcontainer + CI birebir paralel olduğunda **test kodu environment-agnostic kalır** — `setup.ts`'in stub URL'i ("postgres" hostname) hem local hem CI'da çalışır. Host runner + `localhost:5432` paterninde `setup.ts`'i `process.env.CI` koşullu yapmak gerekirdi (test logic'inin CI'ya bağlanması). [[ilkeler]] §"Kalıcılık önceliği" — test kodunun ortamdan bağımsız olması kalıcı; environment-aware stub kısa vadeli hız.

**Gerekçe (manuel branch protection):** Repo remote'u henüz yok; `gh` CLI script'i çalışmaz. Manuel UI + adım rehberi tek seferlik kurulum için yeterli; kullanıcı (Kıvanç) repo admin'i — token + auth ek setup gerektirmiyor. CLAUDE.md feedback §"Varsayım Yok" — paket/dış servis değişikliği onaysız değil; user `AskUserQuestion` ile onayladı.

**Tradeoff'lar:**

- **Job sayısı 3 vs 4:** Task doc 3 paralel job (backend+mobile+shared) öngörüyordu — root lint o şemada bir job'a yapıştırılırdı (örn. `quality` adı altında shared ile birleştirilse mantıksal yapışıklık). 4 ayrı job kesimi daha temiz ama paralel run slot'u +1.
- **Job-container overhead:** `node:22-bookworm` container'ı her backend run'da çekilir (~5-10s); GitHub Actions cache layer kullanır, ikinci run'da hızlı. Host runner + apt install paterni de aynı sürede. Pilot ölçeğinde nötr.
- **Coverage `if: always()`:** Test fail olsa bile coverage upload denenir (kısmi sonuç). `if-no-files-found: ignore` — test başlamadan boot fail olursa silently skip; artifact yoksa CI run yine de görünür (kafa karışıklığı potansiyeli ama "yok bilgisi" `if-no-files-found: warn`'a göre daha az gürültülü).
- **Prisma `db:generate` redundancy:** `pretest`, `pretypecheck`, ve explicit step üçü `prisma generate`'i çağırır (≈7ms × 3). Maliyet ihmal edilebilir; explicit step research tuzak #1.c'nin görünürlük belgesi.

**Risk + Mitigation:**

- **Risk:** Job container'da pnpm cache key'i farklı çözünür (GH Actions cache action container path'lerini host'a mount eder); ilk run cache miss. **Mitigation:** Pilot ölçeğinde ikinci run'dan itibaren cache hit; `setup-node@v4`'ün pnpm cache integration'ı container-aware. Bu task'ta ölçüm gerekli değil.
- **Risk:** Service container `postgres:17-alpine` health check'i 10 retry × 5s = 50s timeout; ağır init senaryosunda yetmeyebilir. **Mitigation:** Postgres alpine boot ~2-3s; 10 retry pilot ölçeğinde fazlasıyla yeterli. Future drift için `health-retries: 20` raise küçük PR.
- **Risk:** Pipeline `name:` alanı değiştirilirse branch protection status check ismi eşleşmez ve check silently atlanır → PR yeşil olmadan merge edilebilir. **Mitigation:** `.github/CI-SETUP.md` §"Yeni Status Check İsmi Eklemek" bölümü disiplini yazılı; rename PR'larında reviewer'a sinyal.
- **Risk:** `pretest` ve explicit `db:generate` step'leri uyumsuz Prisma binary path üretebilir (cache invalidation). **Mitigation:** Aynı backend node_modules üzerinde aynı `prisma generate`; deterministik output (Prisma 7'nin output yolu `src/generated/prisma`).
- **Risk:** Mobile workspace'in jest test'leri Linux runner'da iOS-specific path resolution istisnası fırlatabilir (`preset: jest-expo/ios`). **Mitigation:** jest-expo/ios preset platform-agnostic (sadece module path haritası farkı, native build değil); TASK-1.08 lokalde devcontainer Linux'unda yeşil — CI Linux ile aynı; smoke önce ilk gerçek CI run'ında.

**Üst kararla ilişki:** TASK-1.04 DECISIONS "per-suite Postgres database" paterninin CI tarafı bu task tarafından somutlaşır (services: postgres + container job). Research-phase'in "GitHub Actions" + "pnpm workspaces" üst kararı bu DECISIONS girdisi tarafından **versiyon + env detay boyutunda** dolduruluyor. TASK-1.10'da Coolify staging deploy webhook eklenirken bu workflow'a `deploy` job'u (post-CI, `needs: [quality, shared, mobile, backend]`, `if: github.ref == 'refs/heads/main'`) eklenir.

**İlgili Task/Faz:** TASK-1.09 (bu task) → TASK-1.10 (Coolify staging deploy webhook — `needs:` zinciri + secret kullanımı) → TASK-1.11/1.12 (Sentry — CI'da source map upload step) → TASK-1.13 (3 rol model — yeni migration → CI Postgres'inde otomatik `prisma migrate deploy` per-suite) → tüm sonraki PR'lar (status check zorunluluğu).

---

### 2026-05-29 — TR Locale Util Paketi (`@alpfit/shared`) + ESLint `no-restricted-syntax` + Metro/pnpm Transitive Resolution

**Bağlam:** TASK-1.06 — PHASE-1 §Araştırma Tuzaklar #5 mitigation'ının kendisi. JS spec'in default `'İ'.toLowerCase()` davranışı `'i̇'` (U+0069 + U+0307 combining dot) üretir — TR "İ" → "i" değil. Üye arama, telefon doğrulama, isim eşleştirmede silent bug üretir. Mitigation iki katmanlı: (a) `@alpfit/shared` paketinde `trLower` / `trUpper` util + telefon (+90 mobil) ve TR tarih util'leri; (b) ESLint kuralıyla ham `.toLowerCase()` / `.toUpperCase()` çağrıları yasaklı.

**Seçenekler (Date timezone):**
1. **date-fns + date-fns-tz `formatInTimeZone(d, 'Europe/Istanbul', ...)`** — Date instant'ı host TZ'dan bağımsız hedef TZ'a çevirip locale ile formatlar. Devcontainer UTC olsa bile TR çıktı garantili.
2. **Sadece date-fns + `process.env.TZ = 'Europe/Istanbul'`** — Daha az dep; runtime TZ'a güvenir, test/host hatası TZ unutulursa silent bug.
3. **Sadece date-fns + her test'te `vi.stubGlobal('Date.prototype', ...)`** — Test'e karmaşıklık ekler, production sapması.

**Seçenekler (libphonenumber-js build):**
1. **`libphonenumber-js/mobile`** — Mobil-only metadata; `isValid()` sabit hat için `false` döner. Bizim policy ile birebir uyumlu (sadece TR 5XX kabul).
2. **`libphonenumber-js`** (default `min`) — `isValid()` mobil+sabit ayrımı yapmaz; ek `getType()` mantığı + `max` build (~150KB) gerekir.

**Seçenekler (Shared paketin mobile'dan tüketimi — bundle path):**
1. **Source-based main + Metro resolveRequest patch** — `main: ./src/index.ts`; mobile/metro.config.js'e `.js → .ts/.tsx` fallback shim'i eklenir. Shared source canlı (hot-reload). Custom resolver Expo SDK upgrade'lerinde test edilmeli.
2. **Dist-based main** — `main: ./dist/index.js`; tüm consumer build output okur. Dev'de "build edip kullan" döngüsü; mobile metro temiz kalır.

**Seçenekler (Metro pnpm transitive deps):**
1. **`shared/node_modules` Metro `nodeModulesPaths`'ına eklenir** — pnpm default izole layout'unda shared transitive deps'i (libphonenumber-js, date-fns, date-fns-tz) sadece `shared/node_modules`'a düşer; mobile flat-hoisted olduğu için mobile/node_modules'a girmiyor. Cerrahi fix.
2. **Mobile package.json'a libphonenumber-js + date-fns + date-fns-tz eklenir** — duplicate dep beyanı; shared yükseltirken iki yerden bakılır.
3. **Root `.npmrc` `node-linker=hoisted`** — tüm workspace flat layout. TASK-1.05'in "sadece mobile için hoisted" kararını supersede eder.

**Karar:** Dört seçenekte de **1**. Kullanıcı `AskUserQuestion` ile shared resolution stratejisini (Metro resolveRequest patch) onayladı (CLAUDE.md feedback §"Varsayım Yok"). Diğer üçü implementasyon detayı; bilinmeyen mimari değişiklik içermiyor.

**Tamamlayıcı uygulama kararları:**
- **`shared/src/locale.ts`** — `trLower(s)` ve `trUpper(s)` `s.toLocaleLowerCase('tr-TR')` / `toLocaleUpperCase('tr-TR')` wrapper'ı. Argümanlı çağrı ESLint kuralının selector'ı (`:not([arguments.length>=1])`) tarafından yasaktan istisna tutulur (locale.ts kendi util'inin içinden lint geçer).
- **`shared/src/phone.ts`** — `parseTrPhone(input)` `ParsedPhone { e164, valid }` döner; `country !== 'TR'` veya `parsed.isValid() === false` → `valid: false`. `formatTrPhone(e164)` `formatInternational()` ile "+90 555 123 45 67" verir; geçersiz girdiyi olduğu gibi döner (UI filtre sorumluluğu). `validateTrPhone(input)` `parseTrPhone(input).valid` wrapper'ı. `libphonenumber-js/mobile` (~85KB) build, TR mobil prefix (5XX) policy ile birebir uyumlu — sabit hat (212/312/312...) ve yabancı (+1/+44) reddedilir.
- **`shared/src/date.ts`** — `formatInTimeZone(d, 'Europe/Istanbul', fmt, { locale: tr })` ile system TZ'dan bağımsız TR çıktı. Türkiye 2016'dan beri DST kullanmıyor → UTC+3 sabit; test bunu Mart sonu + Ekim sonu sınırlarında explicit doğruluyor.
- **`shared/vitest.config.ts`** — bağımsız config (`backend/vitest.config.ts`'ten ayrı, paket bağımsızlığı). `env.TZ = 'Europe/Istanbul'` test ortamında double-safety; `formatInTimeZone` ayrıca explicit. Coverage v8 + text+lcov reporter.
- **`shared/package.json` deps** — `libphonenumber-js@^1.11.20` + `date-fns@^4.1.0` + `date-fns-tz@^3.2.0` (date-fns 4 ile uyumlu). devDeps: `vitest@^4.1.7` + `@vitest/coverage-v8@^4.1.7` (backend ile aynı versiyon line).
- **ESLint kuralı** (`eslint.config.mjs`, TS files only) — `no-restricted-syntax` selector `CallExpression[callee.property.name='toLowerCase']:not([arguments.length>=1])` + `toUpperCase` aynı. TR tuzağı message'ı `@alpfit/shared → trLower()` yönlendirir. Smoke verification: shared/src/`__smoke.ts` geçici dosyaya `'X'.toLowerCase()` yazıldı, `eslint` 2 error verdi (mesaj doğru gösterildi), dosya silindi. Lint kuralı locale.ts'in kendi `toLocaleLowerCase('tr-TR')` çağrısını argument count filtresi ile geçirdi.
- **`mobile/metro.config.js` Metro resolveRequest shim'i** — `import './x.js'` çağrılarını `.ts`/`.tsx` source'a fallback ile yönlendirir. NodeNext (backend tsx + TS strict) + bundler (mobile Metro) ikilisinin tek monorepo'da yaşamasının standart pnpm + Expo paterni.
- **`mobile/metro.config.js` `nodeModulesPaths` += `shared/node_modules`** — Metro shared transitive deps'i (libphonenumber-js, date-fns, date-fns-tz) buradan resolve eder. `disableHierarchicalLookup: true` korunur (pnpm `.pnpm` ağacına dalmayı engelliyor); shared/node_modules explicit path olarak eklenir, future workspace deps'i için de aynı patern (her yeni workspace eklendiğinde mobile metro.config.js'e bir satır).
- **`backend/package.json` pretypecheck** — `pnpm db:generate && pnpm -F @alpfit/shared build`. Backend tsconfig `references: [{path: '../shared'}]` + `composite: true` → `tsc --noEmit` referansları auto-build etmiyor (`tsc -b` etse de). Pretypecheck shared'i build ederek backend typecheck'i deterministik yapıyor. Shared dist .d.ts backend resolution'unu, .js çıktısı runtime'da (production) emin yapar.
- **Smoke import'lar** — `backend/src/index.ts` `formatTrDateTime(new Date())` boot log alanı; `mobile/app/index.tsx` `formatTrDate(new Date())` landing subtitle. Hem typecheck (import path resolve) hem runtime (mobile bundle: 1185 modül 1.6MB; backend test 3 passed) doğrular.

**Gerekçe (TR locale util + lint kuralı):** [[ilkeler]] §"Kalıcılık önceliği" — JS spec değişmeyecek; "İ" tuzağı 100% predictable silent bug kaynağı. Util tek nokta + lint kaçınılmaz hatırlatma: gelecekteki geliştirici (Claude oturumu dahil) yanlışlıkla ham `.toLowerCase()` yazarsa CI fail.

**Gerekçe (date-fns-tz):** Devcontainer / CI runner / production hosting (Hetzner Falkenstein UTC) TZ değişkenliğine karşı immunite — Türkiye 2016'dan beri DST kullanmıyor ama "Europe/Istanbul" tüm geçmiş + gelecek TR resmi saatini tutuyor (tz data güncellenir). M3 sürdürülebilirlik motoru gece yarısı sınırı + telafi penceresi için TR-saat baseline'ı zorunlu.

**Gerekçe (libphonenumber-js/mobile):** ~85KB build; `max` (~150KB) gerek yok çünkü `getType()` lazım değil — mobil-only validation paterni doğrudan `isValid()` ile çalışıyor. `min` build (~75KB) sabit-hat ayrımı yapmaz, policy boşluğu doğurur.

**Gerekçe (Metro resolver patch):** TASK-1.05'in mobile-only hoisted layout kararı [[ilkeler]] §"Kalıcılık önceliği" ile alındı; supersede etmek demek mobile'da `pnpm`'in disk-verimli default'undan tamamen vazgeçmek. Shared'in dist-based main'i ise her dev iterasyonda explicit build adımı = hot-reload kaybı = DX tradeoff. Custom Metro resolver tek dosya değişikliği + standart pnpm+Expo monorepo paterni.

**Tradeoff'lar:**
- **Metro resolver shim**: pnpm + Expo monorepo'larda yaygın; Expo SDK 56 ile test edildi (smoke bundle 1185 modül). Expo SDK upgrade'larında resolveRequest API surface'ı değişirse refactor gerekebilir (her upgrade smoke ile yakalanır).
- **`shared/node_modules` explicit path**: Yeni workspace eklendiğinde (örn. `core/` veya `mobile-shared/`) bu satıra eklenmesi gerekir. Tek satır maliyet, fakat hatırlatma görünür değil; ileride workspaceRoot'taki tüm `*/node_modules` dirleri otomatik gezilirse (helper fonksiyon) bu rezilianstı.
- **date-fns-tz dep'i**: ~30KB bundle artışı; mobile'da yine 1.6MB total — tolere edilir, alternatif `process.env.TZ` runtime garantisi vermiyor.
- **shared `composite: true` + backend pretypecheck shared-build**: Her backend typecheck'te ~2-3s shared rebuild. Pilot ölçeğinde tolere edilir; v1.5+'ta TS project references daha agresif kullanılırsa `tsc --build --noEmit` (TS 5.6+) alternatifi değerlendirilir.

**Risk + Mitigation:**
- **Risk:** Yeni geliştirici (veya Claude oturumu) test fixture'larında ham `.toLowerCase()` yazar → lint kırar. **Mitigation:** Memory'ye [[tr-locale-util-zorunlu]] yazıldı; test fixture string'leri direkt lowercase yazılır (örn. `expect(trLower('İSTANBUL')).toBe('istanbul')` — sağ taraf hardcoded).
- **Risk:** TR locale tuzağı sadece "İ"/"I"/"i" değil; "İ" + dotted-I birleşimi başka edge case'lerde de çıkar (örn. sıralama, regex case-insensitive). **Mitigation:** Util sadece case-conversion için; gelecek edge case (örn. `localeCompare`) ihtiyacı çıktığında util'e eklenir (memory'de "TR string disiplini" kategorisi).
- **Risk:** date-fns-tz Expo Hermes / RN'de Intl.DateTimeFormat'a bağımlı; RN 0.85 + Hermes Intl default on; ama eski cihazlarda eksik olabilir. **Mitigation:** Smoke export (web) geçti; iOS sim/Android emu testi TASK-1.10 EAS Build sonrası (TASK-1.34 e2e smoke). `expo-localization` veya `@js-temporal/polyfill` ekleme TASK-1.07 i18n shell ile değerlendirilir.
- **Risk:** Metro resolver shim Expo SDK upgrade'inde değişen API yüzünden bozulur. **Mitigation:** `export:smoke` CI'ya (TASK-1.09) eklenir; her Expo upgrade'de smoke bundle reverify edilir.

**Üst kararla ilişki:** Research 2026-05-29'da `libphonenumber-js` + `date-fns + tr locale` kütüphaneler tablosunda işaretliydi; bu DECISIONS girdisi onların **build ve config alt-kararını** somutlaştırır + ESLint kuralı + Metro/pnpm resolution detaylarını ekler. TASK-1.05'in hoisted-mobile + disableHierarchicalLookup kararı korunur (`shared/node_modules` explicit path olarak eklenir).

**İlgili Task/Faz:** TASK-1.06 (bu task) → TASK-1.07 (i18n shell — `@alpfit/shared`'a `loadTranslations()` benzer util eklenir, aynı paket büyür) → TASK-1.18/1.19 (OTP send/verify endpoint — `validateTrPhone` zorunlu) → TASK-1.27 (Telefon girişi ekranı — `formatTrPhone` inline) → TASK-1.31 (PT üyeler tab — üye adı `trLower` ile search index'lenir) → M3 sürdürülebilirlik motoru (TR-saat gece yarısı sınırı için `formatTrDate` baseline) → tüm sonraki UI metni / telefon / tarih işleyen task'lar.

---

### 2026-05-29 — Mobile Bootstrap: Expo SDK 56 + RN 0.85.3 + Expo Router + pnpm `node-linker=hoisted`

**Bağlam:** TASK-1.05 mobile iskelet. Üst karar (research 2026-05-29 → Expo (React Native) + EAS Build) iki noktada implementation-time revize gerekti: (a) task doc + research notu "RN 0.81" yazıyordu ama Expo SDK 56'nın bundled native modules JSON'u (resmi pairing) `react-native: 0.85.3 + react: 19.2.3 + react-server-dom-webpack: ~19.2.4` zorluyor — RN 0.81 yüklemek peer-dep çatışması üretirdi (Expo SDK 55 ile pairlenirdi); (b) Expo + Metro + pnpm üçlüsünün klasik tuzağı (expo-modules-core gibi transitive native module Metro'nun flat resolution'undan göremiyor).

**Seçenekler (RN version):**
1. **Expo SDK 56 bundled (RN 0.85.3 + React 19.2.6)** — SDK 56'nın "blessed" pairing'i; New Arch zaten RN 0.82'den sonra zorunlu olduğundan `newArchEnabled: true` doğal; peer-dep çatışması yok.
2. **Task doc'a sadık RN 0.81** — Expo 56 peer-dep matrisini tutmaz; install `--legacy-peer-deps` veya overrides gerektirir, runtime'da TurboModule/Fabric uyumsuzlukları çıkar.

**Seçenekler (pnpm + Metro):**
1. **mobile/`.npmrc` + `node-linker=hoisted`** — pnpm 8+ standardı, sadece mobile workspace'i flat node_modules'e çevirir; backend/shared default pnpm layout'ta kalır. Metro hierarchical lookup standart RN ekosistemi gibi çalışır.
2. **`pnpm install --shamefully-hoist`** — Task'ın risk planındaki fallback; flag her install'da hatırlanmalı, kalıcı değil. `.npmrc` kalıcı + idiomatic.
3. **Custom Metro resolver (`resolver.resolveRequest`)** — pnpm `.pnpm/<pkg>/node_modules/<pkg>` zincirini yakalayan custom resolver; community pattern ama bakım yükü.

**Seçenekler (scaffold yöntemi):**
1. **Manuel scaffold** — Dosyaları elle yaz (app.json, app.config.ts, app/_layout.tsx, app/index.tsx, babel/metro), `pnpm -F @alpfit/mobile add ...` ile pnpm lock korunur.
2. **`pnpm create expo-app .`** — Klasör boş değil + npm install ile çağırır; mevcut workspace placeholder'ı üzerine yazar + pnpm lock yeniden generate gerekir.

**Seçenekler (boot smoke):**
1. **`expo export -p web --output-dir .expo-export-smoke`** — Metro tüm modüllere göre bundle yapar; iOS sim / Android emu olmadan dev container'da çalışır; bundle başarılı → import zinciri sağlam.
2. **Sadece `expo config`** — Yalnızca config resolution; Metro bundle import zincirini test etmez.

**Karar:** Üç seçenekte de **1**. Kullanıcı `AskUserQuestion` ile üçünü de onayladı (CLAUDE.md feedback §"Varsayım Yok"). Task doc'taki "RN 0.81" revize edildi; SDK 56 + RN 0.85.3 + React 19.2.6 (rsdw 19.2.4 peer üst-bound'unu da örtüştürür) kalıcı pairing.

**Tamamlayıcı uygulama kararları:**
- **`app.json` + `app.config.ts` ikili yapı** — `app.json` statik konfig (scheme `alpfit`, bundleIdentifier `app.alpfit.mobile`, `newArchEnabled: true`, `plugins: ["expo-router"]`, `experiments.typedRoutes: true`, `web.bundler: metro`); `app.config.ts` `EXPO_PUBLIC_*` env'leri okur ve `extra: { apiBaseUrl, sentryDsn }` olarak inject eder. Sır env değildir (EXPO_PUBLIC_ prefix bundle'a girer); Sentry DSN ve API base URL ortama göre değişir.
- **`mobile/tsconfig.json` override paterni** — `extends: ../tsconfig.base.json` korunur (proje-geneli strict opsiyonlar: `noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess` vb.); mobile-only override: `jsx: react-jsx`, `module: ESNext`, `moduleResolution: bundler`, `lib: [DOM, ESNext]`, `target: ESNext`, `allowJs: true`, `noEmit: true`, `types: [expo/types, react/canary]`. Base'in `noPropertyAccessFromIndexSignature` `process.env.X` syntax'ını yasaklıyor → `app.config.ts` `process.env['EXPO_PUBLIC_X']` bracket access kullanır.
- **`mobile/babel.config.js`** — Minimum: `babel-preset-expo` (expo paketinin dep'i, ek install yok). `expo-router/babel` plugin'i SDK 50'den itibaren `babel-preset-expo` içinde gömülü.
- **`mobile/metro.config.js`** — `getDefaultConfig(projectRoot)` + `watchFolders: [workspaceRoot]` (shared paketi Metro'nun watch ağına girer) + `resolver.nodeModulesPaths: [projectRoot/node_modules, workspaceRoot/node_modules]` (hoisted layout zaten flat çözüyor; bu satır savunma) + `disableHierarchicalLookup: true` (pnpm'in `.pnpm` symlink ağacına dalmasını engeller).
- **`mobile/.npmrc` `node-linker=hoisted`** — Sadece mobile workspace; backend/shared etkilenmez. Devcontainer install ~20s, `expo export -p web` 4.2s (767 modül, 1.1MB bundle).
- **ESLint config eklemesi** (`eslint.config.mjs`) — Expo'nun CommonJS config'leri (`metro.config.js`, `babel.config.js`) için ayrı section: `sourceType: 'commonjs'`, `globals.node`, `@typescript-eslint/no-require-imports: off`. `globals` paketi root devDep. `.expo-export-smoke/` ESLint + Prettier + git ignore'a eklendi.
- **Asset stratejisi** — `assets/` (icon, splash) yok; Expo default placeholder'ları kullanılır. Brand asset'leri Yakın 5 launch öncesi tasarımla gelir (task doc karar noktası).
- **Boot smoke verification** — Devcontainer'da iOS sim/Android emu yok. `pnpm exec expo export --platform web` Metro'nun tam bundle'ı yapabildiğini doğrular (767 modül resolve ✓). Native build'ler EAS Build ile Yakın 5'te (TASK-1.16 dışında bu fazda gerek yok).
- **`expo-env.d.ts` repo'da tutuldu** — Expo CLI normalde `.gitignore`'a koyar ama proje strict tsconfig'ı reference gerektiriyor; minimal `/// <reference types="expo/types" />` ile sabit, auto-regen no-op.
- **Root `package.json` `dev` script** — `pnpm -r --parallel run dev` mobile (`expo start`) + backend (`tsx watch`) eşzamanlı; "concurrently" gibi ek dep yok.

**Gerekçe (RN 0.85.3):** [[ilkeler]] §"Kalıcılık önceliği" — Expo'nun bundled pairing'i SDK ile ileriye dönük garanti edilir (her SDK minor'ı bu pairing'i test etmiş yayınlar). RN 0.81 zorlamak Expo SDK 56'nın güvenliğinden çıkmak demek; runtime'da TurboModule/Fabric uyumsuzluk riski + her paket yükseltmesinde manuel peer dep yönetimi.

**Gerekçe (hoisted linker):** [[ilkeler]] §"Kalıcılık önceliği" + RN ekosisteminin flat node_modules varsayımı = pnpm symlink ağacı uyumsuz; hoisted linker mobile için Yarn classic / npm gibi davranır, RN topluluğunun "olduğu gibi" sayılan layout'unu verir. Backend ve shared pnpm'in disk-verimli default'unda kalır — kayıp yok, yalnızca mobile için trade-off.

**Tradeoff'lar:**
- **Hoisted layout:** Mobile/node_modules ~50K dosya (vs pnpm default ~3K symlink); disk maliyeti var ama dev DX (Metro debug, package "where") ekosistem normuna döner.
- **`app.json` + `app.config.ts` ikili:** Tek config dosyası daha az drift; ama statik (app.json — IDE auto-complete, Expo CLI direkt parse) + dinamik (app.config.ts — env injection) ayrımı production'da değer üretir.

**Risk + Mitigation:**
- **Risk:** Hoisted layout pnpm'in transitive dep çakışma uyarılarını gizler (mobile/node_modules'te tüm v-major'lar yan yana). **Mitigation:** Yeni paket eklerken `pnpm install` peer dep warning'lerini izle; Expo SDK upgrade'larda `expo install` kullan (SDK bundled versiyonu seçer).
- **Risk:** Native module eklerken (örn. expo-secure-store TASK-1.33'te) New Arch + SDK 56 uyumu doğrulanmaz → runtime Fabric crash. **Mitigation:** Paket README'sinde "New Architecture supported" + Expo bundled native modules JSON'u referans; PHASE-1 §Araştırma Tuzaklar #2'ye disiplin yazılı.
- **Risk:** `.expo-export-smoke/` artifact'i unutulup commit edilir. **Mitigation:** `.gitignore` + `.prettierignore` + ESLint ignore üçüne ekli; CI smoke ayrıca `--clear` flag'i ile cache reset.
- **Risk:** `EXPO_PUBLIC_*` env'leri bundle'a girer; sır KOYULURsa public exposure. **Mitigation:** `.env.example`'da uyarı + `app.config.ts` yalnızca `apiBaseUrl` + `sentryDsn` (DSN public-by-design Sentry; backend write-only secret değildir). TASK-1.11 + TASK-1.12 Sentry kurulumunda DSN scoping doğrulanır.

**Üst kararla ilişki:** Research 2026-05-29 "Mobile = Expo (React Native) + EAS Build" kararı korunur. "RN 0.81" satırı bu DECISIONS girdisi tarafından **versiyon boyutunda supersede** edilir (Expo SDK 56 → RN 0.85.3); PHASE-1 §Araştırma Bulguları tablosunda research kararı tarihsel kalır (kayıt).

**İlgili Task/Faz:** TASK-1.05 (bu task) → TASK-1.06 (TR locale util + lint kuralı — mobile/.npmrc hoisted layout'unda `globals` paketinin ESLint config'ten görünmesi etkiler) → TASK-1.07 (i18n shell — mobile workspace'inde `i18next` + `react-i18next` install) → TASK-1.08 (Jest + RTL — Expo SDK 56 Jest preset entegrasyonu) → TASK-1.25 (Deep link `.well-known/` + EAS Hosting — Expo Router scheme'inin canlı kullanımı) → tüm sonraki mobile UI task'ları (1.26–1.34).

---

### 2026-05-29 — Backend Test İzolasyonu: Per-Suite Postgres Database (Testcontainers'tan Sapma)

**Bağlam:** TASK-1.04 backend test altyapısı. Üst karar (2026-05-29 research → Vitest + Testcontainers) bu task'ın devcontainer ortamında **Docker daemon olmadan** çalıştırılamayacağını kıyamadan keşfetmeden alınmıştı. Devcontainer (`.devcontainer/Dockerfile`) `mcr.microsoft.com/devcontainers/typescript-node` üstüne kurulu — Docker CLI yok, `/var/run/docker.sock` mount edilmemiş, `docker-in-docker` / `docker-outside-of-docker` feature'ı eklenmemiş. Testcontainers `GenericContainer.start()` Docker daemon'a TCP/socket bağlanır; daemon yoksa boot edemez.

**Seçenekler:**
1. **Mevcut Postgres + per-suite database (CREATE/DROP DATABASE per suite)** — Devcontainer'ın yanyana çalışan `postgres:17-alpine` servisini admin connection olarak kullan; her test suite başında `CREATE DATABASE alpfit_test_<rand>` → `prisma migrate deploy` → DB URL döndür; afterAll'da `DROP DATABASE ... WITH (FORCE)`. Docker bağımlılığı yok; CI'da aynı patern (GH Actions `services: postgres`).
2. **`.devcontainer/devcontainer.json`'a `docker-outside-of-docker` feature ekle + socket mount** — Dokunulmaz dosyayı değiştirir, devcontainer rebuild gerekir, Testcontainers orijinal kararıyla çalışır.
3. **Task'ı bloke et, ayrı oturumda devcontainer kurulumu yapılsın** — Faz akışını durdurur.

**Karar:** **Seçenek 1 — Per-suite Postgres database.** Kullanıcı `AskUserQuestion` ile onayladı (CLAUDE.md feedback §"Varsayım Yok" — paket/mimari kararı onaysız değişmez).

**Tamamlayıcı uygulama kararları:**
- **`backend/test/db.ts`** — `createTestDatabase()` `pg` admin client (`process.env.DATABASE_URL` → `dev` DB) ile bağlanır, `randomBytes(6).toString('hex')` ile DB adı üretir (`alpfit_test_<12hex>`), `URL` parse + `pathname = /<dbName>` ile suite URL'i kurar, `execSync('pnpm exec prisma migrate deploy', { env: { ..., DATABASE_URL: suiteUrl } })` ile migration uygular. `dropTestDatabase(name)` admin connection + `DROP DATABASE IF EXISTS "..." WITH (FORCE)` (Postgres 13+ aktif connection'ları kapatır).
- **`backend/test/setup.ts`** — `vi.stubEnv` ile baseline env stub (NODE_ENV=development, PORT=3000, LOG_LEVEL=silent, DATABASE_URL=admin URL, JWT secret'lar 32+ char test değerleri). Her suite kendi DB URL'sini override ediyor; setup yalnızca `loadEnv()` ön-koşulu için. `PORT=0` zod `positive()` validasyonundan geçmedi, 3000'e sabitlendi (`.inject()` listen çağırmıyor — semantik anlam yok).
- **`backend/test/build-test-server.ts`** — `buildTestServer({ databaseUrl })`: `loadEnv()` env override + `createPrismaClient(databaseUrl)` + `buildServer({ env, logger: false, prisma })`. Fastify `.inject()` in-process HTTP, socket açılmıyor.
- **`backend/src/routes/healthz.test.ts`** — İki describe: (a) DB reachable → 200/up; (b) DB unreachable (geçersiz host `alpfit-no-such-host` + `?connect_timeout=2`) → 503/down. Negatif test 1sn altı; toplam suite 1.4s.
- **`backend/vitest.config.ts`** — `globals: false` (explicit import), `environment: node`, `setupFiles: ['./test/setup.ts']`, `testTimeout/hookTimeout: 30_000` (migrate deploy CLI ~2-3s payı), coverage v8 + text+lcov, generated/test/d.ts exclude. Vitest 4 `poolOptions` tipi `InlineConfig`'te yok — kaldırıldı; default `threads` pool zaten paralel suite çalıştırıyor.
- **`backend/tsconfig.test.json`** — Ana `tsconfig.json` build composite'i bozmamak için ayrı test tsconfig (`rootDir: '.'`, `noEmit: true`, `include: ['src/**/*', 'test/**/*', 'vitest.config.ts']`). Ana `tsconfig.json` `exclude: ["src/**/*.test.ts"]` ile test dosyalarını build kapsamı dışına aldı. `typecheck` script artık her ikisini sırayla çağırıyor.

**Gerekçe:**
- **Pragmatik kalıcılık** — devcontainer'a docker feature eklemek (Seçenek 2) yapılabilir ama: (a) Dokunulmaz dosyayı değiştirir + rebuild masrafı; (b) CI'da yine `services: postgres` paterni gerekecek (GH Actions Docker overhead'ini taşımaz); (c) Per-suite database paterni Testcontainers boot'undan ~5-10× hızlı (1.4s vs 5-15s). KVKK izolasyon güvencesi (per-suite ayrı DB, test sonrası gerçek silme) aynı seviyede korunur.
- **CI portabilitesi** — Aynı patern GH Actions `services: { postgres: { image: postgres:17-alpine, env: ... } }` ile değişiklik olmadan çalışır (TASK-1.09 CI pipeline). Testcontainers'ta CI runner'da Docker available olsa bile ek "TestContainers Cloud" / "container reuse" config gerekirdi.
- **Düşük teknik borç** — Per-suite database paterni Postgres ekosisteminin standart test paterni; Jest+Knex/Drizzle/Prisma kitaplarında yıllardır kullanılır. Future-proof.

**Tradeoff'lar:** Testcontainers'ın "container scope = ortam tüm bağımlılıklar" garantisi yok — admin Postgres versiyonu (host postgres:17-alpine) test versiyonu = aynı. Devcontainer host postgres servisi değişirse testler etkilenir; ama devcontainer DB versiyonu zaten projenin reference Postgres'idir (tek-DB-versiyon politikası).

**Risk + Mitigation:**
- **Risk:** Test başarısız iptal olursa DB sızıntısı (ilk coverage run'ında bir tane sızdı, ikinci run'da temiz). **Mitigation:** `afterAll` her zaman çalışır, `WITH (FORCE)` aktif connection'ları kapatır. Periyodik temizlik scripti (`DROP DATABASE` LIKE `alpfit_test_%`) gerekirse `test:clean` script eklenir; TASK-1.09 CI cleanup hook'unda değerlendirilir.
- **Risk:** Test paralelleştirmesi (Vitest threads pool) admin connection'a yük bindirir. **Mitigation:** Her suite admin client'i çağrı sonu `end()` yapar; suite başına 2 admin query (CREATE + DROP) — pilot ölçeğinde sorun yok. TASK-1.13'te ilk gerçek model migration'ı geldiğinde suite-shared container + per-test truncate paterni değerlendirilir (task doc karar noktası).
- **Risk:** `prisma migrate deploy` CLI çağrısı her suite başına ~2-3s (Prisma boot + apply). **Mitigation:** Pilot ölçeğinde tolere edilir; suite sayısı arttığında "template DB + clone" paterni (Postgres `CREATE DATABASE x WITH TEMPLATE y`) değerlendirilir.

**Üst kararla ilişki:** "Backend test = Vitest+Testcontainers (research-phase 2026-05-29)" kararının **Testcontainers boyutu bu karar tarafından supersede edilir**; Vitest seçimi korunur. Research kararı `phases/PHASE-1.md` Araştırma Bulguları tablosunda kalır (tarihsel kayıt); pratikte bu DECISIONS girdisi yetkili.

**İlgili Task/Faz:** TASK-1.04 (bu task) → TASK-1.09 (CI pipeline `services: postgres` ile aynı patern) → TASK-1.13 (3 rol model, suite-shared vs per-test truncate kararı) → tüm sonraki backend integration test'leri.

---

### 2026-05-29 — Prisma 7 Setup Detayı: Yeni `prisma-client` Generator + `prisma.config.ts` + Singleton+Factory + Generate Hooks

**Bağlam:** TASK-1.03 Prisma 7 setup. Üst karar (Prisma 7 + Postgres 16 + `@prisma/adapter-pg`) zaten 2026-05-29 (research) DECISIONS'ta yazılı; bu kayıt **implementation-time** alt-kararlarını tutar çünkü Prisma 7 Kasım 2025 release'i task doc'un öngörüsünden meaningfully farklı bir API ile geldi.

**Seçenekler (Generator):**
1. **Yeni `prisma-client` generator** — Prisma 7 init default'u, ESM-first, output proje ağacı içine (`src/generated/prisma`), driverAdapters built-in (preview flag yok), forward-looking.
2. **Eski `prisma-client-js` generator** — Task doc'un tarif ettiği yol, `previewFeatures = ["driverAdapters"]` + `node_modules/.prisma/client` output, v7'de hâlâ destekli ama "legacy".

**Seçenekler (Config dosyaları):**
1. **`prisma.config.ts` korunur + placeholder `.env` silinir** — Prisma 7 standardı; config schema'dan ayrışır (`schema`, `migrations.path`, `datasource.url`); URL `process.env.DATABASE_URL`'den geliyor; devcontainer zaten export ediyor → `.env` gereksiz.
2. **`prisma.config.ts` + `.env` silinir, schema'ya inline döner** — Klasik `datasource db { url = env("DATABASE_URL") }`; daha az dosya ama v7 standardından sapar.

**Karar:** **Yeni `prisma-client` generator** + **`prisma.config.ts` korunur, placeholder `.env` silinir**. Kullanıcı her ikisini de `AskUserQuestion` ile onayladı (CLAUDE.md feedback §"Varsayım Yok" — mimari/paket kararı onaysız değişmez).

**Tamamlayıcı uygulama kararları:**
- **`dotenv/config` import'u `prisma.config.ts`'ten kaldırıldı** — devcontainer env-var bazlı, `.env` dosyası yok; dotenv ek dep gerektiriyordu.
- **Singleton + Factory pattern** (`backend/src/db/prisma.ts`): `createPrismaClient(databaseUrl)` factory (test/DI için) + `getPrisma(databaseUrl)` `globalThis.__alpfitPrisma` cache. Standart Prisma docs paterni; dev hot-reload + tsx watch yeniden mount güvencesi.
- **Adapter explicit** (research §1.b mitigation): `new PrismaPg(databaseUrl)` (constructor connection string kabul ediyor) → `new PrismaClient({ adapter })`. URL `schema.prisma`'da datasource'a yazılmıyor; tek nokta (`prisma.ts`).
- **Fastify decoration**: `app.decorate('prisma', prisma)` + module augmentation. `buildServer({ env, logger?, prisma? })` — `prisma` opsiyonel, gelmezse `getPrisma(env.DATABASE_URL)` kullanılıyor (TASK-1.04 test altyapısı için inject yolu hazır).
- **Generate hooks** (research §1.c mitigation — `migrate dev` artık `generate` çalıştırmıyor): `predev`/`prebuild`/`pretypecheck` → `pnpm db:generate`. CI'da (TASK-1.09) `pnpm install && pnpm -F backend db:generate` zinciri eklenecek; her dev start + build + typecheck önce regenerate (≈7ms maliyet).
- **Generated path policy**: `src/generated/prisma` → `backend/.gitignore` (Prisma init eklemişti), ESLint `**/generated/**` ignore, Prettier `**/generated/**` ignore; tsc include altında (typecheck için), generated `@ts-nocheck` ile tsc tip kontrolünü atlıyor.

**Gerekçe (yeni generator):** [[ilkeler]] §"Kalıcılık önceliği" — Prisma'nın forward-looking yolu (v8'de `prisma-client-js`'in deprecate olma ihtimali yüksek); `driverAdapters` v7'de GA, preview flag yönetmek gereksiz; output proje ağacında olması monorepo/pnpm hoisting edge case'lerinden bağışık.

**Gerekçe (config tut):** Prisma 7'nin "config-as-code" yönü resmi (CLI, IDE, dahili tooling buradan okuyor); schema'da yalnızca `provider` kalması temiz; URL runtime adapter + CLI prisma.config.ts arasında **tek mantıksal yerden** (process.env.DATABASE_URL) akıyor → drift sıfır.

**Tradeoff'lar:** Legacy `prisma-client-js` daha geniş battle-tested ama "kalıcılık önceliği" yeni yola eğilimli; `prisma.config.ts` ek dosya ama v7'nin standardı.

**Risk + Mitigation:**
- **Risk:** Yeni `prisma-client` generator hâlâ olgunlaşma sürecinde (v7.8 Kasım 2025); ekosistem (Sentry instrumentation, edge runtimes) henüz tam test edilmemiş olabilir. **Mitigation:** Tek nokta (`backend/src/db/prisma.ts`); değişirse tek dosyada yamanır; her Prisma minor upgrade'inde changelog kontrol.
- **Risk:** Devcontainer Postgres 17 (task doc "16" diyordu — drift); v17 ile Prisma 7 + adapter-pg uyumlu doğrulandı (`SELECT 1` ping başarılı). **Mitigation:** OVERVIEW/INDEX'te Postgres versiyonu ayrıca tutulmuyor — TECH-STACK.md research-phase'inde "Postgres 17" olarak güncellenecek; bu task ek aksiyon gerektirmez.
- **Risk:** `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` zod-required ama devcontainer set etmiyor → dev/test başlatırken inline geçmek gerek (smoke test'te yapıldı). **Mitigation:** TASK-1.20 öncesi DX iyileştirme adayı (devcontainer env defaults veya `.env.development.example`); bu task'ın işi değil.

**İlgili Task/Faz:** TASK-1.03 (bu task) → TASK-1.04 (Vitest + Testcontainers — `buildServer({ prisma: testClient })` injection ile test edilir) → TASK-1.09 (CI generate zinciri) → TASK-1.13 (3 rol veri modeli — ilk gerçek model migration'ı) → tüm sonraki backend DB iş task'ları.

---

### 2026-05-29 — Backend Bootstrap: Server Factory + zod-Validated Env Loader

**Bağlam:** TASK-1.02 backend iskeleti — production entrypoint + test edilebilirlik + env doğrulama. Sonraki task'lar (Prisma, JWT, OTP, davet endpoint'leri) bu temelin üstüne kurulacak; TASK-1.04 test altyapısı bu kararın doğrudan tüketicisi.

**Seçenekler:**
1. **`buildServer(opts)` factory + `loadEnv()` zod parse (fail-fast) + Fastify `.inject()`** — Test'te env stub + logger off ile in-process inject; production'da `index.ts` `buildServer()` çağırıp `listen()` yapar.
2. **Top-level `Fastify().listen()` + dotenv config** — Tek dosya, daha az boilerplate; ama test'te HTTP socket açmak gerekir, env override yok.
3. **Class-based composition root (NestJS-vari)** — Yapısal disiplin; solo + 90 gün için magic + boilerplate dengesi olumsuz, [[ilkeler]] §"Kalıcılık önceliği" gri kalır.

**Karar:** Seçenek 1 — `buildServer(opts: { env, logger? })` async factory + `loadEnv()` standalone fonksiyon (zod `safeParse` → `EnvValidationError` → stderr + `process.exit(1)`).

**Gerekçe:**
- **Test edilebilirlik:** Factory pattern Fastify `.inject()` API'siyle in-process HTTP simulate edilebilir (TASK-1.04 Vitest + Testcontainers buna dayanacak); env override (logger off, mock DB URL) test'te tek satır.
- **Fail-fast:** [[ilkeler]] §"Sır ve konfigürasyon yönetimi" — eksik/yanlış secret production'da sessiz hata yaratmaz; uygulama başlatma adımında ölür, anlamlı issue listesi stderr'e yazılır.
- **Asenkron register zinciri:** Fastify plugin'leri (`@fastify/sensible`, `@fastify/cors`, route'lar) async `register`; factory async olmak zorunda.
- **Logger esnekliği:** `BuildServerOptions.logger` override'ı test'te `false` ile susturma, production'da pino default. Dev'de pino-pretty transport otomatik.

**Tradeoff'lar:** Top-level Fastify pattern daha az boilerplate ama testabilite kaybı tüm sonraki task'ları kırılgan yapardı. Class-based composition root için NestJS magic riski + [[research]] kararına aykırı.

**Risk + Mitigation:**
- pino transport (pino-pretty) production'da kullanılmasın → `NODE_ENV === 'production' | 'staging'` koşulu transport'u devre dışı bırakır, prod JSON log akışı.
- `npm_package_version` `node` direkt çalıştırmada set edilmez → `/healthz` `version` alanı production'da `'0.0.0'` döner; **TASK-1.10 deploy'da** `APP_VERSION` env'inden okuma eklenir (Coolify build SHA injection).
- Zod 4 `transform()` chain dönüş tipi `z.infer` ile çıkarılır; `exactOptionalPropertyTypes: true` Fastify constructor tip uyumsuzluğu pino `LoggerOptions` direkt kullanımıyla çözüldü (`NonNullable` indexed access yerine).

**İlgili Task/Faz:** TASK-1.02 (iskelet) → TASK-1.03 (Prisma client decorate) → TASK-1.04 (Vitest + `.inject()` test altyapısı) → TASK-1.11 (Sentry + fast-redact logger config) → tüm sonraki backend task'ları.

---

### 2026-05-29 — Observability: Sentry Developer (EU Frankfurt)

**Bağlam:** Backend Node + RN/Expo için error tracking + crash reporting. KVKK uyumu kritik — sağlık verisi (kilo/boy/ölçüm/yemek günlüğü) log'a/error tracker'a YAZILMAZ.

**Seçenekler:**
1. **Sentry Developer (free)** — Endüstri standardı, EU Frankfurt residency free plan'da, PII scrubbing 3 katmanlı (`beforeSend` + server scrubber + Relay). RN+Node tek araç. 5K event/ay.
2. **GlitchTip self-host** — Sentry SDK uyumlu, ücretsiz; ama Postgres+Redis+Celery ops yükü solo dev için fazla.
3. **Better Stack** — Log management odaklı; crash reporting + source map yok. v1'de gerekli değil.
4. **DataDog** — Premium APM; $26/ay sınırını ilk aydan aşar, solo için overkill.

**Karar:** Sentry Developer (free tier, EU Frankfurt region) — backend Node + RN/Expo tek araç. 6. ay civarı Team plan ($26/ay) gerekirse yükselt.

**Gerekçe:** KVKK için EU residency free plan'a dahil. PII scrubbing 3 katmanlı endüstri standardı + sağlık verisi senaryosu için en güçlü destek. RN/Expo + EAS source map "kur ve unut" — solo dev için kritik. Pilot ölçeği (50 üye, beklenen error <500/ay) free tier'a sığar; v1.5'te Team plan'a geçiş tek tıkla.

**Tradeoff'lar:** GlitchTip (ücretsiz ama ops yükü), DataDog (pahalı), Sadece stdout (production'da kullanıcı görmeden crash riski).

**Risk:** Sentry varsayılan `req.body` tam gönderir → PII scrubber yazılmadan KVKK ihlali. **Mitigation:** İlk task'lerden biri "Sentry kurulumu + PII scrubber + zorunlu unit test". 5K event sınırı silently drop → `quota_exceeded` webhook Slack/email'e bağla.

**KVKK-uyumlu loglama deseni** (TECH-STACK.md'de tam tanım): pino + fast-redact (kilo/boy/ölçüm/yemek alanları stdout'a yazılmadan kesilir) + Sentry `beforeSend` + Sentry server-side scrubber. Loglar v1'de Coolify built-in aggregator'unda (EU).

**İlgili Task/Faz:** Yakın 1 task'ları içinde "Sentry + PII scrubber kurulumu" zorunlu — sağlık verisi modülleri başlamadan (Yakın 4) önce kanıtlanmış olmalı.

---

### 2026-05-29 — Hosting + Staging: Hetzner Cloud (Falkenstein, AB) + Coolify

**Bağlam:** Backend + Postgres + Redis hosting. KVKK m.9 reformu (7499 sayılı Kanun, 01.06.2024) sonrası yurt dışı veri aktarımı için yeterlilik kararı şart; Kasım 2025 itibarıyla hiçbir ülke için yeterlilik yok. Sağlık verisi m.6 özel nitelikli — hosting konumu hukuki argümana doğrudan etki ediyor.

**Seçenekler:**
1. **Hetzner Cloud (Falkenstein/Nuremberg, AB) + Coolify** — €8-15/ay, AB konum (KVKK için en savunulabilir), Heroku-benzeri DX; tek-node SPOF.
2. **Render Frankfurt (AB)** — ~$37/ay, tam managed PITR + push-to-deploy. Coolify ops'tan kaçınmak istersen.
3. **DigitalOcean App Platform Frankfurt (AB)** — ~$35/ay, Render benzeri.
4. **Fly.io FRA (AB)** — ~$45-55/ay, Managed PG $38/ay'dan; 2024-2025 FRA WireGuard + IAD outage olayları.
5. **Railway** — 2024-2026 ciddi sicil (DDoS, GCP suspend, Next.js exploit) — önerilmez.
6. **AWS Lightsail/ECS+RDS** — Frankfurt var, RDS PITR endüstri standardı; pilot için overkill.

**Karar:** Hetzner Cloud (Falkenstein veya Nuremberg, AB) + Coolify. Fallback: Render Frankfurt.

**Gerekçe:** KVKK m.9 sonrası AB (Almanya) en savunulabilir konum (GDPR-KVKK uyumu argümanı). Hetzner CPX22 €7.99/ay pilot ölçeğinin 10 katına sığar. Coolify GitHub push-to-deploy + Postgres+Redis one-click + S3 yedek + staging/prod izole project paternini Heroku DX'iyle veriyor. Render Frankfurt commit-edilebilir kaçış yolu olarak duruyor (Coolify'da Linux/Docker tuzağına takılırsan $37/ay'a "tamamen managed PITR" satın al).

**Tradeoff'lar:** Render Frankfurt (3× pahalı ama yönetim kolaylığı), Fly.io (PG pahalı + reliability sicil), Railway (sicil riski), AWS (overkill).

**Risk:** Tek-node SPOF — sunucu çökerse 30-60 dk downtime. **Mitigation:** Günlük Backblaze B2 yedek (Coolify built-in), ayda 1 manuel restore drill (faz retrosunda kontrol), DB+Coolify config ayrı dokümante, v1.5'te HA Postgres (Patroni) değerlendir. **İkincil risk:** KVKK Standart Sözleşme (SCC) Hetzner ile imzalanması — Yakın 4 hukuki adım (KVKK.md'de takip).

**Staging stratejisi:** Tek CPX22 sunucusunda Coolify ile iki ayrı project (`staging-alpfit`, `prod-alpfit`); her project kendi Postgres+Redis+env'i. GitHub Actions: `main` → staging webhook; tagged release + manuel approval → prod webhook.

**İlgili Task/Faz:** Yakın 1 task'larında hosting kurulumu staging'den başlar; prod kurulumu Yakın 5 öncesi (gerçek SMS provider + domain alımı ile birlikte).

---

### 2026-05-29 — Veritabanı + ORM: PostgreSQL 16 + Prisma 7

**Bağlam:** 3 rol veri modeli (Member + Trainer + Gym Owner) + KVKK uyumu + cumulative test prensibi + v1.5 AI-ready (jsonb).

**Seçenekler:**
1. **Prisma 7 + Postgres 16** — Tek `schema.prisma`, graph-tabanlı migration (en olgun, drift detection built-in), en geniş docs.
2. **Prisma 6.x LTS + Postgres 16** — Prisma 7 ekosistemi stabilleyene kadar bekle; Yakın 3 civarı yükseltme.
3. **Drizzle + Postgres 16** — SQL'e yakın, tip güvenliği iyi; ama `drizzle-kit` prod tuzakları (manuel SQL review zorunlu).
4. **Knex + Zod + Postgres** — ORM değil query builder; tip güvenliği elle, çok boilerplate.
5. **TypeORM** — Maintenance modda (v7 alpha 20+ ay); önerilmez.

**Karar:** Prisma 7 + PostgreSQL 16 + `@prisma/adapter-pg`.

**Gerekçe:** Tek schema dosyası → 3 rol model deklaratif. Graph-tabanlı migration [[ilkeler]] §"Kümülatif test altyapısı" + KVKK retention pattern için en güvenli yol. jsonb desteği v1.5 AI verisi için yeterli. En geniş docs solo dev için kritik. Drizzle'ın SQL'e yakınlığı bu bağlamda dezavantaja (manuel migration review = zaman kaybı). Postgres charset UTF-8 TR karakter sorunsuz.

**Tradeoff'lar:** Drizzle (hızlı ama tuzak riski), Knex (boilerplate), TypeORM (maintenance modda).

**Risk:** Prisma 7 ESM + Rust-free geçişi Kasım 2025 — henüz olgunlaşma süreci. Üç tuzak:
1. Monorepo'da Expo/RN ile backend ayrı tsconfig şart.
2. `@prisma/adapter-pg` explicit kurulum atlanırsa runtime'da kırılır.
3. `migrate dev`/`db push` artık `prisma generate` çalıştırmıyor — CI + dev script explicit adım.

**Mitigation:** Yakın 1 ilk task'larında "Prisma 7 setup smoke check" — generate adımı eksikse CI fail. Alternatif: Prisma 6.x LTS ile başla, Yakın 3'te v7'ye yüksel.

**İlgili Task/Faz:** Yakın 1 — backend iskeleti + Prisma setup smoke check + ilk migration (3 rol model).

---

### 2026-05-29 — Backend Stack: Node.js + Fastify 5 + TypeScript

**Bağlam:** TR-pazarı mobile app'in backend'i. Solo founder + zayıf teknik + 90 gün pilot. TypeScript paylaşımı mobile ile.

**Seçenekler:**
1. **Fastify 5 + TypeScript** — "Az sihir + bol batarya", TS ergonomisi iyi, `@fastify/jwt` hazır, Express'ten 2-3× hızlı.
2. **Express 5 + TypeScript** — En geniş ekosistem, en az sürpriz; ama TS ergonomisi zayıf, JWT/validation/schema elle.
3. **NestJS 11 + TypeScript** — Yapısal disiplin güçlü, test altyapısı zengin; decorator/DI dik öğrenme eğrisi (90 gün risk).
4. **Hono** — Modern + edge-native; KVKK audit/queue/cron ekosistemi henüz olgunlaşmadı.

**Karar:** Fastify 5 + TypeScript + Node.js 22 LTS.

**Gerekçe:** "Az sihir + bol batarya" dengesi — solo dev + zayıf teknik + 90 gün için ideal nokta. TypeScript ergonomisi Express'ten çok daha iyi. `@fastify/jwt` plugin'i refresh-token altyapısını hazır veriyor. Built-in JSON schema validation. NestJS'in magic riski + Hono'nun genç KVKK ekosistemi bu bağlamda yüksek risk.

**Tradeoff'lar:** NestJS (yapısal disiplin ama dik öğrenme), Express (en geniş ekosistem ama TS zayıf), Hono (modern ama production-grade audit/queue/cron eksik).

**Risk:** Fastify'ın refresh-token rotation resmi recipe'i yok (topluluk patternleri olgun). **Mitigation:** Pattern unit + integration test ile doğrulanır (rotation + revoke + replay attack senaryoları).

**İlgili Task/Faz:** Yakın 1 — backend iskeleti task'inden tüm sonraki backend task'larına temel.

---

### 2026-05-29 — Mobile Stack: Expo (React Native) + EAS Build

**Bağlam:** TR-pazarı PT-üye coaching mobile app. Solo founder + zayıf teknik + 90 gün pilot + push (M4) + deep link (M1) + offline cache (M2) + TR locale şart.

**Seçenekler:**
1. **Expo (React Native, managed) + EAS Build + Expo Router** — Zero-config, TS paylaşımı backend ile, push+deep link otomasyonu, EAS Build cloud.
2. **Flutter** — UI consistency + performans güçlü; ama push+deep link manuel, Dart öğrenmek, Hive/Isar topluluğa bırakıldı.
3. **Native (Swift + Kotlin)** — En esnek; 2 codebase + 2 CI + 2 release süreci → solo dev için 90 günde gerçekçi değil.

**Karar:** Expo (React Native, managed workflow) + EAS Build + Expo Router.

**Gerekçe:** Solo founder + 90 gün + push/deep link kritikliği + tek TypeScript dilinde mobile+backend kombinasyonunda Expo zero-config en yüksek hızı veriyor. EAS Build solo dev ops yükünü %60-70 azaltıyor (free tier pilot için yeterli). `expo-notifications` APNs+FCM tek arayüz → M4'te push entegrasyonu küçük task. Expo Router + EAS Hosting `.well-known/` otomasyonu Universal Link + App Link kurulumunu minimuma indiriyor (Firebase Dynamic Links Ağustos 2025'te kapatıldıktan sonra kritik).

**Tradeoff'lar:** Flutter (UI ama push/deep link manuel + Dart öğrenmek), Native (esnek ama 2 codebase solo için unrealistic).

**Risk:** RN 0.82 ile eski mimari kaldırıldı (New Architecture default). Third-party kütüphane seçerken "**New Arch + Expo SDK 56+ uyumlu**" filtresi zorunlu — uyumsuz kütüphane pilot ortasında ejection veya patch yazma zorunluluğu yaratabilir.

**Mitigation:** Paket seçim disiplinine yazıldı (TECH-STACK.md "Dikkat Edilecekler" §2). Yeni paket eklerken README'sinde New Arch uyumu doğrulanır.

**İlgili Task/Faz:** Yakın 1 — mobile iskeleti + EAS Build kurulumu; tüm sonraki mobile fazlarının temeli.

---

### 2026-05-29 — Modül Yapısı: 7 Modüllü Kesim

**Bağlam:** Alpfit v1 PRD'sinde 8 feature var (F01–F08). Bunları nasıl modüllere böleceğimiz mimari karar — featurey'lar kendi modülünde mi, gruplanmış mı?

**Seçenekler:**
1. **Her feature kendi modülünde (8 modül)** — Avantaj: bire-bir izlenebilirlik. Dezavantaj: Builder + Viewer ayrı modülde olunca veri senkronizasyon yükü; Ölçüm + Yemek için KVKK çerçevesi iki yerde tekrar eder; M0 altyapı belirsiz kalır.
2. **7 modüllü kesim: M0 cross-cutting + 5 feature-modül + 2 birleşik (M2 = F02+F05, M6 = F07+F08)** — Avantaj: KVKK çerçevesi M6'da tek noktada; PT/üye program tek data modeli; M0 altyapı erken aşamaya zorlanır. Dezavantaj: Modül-feature haritası 1:1 değil — okuyucu için ek translation.
3. **5 modül (M0 ayrı tutulmaz, altyapı M1'in içine girer)** — Avantaj: Daha az soyutlama. Dezavantaj: Altyapı + Auth iç içe → sonradan migration ağrısı; [[ilkeler]] §"Kümülatif test altyapısı" + §"Kalıcılık önceliği" altyapıyı erken faza zorluyor.

**Karar:** Seçenek 2 — 7 modüllü kesim.

**Gerekçe:** [[ilkeler]] §"Kalıcılık önceliği" + §"Kümülatif test altyapısı" altyapıyı önden ayırmayı zorunlu kılıyor; Builder + Viewer birleşik tutmak senkronizasyon yükünü ortadan kaldırıyor; Ölçüm + Yemek aynı KVKK + gizlilik toggle paterni paylaşıyor, ayrı modülde tekrar eder. M2 ve M6 birleşik tutmanın ek çevirme maliyeti, ayrı tutmanın senkronizasyon + duplicate kod maliyetinden az.

**İlgili Task/Faz:** Tüm fazlar — bu modüler kesim faz numaralandırmasının da temeli.

---

### 2026-05-29 — Faz Sırası: M0+M1 → M2 → M3+M4 → M5+M6 → UAT

**Bağlam:** 7 modülün hangi sırayla hangi fazlara dağıtılacağı kritik karar. Sürdürülebilirlik motoru ([[ilkeler]] §Eksen #1) ürünün kalbi ama önce program akışı (girdisi) hazır olmadan motor doğrulanamaz.

**Seçenekler:**
1. **Lineer feature sırası (F01 → F02 → ... → F08)** — Avantaj: PRD sırasına uyar. Dezavantaj: F01 motorunun bağımlılıkları (program + tamamlama sinyali) önce kurulmadan motoru test edemezsin.
2. **Motor-merkezli sıra: Altyapı → Auth → Program → Motor+Bildirim → Dashboard+Sağlık → Launch (5 faz)** — Avantaj: Her fazın girdisi önceki fazda hazır; Motor (kalp) ile Bildirim aynı fazda çünkü motorun doğruluk testi push olmadan yarım kalır; Dashboard + Sağlık aynı fazda çünkü dashboard tüm modüllerin agregatörü. Dezavantaj: 90 gün taahhüdü için 5 faz sıkı — pilot launch fazı kapsamlı.
3. **Dashboard erken (Sprint 2'de PT'ye early access)** — Avantaj: PT erken geri bildirim. Dezavantaj: Boş dashboard anlamsız; underlying veri yok.

**Karar:** Seçenek 2 — 5 fazlı motor-merkezli sıra.

**Gerekçe:** Motor (M3) PRD'nin kalbi ama girdisi (M2 program + tamamlama) olmadan testlenemez. Bildirim (M4) ile motor aynı fazda çünkü motorun "comeback tetiklendi → push gönderildi → üye geri döndü" testi push olmadan yarım kalır — [[ilkeler]] §Eksen #1 doğrulanamaz. Dashboard (M5) tüm modüllerin agregatörü, son içerik fazı (Yakın 4) doğru yer. Yakın 5 UAT + pilot launch — kardeş gerçek SMS ile pilot kullanır, app store yayını burada olur.

**İlgili Task/Faz:** Faz numaralandırma kuralı PHASES.md'de — bu sıralama "Sıradaki Fazlar" listesinde numarasız tutulur, faza girince numara alır.

---

### 2026-05-29 — Projeye Özgü Doküman Seti: TECH-STACK + KVKK

**Bağlam:** DevFlow standart dokümanlarına ek olarak projeye özgü hangi sabit dokümanları açacağız? Erken açmak boş şablon yaratır, geç açmak bilgi dağılır.

**Seçenekler:**
1. **TECH-STACK + KVKK + STYLE-GUIDE üçü birden** — Avantaj: tek seferde açılır. Dezavantaj: STYLE-GUIDE için tasarım dili henüz somutlaşmadı (kardeş "modern/akıcı/profesyonel" demiş, yön yok) — boş şablon değer üretmez.
2. **Sadece TECH-STACK + KVKK** — Avantaj: ikisi de net ihtiyaç (TECH-STACK Yakın 1 öncesi research-phase doldurulacak; KVKK Yakın 4 öncesi hukuki review'lı doldurulacak). STYLE-GUIDE Yakın 2 başlangıcında tasarım oturumuyla netleşince doğar.
3. **Hiçbiri açılmaz, ihtiyaç anında oluşur** — Avantaj: temizlik. Dezavantaj: "blocker olduğu görünür konum yok" — KVKK Yakın 4'ün engelleyici ön-koşulu, bir yerde duruşunun engel olarak görünmesi gerekir.

**Karar:** Seçenek 2 — TECH-STACK.md + KVKK.md boş şablon olarak kickoff-docs'ta açılır.

**Gerekçe:** İkisi de **engelleyici ön-koşul olarak DURUM.md'de izlenecek**; boş şablon kapsamın görünür kalmasını sağlar. STYLE-GUIDE Yakın 2 başlangıcında tasarım oturumuyla netleşince doğar — şimdi açmak değer üretmez.

**İlgili Task/Faz:** TECH-STACK Yakın 1 öncesi research-phase'de; KVKK Yakın 4 öncesi prd-refine + hukuki review.

---
