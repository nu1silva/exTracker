import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@extracker/shared';
import type { Config } from './config.ts';
import type { Database } from './db/client.ts';
import * as schema from './db/schema.ts';

export type AuthConfig = Pick<
  Config,
  'APP_URL' | 'AUTH_SECRET' | 'AUTH_SIGNUP_ENABLED' | 'DEFAULT_CURRENCY' | 'DEFAULT_LOCALE' | 'LOG_LEVEL'
>;

export interface CreateAuthOptions {
  /** The server and the reset command pass the Drizzle adapter. Tests pass the memory adapter. */
  database: BetterAuthOptions['database'];
  config: AuthConfig;
}

// Better Auth has its own logger with fewer levels than pino.
const betterAuthLogLevel = {
  fatal: 'error',
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',
  trace: 'debug',
  silent: 'error',
} as const;

export function createAuth({ database, config }: CreateAuthOptions) {
  return betterAuth({
    // Public origin of the web app, and so the only trusted origin.
    baseURL: config.APP_URL,
    // Better Auth's default, written out because the proxies pass /api through unchanged for it.
    basePath: '/api/auth',
    secret: config.AUTH_SECRET,
    database,
    emailAndPassword: {
      enabled: true,
      disableSignUp: !config.AUTH_SIGNUP_ENABLED,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      autoSignIn: true,
    },
    user: {
      // "user" is a reserved word in Postgres.
      modelName: 'users',
      additionalFields: {
        // input: false, so sign-up cannot set them. Every new user starts with the server's defaults.
        baseCurrency: { type: 'string', required: true, input: false, defaultValue: config.DEFAULT_CURRENCY },
        locale: { type: 'string', required: true, input: false, defaultValue: config.DEFAULT_LOCALE },
      },
    },
    session: { modelName: 'sessions' },
    // Better Auth's "account" is a sign-in method. The name "accounts" is kept for money accounts.
    account: { modelName: 'auth_accounts' },
    verification: { modelName: 'verifications' },
    advanced: {
      database: { generateId: 'uuid' },
      cookiePrefix: 'extracker',
      // nginx sets X-Real-IP to the connecting address. X-Forwarded-For can be forged by the client.
      ipAddress: { ipAddressHeaders: ['x-real-ip'] },
      // Better Auth turns its origin check off when it detects a test run. Keep it on, so the
      // tests check what production does.
      disableOriginCheck: false,
    },
    logger: { level: betterAuthLogLevel[config.LOG_LEVEL], disabled: config.LOG_LEVEL === 'silent' },
    // Off by default. Written out so nobody has to check.
    telemetry: { enabled: false },
  });
}

/** Better Auth on Postgres, for the server and the reset command. */
export function createDatabaseAuth(database: Database, config: AuthConfig) {
  return createAuth({
    // With transactions, sign-up writes the user and their password together or not at all.
    database: drizzleAdapter(database.db, { provider: 'pg', schema, transaction: true }),
    config,
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session'];
