import { describe, expect, it } from 'vitest';
import { ApiRequestError, UnauthorizedError } from '../src/api.ts';
import { fetchAuthOptions } from '../src/auth-options.ts';
import { fetchMe } from '../src/me.ts';

const respond = (status: number, body: unknown) => async () =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const me = {
  id: '0b6e9f1c-3f3a-4f43-9d2c-6a1f6b2f9e10',
  name: 'Sam de Vries',
  email: 'sam@example.com',
  baseCurrency: 'EUR',
  locale: 'en-IE',
};

describe('fetchMe', () => {
  it('parses a 200', async () => {
    await expect(fetchMe(undefined, respond(200, me))).resolves.toEqual(me);
  });

  it('throws UnauthorizedError for a 401', async () => {
    await expect(
      fetchMe(undefined, respond(401, { code: 'UNAUTHORIZED', message: 'Sign in to continue.' })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws ApiRequestError with the error body for other statuses', async () => {
    const error = await fetchMe(undefined, respond(500, { code: 'INTERNAL_SERVER_ERROR', message: 'Oops' })).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 500, body: { code: 'INTERNAL_SERVER_ERROR' } });
  });

  it('refuses a body that does not match the shared schema', async () => {
    await expect(fetchMe(undefined, respond(200, { ...me, baseCurrency: 'XYZ' }))).rejects.toThrow();
  });
});

describe('fetchAuthOptions', () => {
  it('parses a 200', async () => {
    await expect(fetchAuthOptions(undefined, respond(200, { signUpEnabled: true }))).resolves.toEqual({
      signUpEnabled: true,
    });
  });

  it('refuses a body that does not match the shared schema', async () => {
    await expect(fetchAuthOptions(undefined, respond(200, { signUpEnabled: 'yes' }))).rejects.toThrow();
  });
});
