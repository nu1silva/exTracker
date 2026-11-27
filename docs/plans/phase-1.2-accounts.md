# Phase 1.2: Accounts

- **Status:** Proposed. Revised after review: archiving postponed, one owner per account confirmed
- **Date:** 2026-11-27
- **Branch:** `feature/accounts` (proposed)

## Goal

A signed-in person can add the places their money is kept (bank accounts, savings, wallets such
as Wise or Revolut, and cash), each with its own currency and an opening balance. They see them on
a new Accounts tab, grouped by institution, with a total for each currency, and in an Accounts card
on the dashboard. They can edit and delete their accounts. Nobody can see or change another
person's accounts.

These are the first rows the API stores itself, so this phase also sets the rules that every later
table follows: how money is stored, how rows are tied to their owner, and how the tests reach a
database.

## Scope

**In:**

- An `accounts` table, owned by one user.
- `GET`, `POST`, `PATCH` and `DELETE` routes under `/api/accounts`.
- Shared Zod schemas for accounts, and a fixed ISO 4217 table of currencies and their minor units.
- An Accounts tab: accounts grouped by institution, a details card for the selected account, and a
  form to add or edit one.
- An Accounts card on the dashboard.
- API tests on PGlite (Postgres in WebAssembly) instead of Better Auth's memory adapter.
- Error logs cleaned of query values in one place, for our routes and for Better Auth.

**Out, left for later phases:**

- Transfer, Reconcile, the daily balance chart and the account's records list from
  `docs/designs/v1/accounts.html`. All four need records.
- Archiving accounts (D11).
- Exchange rates, and a total converted to the base currency.
- Sharing an account with another user.
- Credit card accounts, loans and other debts.
- Choosing the order of accounts, or giving them colors or icons.
- Changing the base currency. Settings will do that.
- The Add record button, and the Records, Budgets, Analytics and Settings tabs.

## Decisions

D1, D2, D3, D8 and D11 are the project owner's decisions. The others are proposals; change them here before building.

