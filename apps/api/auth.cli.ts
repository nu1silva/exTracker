import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuth } from './src/auth.ts';
import { loadConfig } from './src/config.ts';
import * as schema from './src/db/schema.ts';

// Read only by the Better Auth CLI (pnpm auth:generate, pnpm auth:check), so it can see the auth
// options. Nothing connects to a database here, and this file is not built or shipped.
const config = loadConfig({
  DATABASE_URL: 'postgres://placeholder@localhost/placeholder',
  APP_URL: 'http://localhost:8080',
  AUTH_SECRET: 'placeholder-for-the-cli-only-0123456789abcdefghijklmnop',
  LOG_LEVEL: 'warn',
});

export const auth = createAuth({
  database: drizzleAdapter({}, { provider: 'pg', schema }),
  config,
});
