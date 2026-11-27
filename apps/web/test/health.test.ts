import { describe, expect, it } from 'vitest';
import { fetchHealth } from '../src/health.ts';

const respond = (status: number, body: unknown) => async () =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('fetchHealth', () => {
  it('returns the parsed body of a healthy response', async () => {
    await expect(fetchHealth(undefined, respond(200, { status: 'ok', database: 'up' }))).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('treats 503 as an answer, not a failure', async () => {
    await expect(fetchHealth(undefined, respond(503, { status: 'error', database: 'down' }))).resolves.toEqual({
      status: 'error',
      database: 'down',
    });
  });

  it('rejects other HTTP errors', async () => {
    await expect(fetchHealth(undefined, respond(502, {}))).rejects.toThrow('HTTP 502');
  });

  it('rejects a body that does not match the shared schema', async () => {
    await expect(fetchHealth(undefined, respond(200, { status: 'fine' }))).rejects.toThrow();
  });
});
