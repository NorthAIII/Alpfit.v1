/**
 * JWT access token + kısa ömürlü kayıt jetonu (TASK-1.20).
 *
 * İki token tipi tek @fastify/jwt secret'ı (`JWT_ACCESS_SECRET`, HS256) ile
 * imzalanır ve `typ` claim'iyle ayrışır:
 *   - **access** (15dk): korumalı route'lar için. `sub` = userId, `role` taşır.
 *     `authenticate` middleware yalnızca `typ:'access'` kabul eder.
 *   - **registration** (10dk): OTP doğrulandıktan sonra "yeni üye" akışında
 *     verilir; `sub` = telefon (E.164). `POST /auth/profile` bununla hesap açar.
 *     OTP, verify adımında **tüketilir** (tek kullanımlık korunur) — kayıt
 *     jetonu telefon sahipliğini profil adımına güvenle taşıyan tek-amaçlı
 *     kanıttır (OTP kodu ağ üzerinde iki kez gezmez). Detay: DECISIONS "TASK-1.20".
 *
 * `jti` (UUID) her token'a eklenir — ileride jti-bazlı revoke için hazır
 * (TASK-1.20 dikkat noktası); v1'de kullanılmaz.
 *
 * Not: `@fastify/jwt` `expiresIn` **saniye** cinsindedir (ampirik doğrulandı:
 * `expiresIn:900` → `exp-iat = 900`). Access için register default'u kullanılır;
 * registration `issueRegistrationToken` içinde per-call override edilir.
 */
import { randomUUID } from 'node:crypto';

import type { Role } from '../generated/prisma/enums.js';
import type { FastifyInstance } from 'fastify';

/** Access token ömrü (saniye) — 15 dakika. */
export const ACCESS_TOKEN_TTL_SEC = 15 * 60;
/** Kayıt jetonu ömrü (saniye) — 10 dakika (profil doldurmaya yeter). */
export const REGISTRATION_TOKEN_TTL_SEC = 10 * 60;

export type TokenType = 'access' | 'registration';

/** Access token imza girdisi (`iat`/`exp` imzada otomatik eklenir). */
export interface AccessTokenSignPayload {
  /** userId */
  sub: string;
  role: Role;
  typ: 'access';
  jti: string;
}

/** Kayıt jetonu imza girdisi. */
export interface RegistrationTokenSignPayload {
  /** phoneE164 */
  sub: string;
  typ: 'registration';
  jti: string;
}

/** Doğrulanmış access token claim'leri (`request.user`). */
export interface AccessTokenClaims extends AccessTokenSignPayload {
  iat: number;
  exp: number;
}

/** Doğrulanmış kayıt jetonu claim'leri. */
export interface RegistrationTokenClaims extends RegistrationTokenSignPayload {
  iat: number;
  exp: number;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenSignPayload | RegistrationTokenSignPayload;
    user: AccessTokenClaims | RegistrationTokenClaims;
  }
}

export interface AccessTokenUser {
  id: string;
  role: Role;
}

/**
 * 15dk access token üretir. Register'daki `sign.expiresIn`
 * (`ACCESS_TOKEN_TTL_SEC`) varsayılan olarak uygulanır.
 */
export function issueAccessToken(app: FastifyInstance, user: AccessTokenUser): string {
  return app.jwt.sign({ sub: user.id, role: user.role, typ: 'access', jti: randomUUID() });
}

/** 10dk kayıt jetonu üretir (`sub` = doğrulanmış telefon E.164). */
export function issueRegistrationToken(app: FastifyInstance, phoneE164: string): string {
  return app.jwt.sign(
    { sub: phoneE164, typ: 'registration', jti: randomUUID() },
    { expiresIn: REGISTRATION_TOKEN_TTL_SEC },
  );
}
