# exTracker v2: Personal Finance Tracker (Version 1)

*   **Author:** nu1silva
*   **Status:** Draft
*   **Date:** 2026-10-30
*   **Predecessor:** [docs/designs/extracker_personal_finance.md](./docs/designs/extracker_personal_finance.md) (brainstorm brief; decision numbers D1–D19 below refer to its "Decisions already made" list)

--------------------------------------------------------------------------------

## Overview

exTracker v2 is a web app for tracking personal money across several bank and
wallet accounts, in several currencies. Version 1 has one user, the author, who
enters every transaction by hand. It answers three questions on one screen: how
much did I spend this month and on what, how much is in each account, and how
much do I have in total.

It replaces the author's old exTracker, a PHP and MySQL app. Version 1 is built
as a multi-user product from the start, so that it can later be offered to
paying users in the Netherlands and the EU, with bank import through a licensed
PSD2 provider. Version 1 itself has no billing, no public sign-up and no bank
import.

The system is a TypeScript API in front of a Postgres database and sign-in
service hosted by Supabase in the EU, with a React web app as the only client.

## The Problem

**The author's own need.** The author's money sits in several places: Dutch
bank accounts, and Wise and Revolut balances in more than one currency. The old
exTracker cannot represent this. Its data model (in git history,
`dbscripts/exTracker_mysql.sql`) has three tables (users, a flat category list,
and expenses with a date, description, category and amount). It has:

*   no accounts, so it cannot show balances or a total
*   no income and no transfers, so it can only list spending
*   no currencies, so every amount is assumed to be in one unnamed currency
*   no subcategories and no split transactions
*   server-rendered PHP pages with the logic inside them, so no other client
    (such as a phone app) can reuse it

The author wants one place that shows monthly spending by category, the balance
of every account, and the total across all accounts converted to euros, and
that stays accurate when checked against the bank.

**The longer-term need.** The author intends to turn this into a commercial
product for the Netherlands and the EU. Who it is for and why someone would pay
for it are not decided yet (see Open Questions). What can be decided now is
which groundwork is cheap to build today and expensive to add later: a
multi-user data model, real sign-in, exact money storage, stable record IDs,
account sharing in the data model, EU hosting and GDPR export. Version 1
builds only that groundwork. It does not build features whose value depends on
the undecided product position, such as billing or a marketing site.

**Proposed solution in one paragraph.** A single TypeScript API holds all
business rules and is the only way data is read or written. Transactions are
stored in three levels: the transaction, its legs (one per account it touches),
and category lines (how each person splits a leg across categories). Balances
and totals are always calculated from legs, never typed in. A React web app,
usable in a phone browser, lets the author add records in a few taps and view
the dashboard and four reports.

## Goals

Version 1 is successful when all of the following hold:

1.  **Daily use.** The author uses it as the only expense tracker for 4
    consecutive weeks after launch, entering transactions on the day they
    happen.
