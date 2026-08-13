# Next Steps: Expense Tracker Product Structure

## Purpose

Build an expense tracker that is quick and comfortable for everyday use while making the schema's more advanced features—shared workspaces, roles, multiple wallets, transfers, and recurring transactions—available without overwhelming the user.

This document is the high-level product and implementation map. It is not a commitment to schema changes. Any material schema or architectural change should be reviewed and approved before implementation.

## Product principles

1. **Fast daily capture** — recording an expense or income should take only a few inputs and remain accessible from every main screen.
2. **Progressive disclosure** — the default experience should be simple; workspace administration, categorization, and recurrence controls appear only when needed.
3. **Workspace context is always visible** — users should always know which personal or shared workspace they are viewing or editing.
4. **Money movement stays understandable** — income, expenses, and transfers are distinct concepts in the UI, matching the schema.
5. **Useful defaults, editable detail** — remember recent wallet/category choices and default dates sensibly, while allowing full editing.
6. **Safe collaboration** — permissions must be enforced on the server, and potentially destructive actions must be clear and deliberate.
7. **Derived insights before extra complexity** — prioritize reports that can be calculated from the current schema before adding budgets, goals, or forecasting models.
8. **Language is a presentation preference** — English and Greek share the same routes, data, permissions, and business behavior; changing language must not change application state beyond the locale preference.

## Primary user journeys

### 1. Start and orient

- Sign in.
- Enter the last-used workspace, or select one when no preference exists.
- See current balance, this month's income and expenses, recent activity, and upcoming recurring items.
- Switch workspaces from a persistent workspace selector.

### 2. Record money quickly

- Open a global **Add** action.
- Choose **Expense**, **Income**, or **Transfer**.
- Enter amount first, then wallet and category/destination wallet.
- Default the date to now and the creator to the signed-in user.
- Offer optional date/time and recurrence settings without putting them in the primary path.
- Return the user to their prior context with immediate feedback.

### 3. Review and correct activity

- Browse a single chronological activity feed containing transactions and transfers.
- Filter by date, direction, wallet, category, transaction type, or creator.
- Open an item to inspect, edit, or delete it when permitted.
- Clearly distinguish generated recurring transactions from manually entered items.

### 4. Understand spending

- Compare income and expenses over a selected period.
- See spending grouped first by transaction type, then category.
- Inspect wallet balances and money movement.
- Drill from every summary into the filtered activity that produced it.

### 5. Manage recurring activity

- Create a recurring income or expense from the normal transaction flow.
- Review active, paused, upcoming, and ended recurring definitions.
- Pause, resume, edit, or end a schedule.
- Show generated occurrences in normal activity while retaining a link to their source schedule.

### 6. Collaborate in a workspace

- Admins and members have the same management rights in version 1, including financial activity and workspace configuration.
- Viewers can inspect dashboards, reports, and activity without making changes.
- Activity identifies its creator where that context is useful.

## Information architecture

The application should have a small, stable primary navigation:

1. **Overview** — financial summary, wallet balances, recent activity, and upcoming recurring items.
2. **Activity** — combined transaction and transfer history with filters and search.
3. **Reports** — income/expense trends and category/type breakdowns.
4. **Recurring** — recurring definitions, schedule state, and next occurrence.
5. **Settings** — workspace, wallets, categories/types, members, and personal preferences.

The global **Add** action is not a navigation destination. It should remain available in the desktop header and as a prominent mobile action.

### Suggested route map

```text
/
├── login
└── w/[workspaceId]
    ├── overview
    ├── activity
    │   └── [itemKind]/[itemId]
    ├── reports
    ├── recurring
    │   └── [recurringId]
    └── settings
        ├── workspace
        ├── wallets
        ├── categories
        └── members
```

The workspace identifier in the route makes context explicit, supports direct links, and reduces the risk of reading or mutating data in the wrong workspace. `/` can redirect authenticated users to their last-used or first available workspace.

## Screen structure

### Application shell

- Desktop: sidebar navigation, workspace selector, compact user menu, and persistent Add button.
- Mobile: compact header, bottom navigation for the most-used destinations, and prominent Add action.
- Shared loading, empty, error, permission-denied, and not-found states.
- Server-rendered workspace and permission context; client components only where interaction requires them.

