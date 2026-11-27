import { memoryAdapter } from 'better-auth/adapters/memory';
import type { LightMyRequestResponse } from 'fastify';
import { buildApp } from '../src/app.ts';
import { createAuth } from '../src/auth.ts';
import { loadConfig, type Config } from '../src/config.ts';

export const APP_URL = 'http://localhost:8080';
export const PASSWORD = 'correct horse battery';

export function testConfig(env: Record<string, string> = {}): Config {
  return loadConfig({
    DATABASE_URL: 'postgres://test@localhost/test',
    APP_URL,
    AUTH_SECRET: 'test-secret-that-is-long-enough-0123456789abcdef',
    LOG_LEVEL: 'silent',
    ...env,
  });
}

/** The real app with Better Auth on the memory adapter, so no test needs Postgres. */
export function buildTestApp(env: Record<string, string> = {}) {
  const config = testConfig({ AUTH_SIGNUP_ENABLED: 'true', ...env });
  // The memory adapter keeps one array per table, named like the models in src/auth.ts.
  const auth = createAuth({
    database: memoryAdapter({ users: [], sessions: [], auth_accounts: [], verifications: [] }),
    config,
  });
  const app = buildApp({ checkDatabase: async () => {}, auth, config });
  return { app, auth, config };
}

type App = ReturnType<typeof buildApp>;

/** The Cookie header a browser would send back after this response. */
export function cookiesFrom(response: LightMyRequestResponse): string {
  return setCookies(response)
    .map((line) => line.split(';')[0])
    .join('; ');
}

export function setCookies(response: LightMyRequestResponse): string[] {
  const header = response.headers['set-cookie'];
  if (header === undefined) return [];
  return Array.isArray(header) ? header : [header];
}

/** The session cookie line from a response, if it set one. */
export function sessionCookieLine(response: LightMyRequestResponse): string | undefined {
  return setCookies(response).find((line) => line.startsWith('extracker.session_token='));
}

/** Sends a JSON POST the way better-auth/client does: same-origin, with a JSON body. */
export function postJson(app: App, url: string, body: unknown, headers: Record<string, string> = {}) {
  return app.inject({
    method: 'POST',
    url,
    headers: { origin: APP_URL, 'content-type': 'application/json', ...headers },
    payload: JSON.stringify(body),
  });
}

export async function signUp(app: App, email = 'sam@example.com', name = 'Sam de Vries') {
  const response = await postJson(app, '/api/auth/sign-up/email', { name, email, password: PASSWORD });
  if (response.statusCode !== 200) throw new Error(`sign-up failed: ${response.statusCode} ${response.body}`);
  return cookiesFrom(response);
}

export function getMe(app: App, cookie?: string) {
  return app.inject({ method: 'GET', url: '/api/me', headers: cookie ? { cookie } : {} });
}
