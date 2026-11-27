import pg from 'pg';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

export function createDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString, max: 10, connectionTimeoutMillis: 3_000 });
  const db = drizzle({ client: pool, schema });

  return {
    db,
    pool,
    /** Resolves when Postgres answers a trivial query; rejects otherwise. */
    async check(): Promise<void> {
      await db.execute(sql`select 1`);
    },
    close: () => pool.end(),
  };
}

export type Database = ReturnType<typeof createDatabase>;