2.  **Fast entry on a phone.** Adding a single-category expense on a phone
    browser takes no more than 4 inputs (amount, category, account, save, with
    today's date and the last-used account as defaults) and under 15 seconds.
3.  **Balances match the bank.** At each month-end check, every account's
    balance in the app equals the bank's balance. Any difference is fixed by a
    visible adjustment transaction, never by editing a number directly (D7).
4.  **Correct totals.** Transfers between own accounts never appear in income
    or expense totals. Splits always add up exactly to their leg. Totals in the
    base currency follow the exchange-rate rules in D13.
5.  **Dashboard and reports.** The dashboard shows monthly spending by
    category, each account's balance and the total balance in the base
    currency. The four reports in D15 are available (spending by category with
    drill-down, income versus expenses per month, balance over time, CSV
    export). With 5,000 transactions, the dashboard loads in under 1 second.
6.  **Data isolation is tested.** Automated tests prove that one user cannot
    read or change another user's data through the API, and that Supabase's
    automatic Data API returns no application data (D12).
7.  **Ready for later growth without a rewrite.** The data model already
    supports more than one user, more than one member per account (D10),
    imported records (source and status fields), client-generated IDs, and
    translation of the interface (D18). Adding bank import, account-sharing
    screens or a mobile app must not require changing existing tables' keys or
    the API's existing endpoints.
8.  **Within budget.** Built within roughly 190 hours by 2027-01-31, and
    running for no more than €30 per month while the author is the only user
    (D19).

## Non-Goals

**Not in version 1, planned for later:**

*   Bank import through a PSD2 provider, and the matching and duplicate removal
    it needs. Renewal of bank access.
*   Budgets.
*   Screens for sharing an account with another user. The data model supports
    it (D10, D11); the interface does not.
*   Credit card accounts. A credit card bill is recorded as one expense in the
    fixed "Credit card bill" category (D8).
*   Installable phone app (PWA), offline entry, native iOS and Android apps
    (D17).
*   Moving data from the old exTracker, and importing bank statement files
    (D16).
*   Dutch interface (D18).
*   Billing, subscriptions, public sign-up, onboarding flows, admin tools,
    marketing site.
*   Receipt photos.

**Not in version 1, proposed here (not yet confirmed in the brief):**

*   Recurring and scheduled transactions. Each occurrence is entered by hand.
*   Crypto currencies and assets. Only ISO 4217 currencies are supported.

**Permanent, as currently decided:**

*   Liabilities (loans, mortgages) and assets that are not accounts
    (investments valued by hand, property). "Total balance" is only the sum of
    account balances.
*   A combined household total across the members of a shared account.

## Open Questions

**Product position (not blocking version 1; must be answered before signing a
bank-import contract or opening public sign-up):**

*   **Q1 – Position**: What makes this different from Wallet, Dyme, YNAB and
    the banks' own apps, and who is it for: individuals, households or
    freelancers?
*   **Q2 – Bank-import provider**: Which PSD2 providers will take on a small
    Dutch developer, at what cost per user, and with what legal duties (agent
    registration with DNB, a legal entity)? Does that fit a viable price?
*   **Q3 – Commercial success measure**: What result from version 1 would
    justify starting commercial work?

**Facts to verify during setup (from memory, not checked against live sources):**

*   **Q4 – Supabase Free tier**: Confirm that the Free tier, in the Frankfurt
    region, allows custom SMTP for sign-in emails, asymmetric JWT signing keys
    with a public JWKS endpoint, TOTP two-step login, and the Supavisor
    session pooler. Confirm when inactive Free projects pause.
*   **Q5 – Prices**: Confirm current monthly prices for Supabase Pro, Hetzner
    Cloud CX22 and a Hetzner Storage Box BX11, and recheck the €30 budget in
    the Technical Plan's cost table.

## Critical User Journeys (CUJs)

### CUJ 1: First-time setup

*   **Given**: The author has no account in the app.
*   **When**: They sign up with email and password, set base currency to EUR,
    and add three accounts: "ING Checking" (EUR, opening balance €2,140.00 on
    2026-11-01), "Wise USD" (USD, $310.00) and "Revolut EUR" (EUR, €85.50).
*   **Then**: Each account shows its opening balance. The total balance shows
    the sum in EUR, converting the USD balance at the latest ECB rate. A default
    set of categories exists, including the fixed "Credit card bill" category.

### CUJ 2: Record an expense at the till

*   **Given**: The author has just paid €23.40 at Albert Heijn with their ING
    debit card and has the app open in their phone browser.
*   **When**: They tap "Add", type 23.40, choose "Groceries", keep the
    default account "ING Checking" and today's date, and save.
*   **Then**: The record appears in Records. ING Checking's balance falls by
    €23.40. This month's Groceries spending rises by €23.40 on the dashboard.

### CUJ 3: Split a supermarket receipt

*   **Given**: A €61.00 receipt covers groceries and household items.
*   **When**: The author enters €61.00 and splits it into Groceries €45.25 and
    Household €15.75.
*   **Then**: The app refuses to save until the lines add up to €61.00. After
    saving, each category's monthly total rises by its own line.

### CUJ 4: Move money between currencies

*   **Given**: The author sends €500.00 from ING Checking to Wise USD, and Wise
    credits $538.20.
*   **When**: They record a transfer with both amounts.
*   **Then**: ING Checking falls by €500.00 and Wise USD rises by $538.20. The
    transfer does not appear in income or expense totals. The total balance
    changes only by the difference between the author's implied rate and the
    ECB rate used for display.

### CUJ 5: Month-end check against the bank

*   **Given**: The app shows €1,203.40 for ING Checking, but the bank shows
    €1,198.90 because a €4.50 coffee was never entered.
*   **When**: The author opens "Reconcile" on ING Checking and enters €1,198.90
    as the bank balance on 2026-11-30.
*   **Then**: The app creates a visible adjustment transaction of −€4.50 dated
    2026-11-30. The balance now matches the bank. The adjustment appears in the
    account's history and is labelled as an adjustment.

### CUJ 6: Pay the credit card bill

*   **Given**: The monthly credit card bill of €38.00 is collected from ING
    Checking.
*   **When**: The author records a €38.00 expense in the fixed "Credit card
    bill" category.
*   **Then**: ING Checking falls by €38.00. Spending reports show the amount
    under "Credit card bill", separate from regular categories.

### CUJ 7: Review where the money went

*   **Given**: A full month of records exists.
*   **When**: The author opens the "Spending by category" report for November
    2026 and taps "Food".
*   **Then**: The report shows Food's subcategories (Groceries, Restaurants)
    with totals, and tapping one lists the transactions behind it. Refunds
    reduce the category they belong to.

### CUJ 8: Export records

*   **Given**: The author has filtered Records to "Wise USD, 2026".
*   **When**: They choose "Export CSV".
*   **Then**: A CSV file downloads with one row per category line for the
    filtered records, including date, description, account, currency, amount,
    category and the transaction's ID.

## Technical Plan (Architecture)

### 1. System overview

```text
                       ┌──────────────────────────────────────────────┐
                       │ Hetzner Cloud CX22 (Germany)                 │
 Browser (phone or     │                                              │
 desktop)              │  Caddy (HTTPS, HSTS, CSP)                    │
 React SPA ──HTTPS────►│   ├─ /        → static web build (apps/web)  │
   │                   │   └─ /api/*   → Fastify API (apps/api)       │
   │                   │                  ├─ daily ECB rate job       │
   │                   │                  └─ pino JSON logs (14 days) │
   │                   │  nightly pg_dump job → Storage Box           │
   │                   └───────────────┬──────────────────────────────┘
   │                                   │ TLS, role extracker_api,
   │                                   │ Supavisor session pooler
   │ sign-in, token refresh            ▼
   └──────────────────────►  Supabase project (Frankfurt, eu-central-1)
                              ├─ Auth (email + password, TOTP, JWKS)
                              │    └─ sign-in emails via Brevo SMTP (EU)
                              └─ Postgres
                                   ├─ schema app   (all app tables; not exposed)
                                   └─ schema public (empty; Data API has nothing)
   API ──HTTPS──► ECB eurofxref (daily and historical rate files)
```

*   **The browser talks to Supabase only to sign in.** It uses `supabase-js`
    for sign-up, sign-in, password reset, TOTP and token refresh. It never
    reads or writes tables through Supabase.
*   **Every read and write goes through the API.** The browser sends the
    Supabase access token as `Authorization: Bearer <token>` to `/api/v1/...`.
    Web app and API share one origin, so there is no cross-origin (CORS)
    setup.
*   **One server.** Caddy serves the built web app and proxies `/api` to the
    API container. Both run under Docker Compose on one Hetzner CX22.

### 2. Repository layout and stack

A pnpm workspace with three packages. No Turborepo or Nx: `pnpm -r` runs
scripts across packages, which is enough for three packages.

| Package | Contents | Main libraries |
| :--- | :--- | :--- |
| `apps/api` | HTTP API, business rules, database access, rate job | Fastify 5, `fastify-type-provider-zod`, `@fastify/swagger`, Drizzle ORM with `drizzle-kit`, `pg`, `jose` (token checks), `node-cron`, `pino` |
| `apps/web` | React single-page app | React, Vite, React Router, TanStack Query, React Hook Form, Tailwind CSS with shadcn/ui components, Recharts, i18next, `supabase-js` (sign-in only), `openapi-fetch` |
| `packages/shared` | Zod schemas for API requests and responses, money helpers, generated OpenAPI types | Zod, `openapi-typescript` |

**Why these choices (Q15):**

*   **Fastify + Zod.** Zod schemas in `packages/shared` validate requests in
    the API, validate forms in the web app, and generate the OpenAPI document
    through `@fastify/swagger`. One schema definition serves all three.
    Fastify is mature, fast and has first-party plugins for everything needed
    here. NestJS adds a dependency-injection framework this project does not
    need; Hono's OpenAPI tooling is newer and less settled on Node.
*   **Drizzle ORM.** Tables are defined in TypeScript and `drizzle-kit`
    generates SQL migrations. Rules that Drizzle cannot express (grants,
    row-level security policies, constraint triggers) go in hand-written SQL
    migration files in the same folder, applied in order.
*   **`openapi-fetch`** gives the web app a typed API client generated from the
    OpenAPI document, so the future mobile app can use the same client.
*   **`node-cron` inside the API process** runs the daily rate fetch. A job
    queue (pg-boss) is not needed until bank sync.

### 3. Data model

All application tables live in a Postgres schema named `app`. Money is stored
as `bigint` minor units (cents for EUR). IDs are UUID version 7, generated by
the client for transactions and legs (D17) and by the API for everything else.

```text
users ─┬─< account_members >─ accounts ─< legs >─ transactions
       │                                   │
       ├─< categories ─────────────< category_lines (per leg, per user)
       ├─< manual_fx_rates
       └─< audit_log
accounts ─< reconciliations
currencies ─< fx_rates (ECB, EUR-based)
```

| Table | Key columns | Notes |
| :--- | :--- | :--- |
| `users` | `id` (= Supabase auth user ID), `email`, `display_name`, `base_currency`, `time_zone` (default `Europe/Amsterdam`), `locale`, `created_at` | One row per person. Created by the API on the first request (section 6). |
| `currencies` | `code` (ISO 4217), `minor_units` (0–3), `name` | Seeded from ISO 4217. Read-only. |
| `fx_rates` | `date`, `currency`, `per_eur` (`numeric(18,8)`) | ECB reference rates: 1 EUR = `per_eur` units. Primary key (`date`, `currency`). |
| `manual_fx_rates` | `user_id`, `currency`, `valid_from`, `per_eur` | Rates the user enters for currencies ECB does not publish (D13). |
| `accounts` | `id`, `name`, `type`, `currency`, `institution`, `archived_at`, `created_by` | `type` is one of `checking`, `savings`, `cash`, `wallet`, `other`, and `credit_card` (kept in the type list but not offered in v1, per D8). Unique (`id`, `currency`) so legs can reference both. |
| `account_members` | `account_id`, `user_id`, `role` (`owner` or `member`) | One `owner` row per account in v1 (D10). |
| `transactions` | `id`, `kind`, `date`, `description`, `payee`, `refund_of`, `source`, `external_id`, `created_by`, `created_at`, `updated_at` | Shared facts of the event. `date` is a plain calendar date. `source` is `manual` in v1 (`import` reserved). `external_id` is reserved for bank IDs. |
| `legs` | `id`, `transaction_id`, `account_id`, `currency`, `amount_minor`, `original_currency`, `original_amount_minor`, `status` | One per account touched. Negative = money leaving. Foreign key (`account_id`, `currency`) → `accounts`, so a leg's currency always equals its account's (D14). |
| `category_lines` | `id`, `leg_id`, `user_id`, `category_id`, `amount_minor`, `note` | How one user splits one leg (D11). Same sign as the leg. |
| `categories` | `id`, `user_id`, `parent_id`, `name`, `kind`, `system_key`, `sort_order`, `archived_at` | Owned by one user. Two levels at most. |
| `reconciliations` | `id`, `account_id`, `date`, `bank_balance_minor`, `adjustment_transaction_id`, `created_by` | Stored "balance on date" checks (section 3.5). |
| `audit_log` | `id`, `actor_id`, `entity`, `entity_id`, `action`, `before`, `after` (`jsonb`), `at` | Edit history (section 3.7). |

#### 3.1 Transaction kinds and their rules

The `kind` field decides the shape a transaction must have. The API checks
these rules before writing, and a deferred constraint trigger checks them again
when the database transaction commits.

| Kind | Legs | Sign | Allowed category kinds on lines | Created by |
| :--- | :--- | :--- | :--- | :--- |
| `expense` | 1 | negative | `expense` | Records screen |
| `income` | 1 | positive | `income` | Records screen |
| `refund` | 1 | positive | `expense` | Records screen; optional `refund_of` link to the original |
| `transfer` | 2, different accounts | one negative, one positive | `transfer` | Records screen |
| `adjustment` | 1 | either | `system` (`adjustment`) | Reconcile action only |
| `opening_balance` | 1 | either | `system` (`opening_balance`) | Account creation only |

Further rules:

*   A same-currency transfer's two legs must add up to zero. A cross-currency
    transfer stores both amounts as entered, with no check against the ECB
    rate (D13).
*   For each leg and each user who has lines on it, the lines must add up
    exactly to the leg's amount (checked at commit).
*   A line's category must belong to the line's user, and its kind must match
    the table above.
*   `original_currency` and `original_amount_minor` are optional on expense,
    income and refund legs, for foreign-currency card payments. They are shown
    but never used in totals.

#### 3.2 Which records count in which totals (Q4)

**A line's category kind decides where it counts, not the transaction kind.**
Spending is the sum of lines in `expense` categories, income is the sum of
lines in `income` categories, and `transfer` and `system` categories count in
neither.

| Record | Account balance and total balance | Spending by category | Income vs expenses report |
| :--- | :--- | :--- | :--- |
| Expense | Yes | Adds to its category | Expenses |
| Income | Yes | No | Income |
| Refund | Yes | Reduces its category | Reduces expenses |
| Transfer, both legs visible to the viewer | Yes | No | No |
| Transfer, one leg visible to the viewer (shared accounts only; cannot happen in v1) | Yes | Counts by the category the viewer picks | Counts by the category the viewer picks |
| Credit card bill (expense in system-keyed category) | Yes | Shown as its own row below regular categories | Expenses |
| Adjustment | Yes | No | Separate "Balance adjustments" row, so the report adds up to the change in balance |
| Opening balance | Yes | No | No |
| Leg with no lines for the viewer (shared accounts only) | Yes | "Uncategorised" row | Expenses if negative, income if positive |

Record status (section 3.6) does not affect any total. In v1, what the user
entered is the record of truth.

#### 3.3 Refunds and splits (Q5)

*   **A refund reduces spending in the month of the refund's own date,** not
    the month of the original purchase. That matches when the money comes back
    and what the bank shows. The `refund_of` link is optional and only used to
    show "Refund of …" in the interface.
*   **A category's monthly total can go below zero** if refunds exceed spending
    in that month. The report shows the negative number instead of hiding it.
*   **Splits stay inside one leg and one currency.** Lines must add up exactly;
    the form shows the remaining amount while typing and blocks saving until it
    is zero. The "split evenly" helper gives any leftover cent to the last line.

#### 3.4 Categories (Q9)

*   **Two levels:** parent and child. A transaction line can use either. Reports
    roll children up into their parent and allow drill-down.
*   **Kinds:** `expense`, `income`, `transfer`, `system`. A child has its
    parent's kind.
*   **Defaults:** on sign-up each user receives an editable copy of an English
    default set (for example Food › Groceries, Restaurants; Housing › Rent,
    Utilities; Transport › Public transport, Fuel; Income › Salary, Other
    income; Transfers › Savings, Between own accounts).
*   **System categories** have a fixed `system_key` (D18) and cannot be
    deleted; they can be renamed. Keys: `credit_card_bill` (expense),
    `transfer` (transfer, the default for transfers), `adjustment` (system),
    `opening_balance` (system).
*   **Deleting a category that has lines** requires choosing a replacement
    category of the same kind. The API moves the lines and deletes the category
    in one database transaction. "Merge" is the same operation. **Archiving**
    hides a category from pickers but keeps its history.

#### 3.5 Reconciliation (Q6)

*   Reconciling stores a row in `reconciliations`: account, date and the bank's
    balance on that date. If the app's balance on that date differs, the same
    database transaction creates an `adjustment` transaction for the difference,
    dated on the reconciliation date, and links it.
*   All legs of that account dated on or before the reconciliation date get
    status `reconciled`.
*   **No lock on older periods.** Editing a reconciled leg is allowed, but the
    account page then shows "Changed since reconciled on 30 Nov 2026" whenever
    the calculated balance on the latest reconciliation date no longer equals
    the stored bank balance. Locking adds work for a single user and would block
    fixing honest mistakes.

#### 3.6 Dates, time zones and statuses (Q7, Q8)

*   **The transaction date is a plain calendar date** (Postgres `date`), as the
    user sees it. No time-of-day is stored. A month is all dates from the 1st to
    the last day, with no time zone conversion.
*   **`users.time_zone`** (default `Europe/Amsterdam`) is used only to decide
    what "today" and "this month" mean for API defaults. The web app sends the
    browser's date when it creates a record.
*   **Leg status** has three values: `uncleared` (default for manual entry),
    `cleared` (reserved for bank import: the bank has confirmed it) and
    `reconciled` (covered by a reconciliation). In v1 a leg moves only from
    `uncleared` to `reconciled`, through the reconcile action, and back to
    `uncleared` if its amount, date or account is edited.

#### 3.7 Edit history and deletion (Q10)

*   Every create, update and delete of an account, category or transaction
    writes one `audit_log` row in the same database transaction. For
    transactions, `before` and `after` hold the whole transaction with its legs
    and the actor's lines.
*   **No history screen in v1.** The record view shows "Edited on …". The data
    exists for a later history screen and for debugging.
*   Deleting a transaction is a hard delete of the transaction, its legs and
    lines; the audit row keeps the last state.
*   **Retention:** audit rows are kept as long as the user's account exists and
    are deleted with it (section 7).

### 4. Exchange rates (D13)

*   **Fetching.** A `node-cron` job in the API runs daily at 16:30 and again at
    18:00 Europe/Amsterdam time. It downloads ECB's daily reference rate file and
    upserts the rows into `fx_rates`. On startup, the API checks whether any
    banking day in the last 90 days is missing and, if so, downloads ECB's
    historical file and fills the gaps. The first deployment loads the full
    history from 1999 (about 200,000 rows). Failures are logged and retried at
    the next run; the app keeps working with the last known rate.
*   **Rate for a date.** For currency C on date d, use the latest `fx_rates`
    row for C with `date <= d`. If none exists, use the latest `manual_fx_rates`
    row for that user and currency with `valid_from <= d`. If neither exists,
    the amount is left out of base-currency totals and the total shows a warning
    naming the currency.
*   **Conversion.** To convert amount A from currency X to base currency B on
    date d: `A × per_eur(B, d) / per_eur(X, d)`, with `per_eur(EUR) = 1`.
    Conversion and summing happen in SQL `numeric` with no rounding; the API
    rounds once, half to even, to B's minor units before returning the figure.
*   **Which date.** Spending and income reports convert each line at its
    transaction date. Account balances and the total balance convert at today's
    rate. The balance-over-time report converts each point at that point's
    date.
*   **API format.** Converted amounts are returned as `{ "amountMinor": 123456,
    "currency": "EUR", "approximate": true }`, where `approximate` is `true`
    whenever a conversion was involved.

### 5. API

**Conventions (Q14):**

*   **Base path** `/api/v1`. Within v1, changes are additive only (new fields,
    new endpoints). A breaking change means `/api/v2`.
*   **Money in JSON** is always an object `{ "amountMinor": -2340, "currency":
    "EUR" }`. `amountMinor` is a JSON integer; values are limited to ±(2^53 − 1),
    far above any real balance. Postgres `bigint` values are converted with a
    range check.
*   **Errors** use the RFC 9457 `application/problem+json` format, with a
    machine-readable `code` (for example `split_mismatch`,
    `leg_currency_mismatch`) and, for validation errors, a list of field paths.
*   **Retry-safe creates:** transactions are written with `PUT
    /transactions/{id}`, where the client generates the UUID. Sending the same
    request twice gives the same result. The same pattern is used for accounts
    and categories.
*   **Lists** use cursor pagination ordered by (`date` descending, `id`
    descending), 50 items per page by default.

**Endpoints:**

| Method and path | Purpose |
| :--- | :--- |
| `GET /me`, `PATCH /me`, `DELETE /me` | Profile (name, base currency, time zone); delete account (section 7) |
| `GET /accounts`, `PUT /accounts/{id}`, `GET /accounts/{id}`, `POST /accounts/{id}/archive` | Accounts with calculated balances. Creating an account takes an opening balance and date and creates the `opening_balance` transaction in the same database transaction. |
| `GET /accounts/{id}/reconciliations`, `POST /accounts/{id}/reconciliations` | Reconcile (section 3.5) |
| `GET /categories`, `PUT /categories/{id}`, `POST /categories/{id}/archive`, `POST /categories/{id}/merge` | Category tree; merge moves lines to a target and deletes the source |
| `GET /transactions`, `GET /transactions/{id}`, `PUT /transactions/{id}`, `DELETE /transactions/{id}` | Records. Filters: `from`, `to`, `accountId`, `categoryId`, `kind`, `q` (text search in description and payee), `cursor` |
| `GET /currencies`, `GET /fx-rates?date=`, `PUT /fx-rates/manual/{currency}/{validFrom}` | Currency list, rates in use, manual rates |
| `GET /reports/dashboard?month=` | Month's spending by parent category, all balances, total balance |
| `GET /reports/spending?from=&to=&accountId=&parentId=` | Spending by category with drill-down |
| `GET /reports/income-expense?months=12` | Income, expenses and adjustments per month |
| `GET /reports/balance?from=&to=&accountId=&interval=day\|week\|month` | Balance over time per account or total |
| `GET /exports/transactions.csv?<same filters as /transactions>` | CSV export, one row per category line (CUJ 8) |
| `GET /openapi.json` | OpenAPI document (served in development only) |

**Transaction write payload (shape):**

```text
PUT /api/v1/transactions/{id}
{
  kind: "expense" | "income" | "refund" | "transfer",
  date: "2026-11-14",
  description: string, payee?: string, refundOf?: uuid,
  legs: [
    { id: uuid, accountId: uuid, amount: Money,
      original?: Money,
      lines: [ { categoryId: uuid, amount: Money, note?: string } ] }
  ]
}
```

For a transfer with no lines given, the API adds one line in the user's
`transfer` system category. `adjustment` and `opening_balance` cannot be sent
here.

**Shared accounts (D11), rule for edits:** when a leg's amount changes, the API
deletes other members' lines on that leg. Those members then see the leg as
"Uncategorised" and must categorise it again. The rule "lines add up to the leg"
can then always be enforced. In v1 there are no other members, so this path
only runs in tests.

**Reports are calculated by SQL queries on each request**, with indexes on
`legs (account_id)`, `transactions (date)`, `category_lines (user_id,
category_id)` and `account_members (user_id)`. No cached totals in v1.

### 6. Sign-in and data access (Q11, Q12)

*   **Token check.** The API checks each request's Supabase access token
    against the project's public keys (JWKS endpoint), using `jose` with key
    caching. It checks signature, expiry, issuer and audience
    (`authenticated`). The token's `sub` is the user ID. Supabase's default
    access-token lifetime (1 hour) and refresh handling by `supabase-js` are
    kept.
*   **Two-step login (TOTP).** Settings › Security lets the user enrol an
    authenticator app through Supabase Auth. If the user has a verified factor,
    the API rejects tokens whose `aal` claim is not `aal2`. The author enrols
    before entering real data.
*   **First request creates the profile.** If no `users` row exists for `sub`,
    the API creates it (base currency EUR, time zone `Europe/Amsterdam`) and
    copies the default categories, in one database transaction. No trigger on
    Supabase's own `auth.users` table, so the app does not depend on Supabase
    internals.
*   **Supabase Data API locked out (D12).** All tables are in schema `app`,
    which is not in the Data API's exposed schemas. A migration revokes all
    privileges on schema `app` from `anon`, `authenticated` and `public`.
*   **Database roles.** Migrations run as the project owner. The API connects as
    `extracker_api`, which may only select, insert, update and delete in schema
    `app` and cannot change tables, roles or grants.
*   **Row-level security as a second layer: on.** Every API request runs inside
    one database transaction that starts with `set_config('app.user_id',
    <sub>, true)`. Policies on each table allow only rows the user may see:
    rows linked to accounts they are a member of, and rows in `categories`,
    `category_lines`, `manual_fx_rates` and `audit_log` owned by them. If an API
    query forgets a filter, Postgres still returns nothing from other users.
    The cost is one extra statement per request and policy joins on
    `account_members`, which the indexes above cover.
*   **Connection.** The API uses Supabase's Supavisor pooler in session mode
    with a pool of at most 5 connections.

### 7. Operations, cost and GDPR (Q13, Q16)

**Hosting:**

*   **API and web:** Hetzner Cloud CX22 in Germany, Ubuntu LTS, Docker Compose
    with two services (`caddy`, `api`). Caddy obtains TLS certificates
    automatically. Deploy is a GitHub Actions workflow that builds images, runs
    migrations, then restarts the API container.
*   **Database and sign-in:** Supabase project in Frankfurt. Starts on the Free
    tier.
*   **Sign-in emails:** Brevo (France) as custom SMTP for Supabase Auth, on its
    free tier.
*   **No external error tracking in v1.** Errors go to the API's logs. One user
    can read logs; an error-tracking service would add a processor for little
    gain.

**Backups and restore:**

*   A nightly cron job on the Hetzner server runs `pg_dump` of schema `app`,
    encrypts it with `age`, and copies it to a Hetzner Storage Box. Thirty
    daily copies are kept.
*   The restore procedure (into a fresh Supabase project) is written in
    `infra/README.md` and tested once before real data is entered.
*   When the project moves to Supabase Pro, Supabase's own daily backups are
    added. The Storage Box is dropped to stay within budget, and the nightly
    dump keeps 7 copies on the server's disk instead.

**Monthly cost:**

| Stage | Supabase | Hetzner CX22 | Storage Box | Brevo | Total (approx.) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Build and first use (Free tier) | €0 | ~€5 | ~€4 | €0 | ~€9 |
| After moving to Supabase Pro | ~€23 | ~€5 | dropped | €0 | ~€28 |

Move to Pro when the Free tier's limits are reached or the project pauses. All
prices are approximate and must be checked (Open Question Q5).

**GDPR baseline (D15, Q16):**

*   **Export:** the CSV export in section 5.
*   **Account deletion:** Settings › Account › "Delete my account" (confirmed by
    typing the email address). In one database transaction, the API deletes the
    user's accounts where they are the only member, all their transactions on
    those accounts, their categories, lines, manual rates, reconciliations and
    audit rows, and their `users` row. It then deletes the Supabase auth user
    through the Supabase admin API. Copies in backups disappear as backups
    expire (at most 30 days); the privacy note says so.
*   **Processors:** Supabase (Frankfurt), Hetzner (Germany), Brevo (France).
    Listed in a short privacy note in the app.
*   **Logging:** request logs hold time, method, route pattern, status code,
    duration and user ID. They never contain amounts, descriptions, payees,
    tokens or email addresses. Kept for 14 days.
*   **Web security:** a strict Content-Security-Policy with no third-party
    scripts, because `supabase-js` keeps the session in the browser's local
    storage, where an injected script could read it.

### 8. Web app

**Routes:**

| Route | Screen |
| :--- | :--- |
| `/login`, `/signup`, `/reset-password` | Supabase sign-in screens |
| `/` | Dashboard: this month's spending by parent category, account balances, total balance |
| `/accounts`, `/accounts/:id` | Account list grouped by institution; account history and Reconcile |
| `/records`, `/records/:id` | Filterable list; record detail and edit |
| `/records/new?kind=` | Add form (also opened by the "+" button on every screen) |
| `/reports/spending`, `/reports/income-expense`, `/reports/balance` | The three reports; Records filters drive the CSV export |
| `/settings/profile`, `/settings/categories`, `/settings/currencies`, `/settings/security`, `/settings/account` | Profile and base currency; categories; manual rates; TOTP; delete account |

**Quick add (Goal 2):** the "+" button opens the expense form with the amount
field focused and a numeric keyboard. Account defaults to the last-used
account, date to today, and category shows the user's five most-used categories
as buttons above the full list. Saving needs amount and category only. Kind
switches (expense, income, refund, transfer) sit at the top of the form.

**Layout:** mobile-first. Below 768 px wide, navigation is a bottom bar
(Dashboard, Records, +, Reports, More). Above, it is a side bar.

**Formatting and text:** all text through i18next with an English resource
file. Amounts and dates through `Intl.NumberFormat` and
`Intl.DateTimeFormat` with the browser's locale (D18).

## Alternatives Considered

### Product direction

#### Alternative A: Use an existing app (Wallet, Firefly III, Actual Budget)

*   **Pros**: No build time. Wallet already has Dutch bank import and EU
    hosting; Firefly III and Actual Budget are open source and can be
    self-hosted.
*   **Cons**: No path to the author's own commercial product. Self-hosted tools
    would still need hosting and upkeep.
*   **Reason for Rejection**: Building the product is part of the goal, and
    version 1 is the groundwork for a commercial app. Weakness kept on record:
    the commercial position is not decided (Open Question Q1), so this
    rejection rests on the author's intent, not on a proven gap in the market.

#### Alternative B: Extend the old PHP exTracker

*   **Pros**: Already works and has a login, categories and reports.
*   **Cons**: No accounts, currencies, income, transfers or splits. Logic is
    inside server-rendered pages, so no other client can reuse it. Adding the
    missing parts changes every table.
*   **Reason for Rejection**: The changes needed touch the whole data model and
    the whole interface, which is a rewrite in all but name.

### Platform and stack

#### Alternative C: Supabase-native (clients read and write tables through the Data API, protected by row-level security only)

*   **Pros**: Less code: no separate API server. Supabase's normal pattern,
    with the most examples.
*   **Cons**: Business rules (transfers, splits that must add up, refunds,
    reconciliation) would live in database policies, triggers and client code.
    The future mobile app would have to repeat client-side logic. Any policy
    mistake exposes data directly to the internet.
*   **Reason for Rejection**: Correct money rules need one place that enforces
    them. A single API keeps them in TypeScript, tested, and shared by every
    client (D2, D12).

#### Alternative D: Own sign-in (Better Auth, Keycloak or Zitadel) on own Postgres, no Supabase

*   **Pros**: No vendor; everything EU-hosted by the author; no US-owned
    processor.
*   **Cons**: The author runs the database, its backups, upgrades and the
    sign-in service. Password reset, email and two-step login become the
    author's responsibility.
*   **Reason for Rejection**: Too much operations work for a 190-hour budget.
    Supabase's data is plain Postgres and can be moved; users are the harder
    part to migrate (password hashes and TOTP secrets), which is accepted.

#### Alternative E: Next.js with server rendering instead of a Vite single-page app

*   **Pros**: One framework for the app and a later marketing site; server
    rendering.
*   **Cons**: Server rendering adds a second runtime and caching rules. The
    whole app sits behind a login, where server rendering brings little.
*   **Reason for Rejection**: Complexity without benefit for a logged-in app. A
    marketing site, if needed, can be built separately.

#### Alternative F: Flutter for web and mobile

*   **Pros**: One codebase for web, iOS and Android.
*   **Cons**: Flutter's web output is weaker for data-heavy screens (text
    selection, accessibility, load size). No code sharing with a TypeScript
    API.
