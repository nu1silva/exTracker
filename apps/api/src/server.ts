import { buildApp } from './app.ts';
import { createDatabaseAuth } from './auth.ts';
import { loadConfig } from './config.ts';
import { createDatabase } from './db/client.ts';

const config = loadConfig();
const database = createDatabase(config.DATABASE_URL);
const auth = createDatabaseAuth(database, config);
const app = buildApp({ checkDatabase: database.check, auth, config }, { logger: { level: config.LOG_LEVEL } });

database.pool.on('error', (error) => app.log.error({ err: error }, 'idle database connection failed'));
app.addHook('onClose', async () => {
  await database.close();
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, 'shutting down');
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error({ err: error }, 'shutdown failed');
        process.exit(1);
      },
    );
  });
}

try {
  // Better Auth sets itself up in the background. Wait for it, so a bad option fails here.
  await auth.$context;
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.fatal({ err: error }, 'API failed to start');
  await database.close();
  process.exit(1);
}
