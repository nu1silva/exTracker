import { describe, expect, it } from 'vitest';
import { makeAuthClient } from '../src/auth-client.ts';
import { messageForAuthError } from '../src/auth-errors.ts';

interface SentRequest {
  url: string;
  method: string;
  contentType: string | null;
  body: string;
}

/** A fake fetch that records what the client sends and answers with one fixed response. */
function fakeFetch(status: number, body: unknown) {
  const sent: SentRequest[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    sent.push({
      url: request.url,
      method: request.method,
      contentType: request.headers.get('content-type'),
      body: await request.text(),
    });
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return { fetchImpl, sent };
}

describe('authClient', () => {
  it('signs in with a JSON POST to /api/auth/sign-in/email', async () => {
    const { fetchImpl, sent } = fakeFetch(200, { redirect: false, token: 't', user: {} });
    const client = makeAuthClient({ fetchImpl, baseURL: 'http://localhost:5173' });

    await client.signIn.email({ email: 'sam@example.com', password: 'correct horse battery' });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      url: 'http://localhost:5173/api/auth/sign-in/email',
      method: 'POST',
      contentType: 'application/json',
    });
    expect(JSON.parse(sent[0]!.body)).toEqual({ email: 'sam@example.com', password: 'correct horse battery' });
  });

  it('returns an error response with the code messageForAuthError expects', async () => {
    const { fetchImpl } = fakeFetch(401, { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' });
    const client = makeAuthClient({ fetchImpl, baseURL: 'http://localhost:5173' });

    const { error } = await client.signIn.email({ email: 'sam@example.com', password: 'wrong password!' });

    expect(error).toMatchObject({ status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' });
    expect(messageForAuthError(error!)).toBe('The email or password is wrong.');
  });
});
