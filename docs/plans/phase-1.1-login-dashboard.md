# Phase 1.1: Sign-in and a blank dashboard

- **Status:** Implemented. See "Notes from building it" at the end for where the code differs
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
- A `users` table that later tables can reference, with each user's base currency and locale.
- One protected API route, `GET /api/me`, plus the server-side check that future routes reuse.
- Web pages: `/login`, `/signup`, and `/` (the dashboard) inside the app header from the v1 designs.
- Sign-up closed by default, with an environment variable that opens it.
- A public `GET /api/auth-options`, so the sign-in page offers sign-up only when it is open.
- A server-side command that resets a user's password and signs them out everywhere.

**Out, left for later phases:**

- Password reset by email, and email verification. Both need outgoing email, which the stack does not have yet.
- Two-step sign-in, social sign-in, passkeys.
- Settings, changing the profile or password in the app, deleting the account.
- Dashboard content, the other five tabs, and the Add record button.
- Dark theme switching. Phase 1.1 uses the light theme only.

## Decisions

D1, D3, D12 and D14 are the project owner's decisions. The others are proposals; change them here before building.

| # | Decision | Why |
| --- | --- | --- |
| D1 | Better Auth 1.7, with its Drizzle adapter | Chosen by the project owner. Less security code to write ourselves, and two-step or social sign-in can be added later as plugins. |
| D2 | The API serves everything under `/api`. nginx and the Vite dev server stop removing the prefix | Better Auth builds URLs from its base URL and base path (`/api/auth` by default). If a proxy strips `/api`, the links it creates later (password reset, OAuth callbacks) point at the wrong path. One rule, "paths pass through unchanged", is also easier to follow. |
| D3 | Sign-up is closed by default. `AUTH_SIGNUP_ENABLED=true` opens it | Chosen by the project owner. A server reachable from the internet should not let strangers create accounts. To create the first account, the owner opens sign-up, signs up, and closes it again. Better Auth's `disableSignUp` option does the work. |
| D4 | No email in this phase, so no email verification and no password reset by email | Sending email needs SMTP setup and its own design. D12 covers forgotten passwords until then. |
| D5 | Tables `users`, `sessions`, `auth_accounts` and `verifications`, with UUID IDs. The placeholder `accounts` table is dropped | Better Auth calls them `user`, `session`, `account` and `verification`. `user` is a reserved word in Postgres. Better Auth's `account` (a sign-in method) would be confused with the money accounts that come later, which need the name `accounts`. UUIDs (`advanced.database.generateId: 'uuid'`) match the existing schema. |
| D6 | Passwords are 12 to 128 characters long, with no rules about character types | There is no second factor yet, so length is the main protection. Better Auth's default minimum is 8. The limits live in `packages/shared`, so the API, the forms and the reset command use the same numbers. |
| D7 | Keep Better Auth's defaults: sessions last 7 days and are extended once a day while in use; passwords are hashed with scrypt | These are reasonable defaults and need no code from us. The extension only reaches the browser if our session check passes Better Auth's new cookie on (see Session check). Node 26 has Argon2id built in, but switching would mean writing our own hash code (see Risks). |
| D8 | Our own route is `GET /api/me`, with no version in the path | The web app and API are released together, and there is no other client. Add `/api/v1` when a second client, such as a phone app, appears. |
| D9 | The header shows only the Dashboard tab | Tabs that lead nowhere are confusing. Each later phase adds its tab. |
| D10 | Archivo is served from the app through `@fontsource-variable/archivo`, not from Google Fonts | Loading Google Fonts sends every visitor's IP address to Google, which is a GDPR problem in the EU. It also lets the strict Content-Security-Policy below allow only our own origin. |
| D11 | The cookie prefix is `extracker`. Cookies are `Secure` when `APP_URL` starts with `https://` | Better Auth does this itself when `baseURL` is a string. `NODE_ENV` only matters when there is no base URL (better-auth 1.7.28, `cookies/index.mjs`). A self-hoster on plain HTTP inside their own network still gets cookies that work. |
| D12 | `user:reset-password <email>` sets a new password and ends all of that user's sessions | Chosen by the project owner. Without email, this is the only way back in after a forgotten password. It runs on the server, so only someone with shell access to the server can use it. |
| D13 | Users have `baseCurrency` and `locale`. Both are required and set from the server's defaults | Every money account will have its own currency, so a plain `currency` on users would be ambiguous. `required: true` gives NOT NULL columns, and Better Auth fills both from `defaultValue` at sign-up (better-auth 1.7.28, `db/schema.mjs`; CLI `index.mjs`). |
| D14 | A public `GET /api/auth-options` returns `{ signUpEnabled }`. The web app shows sign-up only when it is open | Chosen by the project owner. Sign-up is closed by default, so without this the sign-in page would offer a link that fails on most servers. It reveals nothing that trying to sign up would not. Better Auth's `disableSignUp` still enforces the setting; this route only drives the pages. |

