import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, signUpInputSchema } from '@extracker/shared';
import { authClient } from './auth-client.ts';
import { authOptionsQuery } from './auth-options.ts';
import { AuthCard, FormError, useAuthForm } from './auth-page.tsx';

interface SignupFields {
  name: string;
  email: string;
  password: string;
}

export function SignupPage() {
  const options = useQuery(authOptionsQuery);
  const form = useAuthForm();

  function signUp(fields: SignupFields) {
    const input = signUpInputSchema.safeParse(fields);
    if (!input.success) {
      form.setError(input.error.issues[0]?.message ?? 'Check the fields.');
      return;
    }
    // Better Auth signs the new user in, so what follows is the same as signing in.
    void form.submit(() => authClient.signUp.email(input.data));
  }

  return (
    form.redirect ?? (
      <SignupView
        signUpEnabled={options.data?.signUpEnabled}
        optionsLoading={options.isPending}
        error={form.error}
        pending={form.pending}
        onSubmit={signUp}
      />
    )
  );
}

export interface SignupViewProps {
  /** Undefined while the options load, or when they failed to. */
  signUpEnabled: boolean | undefined;
  optionsLoading: boolean;
  error: string | null;
  pending: boolean;
  onSubmit: (fields: SignupFields) => void;
}

export function SignupView({ signUpEnabled, optionsLoading, error, pending, onSubmit }: SignupViewProps) {
  if (signUpEnabled === false) {
    return (
      <AuthCard title="Sign-up is closed">
        <p className="t2">
          Sign-up is closed on this server. The person who runs this exTracker can open it, or create an
          account for you.
        </p>
        <p className="auth-switch">
          Have an account?{' '}
          <Link to="/login" className="text-link">
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }
  if (optionsLoading) {
    return (
      <AuthCard title="Create your account">
        <p role="status" className="t2">
          Loading…
        </p>
      </AuthCard>
    );
  }

  // If the options failed to load, the form is still shown. The server refuses sign-up if it is closed.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
    });
  }

  return (
    <AuthCard title="Create your account">
      <form onSubmit={handleSubmit} noValidate>
        <FormError message={error} />
        <label className="label">
          Name
          <input className="field" type="text" name="name" autoComplete="name" maxLength={100} required />
        </label>
        <label className="label">
          Email
          <input className="field" type="email" name="email" autoComplete="email" required />
        </label>
        <label className="label">
          Password
          <input
            className="field"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            aria-describedby="password-hint"
            required
          />
          <span id="password-hint" className="hint">
            At least {PASSWORD_MIN_LENGTH} characters. A few unrelated words make a strong one.
          </span>
        </label>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Creating your account…' : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">
        Have an account?{' '}
        <Link to="/login" className="text-link">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
