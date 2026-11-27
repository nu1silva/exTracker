import { queryOptions } from '@tanstack/react-query';
import { authOptionsResponseSchema, type AuthOptionsResponse } from '@extracker/shared';
import { fetchJson } from './api.ts';

export const authOptionsQueryKey = ['auth-options'] as const;

/** Asks the API whether sign-up is open. */
export function fetchAuthOptions(signal?: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<AuthOptionsResponse> {
  return fetchJson('/api/auth-options', authOptionsResponseSchema, signal, fetchImpl);
}

export const authOptionsQuery = queryOptions({
  queryKey: authOptionsQueryKey,
  queryFn: ({ signal }) => fetchAuthOptions(signal),
  // The setting changes only when the API restarts.
  staleTime: Infinity,
});
