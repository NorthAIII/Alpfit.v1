# MSW (Mock Service Worker) — Test Pattern

Backend HTTP çağrılarını test sırasında mock'lamak için MSW kullanılır. Setup
global'dir (`test/setup.ts` lifecycle hook'ları) — her UI task'ı kendi
handler'larını **suite-level** inject eder.

## Pattern

`handlers.ts` boş dizi tutar (global default). Bir test/suite kendi handler'ını
şöyle ekler:

```ts
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';

beforeEach(() => {
  server.use(
    http.post('https://api.alpfit.app/auth/otp/request', () =>
      HttpResponse.json({ success: true }),
    ),
  );
});
```

`afterEach` global setup'ta `server.resetHandlers()` çağrır — sızıntı yok.

## Neden bu yapı?

- **İzole test'ler:** Bir suite'in handler'ı diğerini etkilemez.
- **Açık intent:** Handler test'in yanında durur → ne mock'landığı görünür.
- **Yeni UI task'ı:** Kendi `*.test.tsx` dosyasında `server.use(...)` ile ekler;
  buradaki global `handlers.ts` dizisine eklemez (drift kaynağı).

## Unhandled request

`setup.ts` içinde `onUnhandledRequest: 'error'` — mock'lanmamış bir HTTP çağrısı
yapılırsa test fail eder. Bu KVKK ihlali korumasıdır (yanlışlıkla gerçek
backend'e veri sızması engellenir).
