import Fastify, { type FastifyServerOptions } from 'fastify';
import { z } from 'zod';
import { healthResponseSchema, type HealthResponse } from '@extracker/shared';

export interface AppDependencies {
  /** Resolves when the database is reachable; rejects otherwise. */
  checkDatabase: () => Promise<void>;
}

// The shared Zod schema also defines how Fastify serializes the response.
const { $schema: _draft, ...healthJsonSchema } = z.toJSONSchema(healthResponseSchema, { target: 'draft-7' });

export function buildApp(dependencies: AppDependencies, options: FastifyServerOptions = {}) {
  const app = Fastify(options);

  app.get(
    '/api/health',
    { schema: { response: { 200: healthJsonSchema, 503: healthJsonSchema } } },
    async (request, reply) => {
      const databaseUp = await dependencies.checkDatabase().then(
        () => true,
        (error: unknown) => {
          request.log.warn({ err: error }, 'database check failed');
          return false;
        },
      );
      const body: HealthResponse = databaseUp
        ? { status: 'ok', database: 'up' }
        : { status: 'error', database: 'down' };
      return reply.code(databaseUp ? 200 : 503).send(body);
    },
  );

  return app;
}
