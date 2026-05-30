import { http, HttpResponse } from 'msw';

import { server } from '../../test/msw/server';

import { bootstrapSession, persistLogin } from './auth-actions';
import { useSessionStore } from './session';
import { loadAuth, saveAuth } from './storage';

const REFRESH_URL = '*/auth/refresh';
const ME_URL = '*/auth/me';

function meResponse(role: 'member' | 'trainer') {
  return HttpResponse.json({
    user: {
      id: 'u1',
      role,
      firstName: 'Ada',
      lastName: 'Yılmaz',
      phoneE164: '+905551112233',
      gymName: null,
      certificateNote: null,
    },
  });
}

beforeEach(() => {
  useSessionStore.getState().clear();
});

describe('persistLogin', () => {
  it('rol verildiğinde (profil create) /me çağırmaz, store + storage doldurur', async () => {
    const role = await persistLogin({ accessToken: 'at', refreshToken: 'rt' }, 'trainer');

    expect(role).toBe('trainer');
    expect(useSessionStore.getState().accessToken).toBe('at');
    expect(await loadAuth()).toEqual({ refreshToken: 'rt', role: 'trainer' });
  });

  it('rol verilmediğinde (OTP login) /me ile öğrenir', async () => {
    server.use(http.get(ME_URL, () => meResponse('member')));

    const role = await persistLogin({ accessToken: 'at', refreshToken: 'rt' });

    expect(role).toBe('member');
    expect(await loadAuth()).toEqual({ refreshToken: 'rt', role: 'member' });
  });

  it('/me başarısız (401) → null, oturum yazılmaz', async () => {
    server.use(http.get(ME_URL, () => new HttpResponse(null, { status: 401 })));

    const role = await persistLogin({ accessToken: 'at', refreshToken: 'rt' });

    expect(role).toBeNull();
    expect(useSessionStore.getState().accessToken).toBeUndefined();
    expect(await loadAuth()).toBeNull();
  });
});

describe('bootstrapSession', () => {
  it('saklı token yok → unauthenticated (ağ çağrısı yok)', async () => {
    expect(await bootstrapSession()).toEqual({ kind: 'unauthenticated' });
  });

  it('geçerli refresh → authenticated + rol, store dolu', async () => {
    await saveAuth({ refreshToken: 'rt-old', role: 'trainer' });
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          accessToken: 'at-new',
          refreshToken: 'rt-new',
          expiresAt: '2026-07-01T00:00:00.000Z',
        }),
      ),
      http.get(ME_URL, () => meResponse('trainer')),
    );

    const result = await bootstrapSession();

    expect(result).toEqual({ kind: 'authenticated', role: 'trainer' });
    expect(useSessionStore.getState().accessToken).toBe('at-new');
    expect(await loadAuth()).toEqual({ refreshToken: 'rt-new', role: 'trainer' });
  });

  it('refresh 401 (expired) → unauthenticated, oturum temizlenir', async () => {
    await saveAuth({ refreshToken: 'rt-old', role: 'member' });
    server.use(http.post(REFRESH_URL, () => new HttpResponse(null, { status: 401 })));

    const result = await bootstrapSession();

    expect(result).toEqual({ kind: 'unauthenticated' });
    expect(useSessionStore.getState().accessToken).toBeUndefined();
    expect(await loadAuth()).toBeNull();
  });
});
