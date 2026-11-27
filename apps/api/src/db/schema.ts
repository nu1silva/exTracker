// Every table, for drizzle-kit and the Drizzle client.

// Users, sessions and sign-in methods, owned by Better Auth. `pnpm auth:generate` rewrites
// auth-schema.ts from the options in src/auth.ts, so never edit that file by hand.
export * from './auth-schema.ts';
