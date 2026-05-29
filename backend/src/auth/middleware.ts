/**
 * Auth guard decorator (TASK-1.20).
 *
 * `app.authenticate` korumalı route'larda `preHandler` olarak kullanılır:
 *
 *   app.get('/x', { preHandler: app.authenticate }, handler)
 *
 * Sıra:
 *   1. Bearer access token doğrula (`req.jwtVerify`),
 *   2. `typ:'access'` zorla — kayıt jetonu (registration) korumalı route'a giremez,
 *   3. DB'de **aktif** kullanıcı kontrolü (`deletedAt: null`) — soft-delete'li
 *      hesap 401 (TASK-1.15 uyumu; `role` JWT'de cache'li, hassas durum DB'den).
 *
 * Başarıda `request.user` doğrulanmış claim'leri taşır. Tüm hata yolları aynı
 * 401 + sızdırmayan mesajı döner (geçersiz/expired/yanlış-tip/silinmiş ayrımı
 * istemciye verilmez).
 */
import { t } from '../i18n/index.js';

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

function unauthorized(reply: FastifyReply): FastifyReply {
  return reply.code(401).send({ status: 'unauthorized' as const, message: t('auth.tokenInvalid') });
}

export function registerAuthGuard(app: FastifyInstance): void {
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      await unauthorized(reply);
      return;
    }

    if (req.user.typ !== 'access') {
      await unauthorized(reply);
      return;
    }

    const user = await app.prisma.user.findFirst({
      where: { id: req.user.sub, deletedAt: null },
      select: { id: true },
    });
    if (user === null) {
      await unauthorized(reply);
    }
  });
}
