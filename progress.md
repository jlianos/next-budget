# Implementation Progress

Last updated: 2026-08-12

This is the working checklist for the application. Product direction, architecture, and phase details live in [next-steps.md](next-steps.md).

## Current focus

### Wallet management

- [x] Add a workspace-scoped wallet settings page.
- [x] Show derived balances and activity-reference counts.
- [x] Allow `ADMIN` and `MEMBER` users to create and rename wallets.
- [x] Keep wallet names unique within a workspace.
- [x] Allow hard deletion only for wallets with no transaction, transfer, or recurring references.
- [x] Use an explicit styled confirmation dialog for wallet deletion.
- [x] Keep `VIEWER` access read-only in both the UI and Server Actions.
- [x] Manually verify create, rename, duplicate-name validation, confirmation cancellation, and deletion.

### Next focus: transaction types and categories

- [ ] Define the smallest useful V1 management rules for transaction types and categories.
- [ ] Build workspace-scoped settings queries and screens.
- [ ] Add role-protected create and rename actions.
- [ ] Prevent deletion when financial or recurring records still reference an item.

### Read-only workspace overview

- [x] Define the initial workspace overview query result shape.
- [x] Build workspace-scoped dashboard queries.
- [x] Add URL-backed `from` and `to` controls that default to the current month.
- [x] Show selected-period income, expenses, and net cash flow.
- [x] Calculate and display all-time wallet balances.
- [x] Calculate selected-period expense totals by category for the upcoming chart.
- [x] Display the expense-by-category proportional bar visualization.
- [x] Show recent transaction and transfer activity.
- [x] Show upcoming recurring transactions.
- [x] Add useful overview loading and section empty states.
- [x] Manually test financial summary calculations for V1.

### Foundation follow-up

- [ ] Add authentication and authorization tests.
- [x] Make workspace IDs easy to copy and share.
- [x] Remove duplicated workspace-page user controls now provided by the app shell.

## Decisions needed soon

- [x] Approve the initial `ADMIN`, `MEMBER`, and `VIEWER` permission policy proposed in `next-steps.md`.
- [x] Choose custom email/password sessions or an authentication library/provider.
- [x] Confirm version-one permissions: `ADMIN` and `MEMBER` have the same rights; `VIEWER` is read-only.
- [x] Confirm that transfers must stay within one workspace.
- [x] Adopt simple version-one wallet balances; defer opening balances and explicit liability/credit-card behavior.
- [ ] Choose the recurring transaction execution strategy.
- [ ] Choose archive/delete behavior for referenced configuration entities other than wallets.
- [ ] Confirm whether SQLite is only for local development or also intended for the first deployment.

## Completed foundation

- [x] Scaffold the Next.js 16 application.
- [x] Configure TypeScript, Tailwind CSS, and Biome.
- [x] Create the Prisma schema as the initial application contract.
- [x] Configure Prisma 7 with the SQLite driver adapter.
- [x] Generate and apply the initial migration.
- [x] Create the Prisma client module.
- [x] Create realistic development seed data.
- [x] Seed users, personal/shared workspaces, roles, wallets, categories, transactions, and transfers.
- [x] Introspect the scaffold and database state.
- [x] Define the high-level product and implementation structure in `next-steps.md`.

## Application roadmap

### Phase 1 — Foundation and application shell

- [x] Complete sign-up, sign-in, sign-out, and signed-cookie session handling.
- [x] Add `getCurrentUser` and `requireUser` server-side authentication helpers.
- [x] Protect authenticated application routes.
- [x] Add workspace membership checks to workspace-scoped routes.
- [x] Redirect authenticated users to their preferred or most recently joined workspace.
- [x] Persist the selected workspace in a per-user HTTP-only cookie.
- [x] Add workspace creation, selection, and join-by-ID flows.
- [x] Build the responsive desktop and mobile application shell.
- [x] Add workspace navigation and signed-in user controls.
- [x] Make route workspace context authoritative for workspace-scoped shells.
- [ ] Add persistent desktop and mobile Add actions.
- [ ] Create shared loading, empty, error, permission-denied, and not-found states.
- [ ] Add shared input validation, money formatting, and date formatting.

### Phase 2 — Read-only overview

