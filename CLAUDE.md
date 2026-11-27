# CLAUDE.md

exTracker is an open-source, multi-user personal expense tracker (AGPL-3.0-only). So far people
can sign up, sign in and out (Better Auth, sessions in Postgres), and see an empty dashboard.
There are no expense features yet. [README.md](README.md) covers running the stack, every
environment variable and the migration steps. This file covers what you need to change the code.

## Commands

You need Node 26 (`.nvmrc`) and pnpm 12.23.0. `engineStrict` is on, so pnpm refuses to run on
an older Node. Run `nvm use` first.

```sh
pnpm install
pnpm test                                             # Vitest, every package. No database needed
pnpm typecheck                                        # tsc -b, every package
pnpm build
pnpm --filter @extracker/api test test/health.test.ts # one test file
pnpm --filter @extracker/web test -t "rejects other"  # tests whose name matches
pnpm dev:api                                          # needs Postgres 17, and DATABASE_URL, AUTH_SECRET, APP_URL in .env
pnpm dev:web                                          # http://localhost:5173, proxies /api to the API
pnpm db:generate                                      # after changing apps/api/src/db/schema.ts
pnpm auth:generate                                    # after changing Better Auth's options; then db:generate
pnpm auth:check                                       # after upgrading Better Auth
pnpm user:reset-password <email>                      # set a user's password, end their sessions
docker compose up --build                             # full stack on http://localhost:8080
```

## Layout

| Path | Contents |
| --- | --- |
| `apps/api` | Fastify 5 API, Better Auth 1.7, Drizzle ORM schema and SQL migrations (`drizzle/`) |
| `apps/web` | React 19 app with Vite 8, React Router 8 and TanStack Query 5. nginx serves it in Docker |
| `packages/shared` | Zod 4 schemas and the types inferred from them, used by both apps |
| `docs/designs/v1` | Clickable HTML screen designs. Not built or shipped |

## How the pieces fit

- **One contract, in `packages/shared`.** Request and response shapes are Zod schemas in
  `packages/shared/src`, exported from `index.ts`. The API turns them into Fastify response
  schemas with `z.toJSONSchema(schema, { target: 'draft-7' })`, dropping `$schema` (see
  `apps/api/src/app.ts`). The web app parses responses with the same schema. Put new shapes
  here, not in one app.
- **Shared loads from source in dev and tests.** `packages/shared` exports a custom
  `@extracker/source` condition that points at `src/index.ts`. The API's dev scripts
  (`node --conditions=@extracker/source`), both Vitest configs and Vite all use it, so nothing
  needs building first. `pnpm build` and Docker use `dist/`. Any new tool or entry point that
  imports shared needs the same condition.
- **Node runs the TypeScript directly** in dev (`node --watch src/server.ts`). That is why
  `tsconfig.base.json` sets `erasableSyntaxOnly` and `verbatimModuleSyntax`:
  - no `enum`, `namespace` or constructor parameter properties;
  - use `import type` for imports that are only types;
  - write relative imports with the `.ts` extension. The build rewrites them to `.js`.
- **The API gets its outside services as arguments.** `buildApp(dependencies, options)` in
  `apps/api/src/app.ts` takes them (`checkDatabase`, `auth` and the `config` it needs), and
  `server.ts` passes the real ones. Tests pass fakes and call `app.inject()`, which is why no
  test needs Postgres. Follow this for new routes and services.
- **Better Auth is built by `createAuth({ database, config })`** in `apps/api/src/auth.ts`. The
  server and the reset command use `createDatabaseAuth()` (Drizzle on Postgres). Tests use
  `buildTestApp()` in `apps/api/test/support.ts`, which passes Better Auth's memory adapter.
  Better Auth turns its own origin check off when it detects a test run; `createAuth` sets
  `disableOriginCheck: false` so the tests check what production does. Keep it.
- **Protected routes use `{ preHandler: app.requireSession }`** (`apps/api/src/session.ts`), then
  `signedInUser(request)` for the user. It answers 401 without a session, passes on the cookie
  Better Auth sends when it extends a session, and refuses any write (not `GET`, `HEAD` or
  `OPTIONS`) whose `Origin` is not `APP_URL` with `403 INVALID_ORIGIN`. Scripts such as `curl`
  must send `Origin` on writes.
- **Errors are `{ code, message }`** (`apiErrorSchema` in shared), the shape Better Auth uses, so
  the web app reads every error one way. The error and not-found handlers in `app.ts` keep
  Fastify's own errors in that shape too.
