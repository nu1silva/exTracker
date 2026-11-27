import { createAuthClient } from 'better-auth/client';

export interface AuthClientOptions {
  /** Tests pass a fake. */
  fetchImpl?: typeof fetch;
  /** Only needed outside a browser. In the browser, the client uses this origin and /api/auth. */
  baseURL?: string;
}

export function makeAuthClient({ fetchImpl = fetch, baseURL }: AuthClientOptions = {}) {
  return createAuthClient({ ...(baseURL ? { baseURL } : {}), fetchOptions: { customFetchImpl: fetchImpl } });
}

export type AuthClient = ReturnType<typeof makeAuthClient>;

export const authClient = makeAuthClient();
