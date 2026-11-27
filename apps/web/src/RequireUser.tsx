import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import type { MeResponse } from '@extracker/shared';
import { AppShell } from './AppShell.tsx';
import { AuthGate } from './AuthGate.tsx';
import { authClient } from './auth-client.ts';
import { meQuery } from './me.ts';

/** Layout route for every page that needs a signed-in user. */
export function RequireUser() {
  const location = useLocation();
  const me = useQuery(meQuery);

  return (
    <AuthGate me={me} currentPath={`${location.pathname}${location.search}`} onRetry={() => void me.refetch()}>
      {(user) => <SignedIn user={user} />}
    </AuthGate>
  );
}

function SignedIn({ user }: { user: MeResponse }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function signOut() {
    setSigningOut(true);
    setSignOutError(null);
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message ?? 'Sign-out failed');
    } catch {
      setSignOutError('Could not sign out. Try again.');
      setSigningOut(false);
      return;
    }
    await navigate('/login', { replace: true });
    // No cached data from this user stays in memory for the next one.
    queryClient.clear();
  }

  return (
    <AppShell user={user} onSignOut={() => void signOut()} signingOut={signingOut} signOutError={signOutError}>
      <Outlet context={user} />
    </AppShell>
  );
}

/** The signed-in user, for pages inside RequireUser. */
export function useCurrentUser(): MeResponse {
  return useOutletContext<MeResponse>();
}