- [x] Build workspace-scoped dashboard queries.
- [x] Add a URL-backed date range that defaults to the current month.
- [x] Show selected-period income, expenses, and net cash flow.
- [x] Calculate and display wallet balances.
- [x] Show spending grouped by category with its transaction-type context.
- [x] Show recent combined transaction and transfer activity.
- [x] Show upcoming recurring transactions.
- [ ] Add useful first-use and empty states.
- [x] Manually test financial summary calculations for V1.

### Phase 3 — Core activity management

- [ ] Create the global Expense / Income / Transfer entry flow.
- [x] Create income and expense transactions.
- [x] Edit permitted transactions.
- [x] Delete permitted transactions safely.
- [x] Build the initial combined transaction and transfer timeline.
- [x] Add date, direction, wallet, type, category, and creator filters.
- [x] Keep the initial activity date-range filter in the URL.
- [x] Keep the V1 combined history capped at 25 items and defer pagination.
- [ ] Build transaction detail views.
- [x] Add pending, success, validation, and failure feedback.
- [x] Manually test workspace isolation and activity permissions for V1.

### Phase 4 — Wallets and transfers

- [x] Build wallet management screens.
- [ ] Build wallet detail and activity views.
- [x] Create transfers between permitted wallets.
- [x] Edit and delete permitted transfers.
- [x] Include transfers correctly in derived wallet balances.
- [x] Prevent same-wallet and invalid cross-workspace transfers.
- [x] Manually test wallet balance calculations for V1.

### Phase 5 — Reports

- [ ] Add reusable period selection.
- [ ] Show income versus expenses over time.
- [ ] Show net cash flow over time.
- [ ] Show expense breakdowns by transaction type and category.
- [ ] Show wallet balance and flow summaries.
- [ ] Link report totals to supporting filtered activity.
- [ ] Add useful empty and low-data report states.
- [ ] Test report totals against underlying activity.

### Phase 6 — Recurring transactions

- [ ] Create recurring income and expense definitions.
- [ ] Build active, paused, upcoming, and ended views.
- [ ] Edit, pause, resume, and end schedules.
- [ ] Implement idempotent occurrence generation.
- [ ] Integrate the approved scheduler strategy.
- [ ] Add retry and failure handling.
- [ ] Link generated transactions to their recurring source.
- [ ] Test interval, timezone, end-date, and duplicate-generation boundaries.

### Phase 7 — Workspace administration

- [ ] Build workspace settings.
- [ ] Build transaction type and category management.
- [ ] Build membership and role management.
- [ ] Enforce the approved role policy in reads and writes.
- [ ] Implement the approved archive/delete behavior.
- [ ] Add safeguards around historical records.

### Phase 8 — Hardening and release readiness

- [ ] Add end-to-end tests for primary user journeys.
- [ ] Complete authorization and workspace-isolation coverage.
- [ ] Review accessibility and keyboard navigation.
- [ ] Review responsive behavior on common mobile and desktop sizes.
- [ ] Review dashboard query and activity pagination performance.
- [ ] Confirm the production database and deployment approach.
- [ ] Add production logging and error reporting.
- [ ] Define backup and recovery procedures.
- [ ] Complete release-readiness review.

## Deferred scope

These are intentionally outside the current application contract:

- [ ] Budgets, spending limits, and savings goals.
- [ ] Multiple currencies and exchange-rate conversion.
- [ ] Receipt uploads and attachments.
- [ ] Merchant/payee tracking and transaction notes.
- [ ] Bank synchronization and CSV import/export.
- [ ] Notifications and recurring-payment reminders.
- [ ] Formal audit history.

Items in this section should move into the roadmap only after an approved product and schema proposal.

## Progress log

