import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { messageForAuthError, networkErrorMessage, type AuthErrorLike } from './auth-errors.ts';
import { Logo } from './Logo.tsx';
import { meQuery, meQueryKey } from './me.ts';
import { safeNextPath } from './redirect.ts';

/** The centred card that the sign-in and sign-up pages share. */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <title>{`${title} · exTracker`}</title>
      <div className="auth-card card">
        <div className="brand">
          <Logo />
        </div>
        <h1 className="h1">{title}</h1>
        {children}
      </div>
    </main>
  );
}

/** An empty live region is kept in the page, so screen readers announce the error when it appears. */
export function FormError({ message }: { message: string | null }) {
  return (
    <p className="form-error" role="alert">
      {message ?? ''}
    </p>
  );
}

/**
 * State and steps that sign-in and sign-up share: send a signed-in user on, and after a
 * successful request, forget the old "nobody is signed in" answer and go to ?next=.
 */
export function useAuthForm() {
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useQuery(meQuery);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(request: () => Promise<{ error: AuthErrorLike | null }>) {
    setPending(true);
    setError(null);
    let failure: string | null = null;
    try {
      const result = await request();
      if (result.error) failure = messageForAuthError(result.error);
    } catch {
      failure = networkErrorMessage;
    }
    if (failure) {
      setError(failure);
      setPending(false);
      return;
    }
    // Reset rather than invalidate, so the next page waits for the new answer instead of acting
    // on the old 401. The button stays disabled until the page changes.
    await queryClient.resetQueries({ queryKey: meQueryKey });
    await navigate(next, { replace: true });
  }

  // Someone who is already signed in has no business here. isSuccess, not data: after a 401 the
  // query still holds the previous user, and RequireUser would send them straight back here.
  const redirect = me.isSuccess ? <Navigate to={next} replace /> : null;
  return { error, setError, pending, submit, redirect };
}
