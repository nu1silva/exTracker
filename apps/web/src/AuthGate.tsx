import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import type { MeResponse } from '@extracker/shared';
import { UnauthorizedError } from './api.ts';
import { loginPath } from './redirect.ts';

export interface AuthGateProps {
  /** State of the me query. */
  me: { data: MeResponse | undefined; error: Error | null; isFetching: boolean };
  /** Where to come back to after signing in. */
  currentPath: string;
  onRetry: () => void;
  children: (user: MeResponse) => ReactNode;
}

/** Shows the page to a signed-in user, and sends everyone else to sign in. Has no hooks, so tests can call it. */
export function AuthGate({ me, currentPath, onRetry, children }: AuthGateProps) {
  // Checked first: a session that ended in another tab or by a password reset ends here too.
  if (me.error instanceof UnauthorizedError) {
    return <Navigate to={loginPath(currentPath)} replace />;
  }
  // A failed background refresh keeps showing the page with the user we already have.
  if (me.data) return children(me.data);
  if (me.error) {
    // Not a reason to sign in again: the API or the network is down.
    return (
      <main className="gate">
        <div className="gate-box" role="alert">
          <h1 className="h2">Cannot reach exTracker</h1>
          <p className="t2">The server did not answer. Check your connection, or try again in a moment.</p>
          <button type="button" className="btn" onClick={onRetry} disabled={me.isFetching}>
            {me.isFetching ? 'Trying again…' : 'Retry'}
          </button>
        </div>
      </main>
    );
  }
  return (
    <main className="gate">
      <p role="status" className="t2">
        Loading exTracker…
      </p>
    </main>
  );
}