- **2026-08-11:** Initial Prisma contract, migration, client setup, and development seed are complete.
- **2026-08-11:** Scaffold and database were inspected; high-level product structure was documented.
- **2026-08-11:** Authentication and workspace-aware access were selected as the first application milestone.
- **2026-08-11:** Implemented custom email/password authentication with Valibot validation, password hashing, signed sessions, protected routes, and sign-out.
- **2026-08-11:** Implemented the responsive authenticated application shell with desktop navigation and a closable mobile drawer.
- **2026-08-11:** Implemented per-user workspace preference cookies, automatic workspace resolution, membership route guards, and workspace selection.
- **2026-08-11:** Implemented workspace creation and join-by-workspace-ID flows without automatic workspace creation during sign-up.
- **2026-08-11:** Completed a successful Next.js production build after the workspace access flow.
- **2026-08-11:** Made the route workspace authoritative for membership checks, shell identity, and workspace navigation while keeping the cookie as the explicit workspace preference.
- **2026-08-11:** Added Day.js UTC date normalization and URL-backed `from`/`to` overview controls that default to the current month.
- **2026-08-11:** Added and manually verified workspace-scoped income, expense, and net cash-flow cards for selected periods.
- **2026-08-11:** Added and manually verified all-time wallet balances, including incoming and outgoing transfers, for the personal and household seed workspaces.
- **2026-08-11:** Avoided Prisma SQLite `groupBy` Decimal sums after verification showed fractional values could be truncated; wallet calculations now use exact per-wallet aggregates.
- **2026-08-11:** Added exact selected-period expense totals by category as the data source for the next overview chart step.
- **2026-08-12:** Displayed selected-period expense categories as proportional bars without adding a client chart dependency.
- **2026-08-12:** Added the five most recent workspace-scoped transactions and transfers for the selected period.
- **2026-08-12:** Added upcoming active recurring items with workspace, date, and active-schedule constraints, including an empty state for workspaces without schedules.
- **2026-08-12:** Completed the main read-only Overview content; calculation tests and shared loading/first-use states remain.
- **2026-08-12:** Added a route-level Overview loading skeleton and section-specific empty states.
- **2026-08-12:** Approved transaction creation for `ADMIN` and `MEMBER`, with `VIEWER` remaining read-only and all references verified against the route workspace.
- **2026-08-12:** Implemented and manually verified workspace-scoped income and expense creation with exact decimal validation and role enforcement.
- **2026-08-12:** Adopted `Europe/Athens` as the temporary application timezone, with UTC database storage and DST-aware input, display, and reporting boundaries.
- **2026-08-12:** Added a workspace-scoped combined Activity timeline for transactions and transfers with an Athens-calendar URL date range and a useful empty state.
- **2026-08-12:** Implemented role-protected, same-workspace transfer creation with distinct-wallet validation and exact decimal amounts.
- **2026-08-12:** Manually verified transfer effects on both wallet balances and added an URL-backed Activity kind filter for income, expenses, and transfers.
- **2026-08-12:** Added an URL-backed Activity wallet filter covering transactions and both sides of transfers, with workspace-option normalization.
- **2026-08-12:** Added an URL-backed, workspace-normalized Activity transaction-type filter that composes with date, kind, and wallet filters.
- **2026-08-12:** Added URL-backed Activity category and creator filters, with workspace-scoped option validation and support for filtering both transactions and transfers by creator.
- **2026-08-12:** Confirmed the version-one permission policy: `ADMIN` and `MEMBER` share full management rights, while `VIEWER` remains read-only.
- **2026-08-12:** Implemented workspace-scoped transaction editing with a reusable create/edit form, preserved creator attribution, recurring-occurrence guidance, and viewer-safe UI and action guards.
- **2026-08-12:** Approved explicit-confirmation hard deletion for transactions, including generated recurring occurrences, for `ADMIN` and `MEMBER`; `VIEWER` remains read-only.
- **2026-08-12:** Implemented and manually verified atomic workspace-scoped transaction deletion with two-step confirmation, recurring-occurrence guidance, route revalidation, and viewer authorization enforcement.
- **2026-08-12:** Implemented and manually verified transfer editing and atomic two-step deletion, preserving creator attribution and keeping wallet balances synchronized without changing cash-flow totals.
- **2026-08-12:** Deferred Activity pagination for version 1; the combined timeline remains capped at 25 items.
- **2026-08-12:** Implemented and manually verified workspace-scoped wallet management with balances, reference counts, role-protected create/rename actions, duplicate-name handling, and deletion limited to unreferenced wallets through a styled confirmation dialog.
- **2026-08-12:** Passed TypeScript, Biome lint, and the Next.js production build after completing wallet management.
