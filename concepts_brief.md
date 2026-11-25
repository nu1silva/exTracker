# exTracker (new): Personal Finance and Expense Tracker

* **Author:** nu1silva
* **Date:** 2026-10-30

## Overview

exTracker (new) replaces the author's old PHP and MySQL expense tracker with a new app. Version 1 has one user, the author. It is still meant to be built as a multi-user commercial product from the start, so it can later be sold to paying users in the Netherlands and the rest of the EU. Wallet by BudgetBakers is the product it is compared with.

The proposed design:
- A TypeScript API holds all business logic, and every read and write goes through it. The API publishes an OpenAPI description that is used to generate typed clients.
- Supabase, hosted in an EU region, provides only two things: the Postgres database and user sign-in.
- Version 1 is a React web app. A React Native (Expo) mobile app follows later.
- Version 1 is manual entry only. It has five sections: Dashboard, Accounts, Records, Analytics/Reports and Settings.
- It supports expenses, income and transfers between accounts, categories, accounts in more than one currency with ECB exchange rates, opening balances, and balance adjustments.
- The data model is meant to be ready for importing transactions from banks later, through a licensed PSD2 provider.

Six reviewers looked at the concept: design, technical accuracy and reuse, scope, readability, readiness to build, and document structure. This brief combines their findings and removes duplicates.

Overall verdict: the basic technical choices are sound and should be kept. These are money stored as whole numbers of cents, transfers saved as one all-or-nothing operation, a single API as the only way to write data, and a shared TypeScript codebase. At review time the concept was not ready for a design document. Three things were missing (status after the 2026-10-30 clarification round in brackets):
1. A decision on which of its two goals comes first: replacing the author's own tool, or building a product people will pay for. [Personal tool first; positioning deliberately undecided, with a deadline before any bank-import contract.]
2. A defined shape for the transaction data. [Resolved: decision 9.]
3. Concrete rules for data isolation, currencies and GDPR. [Isolation and currencies resolved: decisions 10–14. GDPR detail remains for the design draft.]

## Analysis

Findings are grouped by theme. Risks and objections come first. Severity: 🔴 Blocker (must be settled before drafting), 🟡 Major (must be settled in the design), 🟢 Nit (minor).

### 1. Purpose and commercial case

- 🔴 **Two goals pull in opposite directions.** Replacing the author's own tool calls for the cheapest thing that works. Building a commercial product calls for a reason customers would switch, an early test with real users, and bank import. Version 1 does none of the commercial work, yet the personal tool still carries the cost of the commercial groundwork. Pick which goal comes first, and name the event that moves the project from one to the other.
- 🔴 **Nothing says why someone would pay for this instead of an existing app.** The alternatives include Wallet and Spendee (both from BudgetBakers, a Czech, EU-based company that already offers Dutch bank import), YNAB, Monarch, Lunch Money, Dyme (Dutch), and the free insights in the ING, ABN AMRO, Rabobank and bunq apps. "Hosted in the EU" is the only advantage the concept implies, and Wallet already has it. Write a one-paragraph hypothesis of what makes this different and who it is for: individuals, couples and households, or Dutch freelancers who need VAT tracking.
- 🔴 **The paid value depends on bank import, which is postponed and has unverified cost.** Apps that only allow manual entry are free or nearly free, and people tend to stop using them. The commercial case therefore rests on the bank-import work, and that work has open risks:
  - GoCardless Bank Account Data (formerly Nordigen) was widely reported to stop accepting new customers in 2025.
  - Tink and Yapily mostly sign enterprise contracts with minimum fees.
  - The per-user cost may take up a large share of a €3–8 monthly subscription.
  - Working under another company's licence may require registering as its agent with De Nederlandsche Bank (DNB), the Dutch regulator, and may require a legal entity, contracts and a data protection impact assessment.
  - Get written quotes and terms from two or three providers before committing. Enable Banking and Salt Edge are the most likely to work with a solo developer.
- 🟡 **Existing tools already cover the personal version 1 scope.** Firefly III and Actual Budget can both be self-hosted in the EU at no cost. Both already do multi-currency, splits, reconciliation, credit cards and file import. If the real goal is "I want to build it", say so, and keep the commercial groundwork to a minimum. Either way, borrow their data models rather than inventing a new one. Firefly III and Maybe are AGPL-licensed, so read them for ideas only and do not copy their code into a closed product. Actual Budget is MIT-licensed.
- 🟡 **Manual entry on a desktop-first web app is the hardest way to use a tracker.** People record spending on their phone at the till. Two cheaper fixes:
  - Make the web app installable on phones as a Progressive Web App (PWA). This costs little and may delay the native app.
  - Add statement file import from Dutch banks (CSV, CAMT.053 or MT940). This removes most manual typing without a licence, consent renewals or a provider contract. It also tests the import and duplicate-detection fields early.

### 2. Shape of transaction data (the ledger)

