import type { FastifyReply, FastifyRequest } from 'fastify';
import { APIError } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { ApiError } from '@extracker/shared';
import type { Auth, AuthSession } from './auth.ts';

declare module 'fastify' {
  interface FastifyRequest {
    /** The signed-in user. Set by requireSession; null on routes that do not use it. */
    user: AuthSession['user'] | null;
    /** The current session. Set by requireSession; null on routes that do not use it. */
    session: AuthSession['session'] | null;
  }
}

const readOnlyMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

const invalidOrigin: ApiError = { code: 'INVALID_ORIGIN', message: 'Invalid origin' };
const unauthorized: ApiError = { code: 'UNAUTHORIZED', message: 'Sign in to continue.' };

/**
 * The pre-handler for every route that needs a signed-in user. buildApp exposes it as
 * app.requireSession.
 */
export function createRequireSession(auth: Auth) {
  return async function requireSession(request: FastifyRequest, reply: FastifyReply) {
    // Better Auth checks origins only on its own routes. Writes to ours need the same check,
    // or another site could send them with the user's cookie.
    if (!readOnlyMethods.has(request.method)) {
      const origin = request.headers.origin;
      if (!origin || !(await auth.$context).isTrustedOrigin(origin)) {
        return reply.code(403).send(invalidOrigin);
      }
    }

    let result: Awaited<ReturnType<typeof getSession>>;
    try {
      result = await getSession(auth, request);
    } catch (error) {
      // For example, the session was deleted while Better Auth was extending it.
      if (error instanceof APIError && error.statusCode === 401) return reply.code(401).send(unauthorized);
      throw error;
    }

    // Once a day Better Auth extends the session and sends a new cookie. Pass it on, or the
    // browser drops the cookie 7 days after sign-in however often the app is used. An expired
    // session also comes with a cookie that deletes it.
    const cookies = result.headers.getSetCookie();
    if (cookies.length > 0) reply.header('set-cookie', cookies);

    if (!result.response) return reply.code(401).send(unauthorized);
    request.user = result.response.user;
    request.session = result.response.session;
  };
}

function getSession(auth: Auth, request: FastifyRequest) {
  // Without returnHeaders, a server-side call drops the refreshed cookie.
  return auth.api.getSession({ headers: fromNodeHeaders(request.headers), returnHeaders: true });
}

/** The user that requireSession found. Throws if the route forgot to use requireSession. */
export function signedInUser(request: FastifyRequest): AuthSession['user'] {
  if (!request.user) throw new Error(`${request.method} ${request.url} needs requireSession before it`);
  return request.user;
}
