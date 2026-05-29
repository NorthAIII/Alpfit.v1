/**
 * TASK-1.20 — auth/jwt birim testleri.
 *
 * DB gerektirmez: bare Fastify + @fastify/jwt ile token üretip doğrular.
 *   - issueAccessToken: 15dk TTL + claim'ler (sub/role/typ/jti)
 *   - issueRegistrationToken: 10dk TTL + typ:'registration' + sub=telefon
 *   - expired token verify FAIL (per-call negatif expiresIn)
 *   - wrong signature verify FAIL (farklı secret'la imzalanmış token)
 */
import jwt from '@fastify/jwt';
import Fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ACCESS_TOKEN_TTL_SEC,
  REGISTRATION_TOKEN_TTL_SEC,
  issueAccessToken,
  issueRegistrationToken,
  type AccessTokenClaims,
  type RegistrationTokenClaims,
} from './jwt.js';

const SECRET = 'test-access-secret-at-least-32-characters-long';
const OTHER_SECRET = 'another-secret-also-at-least-32-characters-long';

async function buildJwtApp(secret: string): Promise<FastifyInstance> {
  const app = Fastify();
  await app.register(jwt, {
    secret,
    sign: { algorithm: 'HS256', expiresIn: ACCESS_TOKEN_TTL_SEC },
  });
  await app.ready();
  return app;
}

describe('TASK-1.20 — auth/jwt', () => {
  let app: FastifyInstance;
  let other: FastifyInstance;

  beforeAll(async () => {
    app = await buildJwtApp(SECRET);
    other = await buildJwtApp(OTHER_SECRET);
  });

  afterAll(async () => {
    await app.close();
    await other.close();
  });

  it('issueAccessToken → 15dk TTL + doğru claim seti', () => {
    const token = issueAccessToken(app, { id: 'user_1', role: 'member' });
    const claims = app.jwt.verify(token) as AccessTokenClaims;
    expect(claims.sub).toBe('user_1');
    expect(claims.role).toBe('member');
    expect(claims.typ).toBe('access');
    expect(typeof claims.jti).toBe('string');
    expect(claims.jti.length).toBeGreaterThan(0);
    expect(claims.exp - claims.iat).toBe(ACCESS_TOKEN_TTL_SEC);
  });

  it('issueRegistrationToken → 10dk TTL + typ:registration + sub=telefon', () => {
    const token = issueRegistrationToken(app, '+905551112233');
    const claims = app.jwt.verify(token) as RegistrationTokenClaims;
    expect(claims.sub).toBe('+905551112233');
    expect(claims.typ).toBe('registration');
    expect(claims.exp - claims.iat).toBe(REGISTRATION_TOKEN_TTL_SEC);
  });

  it('expired token → verify FAIL', () => {
    const token = app.jwt.sign(
      { sub: 'user_x', role: 'member', typ: 'access', jti: 'jti-x' },
      { expiresIn: -10 },
    );
    expect(() => app.jwt.verify(token)).toThrow();
  });

  it('wrong signature (farklı secret) → verify FAIL', () => {
    const foreign = issueAccessToken(other, { id: 'user_y', role: 'trainer' });
    expect(() => app.jwt.verify(foreign)).toThrow();
  });
});
