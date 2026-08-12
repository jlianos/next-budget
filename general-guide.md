# General Working Guide

This document describes how we build Next Budget together and the conventions we follow while doing it.

## Project documents

- `next-steps.md` describes the product direction, architecture, and implementation phases.
- `progress.md` records what is complete, what is active, and what remains.
- `general-guide.md` describes our day-to-day working method and technical conventions.

## How we work together

1. We choose the smallest useful feature that moves the current phase forward.
2. We discuss architecture or important tradeoffs before implementation.
3. Large changes—especially schema changes, migrations, new dependencies, and broad restructuring—require approval first.
4. Codex normally provides one focused implementation step with the relevant explanation.
5. The user implements that step manually and replies when it is ready.
6. Codex reviews the saved files, diagnoses problems from the actual code, and verifies behavior when appropriate.
7. We update `progress.md` after completing a meaningful milestone.

The user can explicitly ask Codex to implement a change directly instead of following the manual step-by-step flow.

## Implementation principles

- Prefer the simplest design that satisfies the current requirements.
- Treat the Prisma schema as the application contract; do not expand it without a clear product need.
- Keep features organized under `src/features`, reusable UI under `src/components`, and routes under `src/app`.
- Keep pages and layouts as Server Components by default.
- Use Client Components only for state, event handlers, or browser APIs such as the clipboard.
- Keep database access, session access, and sensitive application logic on the server.
- Mark server-only modules with `server-only` when importing them into client code would be unsafe or incorrect.
- Validate all untrusted form data on the server with Valibot.
- Authenticate inside every sensitive Server Action, even when its form appears only on a protected page.
- Verify workspace membership for every workspace-scoped read or mutation.
- Treat the `workspaceId` in a workspace route as the active context. Use the per-user workspace cookie only as an explicit selection preference and for `/` redirects.
- Use Prisma constraints and operations such as composite keys, nested writes, and `upsert` to keep mutations safe and repeatable.
- Keep financial calculations in `Prisma.Decimal`; converting to `number` is permitted only for display formatting or non-financial presentation decisions.
- With the current Prisma SQLite adapter, do not use `groupBy` Decimal sums unless their fractional behavior has been verified. Exact aggregates or `Prisma.Decimal` application-side totals are preferred.
- Return small form-state objects containing only the errors or messages the UI needs.

## Date conventions

- Use Day.js for shared date normalization and formatting.
- Keep date-only URL values in `YYYY-MM-DD` form.
- Use `Europe/Athens` as the application timezone until workspace or user timezone preferences are introduced.
- Overview `from` and `to` values are inclusive for the user and default to the current Athens calendar month.
- Convert the inclusive `to` value to the start of the following day and query with `occurredAt >= start` and `occurredAt < endExclusive`.
- Interpret `datetime-local` form values as Athens wall time, convert them to UTC for storage, and convert stored UTC instants back to Athens time for display.
- Revisit the application timezone when user or workspace timezone preferences are introduced.

## Next.js conventions

- Read the bundled Next.js 16 documentation in `node_modules/next/dist/docs` before relying on framework behavior.
- Use route-group layouts to separate authentication pages from the authenticated application shell.
- Use layouts for shared UI and route-level access checks.
- Use Server Actions for authenticated form mutations.
- Use Route Handlers when a normal request/response boundary is required, such as setting a cookie before redirecting from `/`.
- Revalidate affected paths after mutations when server-rendered data must refresh.

## Verification

After each focused change, verify in proportion to its risk:

- Review the saved source rather than assuming the change was applied.
- Check validation, authentication, authorization, and error states.
- Test the user-visible behavior in the running application when possible.
- Run TypeScript or a production build after a completed flow or structural change.
- Treat generated `.next` files as build output, not application source.

## Scope and safety

- Preserve unrelated user changes and avoid broad cleanup during focused work.
- Do not silently change product behavior while fixing an implementation detail.
- Prefer reversible, localized changes.
- If a decision materially affects permissions, financial calculations, stored data, or the Prisma contract, stop and agree on the behavior first.

