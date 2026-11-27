import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppShell, initials } from '../src/AppShell.tsx';
import { DashboardView } from '../src/DashboardPage.tsx';
import { LoginView, type LoginViewProps } from '../src/LoginPage.tsx';
import { SignupView, type SignupViewProps } from '../src/SignupPage.tsx';

const user = {
  id: '0b6e9f1c-3f3a-4f43-9d2c-6a1f6b2f9e10',
  name: 'Sam de Vries',
  email: 'sam@example.com',
  baseCurrency: 'EUR',
  locale: 'en-IE',
};

function render(node: ReactNode) {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const loginProps: LoginViewProps = { signUpEnabled: false, error: null, pending: false, onSubmit: () => {} };
const signupProps: SignupViewProps = {
  signUpEnabled: true,
  optionsLoading: false,
  error: null,
  pending: false,
  onSubmit: () => {},
};

describe('LoginView', () => {
  it('has labelled email and password fields with the right autocomplete values', () => {
    const html = render(<LoginView {...loginProps} />);
    expect(html).toMatch(/<label class="label">Email<input[^>]*type="email"[^>]*autoComplete="email"/);
    expect(html).toMatch(/<label class="label">Password<input[^>]*type="password"[^>]*autoComplete="current-password"/);
  });

  it('shows "Create an account" only when sign-up is open', () => {
    expect(render(<LoginView {...loginProps} signUpEnabled />)).toContain('Create an account');
    expect(render(<LoginView {...loginProps} signUpEnabled={false} />)).not.toContain('Create an account');
  });

  it('hides "Create an account" while the options load or when they failed', () => {
    expect(render(<LoginView {...loginProps} signUpEnabled={undefined} />)).not.toContain('Create an account');
  });

  it('shows an error in the alert region', () => {
    expect(render(<LoginView {...loginProps} error="The email or password is wrong." />)).toContain(
      '<p class="form-error" role="alert">The email or password is wrong.</p>',
    );
  });
});

describe('SignupView', () => {
  it('has labelled fields with the right autocomplete values', () => {
    const html = render(<SignupView {...signupProps} />);
    expect(html).toMatch(/<label class="label">Name<input[^>]*autoComplete="name"/);
    expect(html).toMatch(/<label class="label">Email<input[^>]*type="email"[^>]*autoComplete="email"/);
    expect(html).toMatch(/<label class="label">Password<input[^>]*type="password"[^>]*autoComplete="new-password"/);
  });

  it('shows an error in the alert region', () => {
    expect(render(<SignupView {...signupProps} error="Sign-up is closed on this server." />)).toContain(
      '<p class="form-error" role="alert">Sign-up is closed on this server.</p>',
    );
  });

  it('shows the closed message instead of the form when sign-up is closed', () => {
    const html = render(<SignupView {...signupProps} signUpEnabled={false} />);
    expect(html).toContain('Sign-up is closed on this server');
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('<form');
  });

  it('shows the form when the options failed to load, since the server still decides', () => {
    expect(render(<SignupView {...signupProps} signUpEnabled={undefined} />)).toContain('<form');
  });
});

describe('AppShell', () => {
  it("shows the user's initials and a Sign out control", () => {
    const html = render(
      <AppShell user={user} onSignOut={() => {}} signingOut={false} signOutError={null}>
        <p>page</p>
      </AppShell>,
    );
    expect(html).toContain('>SV</button>');
    expect(html).toContain('>Sign out</button>');
    expect(html).toContain('sam@example.com');
    // The only tab so far, marked as the current page.
    expect(html).toMatch(/<nav class="tabs" aria-label="Main"><a aria-current="page"[^>]*>Dashboard<\/a><\/nav>/);
  });

  it.each([
    ['Sam de Vries', 'SV'],
    ['sam', 'S'],
    ['  ', 'X'],
  ])('makes initials from %j', (name, expected) => {
    expect(initials(name, 'x@example.com')).toBe(expected);
  });
});

describe('DashboardView', () => {
  it("shows the user's name and the system status card", () => {
    const html = render(<DashboardView user={user} />);
    expect(html).toContain('Welcome, Sam de Vries');
    expect(html).toContain('System status');
  });
});
