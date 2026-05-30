// Default MSW handler dizisi — boş. Test suite'leri kendi handler'larını
// `server.use(http.get(...))` ile inject eder. Bu pattern global state kirliliğini
// önler — her UI task'ı kendi handler'larını ekler, afterEach reset eder.

import { http, HttpResponse } from 'msw';

import type { HttpHandler } from 'msw';

export const handlers: HttpHandler[] = [];

// --- Onboarding akışı mock backend'i (TASK-1.34) --------------------------------
// Uçtan uca onboarding smoke testi (Landing → telefon → OTP → KVKK → profil →
// home; deep link davet; PT davet üretimi; auto-login) gerçek api/* modüllerini
// kullanır — fetch'i MSW yakalar. Aşağıdaki builder'lar her HTTP adımının
// deterministik cevabını üretir. `*` host-agnostik (getApiBaseUrl testte
// localhost'a düşer, değer önemsiz — client.test.ts ile aynı desen). Default
// `handlers` boş kalır; smoke suite bunları `server.use(...)` ile composer.

export interface MockUser {
  id: string;
  role: 'member' | 'trainer';
  firstName: string;
  lastName: string;
  phoneE164: string;
  gymName: string | null;
  certificateNote: string | null;
}

const EXPIRES_AT = '2026-07-01T00:00:00.000Z';

/** `POST /auth/otp/send` → 200 (kod SMS'e verildi). */
export function otpSendOk(): HttpHandler {
  return http.post('*/auth/otp/send', () =>
    HttpResponse.json({ success: true, expiresInSec: 300 }),
  );
}

/** `POST /auth/otp/verify` → 200 yeni kullanıcı (kayıt jetonu döner). */
export function otpVerifyNewUser(registrationToken: string): HttpHandler {
  return http.post('*/auth/otp/verify', () =>
    HttpResponse.json({ verified: true, userExists: false, isNew: true, registrationToken }),
  );
}

/** `POST /auth/profile` → 201 hesap açıldı (oturum jetonları + kullanıcı). */
export function profileCreated(user: MockUser): HttpHandler {
  return http.post('*/auth/profile', () =>
    HttpResponse.json(
      { accessToken: 'at-new', refreshToken: 'rt-new', expiresAt: EXPIRES_AT, user },
      { status: 201 },
    ),
  );
}

/** `GET /invitations/:code` (preview) → 200 geçerli davet (PT ismi). */
export function invitationPreviewValid(opts: {
  trainerFirstName: string;
  trainerLastName: string;
}): HttpHandler {
  return http.get('*/invitations/:code', () =>
    HttpResponse.json({
      trainerFirstName: opts.trainerFirstName,
      trainerLastName: opts.trainerLastName,
      expiresAt: EXPIRES_AT,
    }),
  );
}

/** `POST /invitations/:code/accept` → 200 PT'ye bağlandı. */
export function invitationAccepted(opts: {
  trainerFirstName: string;
  trainerLastName: string;
}): HttpHandler {
  return http.post('*/invitations/:code/accept', () =>
    HttpResponse.json({
      trainerId: 'pt-1',
      trainerFirstName: opts.trainerFirstName,
      trainerLastName: opts.trainerLastName,
    }),
  );
}

/** `GET /invitations` (PT bekleyen davet listesi) → 200 dizi. */
export function invitationsList(
  invitations: { id: string; code: string; url: string; expiresAt: string }[],
): HttpHandler {
  return http.get('*/invitations', () => HttpResponse.json(invitations));
}

/** `POST /invitations` (PT davet üret) → 201 yeni davet. */
export function invitationCreated(invitation: {
  id: string;
  code: string;
  url: string;
  expiresAt: string;
}): HttpHandler {
  return http.post('*/invitations', () => HttpResponse.json(invitation, { status: 201 }));
}

/** `GET /trainers/me/members` → 200 aktif üye dizisi. */
export function trainersMembers(
  members: { id: string; firstName: string; lastName: string; joinedAt: string }[],
): HttpHandler {
  return http.get('*/trainers/me/members', () => HttpResponse.json(members));
}

/** `GET /trainers/me/events` → 200 event dizisi (varsayılan boş — polling no-op). */
export function trainersEvents(
  events: {
    type: 'invitation_accepted';
    memberId: string;
    memberFirstName: string;
    occurredAt: string;
  }[] = [],
): HttpHandler {
  return http.get('*/trainers/me/events', () => HttpResponse.json(events));
}

/** `POST /auth/refresh` → 200 rotation (auto-login boot). */
export function authRefreshOk(): HttpHandler {
  return http.post('*/auth/refresh', () =>
    HttpResponse.json({ accessToken: 'at-boot', refreshToken: 'rt-boot', expiresAt: EXPIRES_AT }),
  );
}

/** `GET /auth/me` → 200 oturum sahibi profili (auto-login doğrulama + rol). */
export function authMeOk(user: MockUser): HttpHandler {
  return http.get('*/auth/me', () => HttpResponse.json({ user }));
}
