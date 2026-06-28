# Admin Auth Route Inventory

Task id: ADM-001
Assigned subagents: SecurityAgent, TestingAgent, LedgerWalletReviewerAgent, BotAgent, DeploymentAgent
Risk level: High
Status: Docs-only route inventory

## Purpose

POLY has a large admin route surface that includes content operations, market mutations, resolution, deposits, withdrawals, bots, reference markets, system health, and agent monitoring. This inventory maps current admin pages and API routes to expected authorization behavior and future test coverage needs.

This document does not change admin auth, source code, tests, middleware, secrets, deployment, wallet, ledger, matching, settlement, bot behavior, Prisma schema, or migrations.

## Expected Admin Auth Rule

All `/admin/**` pages and `/api/admin/**` routes should require an authenticated admin user before exposing admin data or allowing admin actions.

Expected behavior:

- Unauthenticated user: `401 Unauthorized` or a user-safe login-required page state.
- Authenticated non-admin user: `403 Forbidden` or a user-safe not-admin page state.
- Authenticated admin user: route/page may proceed if the specific operation is allowed.
- Mutating high-risk routes should also apply operation-specific checks, rate limits, confirmations, audit trails, and domain review.

## Admin Page Inventory

| Page | Purpose | Expected access | Risk | Future tests |
|---|---|---|---|---|
| `/admin` | Market creation/editing/resolution dashboard | Admin-only page state | High | Signed-out, non-admin, admin-positive |
| `/admin/deposits` | Deposit review/rescan UI | Admin-only page state | Critical | Signed-out, non-admin, admin-positive, rescan confirmation |
| `/admin/withdrawals` | Withdrawal review/complete/reject UI | Admin-only page state | Critical | Signed-out, non-admin, admin-positive, complete/reject confirmation |
| `/admin/reference-markets` | Reference market review/import/refresh/seed UI | Admin-only page state | High | Signed-out, non-admin, admin-positive, mutation confirmation |
| `/admin/bots` | Bot monitor dashboard | Admin-only page state | High | Signed-out, non-admin, admin-positive |
| `/admin/agents` | Agent operations monitor | Admin-only page state | High | Signed-out, non-admin, admin-positive, no secret leakage |
| `/admin/system` | System readiness/health | Admin-only page state | High | Signed-out, non-admin, admin-positive |
| `/admin/markets/[marketId]/invariants` | Market invariant view | Admin-only page state | Critical | Signed-out, non-admin, admin-positive |

Future page tests should verify visible states without using production credentials or real operational data.

## API Route Groups

### Market Content And Mutation

Routes:

- `/api/admin/markets`
- `/api/admin/markets/create`
- `/api/admin/markets/pause`
- `/api/admin/markets/resolve`
- `/api/admin/markets/[id]`
- `/api/admin/markets/[id]/outcomes`
- `/api/admin/markets/[id]/pause`
- `/api/admin/markets/[id]/close`
- `/api/admin/markets/[id]/cancel`
- `/api/admin/markets/[id]/resolve`
- `/api/admin/markets/[id]/invariants`

Expected access:

- Admin-only.
- Mutating actions require operation-specific audit and rate-limit expectations.

Risk:

- High to critical.

Future tests:

- 401 when signed out.
- 403 when signed in as non-admin.
- Admin-positive smoke for read routes.
- Focused mutation tests only with safe fixtures and explicit scope.
- Resolution/invariant tests require LedgerWalletReviewerAgent review.

### Admin Events

Routes:

- `/api/admin/events`
- `/api/admin/events/[id]`
- `/api/admin/events/[id]/markets/from-template`
- `/api/admin/events/[id]/markets/from-templates`

Expected access:

- Admin-only.

Risk:

- Medium to high.

Future tests:

- 401/403 coverage.
- Admin-positive read/create smoke with safe fixtures.
- No automatic template creation tests against production data.

### Deposits

Routes:

- `/api/admin/deposits`
- `/api/admin/deposits/rescan`

Expected access:

- Admin-only.
- Rescan is high-risk and must never run in autonomous cycles unless explicitly scoped.

Risk:

- Critical.

Future tests:

- 401/403 coverage.
- Admin-positive read-only list test with safe fixture data.
- Rescan mutation tests only after canonical deposit architecture and funding gates are approved.

### Withdrawals

Routes:

- `/api/admin/withdrawals`
- `/api/admin/withdrawals/[id]/complete`
- `/api/admin/withdrawals/[id]/reject`

Expected access:

- Admin-only.
- Complete/reject are financial operations requiring audit trail, tx hash rules, and focused tests.

Risk:

- Critical.

Future tests:

