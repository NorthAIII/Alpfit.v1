# TASK-1.02: Backend Fastify iskeleti + zod + healthcheck

**Durum:** ⬜ Bekliyor
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

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
