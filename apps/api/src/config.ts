import { z } from 'zod';
import { currencyCodeSchema, localeSchema } from '@extracker/shared';

const databaseUrlSchema = z.url({ protocol: /^postgres(ql)?$/, error: 'Set DATABASE_URL to a postgres:// URL' });

// Better Auth's base URL and its only trusted origin. The app is served at the root, so a path
// would build wrong links. A trailing slash is harmless and is dropped.
const appUrlSchema = z
  .url({ protocol: /^https?$/, error: 'Set APP_URL to the http:// or https:// address of the web app' })
  .refine((value) => {
    const url = new URL(value);
    return url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
  }, 'APP_URL must be an origin only, such as https://money.example.com, with no path')
  .transform((value) => new URL(value).origin);

const envSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  API_HOST: z.string().min(1).default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  APP_URL: appUrlSchema,
  AUTH_SECRET: z
    .string({ error: 'Set AUTH_SECRET, for example to the output of: openssl rand -base64 32' })
    .min(32, 'AUTH_SECRET must be at least 32 characters, for example the output of: openssl rand -base64 32'),
  // Closed by default, so strangers cannot create accounts on a server reachable from the internet.
  AUTH_SIGNUP_ENABLED: z.stringbool().default(false),
  // Every new user starts with these. Users will change their own in Settings, in a later phase.
  DEFAULT_CURRENCY: currencyCodeSchema.default('EUR'),
  DEFAULT_LOCALE: localeSchema.default('en-IE'),
});

const migrateEnvSchema = envSchema.pick({ DATABASE_URL: true });

export type Config = z.infer<typeof envSchema>;
export type MigrateConfig = z.infer<typeof migrateEnvSchema>;

function parseEnv<T extends z.ZodType>(schema: T, env: NodeJS.ProcessEnv): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return parseEnv(envSchema, env);
}

/** Only what migrations need, so the migrate service never sees the auth secret. */
export function loadMigrateConfig(env: NodeJS.ProcessEnv = process.env): MigrateConfig {
  return parseEnv(migrateEnvSchema, env);
}