### Overview

- URL-backed `from` and `to` date controls, defaulting to the current month.
- Dates are displayed as inclusive calendar dates; database queries use an inclusive start and exclusive end boundary.
- Income, expenses, and net cash flow summary.
- Wallet balance cards calculated from all recorded activity, independent of the selected period.
- Spending by transaction type/category, beginning with an expense-by-category horizontal bar chart.
- Recent combined activity.
- Upcoming recurring transactions.
- First-use state that guides users to create a wallet, categories, and their first transaction.

### Add/edit money flow

- Segmented choice: Expense, Income, Transfer.
- Amount is the first focused field.
- Expense/income fields: wallet, category, occurred date/time.
- Transfer fields: source wallet, destination wallet, occurred date/time.
- Optional recurrence section for income/expense.
- Category options are filtered by the selected direction.
- Validation is inline and preserves entered values.

### Activity

- One timeline, visually differentiating income, expense, and transfer entries.
- Preset periods plus a custom date range.
- Filters for wallet, direction, type, category, and creator.
- URL-backed filters so views can be linked and revisited.
- A capped combined history for version 1; pagination or cursor-based loading is deferred.
- Detail view or drawer with edit/delete actions based on permissions.

### Reports

- Income versus expenses over time.
- Net cash flow over time.
- Expense breakdown by transaction type and category.
- Wallet balance and flow summary.
- Every chart or total links to its supporting filtered activity.
- No budgeting UI in the initial scope because the current schema has no budget contract.

### Recurring

- Upcoming schedule ordered by `nextAt`.
- Active, paused, and ended groupings.
- Frequency and interval expressed in plain language, such as “every 2 weeks.”
- Actions to pause/resume and edit/end a schedule.
- Generated transactions remain ordinary transaction records and link back to the recurring definition.

### Settings

- Workspace: name and currency.
- Wallets: create, rename, review balances and reference counts, and delete only when no activity references the wallet.
- Categories: manage the two-level transaction type → category hierarchy, grouped by income/expense direction.
- Members: invite/add workflow when implemented, role management, and clear role descriptions.
- Personal: sign-out and future display preferences.

## Schema-to-feature map

| Schema capability | Product use |
| --- | --- |
| `User` | Authentication identity and activity creator |
| `Workspace` | Personal/shared financial boundary and reporting currency |
| `UserWorkspace` | Workspace membership, selection, and role-based access |
| `Wallet` | Accounts/cash locations and derived balances |
| `TransactionType` | High-level income/expense reporting groups |
| `TransactionCategory` | Specific classification during entry and reporting |
| `Transaction` | Income/expense activity, including generated recurring occurrences |
| `Transfer` | Internal wallet movement without changing income/expense totals |
| `RecurringTransaction` | Schedule definitions and source link for generated occurrences |

## Domain rules to enforce in the application

The current relational schema does not enforce all business invariants, so every server-side write path should verify them explicitly:

- The acting user belongs to the workspace and has sufficient permission.
- Wallets, categories, transaction types, recurring definitions, and edited records belong to the route's workspace.
- A transaction category's direction matches whether the user is recording income or expense.
- Amounts are positive and use the workspace currency's supported precision.
- A transfer's source and destination are different and belong to the same workspace unless cross-workspace transfers are explicitly designed later.
- Recurrence interval is a positive integer; end date does not precede start date; `nextAt` remains valid.
- Generated recurring occurrences are idempotent for a schedule and occurrence date.
- Deletion or reassignment cannot silently invalidate historical financial records.

Authorization should never rely only on hidden buttons or client-side state. Reads and mutations must both be scoped by workspace membership on the server.

## Role policy proposal

This is a starting policy to approve before implementation:

| Capability | Admin | Member | Viewer |
| --- | :---: | :---: | :---: |
| View workspace data and reports | Yes | Yes | Yes |
| Create transactions and transfers | Yes | Yes | No |
| Edit/delete own activity | Yes | Yes | No |
| Edit/delete another member's activity | Yes | Yes | No |
| Manage recurring definitions | Yes | Yes | No |
| Manage wallets and categories | Yes | Yes | No |
| Manage workspace and members | Yes | Yes | No |

