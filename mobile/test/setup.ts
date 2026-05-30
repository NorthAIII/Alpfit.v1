// Jest global setup. Test framework yüklendikten SONRA, her test dosyasından
// önce 1 kez çalışır. RTL custom matcher'ları ve MSW lifecycle hook'ları burada.

import * as matchers from '@testing-library/react-native/matchers';

import { __resetSecureStore } from './mocks/expo-secure-store';
import { server } from './msw/server';

expect.extend(matchers);

// i18n missing-key handler test ortamında throw etmesin (assertion yerine
// sessiz warn yeterli — eksik anahtarlı testin başka bir assertion'la kırılması
// daha açıklayıcı). Aşağıdaki env flag init/index.ts içinde okunuyor.
process.env['NODE_ENV'] = 'test';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  __resetSecureStore();
});

afterAll(() => {
  server.close();
});
