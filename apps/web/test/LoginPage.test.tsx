import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../src/api.ts';
import { LoginPage } from '../src/LoginPage.tsx';
import { meQueryKey } from '../src/me.ts';

const user = {
  id: '0b6e9f1c-3f3a-4f43-9d2c-6a1f6b2f9e10',
  name: 'Sam de Vries',
  email: 'sam@example.com',
  baseCurrency: 'EUR',
  locale: 'en-IE',
};

function renderWith(queryClient: QueryClient) {
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  it('sends a signed-in user on instead of showing the form', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(meQueryKey, user);
    // Navigate renders nothing on the server.
    expect(renderWith(queryClient)).toBe('');
  });

  it('shows the form once the session has ended, even though the old user is still cached', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(meQueryKey, user);
    // What TanStack Query holds after a refetch answers 401: the error, and the previous data.
    queryClient.getQueryCache().find({ queryKey: meQueryKey })!.setState({ status: 'error', error: new UnauthorizedError() });
    expect(renderWith(queryClient)).toContain('<form');
  });
});
