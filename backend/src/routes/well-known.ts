/**
 * GET /.well-known/apple-app-site-association  (iOS Universal Link)
 * GET /.well-known/assetlinks.json             (Android App Link)
 *
 * TASK-1.25 — Deep link altyapısı. Davet linki `https://<domain>/davet/{kod}`
 * tıklandığında app yüklüyse doğrudan app açılsın diye iOS/Android işletim
 * sistemleri bu iki dosyayı domain'den çeker:
 *
 *   - iOS    : `apple-app-site-association` (UZANTISIZ, MIME application/json)
 *   - Android: `assetlinks.json`            (MIME application/json)
 *
 * **Servis kararı (TASK-1.25):** Staging Coolify değil, docker-compose +
 * bunker-nginx ile çalışıyor; bunker-nginx tüm path'leri `alpfit-backend:3000`'e
 * proxy'ler — bu nedenle `.well-known/` dosyalarını **backend route** servis eder
 * (nginx'e dokunmak gerekmez). Yakın 5'te EAS Hosting'e geçilirse statik
 * `mobile/public/.well-known/` kopyaları devreye girer (içerik aynı tutulur).
 *
 * **Placeholder uyarısı:** `appID` Team ID'si ve Android SHA256 fingerprint'i
 * Apple Developer + Google Play hesapları Yakın 5'te açılınca env üzerinden
 * gerçek değerlerle değişir (tek string değişikliği — `APPLE_APP_ID` +
 * `ANDROID_SHA256_CERT_FINGERPRINTS`). Yanlış fingerprint → Android'de intent
 * chooser çıkar (autoVerify başarısız); placeholder ile staging deep link iOS
 * custom scheme + manuel test üzerinden doğrulanır.
 */
import type { Env } from '../config/env.js';
import type { FastifyPluginAsync } from 'fastify';

/** Android paket adı — mobile/app.json `android.package` ile sabit. */
const ANDROID_PACKAGE_NAME = 'app.alpfit.mobile';

/** Deep link'in yakaladığı path deseni — davet linkleri `/davet/{kod}`. */
const DEEP_LINK_PATHS = ['/davet/*'] as const;

const JSON_CONTENT_TYPE = 'application/json';

export interface WellKnownRoutesOptions {
  env: Pick<Env, 'APPLE_APP_ID' | 'ANDROID_SHA256_CERT_FINGERPRINTS'>;
}

export const wellKnownRoutes =
  (opts: WellKnownRoutesOptions): FastifyPluginAsync =>
  async (app) => {
    // iOS Apple App Site Association — uzantısız path, application/json.
    const aasa = {
      applinks: {
        apps: [] as string[],
        details: [{ appID: opts.env.APPLE_APP_ID, paths: [...DEEP_LINK_PATHS] }],
      },
    };

    // Android Asset Links — virgülle ayrılmış fingerprint listesi parse edilir
    // (env tek string; her biri trim'lenir, boşlar elenir).
    const fingerprints = opts.env.ANDROID_SHA256_CERT_FINGERPRINTS.split(',')
      .map((fp) => fp.trim())
      .filter((fp) => fp.length > 0);
    const assetLinks = [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: ANDROID_PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ];

    app.get('/.well-known/apple-app-site-association', async (_req, reply) => {
      return reply.type(JSON_CONTENT_TYPE).send(JSON.stringify(aasa));
    });

    app.get('/.well-known/assetlinks.json', async (_req, reply) => {
      return reply.type(JSON_CONTENT_TYPE).send(JSON.stringify(assetLinks));
    });
  };
