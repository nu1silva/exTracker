import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import type { MeResponse } from '@extracker/shared';
import { Logo } from './Logo.tsx';

interface AppShellProps {
  user: MeResponse;
  onSignOut: () => void;
  signingOut: boolean;
  signOutError: string | null;
  children: ReactNode;
}

/** "Sam de Vries" gives "SV": the first letters of the first and last words. */
export function initials(name: string, email: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  const letters = [first, last].map((word) => (word ? Array.from(word)[0] : '')).join('');
  return (letters || Array.from(email)[0] || '?').toUpperCase();
}

/** The header from the v1 designs, with only the tabs that lead somewhere. */
export function AppShell({ user, onSignOut, signingOut, signOutError, children }: AppShellProps) {
  return (
    <>
      <div className="app-header">
        <header className="topbar">
          <Link to="/" className="brand" aria-label="exTracker, go to Dashboard">
            <Logo />
          </Link>
          <nav className="tabs" aria-label="Main">
            <NavLink to="/" end className="tab">
              Dashboard
            </NavLink>
          </nav>
          <div className="account">
            <button type="button" className="avatar" popoverTarget="account-menu" aria-label={`${user.name}, account`}>
              {initials(user.name, user.email)}
            </button>
            <div id="account-menu" className="account-menu" popover="auto">
              <p className="account-menu-who">
                <span className="account-menu-name clip">{user.name}</span>
                <span className="t3 clip">{user.email}</span>
              </p>
              <button type="button" className="btn" onClick={onSignOut} disabled={signingOut}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
              <p className="form-error" role="alert">
                {signOutError ?? ''}
              </p>
            </div>
          </div>
        </header>
      </div>
      {children}
    </>
  );
}
