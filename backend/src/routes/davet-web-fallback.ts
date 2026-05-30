/**
 * GET /davet/:code — masaüstü / app-yüklü-değil fallback sayfası (TASK-1.25).
 *
 * Davet linki `https://<domain>/davet/{kod}` mobil cihazda **app yüklüyse** iOS
 * Universal Link / Android App Link tarafından yakalanır ve bu HTML hiç
 * yüklenmez (OS app'i açar). Bu sayfa yalnızca **app yüklü değilse** veya link
 * **masaüstü tarayıcıda** açıldığında görünür: F1.1 "Davet linkine masaüstünden
 * tıklayan kullanıcıya 'Mobile cihazda aç' QR kod gösterilir".
 *
 * İçerik bilinçle minimal + PII'siz: davet linki + QR kodu + "mobil cihazda aç"
 * yönlendirmesi. PT/üye verisi sorgulanmaz (DB hit yok); kodun geçerliliği app
 * içinde `GET /invitations/:code` ile doğrulanır. QR sunucu tarafında üretilir
 * (`qrcode` paketi, inline data-URI) — harici QR servisi YOK (davet kodu 3.
 * tarafa sızmaz, KVKK duruşu korunur).
 */
import QRCode from 'qrcode';

import { buildInvitationUrl } from '../invitations/code.js';

import type { Env } from '../config/env.js';
import type { FastifyPluginAsync } from 'fastify';

export interface DavetWebFallbackRoutesOptions {
  env: Pick<Env, 'APP_BASE_URL'>;
}

/** HTML enjeksiyonuna karşı minimal escape (kod alfanümerik ama savunma amaçlı). */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage(opts: { code: string; url: string; qrDataUri: string }): string {
  const code = escapeHtml(opts.code);
  const url = escapeHtml(opts.url);
  const qr = escapeHtml(opts.qrDataUri);
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Alpfit — Davet</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center;
      justify-content: center; padding: 24px; background: #0F1115;
      color: #E4E8EF; font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    }
    .card {
      max-width: 420px; width: 100%; background: #151922; border: 1px solid #2A2F3A;
      border-radius: 16px; padding: 32px 24px; text-align: center;
    }
    h1 { font-size: 22px; margin: 0 0 8px; color: #FFFFFF; }
    p { font-size: 15px; line-height: 1.5; color: #9AA3B2; margin: 0 0 20px; }
    .qr { width: 220px; height: 220px; border-radius: 12px; background: #FFFFFF; padding: 12px; margin: 0 auto 20px; }
    .qr img { width: 100%; height: 100%; display: block; }
    .code {
      font-size: 13px; color: #9AA3B2; margin-bottom: 8px;
    }
    .code strong { color: #E4E8EF; font-size: 20px; letter-spacing: 2px; }
    .link {
      display: inline-block; word-break: break-all; font-size: 13px;
      color: #3B82F6; text-decoration: none; margin-top: 4px;
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>Davetini mobil cihazda aç</h1>
    <p>Alpfit'e katılmak için bu QR kodu telefonunla okut ya da aşağıdaki bağlantıyı telefonunda aç.</p>
    <div class="qr"><img src="${qr}" alt="Davet QR kodu" /></div>
    <div class="code">Davet kodun: <strong>${code}</strong></div>
    <a class="link" href="${url}">${url}</a>
  </main>
</body>
</html>`;
}

export const davetWebFallbackRoutes =
  (opts: DavetWebFallbackRoutesOptions): FastifyPluginAsync =>
  async (app) => {
    app.get<{ Params: { code: string } }>('/davet/:code', async (req, reply) => {
      const { code } = req.params;
      const url = buildInvitationUrl(opts.env.APP_BASE_URL, code);
      // QR sunucu tarafında üretilir — inline PNG data-URI (harici servis yok).
      const qrDataUri = await QRCode.toDataURL(url, { margin: 1, width: 220 });
      return reply.type('text/html; charset=utf-8').send(renderPage({ code, url, qrDataUri }));
    });
  };
