import { useQuery } from '@tanstack/react-query';
import { fetchHealth, healthQueryKey } from './health.ts';
import { HealthStatus } from './HealthStatus.tsx';

export function App() {
  const health = useQuery({
    queryKey: healthQueryKey,
    queryFn: ({ signal }) => fetchHealth(signal),
    refetchInterval: 15_000,
  });

  return (
    <main>
      <h1>exTracker</h1>
      <h2>System health</h2>
      <HealthStatus isPending={health.isPending} error={health.error} data={health.data} />
    </main>
  );
}
