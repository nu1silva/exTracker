import type { HealthResponse } from '@extracker/shared';

interface HealthStatusProps {
  isPending: boolean;
  error: Error | null;
  data: HealthResponse | undefined;
}

export function HealthStatus({ isPending, error, data }: HealthStatusProps) {
  if (isPending) {
    return <p role="status">Checking the API…</p>;
  }
  if (error || !data) {
    return <p role="alert">Cannot reach the API: {error?.message ?? 'no response'}</p>;
  }
  return (
    <dl aria-live="polite">
      <dt>API</dt>
      <dd>{data.status}</dd>
      <dt>Database</dt>
      <dd>{data.database}</dd>
    </dl>
  );
}