*   **Reason for Rejection**: Web comes first and matters most in version 1.
    React with React Native later still shares types, validation and the API
    client.

#### Alternative G: NestJS or Hono instead of Fastify

*   **Pros**: NestJS gives a fixed structure for large teams. Hono with
    `@hono/zod-openapi` defines routes, validation and OpenAPI in one place.
*   **Cons**: NestJS adds dependency injection and decorators this project does
    not need. Hono's OpenAPI tooling on Node is younger.
*   **Reason for Rejection**: Fastify with Zod covers the same needs with less
    framework code and a longer track record.

#### Alternative H: Installable PWA or native app first

*   **Pros**: Better for recording expenses at the till; a home-screen icon.
*   **Cons**: Offline entry needs a local queue, sync and conflict handling.
    Native apps add app-store work. Both delay version 1.
*   **Reason for Rejection**: The author chose web only for version 1 (D17).
    The mobile layout, client-generated IDs and retry-safe writes keep the path
    open.

#### Alternative I: Job queue (pg-boss) for background work

*   **Pros**: Retries, scheduling and job history; needed later for bank sync.
*   **Cons**: Another dependency and tables, for one daily job.
*   **Reason for Rejection**: One daily rate fetch does not justify a queue. Add
    it with bank sync.

### Data model

