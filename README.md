# exTracker

An open-source personal expense tracker, built to be multi-user.

So far you can create an account, sign in and out, and see an empty dashboard. There are no
expense features yet. Screen designs for the planned app are in
[docs/designs/v1](docs/designs/v1/README.md).

## Layout

| Path | Contents |
| --- | --- |
| `apps/api` | Fastify API, sign-in with Better Auth, Drizzle schema (`src/db/schema.ts`) and SQL migrations (`drizzle/`) |
| `apps/web` | React single-page app built with Vite, served by nginx in Docker |
| `packages/shared` | Zod schemas and the TypeScript types inferred from them, used by both apps |
| `docker-compose.yml` | `db`, `migrate`, `api` and `web` services |

## Requirements

- Docker with Compose v2, to run the stack.
- Node.js 26 and pnpm 12.23.0, only to run tests or develop outside Docker.
  The repository has an `.nvmrc`: `nvm install` then `npm install --global pnpm@12.23.0`.

## Run the stack

```sh
cp .env.example .env
# In .env, set POSTGRES_PASSWORD to the output of: openssl rand -hex 24
# and AUTH_SECRET to the output of: openssl rand -base64 32
docker compose up --build
```

Open <http://localhost:8080>. It sends you to the sign-in page. Sign-up is closed until you open
it, so create the first account as described below.

Startup order: `db` becomes healthy, `migrate` applies pending migrations and exits with
code 0, then `api` starts, then `web`. nginx in `web` serves the app and proxies `/api/*` to
the API with the path unchanged: the API serves every route under `/api`.

```sh
curl http://localhost:8080/api/health    # {"status":"ok","database":"up"}, or HTTP 503 with "down"
docker compose ps -a                     # migrate shows "Exited (0)"
docker compose logs -f api
docker compose down                      # stop; add -v to also delete the database volume
```

## Accounts and sign-in

Users sign in with an email and a password of 12 to 128 characters. Users and sessions are kept
in the project's own Postgres. A session lasts 7 days and is extended while the app is in use.

### Create the first account

Sign-up is closed by default, so strangers cannot create accounts on a server they can reach.

1. In `.env`, set `AUTH_SIGNUP_ENABLED=true`, then run `docker compose up -d api`.
   (`docker compose restart` does not reread `.env`.)
2. Open the app, choose **Create an account**, and sign up. You are signed in straight away.
3. Set `AUTH_SIGNUP_ENABLED=false` again and run `docker compose up -d api`.

Do the same whenever someone else needs an account.

### Open the app at its configured address

`APP_URL` must be the address exactly as people type it in the browser: scheme, host and port.
Compose sets it to `http://localhost:${WEB_PORT}`. Any other address is refused, and the sign-in
page says to check `APP_URL`. `http://127.0.0.1:8080` and a LAN address such as
`http://192.168.1.20:8080` are different addresses from `http://localhost:8080`.

Session cookies are marked `Secure` only when `APP_URL` starts with `https://`, so the app also
works over plain HTTP inside your own network.

### Forgotten password

There is no outgoing email yet, so there is no reset link. Someone with shell access to the
server sets a new password instead. It also signs the user out everywhere.

```sh
docker compose exec api node dist/reset-password.js sam@example.com
```

The command asks for the new password twice and does not show it. It never takes the password
as an argument, because arguments end up in shell history. Outside Docker, run
`pnpm user:reset-password sam@example.com`.

### Behind another proxy

The API limits sign-in attempts per address, using the `X-Real-IP` header that nginx sets. If you
put another proxy in front of nginx, every user then shares that proxy's address and one limit.
Configure nginx's `real_ip` settings to trust your proxy. Limits are kept in memory, so they reset
when the API restarts.

## Environment variables

All configuration comes from environment variables. `.env.example` lists every one with a
comment. Never commit `.env`.