- 🔴 **The core data shape is not decided.** Several behaviours are each described separately, with no single model behind them:
  - transfers with two sides
  - transfers between currencies that store both amounts
  - splits
  - refunds
  - opening balances
  - adjustments
  - later, matching imported records against manual ones

  A flat "one row per record" table cannot hold all of these without special cases. Changing the shape after real or imported data exists means migrating everything. All six reviewers recommend one model, the same pattern Firefly III, Beancount and other ledger tools use:
  - a **transaction** (date, note, source, status)
  - one or more **legs**, each with account, amount and currency: one leg for an expense or income, two for a transfer
  - one or more **category lines** per leg, which is how splits work

  Every record kind is expressed in that model. The database itself should enforce the rules, not only the API:
  - category lines add up exactly to their leg
  - a transfer has exactly two legs, on different accounts belonging to the same owner
  - an account balance is always the sum of its legs, never a separately stored number that can drift
- 🔴 **Terms overlap and are never defined.** "Record", "transaction", "leg", "split", "refund", "adjustment" and "opening balance" are used for overlapping things. The Records section "adds transactions". Refunds and adjustments act like extra record types but are not listed as types. Two developers would build different databases from this text. A glossary is needed, along with how many of each item can exist, for example "a transaction has one or more legs". Also choose one rule for signs: either amounts carry a plus or minus sign, or amounts are always positive and the record type gives the direction.
- 🔴 **Nothing says which records count toward which totals.** For spending, income, account balance, total balance and category reports, it is not stated how each of these is treated:
  - refunds
  - adjustments
  - opening balances
  - uncleared records
  - transfers, which are excluded from totals but still have categories
  - credit card bill payments
  - split lines

  Write this down as a table: record kinds as rows, totals as columns. Reviewers suggest leaving opening balances and adjustments out of income and expense totals, by kind, the same way transfers are left out.
- 🟡 **Refunds.** The concept doesn't say whether a February refund for a January purchase lowers February or January, whether a category total can go below zero, or whether a refund links to the original purchase. It also doesn't cover partial refunds or refunds in another currency. Reviewers suggest treating a refund as money coming back into an expense category, counted in the month of the refund, with an optional link to the original.
- 🟡 **Splits.** Undecided:
  - whether one split can cover several accounts or currencies
  - whether part of a split can be a transfer, for example cash back at the till
  - how a leftover cent is assigned

  Reviewers suggest that one split stays within one leg and one currency, and that the leftover cent goes to the first or largest line by a fixed rule.
- 🟡 **Opening balance and reconciliation.** Undecided:
  - whether the opening balance is a field on the account or a dated record
  - whether records dated before it are allowed
  - whether "reconcile" and "balance adjustment" are the same action, and what reconcile does step by step

  A fixed adjustment amount becomes wrong as soon as the user adds an older transaction dated before it. Two options: store the reconciliation as "balance on date X was Y" and work out the adjustment from it, or lock edits before the last reconciled date. Reviewers suggest storing the opening balance as a dated record of kind "opening".
- 🟡 **Dates and months.** "Transaction date decides the month" doesn't say whether the date is a calendar date or a timestamp, or which time zone sets month boundaries. A purchase at 23:30 can land in the wrong month. Store a calendar date and keep the user's time zone in their profile. Bank import will add a booking date and a value date, so decide now which one sets the month.
- 🟡 **Editing rules.** Undecided:
  - whether one side of a transfer can be edited or deleted on its own
  - whether a record can change type or account
  - what happens to records when their category or account is deleted

  All changes to a transaction's legs and lines should go through one all-or-nothing action.

### 3. Credit cards

- 🔴 **The workaround writes data that is known to be wrong into the history.** All six reviewers raised this. Each bill payment saved as one expense has to be rewritten later. The category detail of the purchases can never be recovered, and the bill lands in the wrong month. Once bank import arrives, card purchases and the bill would be counted twice. Most paying users have a credit card. In the Netherlands these are often ICS-issued cards, which may connect through a different bank link than the current account.
- The simpler fix needs no "liabilities" feature: a credit card is an account that may go below zero. Purchases are expenses on that account, and the bill payment is a transfer from the current account. "Total balance = sum of account balances" then subtracts card debt on its own.
- If the author still postpones this, the minimum is:
  - keep "credit card" in the list of account types now, even if the screens hide it
  - mark every bill payment with a fixed system category or flag so it can be converted automatically later
  - record a decision note giving the trigger for revisiting this and the conversion plan
- **Resolution (2026-10-30):** the author keeps the workaround for version 1. Card spending is under 2% of the author's monthly spending and used only where debit cards are not accepted, so the reviewers' main harm (lost category detail on the main dashboard) is negligible for a single user. The minimum safeguards above are adopted. The risk returns at commercial launch, when other users may pay mostly by credit card.

### 4. Data isolation, sign-in and tenancy