#### Alternative J: One flat table of records (like the old app)

*   **Pros**: Simplest to build and to query; one row per record.
*   **Cons**: Transfers need two rows linked by convention or special columns.
    Splits need a second table anyway. Cross-currency transfers and per-user
    categories do not fit.
*   **Reason for Rejection**: Every special case would become its own column or
    rule. The three-level model (D9) fits all cases in one structure.

#### Alternative K: Data owned by a ledger with members, or by a single user

*   **Pros**: Ledger: one membership check covers everything a household
    shares. Single user: the simplest checks.
*   **Cons**: Ledger: does not match how real joint accounts work, where only
    some accounts are shared. Single user: no sharing later without changing
    every permission check.
*   **Reason for Rejection**: Sharing per account (D10) matches joint bank
    accounts and costs one table in version 1.

#### Alternative L: One shared category list per shared account

*   **Pros**: Each transaction has one set of category lines; no repeated
    categorising.
*   **Cons**: Members must agree on one category list, and one member's edits
    change the other's reports.
*   **Reason for Rejection**: The author chose personal categorising (D11). Cost
    accepted: each member categorises shared transactions themselves.

#### Alternative M: Credit cards as accounts that can go below zero

*   **Pros**: Card purchases keep their categories and land in the right month.
    The bill is a transfer.
