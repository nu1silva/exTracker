import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { signInInputSchema } from '@extracker/shared';
import { authClient } from './auth-client.ts';
import { authOptionsQuery } from './auth-options.ts';
import { AuthCard, FormError, useAuthForm } from './auth-page.tsx';

export function LoginPage() {
  const options = useQuery(authOptionsQuery);
  const form = useAuthForm();

  function signIn(fields: { email: string; password: string }) {
    const input = signInInputSchema.safeParse(fields);
    if (!input.success) {
      form.setError(input.error.issues[0]?.message ?? 'Check the email and password.');
      return;
    }
    void form.submit(() => authClient.signIn.email(input.data));
  }

  return (
    form.redirect ?? (
      <LoginView
        signUpEnabled={options.data?.signUpEnabled}
        error={form.error}
        pending={form.pending}
        onSubmit={signIn}
      />
    )
  );
}

export interface LoginViewProps {
  /** Undefined while the options load, or when they failed to: the link stays hidden then. */
  signUpEnabled: boolean | undefined;
  error: string | null;
  pending: boolean;
  onSubmit: (fields: { email: string; password: string }) => void;
}

export function LoginView({ signUpEnabled, error, pending, onSubmit }: LoginViewProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({ email: String(data.get('email') ?? ''), password: String(data.get('password') ?? '') });
  }

  return (
    <AuthCard title="Sign in">
      {/* noValidate: the shared schema checks the fields, and its messages go in one place. */}
      <form onSubmit={handleSubmit} noValidate>
        <FormError message={error} />
        <label className="label">
          Email
          <input className="field" type="email" name="email" autoComplete="email" required />
        </label>
        <label className="label">
          Password
          <input className="field" type="password" name="password" autoComplete="current-password" required />
        </label>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {signUpEnabled === true && (
        <p className="auth-switch">
          New here?{' '}
          <Link to="/signup" className="text-link">
            Create an account
          </Link>
        </p>
      )}
    </AuthCard>
  );
}
