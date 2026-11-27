# Phase 1.1: Sign-in and a blank dashboard

- **Status:** Draft
- **Date:** 2026-11-27
- **Branch:** `feature/login_dashboard`

## Goal

A person can create an account, sign in, stay signed in across reloads, and sign out. Signed in,
they see the app's header and a dashboard that is empty apart from a welcome line. Signed out,
every app page sends them to the sign-in page.

Sign-in uses [Better Auth](https://www.better-auth.com) with email and password. Users and sessions
are stored in the project's own Postgres, so the stack stays fully self-hosted.

## Scope

**In:**

- Sign-up, sign-in and sign-out with email and password.
- Sessions in Postgres, sent to the browser as an httpOnly cookie.
- A `users` table that later tables can reference, with each user's currency and locale.
- One protected API route, `GET /api/me`, plus the server-side check that future routes reuse.
- Web pages: `/login`, `/signup`, and `/` (the dashboard) inside the app header from the v1 designs.
- An environment variable that turns sign-up off, for servers that should only have known users.

**Out, left for later phases:**

- Password reset and email verification. Both need outgoing email, which the stack does not have yet.
- Two-step sign-in, social sign-in, passkeys.
- Settings, changing the profile or password, deleting the account.
- Dashboard content, the other five tabs, and the Add record button.
- Dark theme switching. Phase 1.1 uses the light theme only.

## Decisions

The sign-in library is settled. The others are proposals; change them here before building.

| # | Decision | Why |
| --- | --- | --- |
| D1 | Better Auth 1.7, with its Drizzle adapter | Chosen by the project owner. Less security code to write ourselves, and two-step or social sign-in can be added later as plugins. |
| D2 | The API serves everything under `/api`. nginx and the Vite dev server stop removing the prefix | Better Auth builds URLs from its base URL and base path (`/api/auth` by default). If a proxy strips `/api`, the links it creates later (password reset, OAuth callbacks) point at the wrong path. One rule, "paths pass through unchanged", is also easier to follow. |
| D3 | Sign-up is open by default. `AUTH_SIGNUP_ENABLED=false` closes it | A self-hoster creates their own account first, then closes sign-up. Better Auth's `disableSignUp` option does the work. |
| D4 | No email in this phase, so no verification and no password reset | Sending email needs SMTP setup and its own design. Until then, a forgotten password cannot be reset from the app (see Risks). |
| D5 | Tables `users`, `sessions`, `auth_accounts` and `verifications`, with UUID IDs. The placeholder `accounts` table is dropped | Better Auth calls them `user`, `session`, `account` and `verification`. `user` is a reserved word in Postgres. Better Auth's `account` (a sign-in method) would be confused with the money accounts that come later, which need the name `accounts`. UUIDs (`advanced.database.generateId: 'uuid'`) match the existing schema. |
| D6 | Passwords are 12 to 128 characters long, with no rules about character types | There is no second factor yet, so length is the main protection. Better Auth's default minimum is 8. The limits live in `packages/shared`, so the API and the forms use the same numbers. |
| D7 | Keep Better Auth's defaults: sessions last 7 days and are extended once a day while in use; passwords are hashed with scrypt | These are reasonable defaults and need no code from us. Node 26 has Argon2id built in, but switching would mean writing our own hash code (see Risks). |
| D8 | Our own route is `GET /api/me`, with no version in the path | The web app and API are released together, and there is no other client. Add `/api/v1` when a second client, such as a phone app, appears. |
| D9 | The header shows only the Dashboard tab | Tabs that lead nowhere are confusing. Each later phase adds its tab. |
| D10 | Archivo is served from the app through `@fontsource-variable/archivo`, not from Google Fonts | Loading Google Fonts sends every visitor's IP address to Google, which is a GDPR problem in the EU. It also lets the strict Content-Security-Policy below allow only our own origin. |
| D11 | The cookie prefix is `extracker`. Cookies are `Secure` when `APP_URL` starts with `https://` | Better Auth's docs give conflicting rules for when cookies get `Secure`. Deciding it from `APP_URL` is explicit, and it still works for a self-hoster on plain HTTP inside their own network. |

## Design

### Request paths

| Browser asks for | API route | Handled by |
| --- | --- | --- |
| `/api/health` | `GET /api/health` | Existing health check, moved |
| `/api/auth/*` | `GET` and `POST /api/auth/*` | Better Auth (sign-up, sign-in, sign-out, get-session) |
| `/api/me` | `GET /api/me` | Our route. Needs a session |
| anything else | not sent to the API | nginx serves the web app (`index.html` for unknown paths) |

nginx's `location /api/` becomes `proxy_pass ${API_UPSTREAM};`. With no path after the upstream,
nginx passes the request path through unchanged. The Vite proxy drops its `rewrite`. The Compose
health check calls `/api/health`.

### API

**`apps/api/src/auth.ts`**: `createAuth({ database, config })` returns a configured `betterAuth()`
instance. Building it from arguments keeps the project's pattern of passing services into
`buildApp`. The server passes `drizzleAdapter(db, { provider: 'pg', schema })`. Tests pass Better
Auth's `memoryAdapter`, so they still need no Postgres.

```ts
betterAuth({
  baseURL: config.APP_URL,              // public origin of the web app; also the only trusted origin
  basePath: '/api/auth',                // Better Auth's default, written out because D2 relies on it
  secret: config.AUTH_SECRET,
  database,
  emailAndPassword: {
    enabled: true,
    disableSignUp: !config.AUTH_SIGNUP_ENABLED,
    minPasswordLength: PASSWORD_MIN_LENGTH,   // from @extracker/shared
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    autoSignIn: true,
  },
  user: {
    modelName: 'users',
    additionalFields: {
      currency: { type: 'string', input: false, defaultValue: config.DEFAULT_CURRENCY },
      locale: { type: 'string', input: false, defaultValue: config.DEFAULT_LOCALE },
    },
  },
  session: { modelName: 'sessions' },
  account: { modelName: 'auth_accounts' },
  verification: { modelName: 'verifications' },
  advanced: {
    database: { generateId: 'uuid' },
    cookiePrefix: 'extracker',
    useSecureCookies: config.APP_URL.startsWith('https://'),
    // nginx sets X-Real-IP to the connecting address. X-Forwarded-For can be forged by the client.
    ipAddress: { ipAddressHeaders: ['x-real-ip'] },
  },
  telemetry: { enabled: false },        // off by default; written out so nobody has to check
});
```

`input: false` means sign-up cannot set currency or locale. New users get the server's
`DEFAULT_CURRENCY` and `DEFAULT_LOCALE`. Settings will let users change them in a later phase.

**Auth routes** (`apps/api/src/auth-routes.ts`): a Fastify route for `GET` and `POST /api/auth/*`
that turns the Fastify request into a Fetch `Request`, calls `auth.handler()`, and copies the
response back. It follows the Fastify page of Better Auth's docs, with three fixes:

- Copy every cookie with `response.headers.getSetCookie()`. Sign-in can set more than one.
- Log failures with `request.log.error({ err })`. Never log the request body, because it holds the password.
- Allow a `POST` with an empty body (for example sign-out). Fastify rejects an empty JSON body by
  default, so the test must send exactly what the browser client sends.

**Session check** (`apps/api/src/session.ts`): a `requireSession` pre-handler. It calls
`auth.api.getSession({ headers: fromNodeHeaders(request.headers) })` and answers `401` when there
is no session. Otherwise it puts the user and session on the request (with Fastify's
`decorateRequest`). Every protected route from now on uses it.

**`GET /api/me`** returns `meResponseSchema`: `id`, `name`, `email`, `currency`, `locale`. It is the
web app's way to ask "who is signed in?".

**Error bodies.** Better Auth answers errors with `{ code, message }`. Our routes use the same
shape (`apiErrorSchema` in shared), for example `{ code: 'UNAUTHORIZED', message: '…' }`, so the
web app reads errors one way.

**Database.**

1. Add the CLI package `auth` (same version as `better-auth`) to the catalog and the API's dev dependencies.
2. Add `apps/api/auth.cli.ts`. It exports an `auth` built with `createAuth()` and placeholder
   values, only so the CLI can read the options. It lives outside `src/`, so it is not built or shipped.
3. Add a script that runs `auth generate` with `--config auth.cli.ts`, the Drizzle adapter and the
   PostgreSQL dialect, writing to `src/db/auth-schema.ts`. Check `auth generate --help` for the
   exact flags.
4. Look at the generated column names. If they are camelCase, set Drizzle's `casing: 'snake_case'`
   in both `drizzle.config.ts` and `createDatabase()` instead of editing the file by hand. The
   file can then be regenerated at any time.
5. `schema.ts` re-exports the auth tables and drops `accounts`. Run `pnpm db:generate` and commit
   `drizzle/0001_*.sql` with `drizzle/meta/`.
6. Add a script that runs `auth check schema --config auth.cli.ts`, so a Better Auth upgrade that
   needs new columns is caught.

### Shared package

`packages/shared/src/auth.ts`:

- `PASSWORD_MIN_LENGTH` (12) and `PASSWORD_MAX_LENGTH` (128).
- `signUpInputSchema` (name 1–100 characters, email, password) and `signInInputSchema` (email, password).
  The forms check these before sending. Better Auth checks again on the server.
- `meResponseSchema`, using the existing `currencyCodeSchema` and `localeSchema`.
- `apiErrorSchema`: `{ code: string, message: string }`.

### Configuration

New API variables. Each goes in `config.ts`, `.env.example`, `docker-compose.yml` and the README
table, as CLAUDE.md requires.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_URL` | none, required. Compose sets `http://localhost:${WEB_PORT}` | Public origin of the web app. Better Auth's base URL and its only trusted origin. Use `http://localhost:5173` for `pnpm dev:web` |
| `AUTH_SECRET` | none, required | Signs cookies and tokens. At least 32 characters: `openssl rand -base64 32` |
| `AUTH_SIGNUP_ENABLED` | `true` | `false` turns sign-up off (D3). Parsed with `z.stringbool()` |

The API fails at start-up if `APP_URL` or `AUTH_SECRET` is missing or invalid. A wrong origin would
otherwise show up later as every sign-in being refused with 403.

### Web app

**New dependencies:** `react-router` 8 (declarative `BrowserRouter` and `Routes`), `better-auth`
(only its `better-auth/client` entry point) and `@fontsource-variable/archivo`.

**Files:**

| File | Contents |
| --- | --- |
| `src/styles/theme.css` | Copied from `docs/designs/v1/theme.css`. The `.ex .ex-light` classes go on the root element |
| `src/styles/components.css` | Only the parts used now: top bar, tabs, buttons, fields, labels, cards, the 760px phone layout |
| `src/auth-client.ts` | `createAuthClient()` from `better-auth/client`. Same origin and the default `/api/auth` base path, so it needs no options |
| `src/api.ts` | `fetchJson(path, schema, signal, fetchImpl)`, generalising today's `health.ts`. A 401 throws `UnauthorizedError` |
| `src/me.ts` | `meQueryKey` and `fetchMe()` for `GET /api/me` |
| `src/redirect.ts` | `safeNextPath(value)`. It accepts only paths that start with a single `/` (not `//` or `/\`) and otherwise returns `/`, so `?next=` cannot send people to another site |
| `src/auth-errors.ts` | `messageForAuthError(error)`. Turns Better Auth's codes and HTTP 429 into plain sentences, with a general message for anything unknown |
| `src/RequireUser.tsx` | Runs the `me` query (no retry on 401). While it waits, shows a loading line. Signed out, it redirects to `/login?next=<current path>` |
| `src/AppShell.tsx` | The header from `parts/app-nav.js`: logo, the Dashboard tab, and an account button with the user's initials. The button opens a small menu with name, email and Sign out |
| `src/LoginPage.tsx`, `src/SignupPage.tsx` | A centred card built from the design's field, label and button styles. Autocomplete attributes `email`, `current-password` and `new-password`. Errors are shown in an `aria-live` region |
| `src/DashboardPage.tsx` | "Welcome, {name}", one line saying balances and spending will appear here, and the existing `HealthStatus` as a small "System status" card |

The v1 designs have no sign-in screen, so the sign-in and sign-up pages reuse the design tokens
and components rather than a mock-up.

**Flows:**

- **Sign in:** `authClient.signIn.email()`, then invalidate the `me` query and go to `safeNextPath(next)`.
- **Sign up:** `authClient.signUp.email({ name, email, password })`. Better Auth signs the new user
  in, so the next step is the same as signing in. When sign-up is off, the page shows the server's
  error. The web app cannot know in advance whether sign-up is open.
- **Sign out:** `authClient.signOut()`, then `queryClient.clear()` so no cached data from the
  previous user stays in memory, then go to `/login`.
- `/login` and `/signup` send a user who is already signed in to `/`.

### nginx

Besides the `proxy_pass` change, add headers to every response:

- `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: same-origin`

nginx drops headers set at the `server` level from any `location` that has its own `add_header`.
The two existing `Cache-Control` locations must therefore repeat these headers, or include them
from a shared snippet. The dev server sends none of them, so Vite's hot reload is unaffected.

## Steps

Each step leaves `pnpm test` and `pnpm typecheck` passing.

1. **Move the API under `/api` (D2).** Change the routes in `app.ts`, the nginx `proxy_pass`, the
   Vite proxy, the Compose health check, the health tests, and the README section about `/api`.
   Done when `curl localhost:8080/api/health` answers in Docker.
2. **Shared auth schemas.** Add `packages/shared/src/auth.ts` and export it from `index.ts`, with tests.
3. **Configuration.** Add the three variables in all four places, and update `config.test.ts`.
4. **Better Auth in the API.** Add `createAuth`, the auth routes, `requireSession` and `GET /api/me`.
   Add `auth` to `AppDependencies` and wire it up in `server.ts`. Write the tests below.
5. **Tables and migration.** Generate the auth schema, check the column names, drop `accounts`,
   generate and commit migration `0001`. Done when `docker compose up --build` applies it and
   `\d users` in `psql` shows UUID IDs plus `currency` and `locale`.
6. **Web app.** Add styles and the font, then the router, the auth client, the pages, the shell
   and the dashboard. Write the tests below.
7. **nginx headers.** Done when the built app loads in Docker with no CSP errors in the browser console.
8. **Docs.** Update README.md (layout, environment variables, how to sign in the first time, how to
   close sign-up) and CLAUDE.md (the `/api` rule, `createAuth` and the memory adapter in tests,
   `requireSession` for protected routes, the auth schema scripts).
9. **End-to-end check** (below), in Docker and in development.

## Tests

The new tests keep to the existing rules: no Postgres, and no jsdom.

**API** (`app.inject()`, with Better Auth on the memory adapter):

- Sign-up answers 200 and sets a session cookie that is `HttpOnly` and `SameSite=Lax`.
- Sign-up is refused when `AUTH_SIGNUP_ENABLED` is false, and refused for an 11-character password.
- Sign-in with a wrong password answers 401. With the right password it sets the cookie.
- A sign-out request that carries the session cookie and `Origin: https://evil.example` is
  refused (Better Auth's origin check), and the session still works afterwards.
- `GET /api/me` answers 401 with `apiErrorSchema` when there is no cookie. With the cookie it
  answers 200 and matches `meResponseSchema`, with currency and locale taken from the config.
- After sign-out, the old cookie gets 401 from `/api/me`. The test sends the sign-out request the
  way `better-auth/client` does.
- A user's `id` is a UUID.
- `config.test.ts`: `APP_URL` and `AUTH_SECRET` are required, a secret shorter than 32 characters
  is refused, and `AUTH_SIGNUP_ENABLED=false` becomes `false`.

**Shared:** the length limits apply to both input schemas; `meResponseSchema` refuses an unknown currency.

**Web** (Node, `renderToStaticMarkup` inside `MemoryRouter`):

- `safeNextPath`: `/`, `/records?x=1`, `//evil.example`, `/\evil.example`, `https://evil.example`, empty.
- `messageForAuthError`: a known code, HTTP 429, an unknown code.
- `fetchMe`: 200 is parsed; 401 throws `UnauthorizedError`; a body that does not match is refused.
- The login and sign-up pages render labelled fields with the right autocomplete values, and show an error when given one.
- `AppShell` shows the user's initials and a Sign out control. `DashboardPage` shows the user's name.

## End-to-end check

Run these by hand in Docker (`docker compose up --build`, with `AUTH_SECRET` set in `.env`):

1. `http://localhost:8080/` redirects to `/login?next=/`.
2. Create an account. You land on the dashboard and see your name.
3. Reload the page: you are still signed in. In the browser's developer tools, the session cookie
   is `HttpOnly`, `SameSite=Lax`, and not `Secure`, because `APP_URL` is plain HTTP.
4. Sign out. You are back on `/login`. Opening `/` sends you to `/login` again.
5. A wrong password shows a plain message. Four wrong tries within 10 seconds show the "too many
   attempts" message. Rate limiting is on in Docker because `NODE_ENV=production`.
6. Set `AUTH_SIGNUP_ENABLED=false` and restart `api`. Sign-up is refused, and sign-in still works.
7. In `psql`, `users` has one row with a UUID ID and `currency = 'EUR'`, and `accounts` is gone.

In development, run Postgres, `pnpm db:migrate`, `pnpm dev:api` and `pnpm dev:web` with
`APP_URL=http://localhost:5173`, then repeat steps 1 to 4 on port 5173.

## Risks and open questions

- **Better Auth changes fast.** 1.7.28 came out on 2026-11-24. Pin an exact version in the catalog,
  ideally a release that has been out for a couple of weeks, and run the schema check on every upgrade.
- **A forgotten password cannot be reset in this phase.** Phase 1.1 has no email, so self-service
  reset is impossible. Before anyone relies on the app, add either email or a server-side command
  (`pnpm --filter @extracker/api user:reset-password <email>`). Say so in the README.
- **Sign-up reveals whether an email is registered.** With automatic sign-in and no email
  verification, Better Auth answers an error for an existing email. Closing sign-up (D3) limits
  this. Email verification, in a later phase, removes it.
- **Rate limits are kept in memory.** They reset when the API restarts and are not shared between
  API processes. That is fine for one API container. If someone puts another proxy in front of
  nginx, `X-Real-IP` becomes that proxy's address, and all users share one limit. nginx's `real_ip`
  settings must then trust the outer proxy. Document this with deployment.
- **Passwords are hashed in JavaScript.** Better Auth's scrypt runs on the API's main thread, which
  is acceptable at this scale. Moving later to Node's built-in Argon2id (`crypto.argon2`, which
  runs off the main thread) means a custom `password.verify` that still accepts the old scrypt hashes.
- **The Fastify adapter turns bodies back into JSON.** Better Auth's Fastify example rebuilds the
  request body with `JSON.stringify`, so only JSON requests work. That is all the browser client
  sends, and the API tests cover it.
- **Open:** should the sign-in page hide "Create an account" when sign-up is off? It would need a
  small public endpoint, such as `GET /api/auth-options`. It is left out for now.