| # | Decision | Why |
| --- | --- | --- |
| D1 | Accounts only. Transfer, Reconcile, the balance chart and the records list wait for the Records phase | Chosen by the project owner. All four need records, which do not exist yet. |
| D2 | Totals are given per currency, for example "€2,225.50 and $310.00 across 3 accounts". No exchange rates yet | Chosen by the project owner. Converting needs a daily rate download, a rates table and a plan for when ECB cannot be reached. That gets its own phase. |
| D3 | The API tests run on PGlite. Better Auth uses its Drizzle adapter on PGlite in the tests too | Chosen by the project owner. The tests then apply the real migrations and run the real SQL, constraints and ownership filters, still with no Postgres server. Users and accounts live in the same database, so the foreign key from accounts to users holds in the tests. |
| D4 | The opening balance and its date are columns on `accounts`. The opening balance is the balance at the end of `opening_date`, as a bank statement shows it. The API returns a separate `balanceMinor`, which equals the opening balance in this phase | There is no records table yet (D1). Fixing the meaning of the date now means the Records phase can count records from the next day without reinterpreting what people typed in. The response keeps its shape when records are added to the sum. The earlier design draft planned the opening balance as a record of its own; if we still want that, moving it later is one insert per account. |
| D5 | Money is stored as `bigint` minor units (cents for EUR) and sent as JSON integers whose names end in `Minor` | Integers add up exactly, and the name says the unit. One amount may be at most 10^13 − 1 minor units (99,999,999,999.99 EUR), so sums of many accounts stay well inside JavaScript's safe integers. Zod 4's `z.int()` refuses unsafe integers, so a sum that grew too large fails loudly. |
| D6 | Minor units come from a fixed ISO 4217 table in `packages/shared`, not from `Intl`. `currencyCodeSchema` checks the same table | `Intl`'s default decimals differ from ISO: on Node 26 it gives HUF 0, IQD 0, COP 0 and IDR 0, where ISO 4217 says 2, 3, 2 and 2. They can also change with an ICU update, and browsers differ. A stored amount must never change its meaning. `Intl.supportedValuesOf('currency')` also still lists codes ISO has withdrawn (BGN, HRK, SLL, ZWL) and misses VED. Codes are only ever added to the table, never removed. |
| D7 | An account's currency cannot change once the account exists | Every later record on the account is in its currency, so changing it would change what each amount means. A wrong currency is fixed by deleting the account and adding it again, which is always possible in this phase (D12). |
| D8 | One owner per account, in `accounts.user_id`. No membership table | Chosen by the project owner. The earlier draft planned `account_members` for sharing, which has no screens planned yet. Every query that touches accounts lives in one module and filters by the user, so adding members later changes that module and adds one migration. |
| D9 | Types: `checking`, `savings`, `wallet`, `cash` and `other`. Stored as `text` with a `CHECK` constraint, not a Postgres enum | These cover the designs. Credit cards stay out because their balances run below zero (the draft's D8). A later migration can change a `CHECK` in one statement; Postgres cannot drop a value from an enum. |
| D10 | Account names are unique per user, ignoring case | The record form will pick accounts by name, so two accounts called "Savings" would be confusing. A unique index enforces it even when two requests arrive at once. |
| D11 | No archiving in this phase. It comes with the Records phase | Chosen by the project owner. Archiving is for closed accounts, and an account can only be emptied by a transfer, which needs records. Until then, deleting removes an account added by mistake. |
| D12 | An account can be deleted while no records use it, which is always true in this phase | The Records phase makes records refer to accounts with `ON DELETE RESTRICT`, so Postgres refuses to delete an account that has records. |
| D13 | Routes are `GET /api/accounts`, `POST /api/accounts`, `PATCH /api/accounts/:id` and `DELETE /api/accounts/:id`. Another user's account, a missing one and a malformed id all answer `404` | The Accounts tab always shows the whole list, so it needs no `GET /api/accounts/:id` yet. A `403` would tell a stranger that the id exists. No version in the path, as in phase 1.1's D8. |
| D14 | Request bodies are parsed with the shared Zod schemas inside the handler. They are not converted to Fastify JSON Schemas | `z.toJSONSchema` drops refinements (checked: `z.string().refine(…)` becomes `{"type":"string"}`), so Fastify would accept currency codes the schema refuses. Strict objects refuse unknown keys, so a body cannot set `userId`, or `currency` on an edit. |
| D15 | Amount fields accept `.` or `,` as the decimal mark. Only when exactly three digits follow a single separator does the user's locale decide whether it is a decimal mark or a thousands separator | A phone's decimal keypad follows the phone's region, not the app's locale, so a person using `en-IE` may only have `,` on their keypad. `2140,5` can only mean one thing, but `12.345` has decimals in `en-IE` (and so is refused for euros) and means twelve thousand in `nl-NL`. |
| D16 | The add and edit forms open in a side drawer, a native `<dialog>`, at `/accounts/new` and `/accounts/:id/edit` | The designs open the record form the same way. A `<dialog>` opened with `showModal()` keeps focus inside and closes on Escape with no extra code. With its own address, the browser's Back button closes it. |

## Design

### Data model

`apps/api/src/db/accounts-schema.ts`, re-exported from `schema.ts`:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid`, primary key, `default gen_random_uuid()` | As the auth tables. Not `uuidv7()`, which only exists from Postgres 18 (see Risks) |
| `user_id` | `uuid`, not null, references `users(id)` `on delete cascade` | Deleting a user deletes their accounts, as GDPR erasure needs |
| `name` | `text`, not null | 1 to 100 characters, trimmed |
| `institution` | `text`, null | Bank or provider, up to 100 characters. Null when empty |
| `type` | `text`, not null, `CHECK (type in (…))` | D9 |
| `currency` | `text`, not null, `CHECK (currency ~ '^[A-Z]{3}$')` | The API checks the code against the shared table (D6). The `CHECK` only stops nonsense |
| `opening_balance_minor` | `bigint`, not null, default `0` | Drizzle `bigint(…, { mode: 'number' })`. Can be negative, for an overdrawn checking account |
| `opening_date` | `date`, not null | The balance is at the end of this day (D4). Drizzle `date(…, { mode: 'string' })`, so it stays `YYYY-MM-DD` and never passes through a time zone |
| `created_at`, `updated_at` | `timestamptz`, not null, default `now()` | `updated_at` is set by the update query |

Indexes: a unique index `accounts_user_name_key` on `(user_id, lower(name))` for D10. It also
serves every list query, because they all start with `user_id`.

Run `pnpm db:generate` to make migration `0003`. Nothing is dropped, so drizzle-kit asks no
questions. Check that the generated SQL has the expression index and both `CHECK`s.

### Shared package

**`packages/shared/src/currencies.ts`**: `CURRENCY_MINOR_UNITS`, a frozen object from code to
minor units, for every currency in ISO 4217 List One with numeric minor units, leaving out funds
(`IsFund="true"`, such as CLF and UYI). Metals and testing codes have no minor units (`N.A.`), so
they drop out on their own. Generate it once from the XML that SIX publishes and commit the
result. The list published on 2026-09-17 has 155 such codes. Most have 2 minor units:

- 0: BIF, CLP, DJF, GNF, ISK, JPY, KMF, KRW, PYG, RWF, UGX, VND, VUV, XAF, XOF, XPF
- 3: BHD, IQD, JOD, KWD, LYD, OMR, TND

A comment says where the table came from and that entries are added, never removed (D6).
`currencyMinorUnits(code)` reads it.

**`settings.ts`**: `currencyCodeSchema` checks `Object.hasOwn(CURRENCY_MINOR_UNITS, code)` instead of
`Intl.supportedValuesOf`. This also fixes a weakness phase 1.1 left: the browser parses `/api/me`
with its own `Intl` list, so a browser whose list lacks the user's base currency shows the
Retry screen instead of the app. The schema gets stricter: `DEFAULT_CURRENCY` is checked with it
(`apps/api/src/config.ts`), so a server set to a code that is not in the table, such as BGN or
HRK, refuses to start after this change. The default, `EUR`, is in the table.

**`packages/shared/src/accounts.ts`**:

- `ACCOUNT_TYPES` and `accountTypeSchema` (`z.enum`, since the project has no TypeScript `enum`).
- `MAX_AMOUNT_MINOR` (10^13 − 1) and `amountMinorSchema`: `z.int()` from −`MAX_AMOUNT_MINOR` to `MAX_AMOUNT_MINOR`.
- `accountNameSchema`: trimmed, 1 to 100 characters. `institutionSchema`: trimmed, at most 100
  characters, empty becomes `null`.
- `createAccountInputSchema`: `z.strictObject({ name, institution?, type, currency, openingBalanceMinor, openingDate })`.
  `openingDate` is `z.iso.date()`, which refuses dates that do not exist (checked: `2026-02-30`
  and `2025-02-29` fail, `2024-02-29` passes).
- `updateAccountInputSchema`: `z.strictObject` with `name`, `institution`, `type`,
  `openingBalanceMinor` and `openingDate`, all optional. No `currency` (D7).
- `accountSchema`: `id`, `name`, `institution` (nullable), `type`, `currency`, `openingBalanceMinor`,
  `openingDate` and `balanceMinor` (`z.int()`).
- `accountsResponseSchema`: `{ accounts: Account[], totals: { currency, balanceMinor }[] }`.

Response schemas are built from plain pieces, never from input pieces that transform.
`toResponseSchema()` calls `z.toJSONSchema`, which throws "Transforms cannot be represented in
JSON Schema" (checked with Zod 4.6.7), so an `accountSchema` that reused `institutionSchema` would
stop `buildApp`. `institution` in `accountSchema` is `z.string().nullable()`.

### API

**Dependencies.** `AppDependencies` gains `db`, the Drizzle database. `server.ts` passes
`database.db`. The tests pass Drizzle on PGlite. Its type is
`PgDatabase<PgQueryResultHKT, typeof schema>` from `drizzle-orm/pg-core`. Both drivers fit it
(checked by compiling with TypeScript 7 against drizzle-orm 0.45.4 and PGlite 0.5.16).

**`apps/api/src/accounts.ts`**: every query that touches `accounts`. Each function takes the user
id and puts `user_id = $user` in the same statement as the id, so no code path loads a row first
and checks the owner afterwards. This file is the one place D8 has to change if sharing arrives.

- `listAccounts(db, userId)`: ordered by `lower(name)`. `balanceMinor` is computed in the select
  (in this phase, the opening balance), so the Records phase changes one expression.
- `createAccount(db, userId, input)`.
- `updateAccount(db, userId, id, input)`: one `update … where id = $id and user_id = $user
  returning …`. No row means the account is not the user's, or does not exist.
- `deleteAccount(db, userId, id)`: returns whether a row was deleted.
- A unique violation on `accounts_user_name_key` becomes a `409 ACCOUNT_NAME_TAKEN` error. Drizzle
  wraps database errors in `DrizzleQueryError` and keeps the Postgres error on `cause`
  (drizzle-orm 0.45.4, `pg-core/session.js`), so check `cause.code === '23505'` and
  `cause.constraint` (checked on PGlite: the constraint is the index name). Relying on the index,
  not a lookup first, stays correct when two requests arrive together.

**`apps/api/src/account-routes.ts`**: a Fastify plugin, like `auth-routes.ts`. Every route uses
`{ preHandler: app.requireSession }`, so writes get the origin check from phase 1.1.

| Route | Success | Errors |
| --- | --- | --- |
| `GET /api/accounts` | `200` `accountsResponseSchema`. `totals` has one entry per currency, base currency first, then by code | `401` |
| `POST /api/accounts` | `201` `accountSchema` | `400 INVALID_INPUT`, `401`, `403 INVALID_ORIGIN`, `409 ACCOUNT_NAME_TAKEN` |
| `PATCH /api/accounts/:id` | `200` `accountSchema` | `400`, `401`, `403`, `404 NOT_FOUND`, `409 ACCOUNT_NAME_TAKEN` |
| `DELETE /api/accounts/:id` | `204`, no body | `401`, `403`, `404 NOT_FOUND` |

- The `:id` is parsed with `z.uuid()`. A malformed id answers `404` before any query runs, because
  Postgres would answer a bad UUID with an error and so a `500`.
- `parseBody(schema, body)` runs `safeParse` and throws an error with `statusCode: 400` and
  `code: 'INVALID_INPUT'`. The error handler in `app.ts` already turns that into `{ code, message }`.
  The message names the first field that failed, for example `name: Use at most 100 characters`.
- Responses keep using `toResponseSchema()`. A `toAccountResponse(row)` function maps rows to the
  response's fields, so columns such as `user_id` never reach the client.

**Logs stay free of money data.** A `DrizzleQueryError`'s message contains the query parameters:
account names and amounts, and on sign-up the email and password hash. The Postgres error's
`detail` repeats values too (checked on PGlite: `Key (user_id, lower(name))=(…, ing checking)
already exists.`), and PGlite's own errors also carry `query` and `params`. Clean errors in one
place:

- `apps/api/src/log.ts` exports `cleanError(error)`. For a `DrizzleQueryError` it keeps the query
  text (it has placeholders, not values) and the Postgres `code`, `message`, `table` and
  `constraint` from `cause`. It drops `params` and `detail`. Other errors pass through pino's
  usual error serializer.
- `buildApp` sets `serializers: { err: cleanError }` on the logger options it is given. Every
  `log.*({ err })` call is then covered: the error handler in `app.ts`, the one in
  `auth-routes.ts`, and every later one.
- Better Auth logs failures through its own logger, not pino (`onError` in better-auth 1.7.28,
  `dist/api/index.mjs`), and logs the whole error object. `createAuth` sets
  `onAPIError.onError` to print `cleanError(error)` with `console.error`, which is where Better
  Auth's logger writes, and to stay quiet when `LOG_LEVEL` is `silent`. Check in the 1.7.28 types
  what `onError` receives, and that Better Auth's response to the client is unchanged. This path
  dates from phase 1.1; it is fixed here because the cause is the same.

### Test database

`apps/api/test/support.ts`:

- `createTestDatabase()` starts PGlite, wraps it with `drizzle-orm/pglite`, and applies the
  migrations in `apps/api/drizzle` with `drizzle-orm/pglite/migrator`. It runs once per test file.
- `buildTestApp(overrides)` becomes `async`. It clones that migrated database with PGlite's
  `clone()`, so each test starts empty, and passes the clone both to `createAuth` (through
  `drizzleAdapter`, `transaction: true`, as `createDatabaseAuth` does) and to `buildApp` as `db`.
  Closing the app closes the clone. Every existing API test changes to `await buildTestApp()`.
  `overrides` replaces dependencies: `health.test.ts` builds its own app today with the memory
  adapter and its own `checkDatabase`, and switches to `buildTestApp({ checkDatabase })`.
- Measured on this machine with PGlite 0.5.16: starting takes about 640 ms, and a clone of a small
  database 75 to 110 ms.
- **PGlite has one connection.** Inside `db.transaction()`, a query on `db` instead of `tx` waits
  for the transaction to end, and so waits forever (checked: it timed out after 3 s). On Postgres
  the same mistake runs on another pooled connection, outside the transaction. Inside a
  transaction, use only `tx`. In the tests, a mistake shows up as Vitest's 5-second test timeout.
- The session-refresh test fakes only `Date` (`vi.useFakeTimers({ toFake: ['Date'] })`), so it
  does not freeze PGlite's own timers.
- Add `@electric-sql/pglite` to the catalog at exactly `0.5.16`, released 2026-11-09, and to the
  API's dev dependencies. 0.6.0 is only four days old. Dev dependencies are left out of the Docker
  image (`pnpm deploy --prod`), so the image does not grow.

### Web app

**Fetching** (`src/api.ts`): add `sendJson(method, path, body, schema, fetchImpl)` next to
`fetchJson`. It sends `content-type: application/json` only when there is a body, because Fastify
refuses an empty body labelled JSON. `DELETE` sends no body. Same-origin `POST`, `PATCH` and
`DELETE` requests carry `Origin` on their own, so `requireSession`'s check passes.

**When a session ends.** Accounts are the first data the app loads besides `/api/me`, and only the
`me` query sends people to sign in (`RequireUser`). `src/session-ended.ts` exports
`onSessionEnded(queryClient)`, an error handler that, for an `UnauthorizedError`, invalidates
`meQueryKey`. `main.tsx` passes it to the `QueryClient`'s `QueryCache` and `MutationCache`. The
`me` query then answers 401, and `RequireUser` sends the person to `/login?next=…` as for any other
ended session. Other errors are left to the page.

**Files:**

| File | Contents |
| --- | --- |
| `src/money.ts` | `parseAmount(text, currency, locale)` returns minor units or an error message. It ignores spaces (French groups with U+202F), accepts a leading `-` or `−`, treats the last `.` or `,` as the decimal mark when one to the currency's minor units of digits follow it (D15 for the three-digit case), and refuses anything else, including more decimals than the currency has. `formatMoney(minor, currency, locale)` builds the decimal string from the integer (`214000` and EUR give `"2140.00"`) and passes that string to `Intl.NumberFormat` with exactly the currency's minor units, so no amount is divided as a float. Negative amounts use the minus sign `−`, as the designs do. `formatTotals(totals, locale)` joins totals with `Intl.ListFormat` ("€2,225.50 and $310.00") |
| `src/dates.ts` | `todayIsoDate()` from the browser's local date, not `toISOString()`, which gives the UTC date and is a day off near midnight. `formatDate(iso, locale)` formats with `timeZone: 'UTC'`, because `new Date('2026-11-01')` is UTC midnight and would show 31 October west of Greenwich |
| `src/session-ended.ts` | `onSessionEnded(queryClient)`, above |
| `src/accounts.ts` | `accountsQuery` (key `['accounts']`), `createAccount`, `updateAccount`, `deleteAccount`, each taking `fetchImpl`. Each change invalidates `['accounts']` |
| `src/account-groups.ts` | `groupAccounts(accounts, locale)`: accounts grouped by institution, compared trimmed and ignoring case (`Intl.Collator` with `sensitivity: 'base'`), each group named with its first account's spelling. Groups and accounts are sorted by name with the same collator, and accounts with no institution come last under "Other" |
| `src/account-errors.ts` | `messageForAccountError(error)`: plain sentences for `ACCOUNT_NAME_TAKEN`, `NOT_FOUND` ("This account no longer exists"), `INVALID_INPUT`, and the phase 1.1 messages for `INVALID_ORIGIN` and unknown errors |
| `src/AccountsPage.tsx` | Runs the query and renders `AccountsView`, a props-only view for the tests |
| `src/AccountForm.tsx` | The drawer. `AccountFormView` is props-only. `AccountFormDrawer` opens the `<dialog>` and goes back to the account when it closes (below) |
| `src/AccountsCard.tsx` | The dashboard card |

**Accounts tab** (`/accounts` and `/accounts/:id`), from `docs/designs/v1/accounts.html`:

- Heading "Accounts", and below it the totals and count, for example "€2,225.50 and $310.00 across
  3 accounts". With no accounts: "No accounts yet".
- An "Add account" button, linking to `/accounts/new`. No Transfer button (D1).
- On the left, one card per institution group, with the group's total when it has more than one
  account and they all share a currency. Each account is a link with its name, type, balance and,
  when every account shares one currency and the total is above zero, its share "37% of total".
  The selected link has `aria-current="true"`.
- On the right, the selected account (`/accounts` selects the first one): name, balance as the
  large figure, "Opening balance €2,140.00 on 1 Nov 2026", and an "Edit account" link. No
  Reconcile button and no chart (D1). Where the records will go: "No records yet. Until records can
  be added, the balance is the opening balance."
- While the list loads, a loading line. If it fails, "Cannot load your accounts" with a Retry
  button, inside the page, so the header and tabs stay.
- An unknown `:id`, for example one deleted in another tab, redirects to `/accounts`.
- With no accounts at all: a short explanation and the Add account button, in place of both columns.
- On phones the details card wraps below the list, as in the designs.

**Add and edit form** (D16):

- Fields: Name; Institution (an `<input list>` that suggests the institutions already used, so
  "bunq" stays one group); Type; Currency (a `<select>` of the shared table, each option labelled
  with `Intl.DisplayNames`, the base currency first and selected); Opening balance
  (`inputmode="decimal"`, the currency code shown beside it, and below it the amount as it will be
  saved, for example "€2,140.00", so a misread separator shows before saving); Balance on
  (`type="date"`, today by default, with the hint "The balance at the end of this day, as your bank
  shows it", D4).
- When editing, Currency is shown but disabled, with the hint "The currency can't be changed.
  Delete this account and add it again instead." (D7).
- The form checks its values with the shared schemas before sending. A field's error appears
  under it, linked with `aria-describedby`. A server error appears in the form's `aria-live`
  region, as on the sign-in page.
- When editing, the form also offers "Delete account". It uses `btn-danger`, red under the color
  rules because it deletes, and asks again inside the drawer before it deletes.
- After a save the drawer closes onto the saved account. After a delete it closes onto `/accounts`.
- `AccountFormDrawer` calls `showModal()` only when the dialog is not already open, and does not
  close it in the effect's cleanup. `main.tsx` renders inside `StrictMode`, which runs effects
  twice in development, and a `close()` there would fire the close event and navigate away at once.

**Dashboard.** Below the welcome line, an Accounts card as in `dashboard.html`: each account with
its name, type and balance, and an "All accounts" link. With no accounts, a link to add the first
one. While loading and on failure, the card shows the same loading line and Retry as the Accounts
tab, and the rest of the dashboard stays. The System status card stays.

**Navigation.** The header gains the Accounts tab after Dashboard, as phase 1.1's D9 planned.

**Styles.** Copy from `docs/designs/v1/components.css`, unchanged: `.figure`, `.tnum`, `.right`,
`.row` and `.btn-danger`. The designs draw the Accounts layout and the record drawer with inline
styles, which the Content-Security-Policy refuses, so they become classes in `app.css`. Add
`.row[aria-current="true"]` next to the design's `aria-pressed` rule, because the rows are links here.

## Steps

Each step leaves `pnpm test` and `pnpm typecheck` passing.

1. **Tests on PGlite (D3).** Add the dependency, `createTestDatabase()` and the async
   `buildTestApp(overrides)`, and move every existing API test to it, `health.test.ts` included.
   Nothing else changes yet. This step comes first because it carries the most uncertainty: if
   PGlite turns out too slow or awkward, we can change course before any accounts code depends on
   it. Done when the suite passes with no memory adapter, and its run time is noted in the pull
   request.
2. **Currency table.** Add `currencies.ts`, switch `currencyCodeSchema` to it, with tests.
3. **Account schemas.** Add `packages/shared/src/accounts.ts` and export it from `index.ts`, with tests.
4. **Table and migration.** Add `accounts-schema.ts`, run `pnpm db:generate`, and read the `0003`
   SQL. Done when `docker compose up --build` applies it on Postgres 17 and `\d accounts` in `psql`
   shows the columns, both `CHECK`s and the unique index.
5. **Logs.** Add `log.ts`, the serializer in `buildApp` and Better Auth's `onAPIError.onError`, with
   the log tests below. Before the accounts routes, so their errors are clean from the start.
6. **API.** Add `db` to `AppDependencies`, `accounts.ts`, `account-routes.ts` and the error mapping,
   with the API tests below.
7. **Web.** Add `sendJson`, `onSessionEnded`, the money and date helpers, the fetchers, the tab, the
   page, the drawer and the dashboard card, with the web tests below.
8. **Docs.**
   - **README.md:**
     - "The tests need no database" now says they run Postgres in-process with PGlite;
     - the opening lines mention the Accounts tab;
     - the `DEFAULT_CURRENCY` row says it must be a current ISO 4217 code, and that withdrawn
       codes such as BGN and HRK stop the API from starting;
     - the README says "account" for a sign-in ("create an account", "Accounts and sign-in");
       reword those to "sign-in" or "user" so the word means money accounts only.
   - **CLAUDE.md:**
     - the test database: PGlite, `buildTestApp()` is async, and no Postgres 18-only SQL;
     - inside `db.transaction()`, use only `tx`, because PGlite has one connection;
     - `db` in `AppDependencies`, and the rule that queries filter by user in the same statement;
     - money: `bigint` minor units, `…Minor` names, the currency table, formatting from strings;
     - request bodies parsed with Zod in the handler (D14), and response schemas without transforms;
     - errors are logged as `{ err }`, so `cleanError` keeps query values out of the logs;
     - a page that loads data relies on `onSessionEnded` for 401s, and shows its own loading and
       Retry states;
     - remove "Money accounts will need the name `accounts`", which is now done.
9. **End-to-end check** (below), in Docker and in development.

## Tests

The new tests keep to the project's rules: no Postgres server and no jsdom.

**API** (`app.inject()` on PGlite):

- **Signed out and cross-site:** each route answers `401` without a session. `POST`, `PATCH` and
  `DELETE` answer `403 INVALID_ORIGIN` without `Origin` and with `Origin: https://evil.example`.
- **Create:** answers `201` and matches `accountSchema`, with a UUID `id`, a trimmed `name`,
  `institution: null` for an empty one, and `balanceMinor` equal to `openingBalanceMinor`.
  `MAX_AMOUNT_MINOR` and its negative come back exactly. The response has no `userId`.
- **Refused input, each `400 INVALID_INPUT`:** an unknown currency (`XAU`, `BGN`, `eur`); a type
  that is not in the list; an empty name and one of 101 characters; an amount of `1.5`, above the
  limit, or sent as a string; `openingDate` `2026-02-30`; a body with `userId`.
- **Names:** a second "ING checking" for the same user answers `409 ACCOUNT_NAME_TAKEN`, and so
  does renaming another account to it. A different user can use the same name.
- **List:** only the signed-in user's accounts, ordered by name. `totals` has one entry per
  currency, the base currency first.
- **Edit:** changes the fields it is given and leaves the rest. A body with `currency` answers
  `400`. `{}` changes nothing and answers `200`.
- **Delete:** answers `204`, and the account is gone from the list. Deleting it again answers `404`.
- **Other users' accounts:** with B's cookie, `PATCH` and `DELETE` on A's account answer `404`, and
  A's account is unchanged afterwards. B's list does not include it.
- **Malformed id:** `PATCH /api/accounts/not-a-uuid` answers `404`, not `500`.
- **Deleting a user** deletes their accounts (the foreign key's `on delete cascade`).
- **Logs**, captured through a pino stream:
  - a database failure during `POST /api/accounts` answers `500`, and the log lines contain neither
    the account name nor the amount, but do contain the Postgres error code;
  - a database failure during sign-up answers `500`, and neither pino's lines nor Better Auth's
    `console.error` output contain the email or the password hash;
  - `cleanError` on a `DrizzleQueryError` keeps the query text and `constraint`, and drops `params`
    and `detail`.
- **The phase 1.1 tests** still pass, now with Better Auth on PGlite.

**Shared:**

- The currency table has 155 codes. EUR has 2 minor units, JPY 0, BHD 3 and HUF 2. It has no
  funds and no metals (CLF, XAU).
- `currencyCodeSchema` accepts EUR and USD, and refuses `eur`, `BGN` and `XAU`.
- The account schemas: trimming, length limits, the amount limit, and strict objects refusing
  unknown keys.
- `accountsResponseSchema` converts with `z.toJSONSchema` without throwing.

**Web** (Node, `renderToStaticMarkup` inside `MemoryRouter`):

- `parseAmount`, with EUR and locale `en-IE` unless noted:
  - `2140`, `2140.00`, `2,140.00`, `2.140,00`, `2 140,00` and `2140,5` give 214000, 214000, 214000,
    214000, 214000 and 214050;
  - `-12.30` and `−12.30` give −1230;
  - `2,14` gives 214, because a thousands separator needs three digits after it;
  - `12.345` is refused (too many decimals), but in `nl-NL` it gives 1234500;
  - with JPY, `1,234` gives 1234 and `1.5` is refused;
  - with BHD, `1.234` gives 1234 (three minor units);
  - `abc`, an empty field and an amount above the limit are refused.
- `formatMoney`: `€2,140.00`; `−€12.30` with the true minus sign; JPY with no decimals; HUF with two
  decimals, although `Intl` would show none; 9,999,999,999,999 minor units shown exactly.
- `formatTotals`: one currency, two, and three joined with "and".
- `formatDate` gives 1 Nov 2026 for `2026-11-01` in any time zone. `todayIsoDate` uses local date parts.
- `groupAccounts`: "bunq" and "Bunq" form one group named after the first account; sorting; "Other" last.
- `onSessionEnded`, with a fake `QueryClient`: an `UnauthorizedError` invalidates `['me']`; any
  other error does nothing.
- Fetchers, with a fake `fetch`:
  - `createAccount` sends a JSON `POST` to `/api/accounts` and parses the `201`;
  - `updateAccount` sends `PATCH` to the account's path;
  - `deleteAccount` sends `DELETE` with no body and no `content-type`;
  - an error body comes back as an `ApiRequestError` with the API's code;
  - a 401 throws `UnauthorizedError`.
- `messageForAccountError`: each code above, and an unknown one.
- `AccountsView`:
  - the loading line, and the error with Retry;
  - the empty state;
  - groups with their totals and balances;
  - the selected account's details;
  - no Transfer or Reconcile button.
- `AccountFormView`:
  - every field is labelled;
  - Currency is disabled when editing;
  - the Balance on hint says the end of the day;
  - Delete has `btn-danger`;
  - a field error is linked with `aria-describedby`.
- `AppShell` has an Accounts tab. The dashboard's Accounts card lists accounts, links to adding
  one when there are none, and shows the loading line and Retry.

## End-to-end check

Run in Docker (`docker compose up --build`), signed in as the first user from phase 1.1.

1. The `migrate` service exits with code 0, so Postgres 17 accepted migration `0003`.
2. The header has an Accounts tab. It shows "No accounts yet" and an Add account button.
3. Add "ING Checking" (ING, Checking, EUR, `2.140,00` on 1 Nov 2026), "Wise USD" (Wise, Wallet,
   USD, `310`) and "Revolut EUR" (revolut, Wallet, EUR, `85.50`). The heading reads "€2,225.50 and
   $310.00 across 3 accounts", and the accounts are grouped by institution. Add a fourth account
   with institution "Revolut": it joins the same group.
4. Adding a second "ing checking" shows that the name is taken.
5. Edit ING Checking: rename it, change the opening balance. Currency cannot be changed.
6. Delete Wise USD after confirming. The heading shows euros only.
7. The dashboard's Accounts card lists the accounts and links to the tab.
8. Sign out in a second tab. Back in the first tab, open Add account and save: the app sends you
   to the sign-in page, and after signing in you are back on Accounts.
9. Stop the `api` container and reload the Accounts tab. It shows "Cannot load your accounts" with
   Retry, under the header. Start `api` again and press Retry.
10. Open sign-up, create a second user in a private window, then close sign-up again. The second
    user sees no accounts. With the second user's cookie, `curl -X PATCH` on one of the first
    user's account ids, with `Origin` set to `APP_URL`, answers `404`. The same request without
    `Origin` answers `403`.
11. At 375 px wide the page has no horizontal scroll, and the details card sits below the list.
12. In `psql`: `accounts` has the rows, with `opening_balance_minor` in cents and `user_id` set,
    and `drizzle.__drizzle_migrations` lists four migrations.
13. `docker compose logs api` shows no account names, amounts or email addresses, including from
    step 9.

In development, run Postgres, `pnpm db:migrate`, `pnpm dev:api` and `pnpm dev:web`, then repeat
steps 2 to 6 on port 5173.

## Risks

- **PGlite runs Postgres 18; production runs 17.** PGlite 0.5.16 reports PostgreSQL 18.6, and it
  accepts `uuidv7()`, which Postgres 17 does not have. A migration or query using something new in
  18 passes the tests and fails in production. Step 4 and end-to-end check 1 apply the migration
  on Postgres 17, and CLAUDE.md gets the rule. Both use the libc locale provider, and PGlite's
  `lower('ÄRZTE')` gives `ärzte`, so the case-insensitive name check should behave the same; the
  tests use ASCII names.
- **PGlite has one connection.** Code that queries `db` inside a transaction hangs in the tests
  and quietly runs outside the transaction in production. The CLAUDE.md rule and the 5-second
  test timeout catch it. Better Auth routes its own calls inside a transaction to the transaction
  (`@better-auth/core`, `context/transaction.mjs`), which step 1 confirms in practice.
- **PGlite is young.** It is at 0.x and releases often. Pin an exact version and run the whole
  suite on each upgrade. If it gets in the way, the fallback is the "Memory fake" option the owner
  turned down: an interface with an in-memory version for tests.
- **Test run time.** Each API test file pays about 0.6 s to start PGlite and apply the migrations,
  and each test about 0.1 s to clone. Fine for now. If the suite grows slow, share one database
  per file and give each test its own users.
- **A stricter currency check can stop a running server.** A server whose `DEFAULT_CURRENCY` is a
  withdrawn code (Node 26 accepted ANG, BGN, CUC, HRK, SLL, XDR, XSU and ZWL) refuses to start
  after the upgrade, with the schema's message. The README says so.
- **Amount input can be ambiguous.** When exactly three digits follow one separator, the locale
  decides (D15), and a person whose keypad does not match their locale can get the other reading.
  The form shows the amount as it will be saved while the person types, so a misreading is visible
  before saving.
- **Better Auth's error hook is unfamiliar.** `onAPIError.onError` replaces Better Auth's own
  error logging. If its arguments differ from what the code reading suggests, the sign-up log test
  fails in step 5.
- **Currency table upkeep.** A new ISO currency needs a code change. Removing an entry would break
  accounts that use it, so entries stay forever.
- **The "share of total" note only appears with one currency.** Until exchange rates arrive
  (D2), a person with accounts in two currencies sees no percentages. This goes away with exchange
  rates.
- **For later phases.**
  - **Records:**
    - refer to accounts with `ON DELETE RESTRICT` (D12);
    - add records dated after `opening_date` to `balanceMinor` (D4);
    - bring archiving (D11). Archive only at a zero balance, and decide whether names stay unique
      among archived accounts (D10), so that a closed "ING Checking" need not block a new one.
  - **Sharing:** changes `accounts.ts` and adds a membership table (D8).