## Suggested code organization

Keep route files thin and group business behavior by feature rather than putting all logic in `app`:

```text
src/
├── app/
│   ├── (auth)/
│   └── (app)/w/[workspaceId]/
├── components/
│   ├── ui/
│   └── app-shell/
├── features/
│   ├── activity/
│   ├── auth/
│   ├── overview/
│   ├── recurring/
│   ├── reports/
│   ├── transactions/
│   ├── transfers/
│   ├── wallets/
│   └── workspaces/
├── db/
├── lib/
│   ├── dates.ts
│   ├── money/
│   └── validation/
└── generated/
```

Feature folders can contain their queries, server actions, validation schemas, domain helpers, and components. Shared primitives should only move into `components/ui` or `lib` after they are genuinely shared.

## Technical approach

- Use Server Components for initial reads and page composition.
- Use `next-intl` for English and Greek presentation. Keep locale selection in the `nextbudget-locale` HTTP-only cookie and keep application URLs locale-neutral.
- Keep translation keys grouped by feature, use server translations in Server Components and Server Actions, and use client translations only inside interactive Client Components.
- Build localized Valibot schemas at the server boundary so validation messages use the locale active when the action runs.
- Use locale-aware date and number formatting for user-visible values while keeping stored instants, URL dates, and financial calculations unchanged.
- Keep Prisma in server-only modules and return explicit view models rather than database records directly to interactive client components.
- Use Server Actions for form-driven application mutations; use Route Handlers only when an actual HTTP endpoint is needed.
- Recheck authentication, role, and workspace ownership inside every action.
- Validate all untrusted input at the server boundary.
- Keep monetary calculations in `Prisma.Decimal` or normalized minor units; do not perform financial arithmetic with JavaScript floating-point numbers.
- Use Day.js for date normalization and formatting. Calendar inputs and reporting boundaries currently use `Europe/Athens`, while stored instants remain UTC.
- Keep URL dates in `YYYY-MM-DD` form. Treat `from` as inclusive and convert the inclusive `to` date to an exclusive next-day database boundary.
- Treat the route `workspaceId` as the active workspace context. The per-user cookie is a preference for `/` redirects and explicit workspace selection, not authority over a workspace route.
- Do not rely on Prisma SQLite `groupBy` Decimal sums without verification; fractional values were observed to truncate. Prefer exact `aggregate` queries or `Prisma.Decimal` application-side totals where needed.
- Revalidate the smallest relevant route/cache scope after mutations.
- Add structured domain errors for validation, permission, conflict, and not-found states.

## Delivery phases

### Phase 0 — Confirm the contract

- Approve the initial role policy.
- Decide authentication/session strategy.
- Confirm wallet balance semantics, including opening balances and credit cards.
- Confirm same-workspace transfer rules.
- Define recurring generation behavior and where its scheduler will run.
- Decide archival/deletion policy for referenced wallets, categories, users, and workspaces.
- Make approved schema adjustments and regenerate the migration before building dependent UI.

### Phase 1 — Foundation and application shell

- Authentication and session handling.
- Workspace-aware authorization helpers.
- Workspace selection and route guards.
- Responsive application shell and common UI states.
- Shared input validation, money formatting, and date formatting.

### Phase 2 — Read-only overview

- Dashboard queries scoped to a workspace.
- URL-backed selected periods that default to the current month.
- Income, expense, net flow, wallet balance, expense-category, recent activity, and upcoming recurring summaries.
- Seed-backed states for both personal and household workspaces.
- Query and calculation tests for financial summaries.

Current status: the overview displays selected-period income, expenses, net cash flow, expense-category proportions, recent combined activity, upcoming recurring items, and all-time wallet balances. Loading and section empty states are implemented, and the calculations have been manually verified for version 1.

### Phase 3 — Core activity management

- Create, edit, and delete income/expense transactions.
- Combined activity list and URL-backed filtering; the version-one list is capped at 25 items and pagination is deferred.
- Permission checks and audit-friendly creator display.
- Accessible forms with pending, success, validation, and error states.

### Phase 4 — Wallets and transfers

- Wallet management.
- Create, edit, and delete transfers.
- Derived wallet balances and wallet detail activity.
- Guardrails for same-wallet and cross-workspace transfer mistakes.

