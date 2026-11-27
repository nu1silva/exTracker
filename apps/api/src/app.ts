import Fastify, { type FastifyServerOptions } from 'fastify';
import { z } from 'zod';
import {
  apiErrorSchema,
  authOptionsResponseSchema,
  healthResponseSchema,
  meResponseSchema,
  type ApiError,
  type AuthOptionsResponse,
  type HealthResponse,
  type MeResponse,
} from '@extracker/shared';
import type { Auth } from './auth.ts';
import { authRoutes } from './auth-routes.ts';
import type { Config } from './config.ts';
import { createRequireSession, signedInUser } from './session.ts';

export interface AppDependencies {
  /** Resolves when the database is reachable; rejects otherwise. */
  checkDatabase: () => Promise<void>;
  auth: Auth;
  config: Pick<Config, 'APP_URL' | 'AUTH_SIGNUP_ENABLED'>;
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Pre-handler for routes that need a signed-in user. See src/session.ts. */
    requireSession: ReturnType<typeof createRequireSession>;
  }
}

// The shared Zod schemas also define how Fastify serializes each response.
function toResponseSchema(schema: z.ZodType) {
  const { $schema: _draft, ...jsonSchema } = z.toJSONSchema(schema, { target: 'draft-7' });
  return jsonSchema;
}

const healthJsonSchema = toResponseSchema(healthResponseSchema);
const errorJsonSchema = toResponseSchema(apiErrorSchema);

export function buildApp(dependencies: AppDependencies, options: FastifyServerOptions = {}) {
  const { auth, config } = dependencies;
  const app = Fastify(options);

  app.decorate('requireSession', createRequireSession(auth));
  app.decorateRequest('user', null);
  app.decorateRequest('session', null);

  // Errors from our routes have the same shape as Better Auth's, so the web app reads them one way.
  app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, request, reply) => {
    const clientError = error.statusCode !== undefined && error.statusCode >= 400 && error.statusCode < 500;
    if (!clientError) request.log.error({ err: error }, 'request failed');
    const body: ApiError = clientError
      ? { code: error.code ?? 'BAD_REQUEST', message: error.message }
      : { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong. Try again.' };
    return reply.code(clientError ? (error.statusCode ?? 400) : 500).send(body);
  });
  app.setNotFoundHandler((request, reply) => {
    const body: ApiError = { code: 'NOT_FOUND', message: `No route for ${request.method} ${request.url}` };
    return reply.code(404).send(body);
  });

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

  // Public, so the sign-in page knows whether to offer sign-up. Better Auth enforces the setting
  // itself. Not under /api/auth/, because the Better Auth route there catches every path.
  app.get(
    '/api/auth-options',
    { schema: { response: { 200: toResponseSchema(authOptionsResponseSchema) } } },
    async (): Promise<AuthOptionsResponse> => ({ signUpEnabled: config.AUTH_SIGNUP_ENABLED }),
  );

  app.get(
    '/api/me',
    {
      preHandler: app.requireSession,
      schema: { response: { 200: toResponseSchema(meResponseSchema), 401: errorJsonSchema, 403: errorJsonSchema } },
    },
    async (request): Promise<MeResponse> => {
      const user = signedInUser(request);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        baseCurrency: user.baseCurrency,
        locale: user.locale,
      };
    },
  );

  app.register(authRoutes, { auth, appUrl: config.APP_URL });

  return app;
}
