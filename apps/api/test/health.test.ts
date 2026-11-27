import { afterEach, describe, expect, it } from 'vitest';
import { healthResponseSchema } from '@extracker/shared';
import { buildApp } from '../src/app.ts';

describe('GET /health', () => {
  let app: ReturnType<typeof buildApp> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('returns 200 when the database answers', async () => {
    app = buildApp({ checkDatabase: async () => {} });
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toEqual({ status: 'ok', database: 'up' });
  });

  it('returns 503 when the database check fails', async () => {
    app = buildApp({
      checkDatabase: async () => {
        throw new Error('connection refused');
      },
    });
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(503);
    expect(healthResponseSchema.parse(response.json())).toEqual({ status: 'error', database: 'down' });
  });
});
