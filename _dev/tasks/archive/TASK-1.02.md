# TASK-1.02: Backend Fastify iskeleti + zod + healthcheck

**Durum:** ✅ Tamamlandı
**Modül:** M0 — Çekirdek Altyapı (`modules/M0-cekirdek-altyapi.md`)
**Feature:** M0 cross-cutting altyapı
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.01

---

## Hedef

`backend/` workspace'ine Fastify 5 + TypeScript + zod tabanlı bir uygulama iskelet kur: bağımlılık enjeksiyonu için server factory pattern, çevre değişkenleri için zod-validated config loader, `/healthz` endpoint'i, pino logger entrypoint (fast-redact henüz değil). Sonraki task'larda Prisma, JWT, OTP, davet endpoint'lerinin üstüne kurulacağı **çalıştırılabilir** Fastify uygulaması bu task'ta hazır olur.

---

## Bağlam

Research-phase Fastify 5 seçti ("az sihir + bol batarya", solo + 90 gün için ideal). zod hem backend hem mobile'da paylaşılacak (shared/'a sonradan taşınacak şemalar için zemin). pino + fast-redact kararı verildi; bu task'ta pino kurulur, **redact konfigürasyonu Sentry PII scrubber task'ı (TASK-1.11) ile birlikte test edilir** — çünkü redact'in doğruluğu sadece KVKK test'iyle doğrulanabilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M0-cekirdek-altyapi.md` §2 (Env & Secret), §8 (Observability)
- `_dev/phases/PHASE-1.md` — Araştırma Bulguları → Backend Framework + Kullanılacak Araçlar
- `_dev/ILKELER.md` §"Sır ve konfigürasyon yönetimi"

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)
- `_dev/docs/DECISIONS.md` — server factory pattern + config loader yaklaşımı kararı

---

## Alt Görevler

- [ ] **1. Fastify 5 + plugin'ler kurulumu**
  - `pnpm -F @alpfit/backend add fastify @fastify/sensible @fastify/cors zod pino`
  - Dev deps: `tsx`, `@types/node`, `typescript` (TASK-1.01'den extends)
  - Dosya: `backend/package.json`

- [ ] **2. Config loader (zod-validated env)**
  - `backend/src/config/env.ts` — `process.env`'i zod ile parse eder; eksik/yanlış değerde uygulama başlatma adımında **fail fast**
  - Şema: `NODE_ENV` (dev/staging/production), `PORT`, `DATABASE_URL` (placeholder şu an), `REDIS_URL` (placeholder), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `LOG_LEVEL`, `APP_ENV` (env label)
  - `.env.example` repo'ya commit edilir (gerçek değer YOK, sadece anahtar listesi + açıklama)
  - `.env` gitignore'da kalır
  - Dosya: `backend/src/config/env.ts`, `backend/.env.example`

- [ ] **3. Server factory pattern**
  - `backend/src/server.ts` — `buildServer(opts)` Fastify instance üretir; opts test'te override edilebilir (logger off, env stub)
  - `backend/src/index.ts` — production entrypoint, `buildServer()` çağırıp `listen({ host: '0.0.0.0', port })`
  - Bu pattern test'te `buildServer()` ile in-process inject + Fastify `.inject()` API'sini kullanmamızı sağlar
  - Dosya: `backend/src/server.ts`, `backend/src/index.ts`

- [ ] **4. pino logger + log level**
  - pino instance Fastify'a inject edilir
  - Production'da `level: 'info'`, dev'de `level: 'debug'`, env'den okunur
  - Pretty print sadece dev'de (`pino-pretty` dev dep)
  - **fast-redact konfigürasyonu bu task'ta YOK** — TASK-1.11'de Sentry PII scrubber ile birlikte test edilerek eklenir
  - Dosya: `backend/src/server.ts` (logger config)

- [ ] **5. /healthz endpoint**
  - `GET /healthz` → `{ status: 'ok', timestamp, version }` (200)
  - Bu task'ta DB/Redis check yok; sonraki task'larda extend edilebilir
  - Dosya: `backend/src/routes/healthz.ts`

- [ ] **6. Script'ler**
  - `backend/package.json` script'leri: `dev` (tsx watch), `build` (tsc), `start` (node dist), `typecheck`, `lint`, `test` (TASK-1.04'te dolar)
  - Dosya: `backend/package.json`

---

## Etkilenen Dosyalar

```
backend/
├── package.json               # GÜNCELLE (deps + scripts)
├── .env.example               # YENİ
├── src/
│   ├── config/env.ts          # YENİ
│   ├── routes/healthz.ts      # YENİ
│   ├── server.ts              # YENİ
│   └── index.ts               # YENİ
```

---

## Dikkat Noktaları

- **Server factory pattern test edilebilirlik için kritik** — `buildServer()` direkt `.inject()` ile çağrılabilir, gerçek HTTP socket açmaya gerek kalmaz. TASK-1.04 test altyapısı bu pattern'e bağlı.
- **Env eksikse fail fast** — `process.env` okuma zod parse hata fırlatırsa uygulama başlatma adımında ölür ([[ilkeler]] §"Sır ve konfigürasyon yönetimi" — eksik secret production'da sessiz hata yaratmaz).
- **Database/Redis URL placeholder** — `DATABASE_URL=postgresql://placeholder` şeklinde, TASK-1.03 Prisma setup'a kadar uygulama DB'siz çalışabilir (sadece /healthz var).
- **JWT secret'lar şimdi tanımlı** — TASK-1.20/1.21'de kullanılacak; baştan env şemasında olmaları sonradan migration zorluğunu önler.

