import * as SecureStore from 'expo-secure-store';

import { clearAuth, loadAuth, saveAuth } from './storage';

// SecureStore bellek-içi mock (test/mocks/expo-secure-store.ts); setup afterEach
// her test sonrası sıfırlar — testler arası izolasyon garanti.

describe('auth storage (SecureStore)', () => {
  it('save → load roundtrip (refresh token + rol)', async () => {
    await saveAuth({ refreshToken: 'rt-123', role: 'trainer' });
    expect(await loadAuth()).toEqual({ refreshToken: 'rt-123', role: 'trainer' });
  });

  it('boş store → null', async () => {
    expect(await loadAuth()).toBeNull();
  });

  it('clear sonrası → null', async () => {
    await saveAuth({ refreshToken: 'rt', role: 'member' });
    await clearAuth();
    expect(await loadAuth()).toBeNull();
  });

  it('kısmi/bozuk kayıt (rol yok) → null', async () => {
    // Sadece refresh token yazılı, rol eksik → tutarsız, oturum yok sayılır.
    await SecureStore.setItemAsync('auth.refresh_token', 'rt-only');
    expect(await loadAuth()).toBeNull();
  });

  it('geçersiz rol değeri → null', async () => {
    await SecureStore.setItemAsync('auth.refresh_token', 'rt');
    await SecureStore.setItemAsync('auth.role', 'gym_owner');
    expect(await loadAuth()).toBeNull();
  });
});
