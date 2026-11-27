import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiErrorSchema, authOptionsResponseSchema, meResponseSchema } from '@extracker/shared';
import {
  APP_URL,
  PASSWORD,
  buildTestApp,
  cookiesFrom,
  getMe,
  postJson,
  sessionCookieLine,
  signUp,
} from './support.ts';

type TestApp = ReturnType<typeof buildTestApp>['app'];

describe('sign-in with email and password', () => {
  let app: TestApp | undefined;

  afterEach(async () => {
    vi.useRealTimers();
    await app?.close();
  });

  describe('sign-up', () => {
    it('is refused when AUTH_SIGNUP_ENABLED is not set', async () => {
      ({ app } = buildTestApp({ AUTH_SIGNUP_ENABLED: 'false' }));
      const response = await postJson(app, '/api/auth/sign-up/email', {
        name: 'Sam',
        email: 'sam@example.com',
        password: PASSWORD,
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
      expect(sessionCookieLine(response)).toBeUndefined();
    });

    it('answers 200 and sets an HttpOnly, SameSite=Lax session cookie', async () => {
      ({ app } = buildTestApp());
      const response = await postJson(app, '/api/auth/sign-up/email', {
        name: 'Sam',
        email: 'sam@example.com',
        password: PASSWORD,
      });

      expect(response.statusCode).toBe(200);
      const cookie = sessionCookieLine(response);
      expect(cookie).toMatch(/; HttpOnly/i);
      expect(cookie).toMatch(/; SameSite=Lax/i);
      // APP_URL is plain HTTP in the tests.
      expect(cookie).not.toMatch(/; Secure/i);
    });

    it('refuses a password of 11 characters', async () => {
      ({ app } = buildTestApp());
      const response = await postJson(app, '/api/auth/sign-up/email', {
        name: 'Sam',
        email: 'sam@example.com',
        password: 'x'.repeat(11),
      });

      expect(response.statusCode).toBe(400);
      expect(apiErrorSchema.parse(response.json()).code).toBe('PASSWORD_TOO_SHORT');
    });

    it('gives the user a UUID', async () => {
      ({ app } = buildTestApp());
      const me = meResponseSchema.parse((await getMe(app, await signUp(app))).json());
      expect(me.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('sign-in', () => {
    it('answers 401 for a wrong password and sets the cookie for the right one', async () => {
      ({ app } = buildTestApp());
      await signUp(app);

      const wrong = await postJson(app, '/api/auth/sign-in/email', { email: 'sam@example.com', password: 'not the password' });
      expect(wrong.statusCode).toBe(401);
      expect(sessionCookieLine(wrong)).toBeUndefined();

      const right = await postJson(app, '/api/auth/sign-in/email', { email: 'sam@example.com', password: PASSWORD });
      expect(right.statusCode).toBe(200);
      expect(sessionCookieLine(right)).toBeDefined();
      expect((await getMe(app, cookiesFrom(right))).statusCode).toBe(200);
    });
  });

  describe('sign-out', () => {
    it('is refused from another origin, and the session keeps working', async () => {
      ({ app } = buildTestApp());
      const cookie = await signUp(app);

      const response = await postJson(app, '/api/auth/sign-out', {}, { cookie, origin: 'https://evil.example' });
      expect(response.statusCode).toBe(403);
      expect(apiErrorSchema.parse(response.json()).code).toBe('INVALID_ORIGIN');
      expect((await getMe(app, cookie)).statusCode).toBe(200);
    });

    it('ends the session when sent the way better-auth/client sends it', async () => {
      ({ app } = buildTestApp());
      const cookie = await signUp(app);

      const response = await postJson(app, '/api/auth/sign-out', {}, { cookie });
      expect(response.statusCode).toBe(200);
      expect((await getMe(app, cookie)).statusCode).toBe(401);
    });

    it('accepts a POST with no body, as curl sends it', async () => {
      ({ app } = buildTestApp());
      const cookie = await signUp(app);

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-out',
        headers: { origin: APP_URL, cookie, 'content-type': 'application/json' },
      });
      expect(response.statusCode).toBe(200);
      expect((await getMe(app, cookie)).statusCode).toBe(401);
    });
  });

  describe('GET /api/me', () => {
    it('answers 401 with an error body when there is no cookie', async () => {
      ({ app } = buildTestApp());
      const response = await getMe(app);

      expect(response.statusCode).toBe(401);
      expect(apiErrorSchema.parse(response.json()).code).toBe('UNAUTHORIZED');
    });

    it('returns the user, with the base currency and locale from the config', async () => {
      ({ app } = buildTestApp({ DEFAULT_CURRENCY: 'USD', DEFAULT_LOCALE: 'en-US' }));
      const response = await getMe(app, await signUp(app, 'sam@example.com', 'Sam de Vries'));

      expect(response.statusCode).toBe(200);
      expect(meResponseSchema.parse(response.json())).toEqual({
        id: expect.any(String),
        name: 'Sam de Vries',
        email: 'sam@example.com',
        baseCurrency: 'USD',
        locale: 'en-US',
      });
    });

    it('gives each cookie its own user', async () => {
      ({ app } = buildTestApp());
      const sam = await signUp(app, 'sam@example.com', 'Sam');
      const alex = await signUp(app, 'alex@example.com', 'Alex');

      expect(meResponseSchema.parse((await getMe(app, sam)).json()).email).toBe('sam@example.com');
      expect(meResponseSchema.parse((await getMe(app, alex)).json()).email).toBe('alex@example.com');
    });

    it('passes on the cookie that extends the session once a day', async () => {
      vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-27T09:00:00Z') });
      ({ app } = buildTestApp());
      const cookie = await signUp(app);

      // Within the first day nothing changes, so no new cookie.
      expect(sessionCookieLine(await getMe(app, cookie))).toBeUndefined();

      vi.setSystemTime(new Date('2026-11-28T10:00:00Z'));
      const response = await getMe(app, cookie);
      expect(response.statusCode).toBe(200);
      expect(sessionCookieLine(response)).toMatch(/; Max-Age=604800/i);
    });
  });

  describe('requireSession on a write route', () => {
    function appWithWriteRoute() {
      const built = buildTestApp();
      built.app.post('/api/test-write', { preHandler: built.app.requireSession }, async () => ({ ok: true }));
      return built.app;
    }

    it.each([
      ['no Origin header', {}],
      ['another origin', { origin: 'https://evil.example' }],
    ])('answers 403 INVALID_ORIGIN with %s', async (_label, originHeader) => {
      app = appWithWriteRoute();
      const cookie = await signUp(app);
      const response = await app.inject({ method: 'POST', url: '/api/test-write', headers: { cookie, ...originHeader } });

      expect(response.statusCode).toBe(403);
      expect(apiErrorSchema.parse(response.json()).code).toBe('INVALID_ORIGIN');
    });

    it('passes with Origin set to APP_URL', async () => {
      app = appWithWriteRoute();
      const cookie = await signUp(app);
      const response = await app.inject({ method: 'POST', url: '/api/test-write', headers: { cookie, origin: APP_URL } });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    });
  });

  describe('GET /api/auth-options', () => {
    it('says sign-up is closed by default, without a cookie', async () => {
      ({ app } = buildTestApp({ AUTH_SIGNUP_ENABLED: 'false' }));
      const response = await app.inject({ method: 'GET', url: '/api/auth-options' });

      expect(response.statusCode).toBe(200);
      expect(authOptionsResponseSchema.parse(response.json())).toEqual({ signUpEnabled: false });
    });

    it('says sign-up is open when AUTH_SIGNUP_ENABLED is true', async () => {
      ({ app } = buildTestApp({ AUTH_SIGNUP_ENABLED: 'true' }));
      const response = await app.inject({ method: 'GET', url: '/api/auth-options' });

      expect(authOptionsResponseSchema.parse(response.json())).toEqual({ signUpEnabled: true });
    });
  });

  it('answers unknown API paths with a 404 error body', async () => {
    ({ app } = buildTestApp());
    const response = await app.inject({ method: 'GET', url: '/api/nothing-here' });

    expect(response.statusCode).toBe(404);
    expect(apiErrorSchema.parse(response.json()).code).toBe('NOT_FOUND');
  });
});
