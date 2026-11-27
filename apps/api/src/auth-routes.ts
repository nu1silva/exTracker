import type { FastifyInstance } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import type { ApiError } from '@extracker/shared';
import type { Auth } from './auth.ts';

export interface AuthRoutesOptions {
  auth: Auth;
  /** Public origin of the web app. Request URLs are built from it, never from the Host header. */
  appUrl: string;
}

// They describe how this request reached us, not the body handed to Better Auth.
const hopByHopHeaders = ['connection', 'content-length', 'transfer-encoding'];

/** Hands every /api/auth/* request to Better Auth (sign-up, sign-in, sign-out, get-session). */
export async function authRoutes(app: FastifyInstance, { auth, appUrl }: AuthRoutesOptions) {
  // Better Auth reads the body itself, so pass the bytes on untouched. This also accepts an
  // empty POST, such as a sign-out sent with curl, which Fastify's JSON parser would refuse.
  // Fastify keeps these parsers inside this plugin; other routes still parse JSON as usual.
  app.removeAllContentTypeParsers();
  app.addContentTypeParser('*', { parseAs: 'buffer' }, (_request, body, done) => done(null, body));

  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      const headers = fromNodeHeaders(request.headers);
      for (const name of hopByHopHeaders) headers.delete(name);
      const body = Buffer.isBuffer(request.body) && request.body.length > 0 ? request.body : undefined;

      let response: Response;
      try {
        response = await auth.handler(
          new Request(new URL(request.url, appUrl), { method: request.method, headers, body: body ?? null }),
        );
      } catch (error) {
        // Never log the request body: it holds the password.
        request.log.error({ err: error }, 'Better Auth failed');
        const failure: ApiError = { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong. Try again.' };
        return reply.code(500).send(failure);
      }

      reply.code(response.status);
      response.headers.forEach((value, name) => {
        if (name !== 'set-cookie' && !hopByHopHeaders.includes(name)) reply.header(name, value);
      });
      // Sign-in can set more than one cookie. Headers.forEach would join them into one line.
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) reply.header('set-cookie', cookies);
      return reply.send(response.body ? Buffer.from(await response.arrayBuffer()) : null);
    },
  });
}