- 401/403 coverage.
- Admin-positive read-only list test.
- Complete/reject tests only in safe test DB fixtures.
- LedgerWalletReviewerAgent required for all completion/rejection behavior changes.

### Reference Markets And Bot Operations

Routes:

- `/api/admin/reference-markets`
- `/api/admin/reference-markets/[id]`
- `/api/admin/reference-markets/[id]/refresh-snapshot`
- `/api/admin/reference-markets/[id]/seed-bot`
- `/api/admin/reference-markets/polymarket/import`
- `/api/admin/reference-quote-snapshots`
- `/api/admin/bots`
- `/api/admin/bots/[id]`

Expected access:

- Admin-only.
- Mutating reference import, refresh, seed, and bot controls require SecurityAgent and BotAgent review.

Risk:

- High.

Future tests:

- 401/403 coverage for all routes.
- Admin-positive read-only bot/reference snapshots.
- Mutating tests must not run live trading or external imports.

### Agent Operations

Routes:

- `/api/admin/agents/status`
- `/api/admin/agents/activity`
- `/api/admin/agents/runs`
- `/api/admin/agents/runs/[runId]`
- `/api/admin/agents/runs/[runId]/tasks`
- `/api/admin/agents/runs/[runId]/logs`
- `/api/admin/agents/runs/[runId]/files`
- `/api/admin/agents/runs/[runId]/memory-review`

Expected access:

- Admin-only.
- Must not expose secrets, credentials, or unsafe file contents.

Risk:

- Medium to high.

Future tests:

- 401/403 coverage.
- Admin-positive read-only smoke.
- No secret leakage checks for logs/files/memory-review responses.
- DeploymentAgent review for operational claims.

### System And Operations

Routes:

- `/api/admin/system`
- `/api/admin/market-ops-stats`

Expected access:

- Admin-only.

Risk:

- High.

Future tests:

- 401/403 coverage.
- Admin-positive read-only smoke.
- No production secret/config leakage.
- DeploymentAgent review for readiness signals.

## Auth Helper Observations

Current visible auth helpers include:

- `src/lib/admin.ts` with `requireAdmin`.
- `src/lib/marketGuards.ts` with admin guard behavior.
- `src/lib/internalAdminAuth.ts` with internal admin key behavior.
- Admin route handlers using `requireAdmin` or `assertAdmin`.

Future implementation work should verify every admin route uses one approved guard path and returns consistent 401/403 behavior. This inventory does not assert that every route is currently correct; it defines the target review matrix.

## Future Test Matrix

Minimum future coverage before public beta:

| Route class | Signed out | Non-admin | Admin positive | No secret leak | Mutation confirmation |
|---|---:|---:|---:|---:|---:|
| Admin pages | Required | Required | Required | Required where logs/config shown | Required for mutating pages |
| Admin market reads | Required | Required | Required | Recommended | Not applicable |
| Admin market mutations | Required | Required | Required | Recommended | Required |
| Admin resolution/invariants | Required | Required | Required | Recommended | Required |
| Admin deposits | Required | Required | Required | Required | Required for rescan |
| Admin withdrawals | Required | Required | Required | Required | Required for complete/reject |
| Admin reference/bots | Required | Required | Required | Required | Required for import/seed/refresh |
| Admin agents/system | Required | Required | Required | Required | Required for any mutation |

## Automation Rules

Agents may automate:

- Docs-only inventories.
- Test plans.
- Read-only route matrix updates.

Agents must not auto-merge:

- Admin auth implementation changes.
- Middleware changes.
- Admin mutation behavior changes.
- Tests that mutate financial/admin state unless explicitly approved as low-risk test-only work.
- Any change touching wallet, deposit, withdrawal, ledger, matching, settlement, bot live trading, production config, Prisma, or migrations.

## Recommended Follow-Up Tasks

1. `TST-004 - Admin Auth Test Matrix`
   - Convert this inventory into focused 401/403/admin-positive test cases.
   - Test-only PR; not auto-merged unless explicitly low-risk and scoped.

2. `ADM-002 - Admin Operations IA Plan`
   - Separate content, finance, bots, system, and agents in the admin mental model.
   - Docs-only first.

3. `SEC-003 - Admin Secret Leak Review Plan`
   - Plan tests/reviews for `/admin/agents`, `/admin/system`, logs, files, and config summaries.
   - Docs-only first.

## Non-Goals

This inventory does not:

- Modify admin auth.
- Modify middleware.
- Modify pages or API routes.
- Add tests.
- Change financial, wallet, trading, bot, deployment, Prisma, migration, or production behavior.
- Approve public beta launch.

## Validation For This Inventory

This inventory is docs-only. Validation for this PR should be:

```bash
git diff --check
```
