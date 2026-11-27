# exTracker

An open-source personal expense tracker, built to be multi-user.

This is the project skeleton. It has a health check end to end (database, API, web app)
and no expense features yet. Screen designs for the planned app are in
[src/designs/v1](src/designs/v1/README.md).

## Layout

| Path | Contents |
| --- | --- |
| `apps/api` | Fastify API, Drizzle schema (`src/db/schema.ts`) and SQL migrations (`drizzle/`) |
| `apps/web` | React single-page app built with Vite, served by nginx in Docker |
| `packages/shared` | Zod schemas and the TypeScript types inferred from them, used by both apps |
| `docker-compose.yml` | `db`, `migrate`, `api` and `web` services |

The `accounts` table is a placeholder that proves migrations run. It is not the real data model.

## Requirements

- Docker with Compose v2, to run the stack.
- Node.js 26 and pnpm 12.23.0, only to run tests or develop outside Docker.
  The repository has an `.nvmrc`: `nvm install` then `npm install --global pnpm@12.23.0`.

## Run the stack

```sh
cp .env.example .env
# Set POSTGRES_PASSWORD in .env, for example to the output of: openssl rand -hex 24
docker compose up --build
```

Open http://localhost:8080. The page shows the API and database status.

Startup order: `db` becomes healthy, `migrate` applies pending migrations and exits with
code 0, then `api` starts, then `web`. nginx in `web` serves the app and proxies `/api/*` to
the API, so `/api/health` reaches the API's `GET /health`.

```sh
curl http://localhost:8080/api/health    # {"status":"ok","database":"up"}, or HTTP 503 with "down"
docker compose ps -a                     # migrate shows "Exited (0)"
docker compose logs -f api
docker compose down                      # stop; add -v to also delete the database volume
```

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
| `DEFAULT_CURRENCY` | `EUR` | api | Default currency for new users (ISO 4217). Not used until users exist |
| `DEFAULT_LOCALE` | `en-IE` | api | Default locale for new users (BCP 47). Not used until users exist |
| `WEB_PORT` | `8080` | web | Host port for the web app |
| `API_UPSTREAM` | built by Compose | web | Where nginx sends `/api` requests |
| `API_PROXY_TARGET` | `http://localhost:3000` | web dev server | Where `pnpm dev:web` sends `/api` requests |

## Tests and checks

```sh
pnpm install
pnpm test         # Vitest, API and web app
pnpm typecheck    # TypeScript strict mode, every package
pnpm build
```

The tests need no database: the API tests replace the database check.

## Database migrations

1. Change `apps/api/src/db/schema.ts`.
2. Run `pnpm db:generate`. drizzle-kit writes a new SQL file to `apps/api/drizzle/`.
3. Commit the SQL file. The `migrate` service applies it on the next `docker compose up`.

## Develop without Docker

Run Postgres 17 yourself, set `DATABASE_URL` (and optionally `API_HOST=127.0.0.1`) in `.env`, then:

```sh
pnpm db:migrate
pnpm dev:api    # http://localhost:3000/health, restarts on changes
pnpm dev:web    # http://localhost:5173, proxies /api to the API
```

Both read `.env` from the repository root and load `packages/shared` from its TypeScript source.

## Versions

Node.js 26 LTS, PostgreSQL 17, Fastify 5.12, Drizzle ORM 0.45, Zod 4, React 19, Vite 8,
TanStack Query 5, Vitest 5, TypeScript 7. Exact versions are pinned once, in the `catalog`
of `pnpm-workspace.yaml`.

## License

[GNU Affero General Public License v3.0](LICENSE) (`AGPL-3.0-only`). If you run a modified
version as a network service, you must offer its users the source code of your version.
