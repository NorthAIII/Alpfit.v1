// Jest global setup. Test framework yüklendikten SONRA, her test dosyasından
// önce 1 kez çalışır. RTL custom matcher'ları ve MSW lifecycle hook'ları burada.

import * as matchers from '@testing-library/react-native/matchers';
import { notifyManager } from '@tanstack/react-query';

import { __resetAsyncStorage } from './mocks/async-storage';
import { __resetSecureStore } from './mocks/expo-secure-store';
import { server } from './msw/server';

// TanStack Query'yi test modunda senkron çalıştır. Varsayılan scheduler
// setTimeout ile batch yapıp act() dışında kalarak render döngüsünü kirletir
// (RN renderer sürüm kontrolü + "not wrapped in act" uyarısı tetiklenir).
notifyManager.setScheduler((callback) => callback());

// react-native-renderer@19.2.3 DevTools init kodu React.version'ı '19.2.3'
// ile karşılaştırır; react@19.2.6 yüklü olduğunda Error fırlatır. Bu test
// ortamına özgü patch minor versiyon farkını giderir — production'da çalışmaz,
// gerekmiyor.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReactForVersionPatch = require('react') as { version: string };
ReactForVersionPatch.version = '19.2.3';

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
  __resetAsyncStorage();
});

afterAll(() => {
  server.close();
});