---

## Test Kriterleri

- [ ] `pnpm -F @alpfit/backend dev` → server PORT'ta dinlemeye başlar, log akar
- [ ] `curl http://localhost:PORT/healthz` → 200 + `{ status: 'ok', ... }`
- [ ] Env eksikse (örn. `JWT_ACCESS_SECRET` yoksa) `pnpm dev` zod parse error ile FAIL eder, stack trace anlamlı
- [ ] `pnpm -F @alpfit/backend build` hatasız tamamlanır, `dist/index.js` çalıştırılabilir
- [ ] `pnpm -F @alpfit/backend typecheck` hatasız geçer
- [ ] `.env.example` repo'da, `.env` gitignore'da olduğu doğrulanır

---

## Karar Noktaları

- **CORS politikası şimdi mi belirleniyor:** Bu task'ta `@fastify/cors` kurulu ama `origin: false` (tüm cross-origin reddedilir; mobile native API call yapıyor, CORS gerekmez). Web admin paneli gelecekte gerekirse origin allow-list eklenir.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.02): scaffold fastify backend with zod env and healthz`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi
- [ ] DECISIONS.md — server factory pattern ve config-loader yaklaşımı kararı yazıldı

---

## Oturum Kayıtları

### Oturum 2026-05-29 ✅

**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `backend/` workspace'ine bağımlılıklar eklendi: `fastify@5.8.5`, `@fastify/sensible@6.0.4`, `@fastify/cors@11.2.0`, `pino@10.3.1`, `zod@4.4.3`; dev deps: `tsx@4.22.3`, `pino-pretty@13.1.3`.
- `src/config/env.ts` — zod `safeParse` ile `process.env` doğrulama; `EnvValidationError` özel hatası, fail-fast `process.exit(1)`. Şema: `NODE_ENV` (development|staging|production, default development), `APP_ENV`, `PORT` (coerce.number + max 65535), `LOG_LEVEL` (transform ile NODE_ENV bazlı fallback — prod=info, diğer=debug), `DATABASE_URL`/`REDIS_URL` (placeholder string min 1), `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (string min 32, hata mesajları açık).
- `src/server.ts` — `buildServer(opts: { env, logger? })` async factory; `@fastify/sensible` + `@fastify/cors` (`origin: false`, mobile native call için CORS gerekmez) + `healthzRoutes` register. `buildLoggerConfig(env)` → prod/staging JSON pino, dev/local pino-pretty transport.
- `src/routes/healthz.ts` — `FastifyPluginAsync`; `GET /healthz` → `{ status, timestamp, version }` (200). Version `process.env['npm_package_version']` (pnpm script'inden çalıştırırken set, prod `node dist/index.js`'de '0.0.0' fallback — TASK-1.10'da `APP_VERSION` env'inden okunacak).
- `src/index.ts` — production entry; `loadEnv()` try/catch ile `EnvValidationError` yakalanır, stderr'e issue listesi yazılır, exit 1. Aksi halde `buildServer({ env })` + `listen({ host: '0.0.0.0', port: env.PORT })`.
- `package.json` script'leri: `dev` (tsx watch), `build` (tsc --build), `start` (node dist/index.js), `typecheck` (tsc --noEmit).
- `.env.example` — anahtar listesi + açıklamalar + JWT için `openssl rand -hex 32` ipucu; gerçek değer yok. `.env` zaten gitignore (`.gitignore:13`).

**Tip İncelikleri:**
- `exactOptionalPropertyTypes: true` + `noUncheckedIndexedAccess: true` + Fastify 5'in karmaşık logger union'ı çakıştı: `FastifyServerOptions['logger']` indexed access undefined sızdırdığı için Fastify constructor overload'ı `Http2SecureServer` fallback'e düşüyordu. Çözüm: `pino` `LoggerOptions` doğrudan kullanmak (`PinoLoggerOptions | boolean` union'ı) — Fastify HTTP overload'ı deterministik seçildi (DECISIONS.md → Risk + Mitigation §3).

**Test Kriterleri ✅:**
- `pnpm -F @alpfit/backend typecheck` → temiz.
- `pnpm -F @alpfit/backend build` → `dist/{index,server}.js + routes/healthz.js + config/env.js + .map` hatasız.
- `node dist/index.js` (PORT=3717) → server `http://127.0.0.1:3717` + `http://172.19.0.4:3717` dinler.
- `curl -sS -i http://localhost:3717/healthz` → `200 OK`, body `{"status":"ok","timestamp":"2026-05-29T11:35:12.827Z","version":"0.0.0"}`.
- `pnpm -F @alpfit/backend dev` (PORT=3718, tsx watch) → aynı 200 yanıt + pino-pretty `[11:35:42.022] INFO: Server listening...` formatı.
- Fail-fast (3 senaryo): JWT_ACCESS_SECRET missing → "expected string, received undefined"; secret too short → "must be at least 32 characters" (her iki secret için); invalid NODE_ENV → "expected one of development|staging|production". Hepsinde exit 1, anlamlı issue listesi.
- `pnpm lint` + `pnpm format:check` temiz (import-order auto-fix sonrası).
- `.env` yok (gitignore'da), `.env.example` repo'da untracked → commit edilecek.

**Karar Kayıtları:** DECISIONS.md → "Backend Bootstrap: Server Factory + zod-Validated Env Loader" eklendi.

**Sonraki Adım:** TASK-1.03 — Prisma 7 + `@prisma/adapter-pg` + ilk migration + generate smoke check.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
**Tamamlanma:** 2026-05-29 (run-task)
