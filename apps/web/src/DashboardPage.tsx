import { useQuery } from '@tanstack/react-query';
import type { MeResponse } from '@extracker/shared';
import { fetchHealth, healthQueryKey } from './health.ts';
import { HealthStatus } from './HealthStatus.tsx';
import { useCurrentUser } from './RequireUser.tsx';

export function DashboardPage() {
  return <DashboardView user={useCurrentUser()} />;
}

export function DashboardView({ user }: { user: MeResponse }) {
  return (
    <main className="page">
      <title>Dashboard · exTracker</title>
      <section className="welcome">
        <h1 className="h1">Welcome, {user.name}</h1>
        <p className="t2">Your balances and spending will appear here.</p>
      </section>
      <section className="card status-card" aria-labelledby="system-status">
        <h2 id="system-status" className="h2">
          System status
        </h2>
        <SystemStatus />
      </section>
    </main>
  );
}

function SystemStatus() {
  const health = useQuery({
    queryKey: healthQueryKey,
    queryFn: ({ signal }) => fetchHealth(signal),
    refetchInterval: 15_000,
  });
  return <HealthStatus isPending={health.isPending} error={health.error} data={health.data} />;
}