- 🔴 **Supabase exposes database tables to the internet by default.** The web app holds Supabase's public key because it needs it for sign-in. By default Supabase publishes the `public` schema through its automatic table API (the "Data API"). Any table created there without row-level security rules (database rules that limit which rows each user can see) can be read and written directly by anyone with that key. "Clients do not query tables" is a habit, not a protection. The design must:
  - put app tables in a schema that is not published, or turn off the Data API
  - remove access from Supabase's anonymous and signed-in database roles
  - have the API connect as a limited database user, not the administrator account
  - add a check in the build pipeline that fails if any published table has no row rules
- 🔴 **Isolation rests only on API code.** One query that forgets its owner filter leaks another user's financial data. Required:
  - a single data-access layer that always applies the owner filter
  - automated tests proving that user A cannot read, change or delete user B's records by ID, including links to another user's accounts or categories
  - optionally, row-level security as a second layer, by having the API pass the current user to the database on each request
- 🟡 **Data is owned by a user rather than a shared "ledger".** "Sharing between users" is planned, and shared household accounts are a core paid feature for competitors. If every row is keyed on the user, every table and every access check has to be rewritten later. Give data an owning ledger (or workspace) with a members list from day one. In version 1 each user has exactly one ledger and is its only member.
- 🟡 **Checking the sign-in token is not specified.** Supabase now offers public-key signing published at a standard key address (JWKS), alongside the older shared secret. The design should:
  - use the public-key method with a standard library (`jose`) and allow only the expected signing algorithms
  - check issuer, audience and expiry
  - plan for key rotation
  - decide token lifetime and whether a token can be cancelled before it expires; tokens stay valid until expiry even after logout
  - plan for two-step login, expected for a finance app
- 🟡 **Being tied to Supabase identities.** Keep the app's own users table with its own ID, mapped to the Supabase user ID. Do not link app tables directly to Supabase's internal `auth` schema.
- 🟡 **Creating a new user is undefined.** Sign-up happens in Supabase, outside the API. Nothing says what creates the user's profile, ledger and default categories, or how a half-finished setup is repaired. It also doesn't say how sign-up is restricted in version 1 while public sign-up is out of scope.

### 5. Currencies and exchange rates

- 🟡 **"Multi-currency accounts" can mean two things.** Either each account has one currency, or one account holds balances in several currencies, as Wise or Revolut do. Choose one.
- 🟡 **ECB rates have gaps.**
  - ECB publishes about 30 currencies, around 16:00 CET, on euro-area banking days only. There are no rates on weekends or holidays, and none for today before publication.
  - Missing currencies include RUB (suspended since 2022), AED, SAR, KWD, TWD, UAH and all crypto. HRK and BGN have been replaced by the euro.
  - Define the rule: use the latest rate published on or before the transaction date, and record which rate date was used.
  - Show a visible "rate not available" state, and never quietly treat a missing rate as 1.
  - Choose a second source or refuse unsupported currencies.
  - Instead of writing a parser, reuse the ECB XML feed or Frankfurter, an open-source service that serves ECB rates.
- 🟡 **Converted amounts: saved or calculated each time.** If converted amounts are saved when the record is written, reports are cheap, but a change of base currency means recalculating all history. If they are calculated when a report is read, the rates table becomes history that must never be lost. Also decide:
  - whether the user can change base currency in version 1
  - whether the user's own amounts on a cross-currency transfer outrank the ECB rate (reviewers suggest yes)
  - where transfer fees go
  - whether the "original amount" on foreign spending is used anywhere
- 🟡 **Rounding and decimal places.**
  - Not every currency has 2 decimal places: JPY and KRW have 0, and KWD and BHD have 3.
  - Keep a currencies table with each currency's decimal places, filled from the ISO 4217 list. Do not take decimal places from the browser's number formatting, which uses a different list.
  - Store amounts as 64-bit whole numbers and rates as exact decimals.
  - Use a decimal library rather than plain JavaScript numbers when multiplying by rates.
  - Fix one rounding mode and the point where rounding happens.
  - Crypto does not fit this scheme, so declare it out of scope.
- 🟢 **"Total balance at today's rate" changes with no user activity.** Show the rate date and how much of the change comes from exchange rates, so users understand why the number moved.
- 🟡 **Multi-currency may be the most expensive part of version 1.** If the author holds only euro accounts, make version 1 euro-only but keep a currency field on every amount. Alternatively, save a base-currency amount at entry time and skip revaluation until reports need it.

### 6. Readiness for bank import

- 🟡 **The listed fields are not enough.** Add these now, even if they stay empty in version 1:
  - the provider name and the bank's transaction ID, with a rule that the ID is unique per account and provider
  - an import batch ID
  - a link between a manual record and the imported record it matches
  - booking date and value date
  - a reference to the raw bank data
  - user changes (category, note) that survive a re-import

  Consider keeping raw imported bank lines separate from the user-facing transaction, joined by an explicit match table.
