import { z } from 'zod';
import { currencyCodeSchema, localeSchema } from '@extracker/shared';

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: 'Set DATABASE_URL to a postgres:// URL' }),
  API_HOST: z.string().min(1).default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  // Defaults for new users. Not used until users and money exist.
  DEFAULT_CURRENCY: currencyCodeSchema.default('EUR'),
  DEFAULT_LOCALE: localeSchema.default('en-IE'),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
