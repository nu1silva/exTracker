import { apiErrorSchema, type ApiError } from '@extracker/shared';

/** The API answered 401: nobody is signed in, or the session has ended. */
export class UnauthorizedError extends Error {
  override name = 'UnauthorizedError';
  constructor() {
    super('Not signed in');
  }
}

/** The API answered with another error status. */
export class ApiRequestError extends Error {
  override name = 'ApiRequestError';
  readonly status: number;
  readonly body: ApiError | undefined;

  constructor(status: number, body: ApiError | undefined) {
    super(body?.message ?? `The API answered HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

interface Schema<T> {
  parse(data: unknown): T;
}

/** GETs an API path and parses the body with a shared schema. A 401 throws UnauthorizedError. */
export async function fetchJson<T>(
  path: string,
  schema: Schema<T>,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(path, { headers: { accept: 'application/json' }, signal: signal ?? null });
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) {
    const body = apiErrorSchema.safeParse(await response.json().catch(() => undefined));
    throw new ApiRequestError(response.status, body.success ? body.data : undefined);
  }
  return schema.parse(await response.json());
}