| Variable | Default | Used by | Purpose |
| --- | --- | --- | --- |
| `POSTGRES_USER` | `extracker` | db, migrate, api | Database user |
| `POSTGRES_PASSWORD` | none, required | db, migrate, api | Database password. Letters and digits only, because it is also put into a URL |
| `POSTGRES_DB` | `extracker` | db, migrate, api | Database name |
| `DATABASE_URL` | built by Compose | migrate, api | Postgres connection URL. Set it yourself only outside Docker |
| `API_HOST` | `0.0.0.0` | api | Address the API listens on |
| `API_PORT` | `3000` | api, web | API port inside the Compose network |
| `LOG_LEVEL` | `info` | api | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |
| `APP_URL` | `http://localhost:${WEB_PORT}` in Compose. Required outside it | api | Public address of the web app, exactly as people type it in the browser. Scheme, host and port must all match, or every sign-in is refused. Use `http://localhost:5173` with `pnpm dev:web` |
| `AUTH_SECRET` | none, required | api | Signs session cookies. At least 32 characters: `openssl rand -base64 32` |
| `AUTH_SIGNUP_ENABLED` | `false` | api | `true` lets anyone who can open the app create an account |
| `DEFAULT_CURRENCY` | `EUR` | api | Base currency of every new user (ISO 4217) |
| `DEFAULT_LOCALE` | `en-IE` | api | Locale of every new user (BCP 47) |
| `WEB_PORT` | `8080` | web | Host port for the web app |
| `API_UPSTREAM` | built by Compose | web | Where nginx sends `/api` requests |
| `API_PROXY_TARGET` | `http://localhost:3000` | web dev server | Where `pnpm dev:web` sends `/api` requests |

## Tests and checks

```sh
pnpm install
pnpm test         # Vitest, every package
pnpm typecheck    # TypeScript strict mode, every package
pnpm build
```

The tests need no database: the API tests run Better Auth on its in-memory adapter.

## Database migrations

1. Change `apps/api/src/db/schema.ts`.
2. Run `pnpm db:generate`. drizzle-kit writes a new SQL file to `apps/api/drizzle/`.
3. Commit the SQL file with `apps/api/drizzle/meta/`. The `migrate` service applies it on the
   next `docker compose up`.

If a change both drops a table and adds one, make it in two runs (drop, generate, then add,
generate). In one run drizzle-kit asks whether the table was renamed, and without a terminal that
question fails while drizzle-kit still exits with code 0. Check that the new SQL file exists.

The sign-in tables (`users`, `sessions`, `auth_accounts`, `verifications`) are generated from
Better Auth's options in `apps/api/src/auth.ts`:

```sh
pnpm auth:generate   # rewrites apps/api/src/db/auth-schema.ts; then run pnpm db:generate
pnpm auth:check      # after a Better Auth upgrade: fails if the tables are missing anything
```

## Develop without Docker

Run Postgres 17 yourself. In `.env`, set `DATABASE_URL`, `AUTH_SECRET`,
`APP_URL=http://localhost:5173`, and `AUTH_SIGNUP_ENABLED=true` if you need to create an account
(optionally also `API_HOST=127.0.0.1`). Then:

```sh
pnpm db:migrate
pnpm dev:api    # http://localhost:3000/api/health, restarts on changes
pnpm dev:web    # http://localhost:5173, proxies /api to the API
```

Both read `.env` from the repository root and load `packages/shared` from its TypeScript source.

## Versions

Node.js 26 LTS, PostgreSQL 17, Fastify 5.12, Better Auth 1.7, Drizzle ORM 0.45, Zod 4, React 19,
React Router 8, Vite 8, TanStack Query 5, Vitest 5, TypeScript 7. Exact versions are pinned
once, in the `catalog` of `pnpm-workspace.yaml`.

## License

[GNU Affero General Public License v3.0](LICENSE) (`AGPL-3.0-only`). If you run a modified
version as a network service, you must offer its users the source code of your version.