- 🟡 **"Cleared / uncleared" is too thin, and its meaning is unclear for manual records.** Make status a list of states with defined transitions: for example pending, booked, reconciled and voided, mapped to the banks' "pending" and "booked". Keep reconciliation status separate from bank status. State the default for manual records and whether uncleared records count in balances.
- 🟡 **IDs, retries and offline mobile.** If the server assigns IDs and repeated requests are not safe, adding offline mobile entry later means changing both the API and the ID scheme. A mobile retry over a bad connection could also create a duplicate expense. Decide now:
  - IDs that the client can generate (UUIDv7, which sorts by time)
  - an `Idempotency-Key` header on every create request
  - a version number on records to catch conflicting edits
  - whether offline mobile entry is a goal at all
- 🟢 **The "180-day PSD2 consent expiry" is described loosely.** Since July 2023 (Regulation 2022/2360), banks must let the user's provider renew access every 180 days instead of 90, without asking the user to authenticate at the bank each time. In practice, consent length still varies by bank and provider, so plan for different lengths and a re-consent screen. PSD3 and the Payment Services Regulation (PSR) may change this from about 2027–2028 (unverified). Bank access without the user present is limited to 4 refreshes per day per account.

### 7. Edit history and GDPR

- 🟡 **"Audit trail of edits" has no design and conflicts with the right to erasure.** It could be history tables filled by database triggers, an event log, or reversal entries. Each has very different cost. Decide:
  - what is captured (before and after values, who, when, request ID)
  - who can see it
  - how long it is kept
  - how a full account deletion removes it

  The scope reviewer suggests version 1 may only need created and updated times plus the source, with visible adjustment records explaining balance changes. If history is wanted, use one generic trigger-based table such as Supabase's `supa_audit` rather than hand-written code. Store differences, not full copies.
- 🟡 **"EU hosting only" covers less than it seems.**
  - Supabase's EU regions inside the EU are Frankfurt, Ireland, Paris and Stockholm. London and Zurich are not in the EU.
  - Supabase is a US company, so compliance rests on its data processing agreement and the EU–US transfer arrangements, not only on where the data sits.
  - Every other service must also be EU-hosted: the API host, email sending, error tracking, logs and analytics.
  - Supabase's built-in email is rate-limited and not meant for production.
  - If "EU-owned, privacy-first" is meant to be a selling point, a US-owned provider weakens that claim.
- 🟡 **GDPR duties for a product are missing.** These include:
  - data export (JSON and CSV)
  - full deletion across app tables, edit history and the Supabase user
  - how long deleted data stays in backups
  - a list of processors and signed data processing agreements
  - a record of processing activities
  - a data protection impact assessment before commercial launch
  - a rule that amounts, notes, payees, IBANs and tokens are never logged

### 8. Running the system

- 🟡 **Hosting and database connections.**
  - No EU host is named for the Node API. Options include Fly.io, Render Frankfurt, Scaleway and Hetzner. Place it in the same region as the database.
  - Supabase's direct database address is IPv6-only unless you pay for an IPv4 add-on, and some hosts cannot make outgoing IPv6 connections.
  - Supabase's shared connection pool has two modes. One mode does not keep a connection open between queries and breaks some features. pg-boss and database migrations should use the other mode or a direct connection.
  - Use separate connection pools, with size limits, for the API and the background jobs.
- 🟡 **Backups and environments.**
  - Supabase free projects pause after about a week without use and have no managed backups. A one-user app can easily hit that.
  - Use a paid plan with daily backups, and point-in-time restore once financial data matters, or run your own backups to EU storage.
  - Set up three environments: local, staging and production.
  - Test a restore before trusting the app with real data.
- 🟡 **Background jobs are already needed in version 1.** The daily exchange-rate fetch is a scheduled job, so the job runner is not only a "later" item.
  - pg-boss can do this with its built-in scheduler.
  - It may run a job more than once, so every job must be safe to repeat.
  - Version 10 introduced breaking changes, so pin the major version.
  - Supabase Queues with pg_cron is an alternative.
  - The scope reviewer suggests a plain scheduled task until bank import is designed.
- 🟡 **Database changes and API versions.**
  - Choose one tool for database changes.
  - Changes only move forward. Breaking changes go in steps: add, copy data, switch, then remove.
  - Version the API (`/v1`), allow only additions within a version, and make generated clients accept unknown values in lists of options.
  - Add a check in the build pipeline that catches breaking API changes. This matters once mobile apps exist that users don't update.
- 🟡 **Monitoring.** None is specified. Needed:
  - structured logs with a request ID, with personal data removed
  - EU-hosted error tracking
  - tracing that follows a request into the background jobs it triggers
  - a health check endpoint
  - alerts for a failed or stale rate fetch, failed jobs and connection limits
  - a scheduled check that balances still match the sum of legs and that both sides of each transfer still add up
- 🟡 **Testing money and rate maths.** Plan for:
  - random-input tests: split lines always add up, a same-currency transfer never changes the total
  - fixed test cases with recorded ECB rates, including weekends, holidays and currencies with 0 or 3 decimals
  - tests against a real Postgres database, together with the cross-user isolation tests
