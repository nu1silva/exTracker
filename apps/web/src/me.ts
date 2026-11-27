import { queryOptions } from '@tanstack/react-query';
import { meResponseSchema, type MeResponse } from '@extracker/shared';
import { UnauthorizedError, fetchJson } from './api.ts';

export const meQueryKey = ['me'] as const;

/** Asks the API who is signed in. Throws UnauthorizedError when nobody is. */
export function fetchMe(signal?: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<MeResponse> {
  return fetchJson('/api/me', meResponseSchema, signal, fetchImpl);
}

export const meQuery = queryOptions({
  queryKey: meQueryKey,
  queryFn: ({ signal }) => fetchMe(signal),
  // A 401 is an answer, not a failure: never retry it. Retry other errors once.
  retry: (failureCount, error) => !(error instanceof UnauthorizedError) && failureCount < 1,
});
