// Default MSW handler dizisi — boş. Test suite'leri kendi handler'larını
// `server.use(http.get(...))` ile inject eder. Bu pattern global state kirliliğini
// önler — her UI task'ı kendi handler'larını ekler, afterEach reset eder.

import type { HttpHandler } from 'msw';

export const handlers: HttpHandler[] = [];
