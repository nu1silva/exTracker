import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadMigrateConfig } from './config.ts';
import { createDatabase } from './db/client.ts';

// Applies the SQL files in apps/api/drizzle that have not run yet, then exits.
const { DATABASE_URL } = loadMigrateConfig();
const database = createDatabase(DATABASE_URL);
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

try {
  await migrate(database.db, { migrationsFolder });
  console.log(`Migrations applied from ${migrationsFolder}`);
} catch (error) {
  console.error('Migrations failed:', error);
  process.exitCode = 1;
} finally {
  await database.close();
}