*   **Cons**: Adds negative balances and card debt to the total in version 1.
*   **Reason for Rejection**: The author's card spending is under 2% of monthly
    spending (D8). Revisit before commercial launch.

#### Alternative N: One account holding several currencies

*   **Pros**: Mirrors how Wise and Revolut present one account.
*   **Cons**: A leg's currency could differ from its account's, which is a
    common source of balance bugs. Balances become lists, not numbers.
*   **Reason for Rejection**: One currency per account (D14), grouped by an
    institution field.

#### Alternative O: Store base-currency amounts when a record is written

*   **Pros**: Faster reports; no rate join at read time.
*   **Cons**: Changing the base currency, or correcting a rate, means
    rewriting stored amounts. Stored figures go stale.
*   **Reason for Rejection**: Calculating when read is fast enough for one user
    (D13). Cached monthly totals can be added before commercial scale.

### Security and integrity

#### Alternative P: No row-level security; filters in API queries only

*   **Pros**: Simpler queries; no per-request `set_config`; easier debugging.
*   **Cons**: One missing filter in one query leaks another user's data.
*   **Reason for Rejection**: Leaking financial data would end a commercial
    product. The cost (one statement per request, policy joins) is small.

#### Alternative Q: Lock periods before the last reconciliation

*   **Pros**: Reconciled balances cannot change by accident.
*   **Cons**: Honest mistakes in old records need an unlock flow. Extra work for
    one user.
*   **Reason for Rejection**: A visible "changed since reconciled" warning gives
    most of the benefit without blocking corrections.

*Drafted with EGM*
