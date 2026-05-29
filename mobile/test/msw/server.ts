// MSW Node server instance. Setup.ts test lifecycle hook'larına bağlar.
// Default boş handler dizisi; her test (veya UI task'ı) kendi handler'larını
// `server.use(...)` ile inject eder. Pattern: handlers.ts boş kalır, suite-level
// override edilir.

import { setupServer } from 'msw/node';

import { handlers } from './handlers';

export const server = setupServer(...handlers);