## Design

### Request paths

| Browser asks for | API route | Handled by |
| --- | --- | --- |
| `/api/health` | `GET /api/health` | Existing health check, moved |
| `/api/auth/*` | `GET` and `POST /api/auth/*` | Better Auth (sign-up, sign-in, sign-out, get-session) |
| `/api/me` | `GET /api/me` | Our route. Needs a session |
| `/api/auth-options` | `GET /api/auth-options` | Our route. Public. Says whether sign-up is open |
| anything else | not sent to the API | nginx serves the web app (`index.html` for unknown paths) |

nginx's `location /api/` becomes `proxy_pass ${API_UPSTREAM};`. With no path after the upstream,
nginx passes the request path through unchanged. The Vite proxy drops its `rewrite`. The Compose
health check calls `/api/health`.

### API

**`apps/api/src/auth.ts`**: `createAuth({ database, config })` returns a configured `betterAuth()`
instance. Building it from arguments keeps the project's pattern of passing services into
`buildApp`. The server and the reset command pass `drizzleAdapter(db, { provider: 'pg', schema })`.
Tests pass Better Auth's `memoryAdapter`, so they still need no Postgres.

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
      baseCurrency: { type: 'string', required: true, input: false, defaultValue: config.DEFAULT_CURRENCY },
      locale: { type: 'string', required: true, input: false, defaultValue: config.DEFAULT_LOCALE },
    },
  },
  session: { modelName: 'sessions' },
  account: { modelName: 'auth_accounts' },
  verification: { modelName: 'verifications' },
  advanced: {
    database: { generateId: 'uuid' },
    cookiePrefix: 'extracker',
    // nginx sets X-Real-IP to the connecting address. X-Forwarded-For can be forged by the client.
    ipAddress: { ipAddressHeaders: ['x-real-ip'] },
  },
  telemetry: { enabled: false },        // off by default; written out so nobody has to check
});
```

Because of `input: false`, sign-up cannot set the base currency or locale. New users get the
server's `DEFAULT_CURRENCY` and `DEFAULT_LOCALE`. Settings will let users change them in a later phase.

**Auth routes** (`apps/api/src/auth-routes.ts`): a Fastify route for `GET` and `POST /api/auth/*`
that turns the Fastify request into a Fetch `Request`, calls `auth.handler()`, and copies the
response back. It follows the Fastify page of Better Auth's docs, with three fixes:

- Copy every cookie with `response.headers.getSetCookie()`. Sign-in can set more than one.
- Log failures with `request.log.error({ err })`. Never log the request body, because it holds the password.
- Allow a `POST` with an empty body (for example sign-out). Fastify rejects an empty JSON body by
  default, so the test must send exactly what the browser client sends.

**Session check** (`apps/api/src/session.ts`): a `requireSession` pre-handler. Every protected
route from now on uses it. It does three things, in order:

1. **Checks the origin of writes.** Better Auth checks origins only on its own routes. For any
   method other than `GET`, `HEAD` or `OPTIONS`, `requireSession` requires an `Origin` header that
   `(await auth.$context).isTrustedOrigin(origin)` accepts. Otherwise it answers
   `403 { code: 'INVALID_ORIGIN' }`, the same code Better Auth uses. Phase 1.1 has no protected write
   route, but the first one in phase 1.2 is then covered from the start.
2. **Reads the session and passes on a refreshed cookie.** It calls
   `auth.api.getSession({ headers: fromNodeHeaders(request.headers), returnHeaders: true })` and
   copies every `Set-Cookie` from the returned headers onto the reply. Once a day, Better Auth
   extends the session in the database and writes a new cookie (better-auth 1.7.28,
   `api/routes/session.mjs`). A server-side call without `returnHeaders` drops that cookie
   (`api/dispatch.mjs`), and the browser would then sign the user out 7 days after sign-in, however
   often they use the app.
3. **Answers `401` when there is no session.** Otherwise it puts the user and session on the request
   (with Fastify's `decorateRequest`).

**`GET /api/me`** returns `meResponseSchema`: `id`, `name`, `email`, `baseCurrency`, `locale`. It
is the web app's way to ask "who is signed in?".

**`GET /api/auth-options`** (D14) needs no session. It returns `authOptionsResponseSchema`,
`{ signUpEnabled: boolean }`, taken from `config.AUTH_SIGNUP_ENABLED`. It must not live under
`/api/auth/`, because the Better Auth route there catches every path. It is registered in `buildApp`
like `/api/health`, and it gets the setting from the config passed in, not from `process.env`.

**Error bodies.** Better Auth answers errors with `{ code, message }`. Our routes use the same
shape (`apiErrorSchema` in shared), for example `{ code: 'UNAUTHORIZED', message: '…' }`, so the
web app reads errors one way.

**Password reset command** (D12):

- `apps/api/src/password-reset.ts` exports `resetPassword(auth, email, newPassword)`. It uses
  Better Auth's internal adapter through `auth.$context`:
  1. `internalAdapter.findUserByEmail(email)` finds the user, matching email case-insensitively.
  2. `password.hash(newPassword)` hashes the new password.
  3. `internalAdapter.updatePassword(userId, hash)` saves it.
  4. `internalAdapter.deleteUserSessions(userId)` ends every session.

  It rejects an unknown email and a password outside the D6 limits. It is a plain function, so
  tests run it on the memory adapter.
- `apps/api/src/reset-password.ts` is the command. It loads the config, creates the database and
  `createAuth()`, then asks twice for the new password without showing it. It needs no new
  dependency: put stdin in raw mode, because `node:readline` has no hidden input. It calls
  `resetPassword()`, prints which email was reset, and closes the database.
- The password is never taken as an argument, because arguments end up in shell history and
  process lists. Without a terminal, the command refuses to run.
- Run it in Docker with `docker compose exec api node dist/reset-password.js <email>`. In
  development, run `pnpm user:reset-password <email>`. The root script calls the API package's
  script, which runs `src/reset-password.ts` with `--conditions=@extracker/source` and
  `--env-file-if-exists=../../.env`, like `db:migrate`.

**Database.**

1. Add the CLI package `auth` (same version as `better-auth`) to the catalog and the API's dev dependencies.
2. Add `apps/api/auth.cli.ts`. It exports an `auth` built with `createAuth()` and placeholder
   values, only so the CLI can read the options. It lives outside `src/`, so it is not built or
   shipped. Add it to `include` in `apps/api/tsconfig.json`, so `pnpm typecheck` checks it.
3. Add an `auth:generate` script. It runs `pnpm --filter @extracker/shared build` first, because
   the CLI loads `auth.cli.ts` with jiti and ignores the `@extracker/source` condition. Without
   the build, `@extracker/shared` resolves to a `dist/` that may be missing or out of date. It then
   runs `auth generate` with `--config auth.cli.ts`, the Drizzle adapter and the PostgreSQL
   dialect, writing to `src/db/auth-schema.ts`. Check `auth generate --help` for the exact flags.
   The generator writes snake_case table and column names itself, so the file needs no hand
   edits and can be regenerated at any time.
4. Make two migrations, one after the other:
   1. Remove `accounts` from `schema.ts` and run `pnpm db:generate`. This gives `0001`, which only
      drops the table.
   2. Re-export the auth tables from `schema.ts` and run `pnpm db:generate` again. This gives
      `0002`, which creates them.

   Doing both in one run makes drizzle-kit ask whether `accounts` was renamed. Without a
   terminal that prompt fails, and drizzle-kit still exits with code 0. After each run, check that
   the new SQL file exists. Commit both files with `drizzle/meta/`.
5. Add an `auth:check` script. It builds shared first, like `auth:generate`, then runs
   `auth check schema --config auth.cli.ts`, so a Better Auth upgrade that needs new columns is caught.

### Shared package

`packages/shared/src/auth.ts`:

- `PASSWORD_MIN_LENGTH` (12) and `PASSWORD_MAX_LENGTH` (128).
- `signUpInputSchema` (name 1–100 characters, email, password) and `signInInputSchema` (email, password).
  The forms check these before sending. Better Auth checks again on the server.
- `meResponseSchema`: `baseCurrency` uses the existing `currencyCodeSchema`, and `locale` uses `localeSchema`.
- `authOptionsResponseSchema`: `{ signUpEnabled: boolean }`.
- `apiErrorSchema`: `{ code: string, message: string }`.

### Configuration

New API variables. Each goes in `config.ts`, `.env.example`, `docker-compose.yml` and the README
table, as CLAUDE.md requires.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_URL` | none, required. Compose sets `http://localhost:${WEB_PORT}` | Public origin of the web app, exactly as people type it in the browser (see below). Better Auth's base URL and its only trusted origin. Use `http://localhost:5173` for `pnpm dev:web` |
| `AUTH_SECRET` | none, required | Signs cookies and tokens. At least 32 characters: `openssl rand -base64 32` |
| `AUTH_SIGNUP_ENABLED` | `false` | `true` opens sign-up (D3). Parsed with `z.stringbool()` |

The API fails at start-up if `APP_URL` or `AUTH_SECRET` is missing or invalid.

A valid `APP_URL` that does not match the browser's address is not caught at start-up. Every
sign-in is then refused with `403 INVALID_ORIGIN`. For example, `http://localhost:8080` and
`http://127.0.0.1:8080` are different origins, and so is a LAN address. To deal with this:

- `.env.example` and the README say that scheme, host and port must match exactly.
- The web app's message for `INVALID_ORIGIN` tells the reader to check `APP_URL`.

### Web app

**New dependencies:** `react-router` 8 (declarative `BrowserRouter` and `Routes`), `better-auth`
(only its `better-auth/client` entry point) and `@fontsource-variable/archivo`.

**Files:**

| File | Contents |
| --- | --- |
| `src/styles/theme.css` | Copied from `docs/designs/v1/theme.css`, with `font-family` changed to `'Archivo Variable'`, the name Fontsource uses. The `.ex .ex-light` classes go on the root element |
| `src/styles/components.css` | Only the parts used now: top bar, tabs, buttons, fields, labels, cards, the 760px phone layout |
| `src/main.tsx` | Also imports `@fontsource-variable/archivo/wdth.css`. That file has the weight and width axes; the default `index.css` has only weights, and the designs use `font-stretch` from 106% to 112% |
| `src/auth-client.ts` | `makeAuthClient(fetchImpl = fetch)` returns `createAuthClient({ fetchOptions: { customFetchImpl: fetchImpl } })` from `better-auth/client`, and the module exports one default instance. Same origin and the default `/api/auth` base path, so no other options are needed. Tests pass a fake `fetch`, as CLAUDE.md asks for code that calls the network |
| `src/api.ts` | `fetchJson(path, schema, signal, fetchImpl)`, generalising today's `health.ts`. A 401 throws `UnauthorizedError` |
| `src/me.ts` | `meQueryKey` and `fetchMe()` for `GET /api/me` |
| `src/auth-options.ts` | `authOptionsQueryKey` and `fetchAuthOptions()` for `GET /api/auth-options`. The query never goes stale (`staleTime: Infinity`), because the setting changes only when the API restarts |
| `src/redirect.ts` | `safeNextPath(value)`. It accepts only paths that start with a single `/` (not `//` or `/\`) and otherwise returns `/`, so `?next=` cannot send people to another site |
| `src/auth-errors.ts` | `messageForAuthError(error)`. Turns Better Auth's codes and HTTP 429 into plain sentences, with a general message for anything unknown. For `INVALID_ORIGIN`, it says to open the app at its configured address or to check `APP_URL` |
| `src/AuthGate.tsx` | Takes the `me` query's state as props, like `HealthStatus`. Its four states: waiting shows a loading line; `UnauthorizedError` redirects to `/login?next=<current path>`; any other error shows "Cannot reach exTracker" with a Retry button, and no redirect; a user gets the page |
| `src/RequireUser.tsx` | Runs the `me` query (no retry on 401) and renders `AuthGate` with its state |
| `src/AppShell.tsx` | The header from `parts/app-nav.js`: logo, the Dashboard tab, and an account button with the user's initials. The button opens a small menu with name, email and Sign out |
| `src/LoginPage.tsx`, `src/SignupPage.tsx` | A centred card built from the design's field, label and button styles. Autocomplete attributes `email`, `current-password` and `new-password`. Errors are shown in an `aria-live` region. The sign-in page shows "Create an account" only when `signUpEnabled` is true. While the options load, or if they fail to load, the link stays hidden and signing in still works. When sign-up is closed, the sign-up page shows "Sign-up is closed on this server" and a link to sign in, instead of the form |
| `src/DashboardPage.tsx` | "Welcome, {name}", one line saying balances and spending will appear here, and the existing `HealthStatus` as a small "System status" card |

The v1 designs have no sign-in screen, so the sign-in and sign-up pages reuse the design tokens
and components rather than a mock-up.

**Flows:**

- **Sign in:** `authClient.signIn.email()`, then invalidate the `me` query and go to `safeNextPath(next)`.
- **Sign up:** `authClient.signUp.email({ name, email, password })`. Better Auth signs the new user
  in, so the next step is the same as signing in. Both pages read `GET /api/auth-options` first,
  so a closed sign-up is never offered. If sign-up closes while the page is open, the server's
  error is shown.
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
4. **Better Auth and its tables.** Add `createAuth`, `auth.cli.ts` and the `auth:generate` and
   `auth:check` scripts. Generate the auth schema, make migrations `0001` and `0002`, and wire
   `createAuth` into `server.ts` with the Drizzle adapter. Done when `docker compose up --build`
   applies both migrations, and `\d users` in `psql` shows a UUID `id` and NOT NULL `base_currency`
   and `locale`.
5. **Routes and the session check.** Add the auth routes, `requireSession`, `GET /api/me` and
   `GET /api/auth-options`, add
   `auth` to `AppDependencies`, and write the API tests below.
6. **Password reset command.** Add `resetPassword()`, the command, and the root and API package
   scripts, with tests.
7. **Web app.** Add styles and the font, then the router, the auth client, the pages, the shell
   and the dashboard. Write the tests below.
8. **nginx headers.** Done when the built app loads in Docker with no CSP errors in the browser console.
9. **Docs.**
   - **README.md:** layout; environment variables, including the exact-match rule for `APP_URL`;
     first sign-up (open sign-up, create the account, close it again); and the reset command.
   - **CLAUDE.md:**
     - the `/api` rule;
     - `createAuth` and the memory adapter in tests;
     - `requireSession` for protected routes, including its origin check;
     - the auth schema scripts, and the two-run migration rule when a table is dropped.
10. **End-to-end check** (below), in Docker and in development.

## Tests

The new tests keep to the existing rules: no Postgres, and no jsdom.

**API** (`app.inject()`, with Better Auth on the memory adapter):

- Sign-up is refused when `AUTH_SIGNUP_ENABLED` is not set. The other sign-up tests turn it on.
- Sign-up answers 200 and sets a session cookie that is `HttpOnly` and `SameSite=Lax`. A
  password of 11 characters is refused.
- Sign-in with a wrong password answers 401. With the right password it sets the cookie.
- A sign-out request that carries the session cookie and `Origin: https://evil.example` is
  refused (Better Auth's origin check), and the session still works afterwards.
- `GET /api/me` answers 401 with `apiErrorSchema` when there is no cookie. With the cookie it
  answers 200 and matches `meResponseSchema`, with `baseCurrency` and `locale` taken from the config.
- With two users signed in, each cookie gets its own user from `/api/me`.
- **Session refresh:** sign in, then move the clock forward by more than a day (`vi.setSystemTime`).
  `/api/me` answers 200 and sets a new session cookie with a 7-day `Max-Age`.
- **Origin check in `requireSession`:** the test adds a throwaway `POST` route behind it. Without
  an `Origin` header, or with `Origin: https://evil.example`, it answers `403 INVALID_ORIGIN`. With
  `Origin` set to `APP_URL`, it passes.
- After sign-out, the old cookie gets 401 from `/api/me`. The test sends the sign-out request the
  way `better-auth/client` does.
- A user's `id` is a UUID.
- `GET /api/auth-options` answers 200 without a cookie and matches `authOptionsResponseSchema`.
  It gives `{ signUpEnabled: false }` by default and `true` when sign-up is open.
- **`resetPassword()`:**
  - Afterwards the old password fails, the new one works, and the old session cookie gets 401.
  - An unknown email is rejected, and so is a password outside the D6 limits.
- **`config.test.ts`:**
  - `APP_URL` and `AUTH_SECRET` are required, and a secret shorter than 32 characters is refused.
  - `AUTH_SIGNUP_ENABLED` is `false` when not set, and `true` when set to `true`.

**Shared:** the length limits apply to both input schemas; `meResponseSchema` refuses an unknown currency.

**Web** (Node, `renderToStaticMarkup` inside `MemoryRouter`):

- `safeNextPath`: `/`, `/records?x=1`, `//evil.example`, `/\evil.example`, `https://evil.example`, empty.
- `messageForAuthError`: a known code, `INVALID_ORIGIN` (the message mentions `APP_URL`), HTTP 429, an unknown code.
- `fetchMe`: 200 is parsed; 401 throws `UnauthorizedError`; a body that does not match is refused.
- `fetchAuthOptions`: 200 is parsed; a body that does not match is refused.
- **Sign-up links:**
  - The sign-in page shows "Create an account" only when `signUpEnabled` is true. It hides the
    link while options are loading and when they failed to load.
  - The sign-up page shows the closed message instead of the form when `signUpEnabled` is false.
- **Auth client, with a fake `fetch`:** sign-in sends a JSON `POST` to `/api/auth/sign-in/email`,
  and an error response comes back as the code `messageForAuthError` expects.
- **`AuthGate`:**
  - waiting shows the loading line;
  - `UnauthorizedError` renders a redirect to `/login?next=…`;
  - any other error shows "Cannot reach exTracker" and Retry, without redirecting;
  - a user renders the page.
- The login and sign-up pages render labelled fields with the right autocomplete values, and show an error when given one.
- `AppShell` shows the user's initials and a Sign out control. `DashboardPage` shows the user's name.

## End-to-end check

Run these by hand in Docker (`docker compose up --build`, with `AUTH_SECRET` set in `.env`). After
changing `.env`, run `docker compose up -d api`. `docker compose restart` does not reread `.env`.

1. `http://localhost:8080/` redirects to `/login?next=/`. Sign-up is closed, so the page has no
   "Create an account" link, and `/signup` says sign-up is closed.
2. Set `AUTH_SIGNUP_ENABLED=true` and recreate `api`. Reload: the link appears. Create an account.
   You land on the dashboard and see your name.
3. Reload the page: you are still signed in. In the browser's developer tools, the session cookie
   is `HttpOnly`, `SameSite=Lax`, and not `Secure`, because `APP_URL` is plain HTTP.
4. Sign out. You are back on `/login`. Opening `/` sends you to `/login` again.
5. A wrong password shows a plain message. Four wrong tries within 10 seconds show the "too many
   attempts" message. Rate limiting is on in Docker because `NODE_ENV=production`.
6. Set `AUTH_SIGNUP_ENABLED` back to `false` and recreate `api`. The link is gone, a sign-up
   request sent by hand is refused, and sign-in still works.
7. Sign in, then run `docker compose exec api node dist/reset-password.js <your email>` and type a
   new password twice. The open tab is sent to `/login` on its next request. The old password
   fails, and the new one works.
8. Open `http://127.0.0.1:8080` and try to sign in. The message tells you to check `APP_URL`.
9. Stop the `api` container and reload the dashboard. It shows "Cannot reach exTracker" and stays
   on the page.
10. In `psql`:
    - `users` has one row, with a UUID `id` and `base_currency = 'EUR'`;
    - `accounts` is gone;
    - `drizzle.__drizzle_migrations` lists three migrations.

In development, run Postgres, `pnpm db:migrate`, `pnpm dev:api` and `pnpm dev:web` with
`APP_URL=http://localhost:5173` and `AUTH_SIGNUP_ENABLED=true`, then repeat steps 1 to 4 on port 5173.

## Risks

- **Better Auth changes fast.** 1.7.28 came out on 2026-11-24. Pin an exact version in the catalog,
  ideally a release that has been out for a couple of weeks. Run `auth:check` and the tests on every upgrade.
- **The reset command uses Better Auth's internals.** `auth.$context` and its `internalAdapter` are
  not part of the documented API, so an upgrade can change them. The `resetPassword()` tests catch
  that. If it happens, the admin plugin's `setUserPassword` is the documented alternative, but it
  needs an admin session.
- **Sign-up reveals whether an email is registered.** With automatic sign-in and no email
  verification, Better Auth answers `422` for an existing email. Sign-up is closed by default (D3),
  which limits this. Email verification, in a later phase, removes it.
- **Rate limits are kept in memory.** They reset when the API restarts and are not shared between
  API processes. That is fine for one API container. If someone puts another proxy in front of
  nginx, `X-Real-IP` becomes that proxy's address, and all users share one limit. nginx's `real_ip`
  settings must then trust the outer proxy. Document this with deployment.
- **Passwords are hashed in JavaScript.** Better Auth's scrypt runs on the API's main thread, which
  is acceptable at this scale. Moving later to Node's built-in Argon2id (`crypto.argon2`, which
  runs off the main thread) means a custom `password.verify` that still accepts the old scrypt
  hashes. The reset command uses whatever hash is configured, so it needs no change.
- **The Fastify adapter turns bodies back into JSON.** Better Auth's Fastify example rebuilds the
  request body with `JSON.stringify`, so only JSON requests work. That is all the browser client
  sends, and the API tests cover it.
- **Write requests must carry `Origin`.** `requireSession` refuses writes without an `Origin` header.
  Browsers always send one on these requests, but scripts such as `curl` must add it.

## Notes from building it

Built with better-auth, the `auth` CLI and react-router at the latest releases (1.7.28 and 8.5.3),
because the internals above were checked against 1.7.28. Where the code differs from this plan:

- **Migrations read only `DATABASE_URL`.** `migrate.ts` used `loadConfig()`, which now requires
  `APP_URL` and `AUTH_SECRET`. `loadMigrateConfig()` parses only the database URL, so the
  `migrate` service needs no auth secret.
- **`APP_URL` must be an origin.** `config.ts` refuses a path, query or credentials, and drops a
  trailing slash, because the app is served at the root.
- **The origin check stays on in tests.** Better Auth skips its origin check when it detects a test
  run (`isTest()` in `context/create-context.mjs`). `createAuth` sets
  `advanced.disableOriginCheck: false`; without it, the sign-out origin test passed for the wrong
  reason.
- **The auth route passes the body bytes through** instead of rebuilding JSON. This handles the
  empty `POST` (curl) and removes the "only JSON requests work" risk. `better-auth/client` itself
  sends sign-out as a JSON `POST` with body `{}`; the tests cover both.
- **The Drizzle adapter runs with `transaction: true`**, so sign-up writes the user and the
  password row together or not at all.
- **`resetPassword()` checks for a password sign-in first.** `internalAdapter.updatePassword`
  silently does nothing when the user has none.
- **Our routes answer errors as `{ code, message }` everywhere**, including Fastify's own
  validation, 404 and 500 errors, through the error and not-found handlers in `app.ts`.
- **Zod runs jitless in the browser.** Zod 4 calls `new Function()` when a schema is defined, to see
  whether it may compile parsers. The CSP refuses that and the browser logged an error on every
  load. `apps/web/src/zod-config.ts` turns it off and is the first import of `main.tsx`.
- **Form errors are not red**, following the designs' rule that red is only for over the limit and
  for deleting.
- **Scripts added for convenience:** root `auth:generate` and `auth:check`, next to `db:generate`.
