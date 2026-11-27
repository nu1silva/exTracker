import { healthResponseSchema, type HealthResponse } from '@extracker/shared';

export const healthQueryKey = ['health'] as const;

/** Calls the API's health check. A 503 still carries a health body, so it is not an error. */
export async function fetchHealth(signal?: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<HealthResponse> {
  const response = await fetchImpl('/api/health', { headers: { accept: 'application/json' }, signal: signal ?? null });
  if (!response.ok && response.status !== 503) {
    throw new Error(`Health check failed with HTTP ${response.status}`);
  }
  return healthResponseSchema.parse(await response.json());
}