- **Configuration.** The Zod schema in `apps/api/src/config.ts` parses every API environment
  variable. Nothing else in the API reads `process.env`. A new variable goes in four places:
  `config.ts`, `.env.example` (with a comment), `docker-compose.yml` and the table in README.md.
- **Migrations.** Change `apps/api/src/db/schema.ts`, run `pnpm db:generate`, and commit the
  new SQL file together with `drizzle/meta/`. Never edit a migration that has already been
  applied. In Compose, the one-shot `migrate` service applies them before `api` starts.
  - A change that drops one table and adds another needs two runs: drop and generate, then add
    and generate. In one run drizzle-kit asks whether the table was renamed; without a terminal
    that question fails and drizzle-kit still exits 0. Check that the SQL file exists.
  - The auth tables (`users`, `sessions`, `auth_accounts`, `verifications`) live in
    `src/db/auth-schema.ts`, which `pnpm auth:generate` writes from the options in
    `src/auth.ts` (read through `apps/api/auth.cli.ts`). Never edit it by hand. Both auth scripts
    build shared first, because the CLI ignores the `@extracker/source` condition.
  - Money accounts will need the name `accounts`; Better Auth's sign-in methods are `auth_accounts`.
- **Web tests run in Node, without jsdom.** Components are checked with
  `renderToStaticMarkup`, and functions that call the network take a `fetchImpl` argument.
  Keep fetching out of components (`health.ts` fetches, `HealthStatus.tsx` only renders) so
  both stay testable this way. Pages with hooks export a props-only view for the tests
  (`LoginPage` and `LoginView`), and `AuthGate` has no hooks so tests can call it directly.
- **Signed-in pages go inside the `RequireUser` route** in `apps/web/src/App.tsx`, and read the
  user with `useCurrentUser()`. `RequireUser` asks `GET /api/me`: a 401 sends people to
  `/login?next=<path>`, and any other failure shows a Retry screen without signing them out.
- **The browser enforces a strict Content-Security-Policy** (`apps/web/nginx/security-headers.conf`):
  only same-origin scripts, styles and fonts, and no inline `<style>`, `style="…"` in HTML, or
  `eval`. Put styles in `apps/web/src/styles/`. `src/zod-config.ts` must stay the first import of
  `main.tsx`, or Zod's `new Function` check logs a CSP error.
- **Every API route lives under `/api`.** nginx (Docker) and the Vite dev server pass `/api/*`
  through unchanged, so the browser's `/api/health` is the API's `GET /api/health`. Never strip
  the prefix in a proxy: Better Auth builds its links from `APP_URL` and `/api/auth`. Only the
  web app is published on the host.

## Conventions

- Every dependency version is pinned once, in the `catalog` of `pnpm-workspace.yaml`. Each
  `package.json` refers to it with `"catalog:"`. Add new dependencies to the catalog with an
  exact version.
- Every `package.json` has `"private": true`, `"type": "module"` and
  `"license": "AGPL-3.0-only"`.
- Docker images are built from the repository root (`docker build -f apps/api/Dockerfile .`).
  The Dockerfiles copy each package's files by name, so a new workspace package or dependency
  between packages means updating their `COPY` lines.
- Never commit `.env`. `POSTGRES_PASSWORD` must be letters and digits only, because Compose
  puts it into `DATABASE_URL`.
- Currency codes (ISO 4217) and locales (BCP 47) are validated by `currencyCodeSchema` and
  `localeSchema` in `packages/shared/src/settings.ts`. Reuse them.
- Comments and docs are short and in plain English, and say why rather than what.

## Designs

`docs/designs/v1` has clickable designs, in the Harbor theme, for the six tabs (Dashboard,
Accounts, Records, Budgets, Analytics, Settings) and the Add record form. Open
`dashboard.html` in a browser. Build the app's colors from the tokens in `theme.css`, and
follow the color rules in that folder's README.md: each category keeps its color in every
chart, red is only for over the limit and for deleting, and category colors are always labelled.
The app has copies of `theme.css` and the parts of `components.css` it uses, in
`apps/web/src/styles/`. Copy more from the designs unchanged as screens need them.

An earlier design draft is in git history (`git show fbbd1c3:design_draft.md`). Parts of it no
longer match the code (it planned hosting on Supabase), so check with the user before
following it.