- 🟢 **Money in API messages.** JavaScript loses precision on very large integers, and the Postgres driver returns large integers as text. Fix one format for money in the API, for example `{ amountMinor: string, currency }`, and one shared money library. Use the standard problem-details format (RFC 9457) for errors, with stable error codes for domain failures such as "split does not add up" or "rate unavailable".

### 9. Stack choices

- 🟡 **The stack is heavy for one user.** It has three deployable parts, two places that handle sign-in, generated API clients and a queue. Supabase is used in a way that keeps its costs (vendor lock-in, pausing) but gives up its main features (row rules, automatic API, realtime). Options:
  - one deployable that serves both the API and the web app, using plain EU Postgres with an established sign-in library
  - or keep Supabase but write down why it beats plain Postgres
  - run the API and background jobs as one program with a worker mode until bank import needs them split
- 🟢 **"NestJS or Fastify" is a false choice.** NestJS can run on top of Fastify. For one source of truth for validation that web, API and mobile share, Fastify with TypeBox or Zod is lighter than NestJS's class-based checks. Contract-first options include ts-rest and Hono with zod-openapi. For generating clients, openapi-typescript with openapi-fetch, Orval, or hey-api all work in the browser and in React Native. Choose one way to define validation, not two.
- 🟢 **Sharing code between Expo and Vite.**
  - Use one repository with several packages (pnpm or Turborepo).
  - Keep shared packages free of React, Node-only and browser-only code, because React Native pins its own React version.
  - Test money formatting on both platforms.
  - Supabase sign-in on mobile needs secure storage and deep-link handling.

### 10. Scope of the screens and categories

- 🟡 **Analytics/Reports has no content.** Only the Dashboard has success criteria. Either list the version 1 reports (charts, filters, date ranges, currency) or merge the section into the Dashboard. Also decide whether CSV export is included; GDPR data export needs it anyway.
- 🟡 **The category model is undecided.** Decide:
  - one or two levels, and whether subcategory totals add up into the parent
  - whether default categories can be edited or deleted
  - what happens to records when a category is deleted (archive or merge, not hard delete)
  - fixed system categories (transfer, adjustment, card payment, uncategorised) that cannot be deleted
  - Dutch or English names for the defaults
  - per-user copies, or shared defaults with user overrides
  - whether a category belongs to expenses, income or transfers, and whether records must match that
  - a fixed internal key per default category, for later automatic categorisation of imported records
- 🟢 **Categories on transfers have no stated use.** Transfers are left out of totals, so nothing would use their category. Either give the use (for example tracking savings) or drop it.
- 🟡 **The old app's data.** Nothing says whether the old MySQL data (`dbscripts/exTracker_mysql.sql`, still in git history) is moved over. If it is, the work needs:
  - a field-by-field mapping
  - a repeatable import script marked `source = legacy_import`, with a trial-run mode
  - a rule for converting old decimal amounts to cents
  - checks that monthly totals per category and account balances match the old app exactly

  The new model must also be able to represent the old data.
- 🟢 Settings "other preferences" has no limit, so list them. Dutch number and date formats (decimal comma) are not mentioned. Recurring and future-dated transactions are neither in nor out of scope. Admin or support access to user data should be a planned role with its own log, not a back door. Check "exTracker" against EU trademarks and app-store names before using it commercially.

### 11. Document structure

- 🔴 **One document cannot hold all of this.** The concept mixes four kinds of content: a business case, platform choices, the data model, and a list of screens. The biggest risk is writing the screens document first, which would fix the data model by accident.
- 🔴 **No alternatives are recorded.** Every choice is stated as the only option. Missing comparisons include:
  - build versus adopt an existing app
  - Supabase versus other EU Postgres hosting
  - Supabase sign-in versus other sign-in providers
  - API-only versus a Supabase client with row rules
  - REST versus tRPC
  - NestJS versus Fastify
  - flat records versus transactions with legs
  - saved versus calculated currency conversion
  - per-user category copies versus shared defaults
  - pg-boss versus other job runners
- 🔴 **No way to measure success.** The Dashboard "success criteria" describe features, not outcomes. Example measures:
  - the author uses only this app for N months
  - balances match bank statements to the cent at every month end
  - automated tests show zero cases of one user seeing another's data
  - a full data export and deletion works end to end
