import { defineConfig } from 'drizzle-kit';

// Used by `pnpm db:generate` to write SQL migrations from src/db/schema.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
