# Implementation Progress

Last updated: 2026-08-11

This is the working checklist for the application. Product direction, architecture, and phase details live in [next-steps.md](next-steps.md).

## Current focus

### Read-only workspace overview

- [x] Define the initial workspace overview query result shape.
- [ ] Build workspace-scoped dashboard queries.
- [x] Add URL-backed `from` and `to` controls that default to the current month.
- [x] Show selected-period income, expenses, and net cash flow.
- [x] Calculate and display all-time wallet balances.
- [x] Calculate selected-period expense totals by category for the upcoming chart.
- [ ] Display the expense-by-category chart.
- [ ] Show recent transaction and transfer activity.
- [ ] Show upcoming recurring transactions.
- [ ] Add useful overview loading and empty states.
- [ ] Test financial summary calculations.

### Foundation follow-up

- [ ] Add authentication and authorization tests.
- [x] Make workspace IDs easy to copy and share.
- [ ] Remove duplicated workspace-page user controls now provided by the app shell.

## Decisions needed soon

- [ ] Approve the initial `ADMIN`, `MEMBER`, and `VIEWER` permission policy proposed in `next-steps.md`.
- [x] Choose custom email/password sessions or an authentication library/provider.
- [ ] Confirm whether members may edit only their own activity and recurring definitions.
- [ ] Confirm that transfers must stay within one workspace.
- [x] Adopt simple version-one wallet balances; defer opening balances and explicit liability/credit-card behavior.
- [ ] Choose the recurring transaction execution strategy.
- [ ] Choose archive/delete behavior for referenced financial entities.
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

- [ ] Build workspace-scoped dashboard queries.
- [x] Add a URL-backed date range that defaults to the current month.
- [x] Show selected-period income, expenses, and net cash flow.
- [x] Calculate and display wallet balances.
- [ ] Show spending grouped by transaction type and category.
- [ ] Show recent combined transaction and transfer activity.
- [ ] Show upcoming recurring transactions.
- [ ] Add useful first-use and empty states.
- [ ] Test financial summary calculations.

### Phase 3 — Core activity management

- [ ] Create the global Expense / Income / Transfer entry flow.
- [ ] Create income and expense transactions.
- [ ] Edit permitted transactions.
- [ ] Delete permitted transactions safely.
- [ ] Build the combined activity timeline.
- [ ] Add date, direction, wallet, type, category, and creator filters.
- [ ] Keep activity filters in the URL.
- [ ] Add paginated or cursor-based history loading.
- [ ] Build transaction detail views.
- [ ] Add pending, success, validation, and failure feedback.
- [ ] Test workspace isolation and activity permissions.

### Phase 4 — Wallets and transfers

- [ ] Build wallet management screens.
- [ ] Build wallet detail and activity views.
- [ ] Create transfers between permitted wallets.
- [ ] Edit and delete permitted transfers.
- [ ] Include transfers correctly in derived wallet balances.
- [ ] Prevent same-wallet and invalid cross-workspace transfers.
- [ ] Test wallet balance calculations.

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