- 🟡 Also missing: a risks section, cost (hosting, Supabase plan, later per-user bank-import fees, the author's hours per month), a timeline with milestones, the rollout plan, and the security and GDPR baseline.
- 🟡 **Proposals are mixed in with decisions.** Each of these needs either a decision with its reason or an open question with an owner:
  - "NestJS or Fastify"
  - "likely two-level"
  - "Proposed rules" for refunds, splits and month
  - "e.g. ECB" and "e.g. pg-boss"
  - "optionally the original amount"
  - the credit card caveat
- Also separate permanent non-goals (no liabilities in net worth) from deferred goals (credit cards, bank import), and give each deferred goal its trigger.

### Facts to verify before the next document

These come from reviewer knowledge up to mid-2026. None could be checked online in this session:
- GoCardless Bank Account Data closed to new sign-ups (2025).
- Enable Banking offers free access for linking your own accounts and covers the major Dutch banks.
- Supabase's default signing method for new projects and the end date for the old keys.
- Free projects pause after about 7 days.
- pg-boss is at version 10 or 11.
- ECB has stopped publishing BGN after Bulgaria adopted the euro in 2026.
- PSD3 and PSR timing.
- Whether operating under a provider's licence requires agent registration with DNB.

## Goals vs. Non-Goals

*Updated 2026-10-30 after the clarification round; decision numbers refer to the next section.*

* **In-Scope Goals:**
  - Replace the old PHP and MySQL tracker with a web app for the author's own daily use, usable in a phone browser (decision 17).
  - Five sections: Dashboard, Accounts, Records, Analytics/Reports and Settings.
  - Manual entry of expenses, income and transfers between the user's own accounts, using the transaction → legs → category lines model (decision 9). Transfers are saved as one all-or-nothing operation and left out of income and expense totals.
  - Categories with a default set for each user; each user categorises for themselves (decision 11). Fixed system categories, including "Credit card bill" (decisions 8 and 18).
  - One currency per account, a base currency per user, ECB reference rates with the rules in decision 13 (decisions 13 and 14).
  - A dated opening balance per account, and a reconcile action that creates a visible adjustment transaction.
  - Splits and refunds (detailed rules to be settled in the design draft).
  - A Dashboard showing monthly spending by category, account balances, and total balance in the base currency.
  - Four reports: spending by category with drill-down, income versus expenses per month, balance over time, CSV export (decision 15).
  - English interface with browser-locale number and date formats, built on an i18n library (decision 18).
  - Groundwork for commercial use and bank import from day one:
    - stable, client-generated IDs and retry-safe create requests
    - a source field, a status field and an account type field
    - account membership (`account_members`), one member per account in version 1 (decision 10)
    - a history of edits (design to be decided)
    - Supabase's Data API locked out of application tables (decision 12)
    - EU hosting
    - money stored as whole numbers of the smallest unit plus a currency code
  - All reads and writes go through one TypeScript API that publishes an OpenAPI description.
* **Out-of-Scope Non-Goals:**
  - *Permanent (as currently stated):* tracking liabilities or assets that are not accounts; "total balance" is only the sum of account balances.
  - *Deferred to later versions:*
    - budgets
    - PSD2 bank import through a licensed provider, and the matching and duplicate removal it needs
    - handling renewal of bank access
    - subscriptions, billing, public sign-up and admin tools
    - screens for sharing accounts with other users (the data model supports it from day one)
    - credit card accounts (version 1 records card bills as one expense; decision 8)
    - receipt photos
    - installable PWA, offline entry, native iOS and Android apps (decision 17)
    - moving data from the old app, and statement file import (decision 16)
    - Dutch-language interface (decision 18)
    - a combined household total across members of shared accounts
  - *Still needing an explicit in or out:*
    - recurring transactions
    - crypto currencies

## Key Decisions & Staging for Next Steps

### Decisions already made (reviewers agree these should stay)

1. Store money as 64-bit whole numbers of the smallest unit (for example cents) plus an ISO 4217 currency code. Never use floating-point numbers.
2. A single TypeScript API is the only way to read or write data. Clients never read tables directly. Reviewers add that this must be enforced in Supabase's settings, not just followed as a habit.
3. Supabase in an EU region, used only for Postgres and sign-in. Reviewers ask for an exact region inside the EU (Frankfurt is recommended) and a recorded comparison with the alternatives.
4. A transfer is one transaction with two sides, saved all-or-nothing and left out of income and expense totals.
5. Total balance = the sum of account balances converted to the base currency. No net-worth feature.
6. Version 1 is manual entry only, on the web first, and serves one user.
7. Reconciling an account creates a visible adjustment record rather than silently changing the balance.
8. Credit cards are not accounts in version 1. Each card bill is recorded as one expense under a fixed system category, "Credit card bill", which spending reports show apart from regular categories. Accepted after critique on 2026-10-30: the author's card spending is under 2% of monthly spending and used only where a debit card is not accepted, so the loss of category detail is negligible. "Credit card" stays in the list of account types so the feature can be added later. Revisit if card spending rises well above this level, or before commercial launch, because other users may rely on credit cards far more.

9. Transaction data uses three levels, accepted on 2026-10-30: a **transaction** (date, description, payee, kind: expense, income, transfer, adjustment or opening balance), one or more **legs** (account, signed amount in minor units, currency; money leaving an account is negative, money arriving is positive), and **category lines** that split a leg's amount and must add up to it exactly. An account balance is always calculated from its legs and never stored as an editable number. The opening balance is a dated transaction of kind "opening balance".
10. Access is decided per **account**, not per ledger (2026-10-30). An `account_members` table links users to accounts. A user can see a leg, and the shared fields of its transaction (date, description, payee, amount), only if they are a member of that leg's account. In version 1 every account has exactly one member, its owner, and there are no screens for sharing.
11. **Categorising is personal** (2026-10-30). Category lines belong to a leg *and* a user, so on a shared account each member categorises and splits the same transaction with their own categories. Consequences carried into the data model spec:
    - A transaction entered by one member shows as uncategorised for the other members until they categorise it.
    - If a member changes a leg's amount, other members' splits no longer add up and must be flagged for them to fix.
    - When a member can see only one leg of a transfer (for example money moved from a partner's private account into the joint account), that leg is treated as income or expense for that member and counts in their totals.
    - A shared account counts in full in each member's total balance. A combined household total is out of scope.
12. Supabase's Data API must not reach application tables: keep them out of the exposed schema (or disable the Data API), revoke the default `anon`/`authenticated` grants, have the API connect as a restricted database role, and add tests proving one user cannot read another's data. This is a requirement, not an option.
13. **Currency rules** (2026-10-30):
    - ECB daily reference rates are stored in a rates table. For any date, use the latest rate published on or before that date (covers weekends, holidays and the time before the afternoon publication).
    - Legs store only their own-currency amount. Base-currency figures are calculated when read, never stored, so changing the base currency recalculates everything with no migration.
    - Currencies ECB does not publish are shown unconverted with a warning, and the user may enter a rate by hand.
    - Decimal places per currency come from a currency table based on ISO 4217 (for example JPY 0, EUR 2, KWD 3). Round once, at display, not at intermediate steps.
    - Known cost: calculating on read gets slower as history grows. Fine for one user; expect cached monthly totals before commercial scale.
14. **One currency per account** (2026-10-30). Each account is bound to one currency, and every leg on it uses that currency. A multi-currency wallet such as Wise or Revolut is entered as several accounts, one per currency. Accounts carry an optional institution field (for example "Wise") so the list can group them, and so one bank consent can later cover several accounts.
15. **Reports in version 1** (2026-10-30): (1) spending by category for a chosen month or date range, with drill-down from parent category to subcategory to transactions and filters for account; (2) income versus expenses per month over the last 12 months; (3) balance over time per account and for the total balance in base currency; (4) CSV export of transactions with the current filters applied, which also serves as the GDPR data-export baseline. Not in version 1: custom report builders, budget comparisons, forecasts, PDF reports.
16. **No data import in version 1** (2026-10-30): no migration from the old exTracker database and no statement file import (CSV or CAMT.053). Accepted consequence: reports 2 and 3 have little history for the first months; each account starts from a dated opening balance. Statement import remains a candidate early follow-up, because it tests field mapping, duplicate detection and clearing before paying for bank sync.
17. **Web only in version 1** (2026-10-30): a web app used in the browser, online only. No installable PWA, no offline entry, no native apps. The layout must still work in a phone browser, because manual entry at the moment of payment is the main way data gets in. Transaction IDs are generated by the client (UUIDs) and create requests are safe to retry, so offline entry and native apps can be added later without changing the API.
18. **English in version 1** (2026-10-30). Numbers, dates and currency amounts are formatted with the browser's locale through the standard `Intl` API, so a Dutch browser shows `€ 1.234,56` and `30-10-2026` at no extra cost. All interface text goes through an i18n library from day one so Dutch can be added before a Dutch commercial launch. Fixed system categories (such as "Credit card bill") are identified by a stable key, not by their display name.
19. **Time and cost budget** (2026-10-30): version 1 is built in evenings of 2–3 hours over 3 months (roughly 100–190 hours depending on evenings per week). Running cost while the author is the only user must stay at or below €30 per month. If the build runs behind, cut in this order: split transactions in the interface (the data model keeps them), the balance-over-time report, reconciliation screens (keep the adjustment transaction), then hand-entered exchange rates.

### Open questions to answer before /egm-draft

**A. Purpose and business case (answer first, because most other answers depend on them)**

*Status (2026-10-30): positioning is not decided yet.* Working rule until it is: build commercial groundwork only where it is cheap now and expensive to add later (multi-user data model, real sign-in, money types, stable IDs, account membership, EU hosting, GDPR export and deletion). Defer anything whose value depends on positioning (billing, public sign-up, onboarding, marketing site, aggregator contract). Trigger: questions 1–4 must be answered before signing a bank-import contract or opening public sign-up.
1. Which goal comes first in version 1: the personal tool or testing a commercial product? What event moves the project from one to the other?
2. What makes this different from Wallet, Dyme, YNAB and the banks' own apps, and who is it for: individuals, households or freelancers?
3. Why build rather than run Firefly III or Actual Budget? If the answer is "I want to build it", how much commercial groundwork is still justified?
4. Which bank-import providers will take on a small Dutch developer today, at what cost per user, and with what legal duties (agent registration, legal entity)? Does that cost fit the planned price?
5. How is success measured for personal version 1 and for commercial readiness? ~~What are the time and monthly cost budgets?~~ Budgets resolved (decision 19). Personal success: the author uses it daily and the three dashboard figures match the bank. Commercial readiness is still open.

**B. Data model**
6. ~~Confirm the model of transactions, legs and category lines, and the rule for signs. Is the opening balance a dated record?~~ Resolved: see decision 9.
7. ~~Credit cards: model them as accounts that can go below zero now, or keep the workaround with a fixed marker and a written conversion plan?~~ Resolved: keep the workaround with a fixed marker (see decision 8).
8. ~~Who owns data: a user, or a ledger with members (one member in version 1)?~~ Resolved: account-level membership with personal categorising (decisions 10 and 11).
9. Write the table of which record kinds count in which totals, including refunds, adjustments, opening balances, uncleared records and card payments.
10. Refunds: which month do they reduce, must they link to the original, and can a category total go below zero? Splits: one leg and one currency only, and which line gets the leftover cent?
11. Reconciliation: store a "balance on date" check, or a one-off adjustment? Are periods before the last reconciliation locked?
12. Is the transaction date a calendar date? Where is the user's time zone stored, and which bank date (booking or value) will set the month later?
13. Which record statuses exist, how does a record move between them, and what does "cleared" mean for a manual record?
14. Categories: depth, roll-up, delete and merge behaviour, fixed system categories, whether transfers have categories, language of the defaults, and per-user copies versus shared defaults.
15. Edit history: how it works, what it stores, how long it is kept, who sees it, and how it is fully deleted under GDPR.

**C. Currencies**
16. ~~Does one account hold one currency or several?~~ Resolved: one currency per account (decision 14).
17. ~~Are converted amounts saved when written or calculated when read? Can the base currency change in version 1, and what happens to history if it does?~~ Resolved: calculated when read; base currency can change with no migration (decision 13).
18. ~~What happens on weekends, holidays, before 16:00 CET, and for currencies ECB doesn't publish? Which rounding mode? Do the user's own amounts on a cross-currency transfer outrank the ECB rate?~~ Resolved: latest rate on or before the date, manual rate for unpublished currencies, round once at display (decision 13). The user's own two amounts on a cross-currency transfer always outrank the ECB rate.
19. ~~Does the author actually need non-euro accounts in version 1?~~ Resolved: yes, the author holds Wise/Revolut accounts in several currencies.

**D. Platform and security**
20. Are app tables kept off Supabase's automatic API, and are permissions removed from Supabase's default roles? Is row-level security also used as a second layer, and which database user does the API connect as?
21. Sign-in tokens: public-key checking through JWKS, token lifetime, early cancellation, two-step login, and the link between the app's user ID and Supabase's user ID. What creates a new user's profile, ledger and default categories?
22. Which EU host and region for the API, which Supabase plan, which backup and restore plan, and which EU email and error-tracking services?
23. Which tool manages database changes? What is the API versioning rule? How is money written in API messages? What is the error format? Are client-made IDs and repeat-safe create requests used? Is offline mobile entry ever a goal?
24. Choose one framework and one way of defining validation (NestJS, Fastify, ts-rest or Hono; TypeBox or Zod). Is pg-boss used in version 1 for the rate fetch, or a plain scheduled task?
25. What is the GDPR baseline in version 1: export, deletion, retention, processor list, and the logging rules?

**E. Scope**
26. ~~What exactly do Analytics/Reports contain in version 1, and is CSV export included?~~ Resolved: three reports plus CSV export (decision 15).
27. ~~Is data moved over from the old app, and is statement file import (CSV, CAMT.053) in version 1 or an early follow-up?~~ Resolved: neither in version 1 (decision 16).
28. ~~Is an installable phone version of the web app acceptable as the version 1 mobile path?~~ Resolved: web only, responsive, online only (decision 17).
29. ~~Should the interface be in Dutch, and should Dutch number and date formats be used?~~ Resolved: English, browser-locale formats (decision 18).

### Suggested order of documents

1. **Product charter** (short, Heilmeier format): goal, competing products, what makes this different, cost, timeline and measures of success. This settles questions 1–5 and decides how much commercial groundwork is warranted.
2. **Platform and architecture spec**, with short decision notes for each "X or Y" choice: sign-in, data isolation, API conventions, hosting, backups, monitoring and the GDPR baseline (questions 20–25).
3. **Data model spec**, written alongside the platform spec. It must agree with it on ownership and IDs. It covers the glossary, the record model, the table of totals, statuses, edit history, and what bank import, credit cards, sharing and offline mobile will need later (questions 6–15). It includes decision notes for the credit card rule and the definition of total balance.
4. **Currency and exchange-rate spec**, or a required appendix to the data model spec (questions 16–19).
5. **Version 1 product spec** for the screens and flows. It refers to the documents above instead of redefining terms. It covers goals and non-goals, success measures and rollout, including any move of the old data (questions 26–29).
6. **Placeholders for later:** bank import, credit cards and liabilities, commercial launch, mobile and offline, and sharing. Their needs from the data model are written into document 3 now.