Current status: transfer creation, editing, and deletion are complete. Wallet management now supports balance/reference review, role-protected creation and renaming, workspace-unique names, and deletion only for unreferenced wallets. Dedicated wallet detail views remain optional follow-up work.

### Phase 5 — Reports

- Period comparisons and trend views.
- Transaction type/category breakdowns.
- Drill-through from summaries to filtered activity.
- Empty and low-data states that remain useful.

### Phase 6 — Recurring transactions

- Recurring definition management.
- Idempotent occurrence generation.
- Scheduler integration and failure/retry strategy.
- Upcoming schedule UI and source links from generated transactions.

### Phase 7 — Workspace administration

- Workspace settings.
- Transaction type/category management.
- Membership and role management.
- Safe archival or deletion flows based on the approved data-retention policy.

Current status: transaction type and category management, workspace settings, and the V1 read-only member list are complete. Types have immutable Income/Expense directions, categories remain under their original type, names follow the schema's scoped uniqueness rules, and hard deletion is limited to safe unreferenced or empty structures. Membership invitations and role management remain deferred.

### Phase 8 — Hardening and release readiness

- Complete English and Greek localization and audit untranslated UI, validation, action feedback, dates, and monetary presentation.
- Authorization and workspace-isolation tests.
- End-to-end tests for primary user journeys.
- Accessibility, responsive layout, and keyboard navigation review.
- Performance review for dashboard aggregates and activity pagination.
- Production database and deployment strategy; SQLite suitability must be reassessed for the intended hosting model and concurrency.
- Logging, error reporting, backup, and recovery plan.

Current status: English and Greek localization is complete across the current V1 screens, forms, validation, Server Action feedback, metadata, dates, money, chart labels, and accessibility text. Both catalogs are structurally aligned, and the rendered desktop/mobile audit passes without horizontal overflow. The remaining Phase 8 work is testing, broader accessibility and keyboard review, performance, deployment, and operational readiness.

## Testing priorities

1. Workspace isolation and role enforcement.
2. Correct income, expense, transfer, and wallet balance calculations.
3. Decimal precision and currency formatting.
4. Recurring occurrence idempotency and date boundaries.
5. Transaction entry and editing across mobile and desktop.
6. Filtered reports matching their underlying activity.
7. Empty, loading, invalid-input, unauthorized, and failure states.

## Decisions still required

The following choices materially affect architecture or the schema and should be approved before implementation:

1. **Authentication:** resolved in favor of custom email/password sessions using the existing `passwordHash`.
2. **Wallet semantics:** version 1 treats wallets as simple money containers with balances derived as income minus expenses plus incoming transfers minus outgoing transfers. Opening balances and explicit liability/credit-card behavior remain undecided.
3. **Role permissions:** resolved for version 1: `ADMIN` and `MEMBER` have the same management rights; `VIEWER` is read-only. The separate admin role is retained for possible future policy changes.
4. **Transfers:** resolved for version 1: both wallets must belong to the route workspace, and source and destination must be different.
5. **Recurring execution:** request-driven catch-up, an external scheduled job, or a deployment-platform scheduler.
6. **Deletion policy:** version-one activity records use explicit-confirmation hard deletion for `ADMIN` and `MEMBER`; `VIEWER` remains read-only. Generated recurring occurrences may be deleted without deleting their recurring definition and may be recreated by future scheduler catch-up behavior. Wallets and categories can be hard-deleted only when unreferenced; transaction types can be hard-deleted only when empty. Workspace membership and workspace deletion policy remains undecided.
7. **Deployment database:** keep SQLite for the first release or plan an early move to PostgreSQL before collaborative production use.

## Explicitly deferred scope

These features are not represented by the current schema and should not enter the initial build implicitly:

- Budgets, spending limits, or savings goals.
- Multiple currencies within one workspace or exchange-rate conversion.
- Receipt uploads and attachments.
- Merchant/payee tracking and free-form transaction notes.
- Bank synchronization or CSV import/export.
- Notifications and recurring-payment reminders.
- Formal audit history beyond `createdBy` and timestamps.

Each can be considered later through a deliberate product and schema proposal.
