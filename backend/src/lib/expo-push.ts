import Expo from 'expo-server-sdk';

import type { PrismaClient } from '../db/prisma.js';
import type { PushChannel } from './push.js';

const expo = new Expo();

export class ExpoPushAdapter implements PushChannel {
  constructor(private readonly prisma: PrismaClient) {}

  async send(opts: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<'sent' | 'invalid_token'> {
    const [ticket] = await expo.sendPushNotificationsAsync([
      {
        to: opts.token,
        title: opts.title,
        body: opts.body,
        data: opts.data,
        sound: 'default',
      },
    ]);

    if (ticket.status === 'error') {
      const errorCode = ticket.details?.error;
      if (errorCode === 'DeviceNotRegistered') {
        await this.prisma.pushToken.deleteMany({ where: { token: opts.token } });
        return 'invalid_token';
      }
      // APNs/FCM geçici hatası — BullMQ retry yakalar
      throw new Error(`Expo push error: ${errorCode ?? ticket.message}`);
    }

    return 'sent';
  }
}
