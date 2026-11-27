const placeholderOrigin = 'http://placeholder.invalid';

/**
 * The path to go to after signing in, taken from ?next=. Anything that is not a path on this
 * site gives "/", so a link cannot send people to another site. "//evil.example" and
 * "/\evil.example" are addresses on other sites, and the URL parser treats them that way.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/')) return '/';
  let url: URL;
  try {
    url = new URL(value, placeholderOrigin);
  } catch {
    return '/';
  }
  if (url.origin !== placeholderOrigin) return '/';
  return `${url.pathname}${url.search}${url.hash}`;
}

/** The sign-in page, with a path to come back to afterwards. */
export function loginPath(next: string): string {
  // "/" is allowed in a query string. Leaving it readable keeps the address bar tidy.
  return `/login?next=${encodeURIComponent(next).replaceAll('%2F', '/')}`;
}
