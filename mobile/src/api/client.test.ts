import { delay, http, HttpResponse } from 'msw';

import { server } from '../../test/msw/server';
import { useSessionStore } from '../auth/session';
import { loadAuth, saveAuth } from '../auth/storage';

import { authedFetch, fetchMe, refreshAccessToken } from './client';

// MSW host-agnostik wildcard; getApiBaseUrl test'te localhost'a düşer ama önemsiz.
const REFRESH_URL = '*/auth/refresh';
const ME_URL = '*/auth/me';
const PROTECTED_URL = '*/protected';

beforeEach(() => {
  useSessionStore.getState().clear();
});

describe('refreshAccessToken', () => {
  it('saklı token yok → null (ağ çağrısı yapılmaz)', async () => {
    expect(await refreshAccessToken()).toBeNull();
  });

  it('başarılı rotation → yeni token store + SecureStore', async () => {
    await saveAuth({ refreshToken: 'rt-old', role: 'member' });
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          accessToken: 'at-new',
          refreshToken: 'rt-new',
          expiresAt: '2026-07-01T00:00:00.000Z',
        }),
      ),
    );

    const token = await refreshAccessToken();

    expect(token).toBe('at-new');
    expect(useSessionStore.getState().accessToken).toBe('at-new');
    expect(await loadAuth()).toEqual({ refreshToken: 'rt-new', role: 'member' });
  });

  it('401 (expired/replay) → oturum temizlenir, null', async () => {
    await saveAuth({ refreshToken: 'rt-old', role: 'member' });
    useSessionStore.getState().setSession({
      accessToken: 'at',
      refreshToken: 'rt-old',
      role: 'member',
    });
    server.use(http.post(REFRESH_URL, () => new HttpResponse(null, { status: 401 })));

    const token = await refreshAccessToken();

    expect(token).toBeNull();
    expect(useSessionStore.getState().accessToken).toBeUndefined();
    expect(await loadAuth()).toBeNull();
  });
});

describe('authedFetch (401 interceptor)', () => {
  it('401 → refresh → orijinal isteği yeni token ile tekrarlar', async () => {
    await saveAuth({ refreshToken: 'rt-old', role: 'trainer' });
    useSessionStore.getState().setSession({
      accessToken: 'at-old',
      refreshToken: 'rt-old',
      role: 'trainer',
    });
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          accessToken: 'at-new',
          refreshToken: 'rt-new',
          expiresAt: '2026-07-01T00:00:00.000Z',
        }),
      ),
      http.get(PROTECTED_URL, ({ request }) => {
        const auth = request.headers.get('Authorization');
        return auth === 'Bearer at-new'
          ? HttpResponse.json({ ok: true })
          : new HttpResponse(null, { status: 401 });
      }),
    );

    const res = await authedFetch('/protected');

    expect(res.status).toBe(200);
    expect(useSessionStore.getState().accessToken).toBe('at-new');
  });

  it('refresh de başarısız → 401 döner, oturum temizlenir', async () => {
    await saveAuth({ refreshToken: 'rt-old', role: 'trainer' });
    useSessionStore.getState().setSession({
      accessToken: 'at-old',
      refreshToken: 'rt-old',
      role: 'trainer',
    });
    server.use(
      http.post(REFRESH_URL, () => new HttpResponse(null, { status: 401 })),
      http.get(PROTECTED_URL, () => new HttpResponse(null, { status: 401 })),
    );

    const res = await authedFetch('/protected');

    expect(res.status).toBe(401);
    expect(useSessionStore.getState().accessToken).toBeUndefined();
    expect(await loadAuth()).toBeNull();
  });

  it('eşzamanlı iki 401 tek refresh paylaşır (rotate edilen token tekrar gönderilmez)', async () => {
    await saveAuth({ refreshToken: 'rt-old', role: 'member' });
    useSessionStore.getState().setSession({
      accessToken: 'at-old',
      refreshToken: 'rt-old',
      role: 'member',
    });
    let refreshCalls = 0;
    server.use(
      http.post(REFRESH_URL, async () => {
        refreshCalls += 1;
        await delay(10); // İki isteğin refresh'te örtüşmesini garanti et.
        return HttpResponse.json({
          accessToken: 'at-new',
          refreshToken: 'rt-new',
          expiresAt: '2026-07-01T00:00:00.000Z',
        });
      }),
      http.get(PROTECTED_URL, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer at-new'
          ? HttpResponse.json({ ok: true })
          : new HttpResponse(null, { status: 401 }),
      ),
    );

    const [a, b] = await Promise.all([authedFetch('/protected'), authedFetch('/protected')]);

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(refreshCalls).toBe(1);
  });
});

describe('fetchMe', () => {
  it('200 → ok (user + rol)', async () => {
    useSessionStore.getState().setSession({
      accessToken: 'at',
      refreshToken: 'rt',
      role: 'trainer',
    });
    server.use(
      http.get(ME_URL, () =>
        HttpResponse.json({
          user: {
            id: 'u1',
            role: 'trainer',
            firstName: 'Kıvanç',
            lastName: 'Demir',
            phoneE164: '+905551112233',
            gymName: null,
            certificateNote: null,
          },
        }),
      ),
    );

    const res = await fetchMe();

    expect(res).toEqual({ kind: 'ok', user: expect.objectContaining({ role: 'trainer' }) });
  });
});
