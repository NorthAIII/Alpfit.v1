import { formatTrDateTime } from '@alpfit/shared';

import { EnvValidationError, loadEnv, type Env } from './config/env.js';
import { initSentry } from './observability/sentry.js';
import { buildServer } from './server.js';

async function start(): Promise<void> {
  let env: Env;
  try {
    env = loadEnv();
  } catch (err) {
    if (err instanceof EnvValidationError) {
      process.stderr.write(`${err.message}\n`);
    } else {
      process.stderr.write(`Unexpected error while loading environment: ${String(err)}\n`);
    }
    process.exit(1);
  }

  // Sentry init önce — sonraki kod path'i içindeki hatalar yakalansın diye.
  // DSN yoksa no-op döner (degrade mode); app yine çalışır.
  initSentry({ env });

  const app = await buildServer({ env });

  try {
    await app.listen({ host: '0.0.0.0', port: env.PORT });
    app.log.info({ startedAt: formatTrDateTime(new Date()) }, 'alpfit backend ready');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void start();
