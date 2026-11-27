import { afterEach, describe, expect, it } from 'vitest';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { healthResponseSchema } from '@extracker/shared';
import { buildApp, type AppDependencies } from '../src/app.ts';
import { createAuth } from '../src/auth.ts';
import { testConfig } from './support.ts';

function buildHealthApp(checkDatabase: AppDependencies['checkDatabase']) {
  const config = testConfig();
  const auth = createAuth({ database: memoryAdapter({}), config });
  return buildApp({ checkDatabase, auth, config });
}

describe('GET /api/health', () => {
  let app: ReturnType<typeof buildApp> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('returns 200 when the database answers', async () => {
    app = buildHealthApp(async () => {});
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toEqual({ status: 'ok', database: 'up' });
  });

  it('returns 503 when the database check fails', async () => {
    app = buildHealthApp(async () => {
      throw new Error('connection refused');
    });
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(503);
    expect(healthResponseSchema.parse(response.json())).toEqual({ status: 'error', database: 'down' });
  });
});
