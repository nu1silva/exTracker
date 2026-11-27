import { renderToStaticMarkup } from 'react-dom/server';
import { Navigate } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ApiRequestError, UnauthorizedError } from '../src/api.ts';
import { AuthGate, type AuthGateProps } from '../src/AuthGate.tsx';

const user = {
  id: '0b6e9f1c-3f3a-4f43-9d2c-6a1f6b2f9e10',
  name: 'Sam de Vries',
  email: 'sam@example.com',
  baseCurrency: 'EUR',
  locale: 'en-IE',
};

function gate(me: Partial<AuthGateProps['me']>) {
  const props: AuthGateProps = {
    me: { data: undefined, error: null, isFetching: false, ...me },
    currentPath: '/records?x=1',
    onRetry: () => {},
    children: (signedIn) => <p>Page for {signedIn.name}</p>,
  };
  // AuthGate has no hooks, so it can be called directly to see what it returns.
  return AuthGate(props);
}

describe('AuthGate', () => {
  it('shows a loading line while waiting', () => {
    expect(renderToStaticMarkup(gate({ isFetching: true }))).toContain('Loading exTracker');
  });

  it('redirects to sign-in, with the current path, on UnauthorizedError', () => {
    const element = gate({ error: new UnauthorizedError() });
    expect(element).toMatchObject({ type: Navigate, props: { to: '/login?next=/records%3Fx%3D1', replace: true } });
  });

  it('redirects on UnauthorizedError even with a user from before', () => {
    expect(gate({ data: user, error: new UnauthorizedError() })).toMatchObject({ type: Navigate });
  });

  it('shows "Cannot reach exTracker" and Retry for any other error, without redirecting', () => {
    const element = gate({ error: new ApiRequestError(502, undefined) });
    expect(element).not.toMatchObject({ type: Navigate });
    const html = renderToStaticMarkup(element);
    expect(html).toContain('Cannot reach exTracker');
    expect(html).toContain('>Retry</button>');
  });

  it('renders the page for a user', () => {
    expect(renderToStaticMarkup(gate({ data: user }))).toBe('<p>Page for Sam de Vries</p>');
  });

  it('keeps showing the page when a background refresh fails', () => {
    expect(renderToStaticMarkup(gate({ data: user, error: new ApiRequestError(502, undefined) }))).toContain(
      'Page for Sam de Vries',
    );
  });
});
