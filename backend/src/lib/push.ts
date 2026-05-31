/**
 * Kanal-agnostik push bildirim interface'i.
 *
 * v1: ExpoPushAdapter (Expo Push API).
 * v1.5: WhatsApp kanalı ikinci implementation olarak buraya eklenir.
 */
export interface PushChannel {
  send(opts: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<'sent' | 'invalid_token'>;
}
