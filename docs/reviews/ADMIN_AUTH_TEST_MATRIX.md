# Admin Auth Test Matrix

Task id: TST-004
Assigned subagents: TestingAgent, SecurityAgent
Risk level: High by topic
Status: Docs-only test matrix

## Purpose

This matrix turns `docs/reviews/ADMIN_AUTH_ROUTE_INVENTORY.md` into a future admin auth test plan. It does not add tests, change admin auth, modify middleware, change routes, or alter admin behavior.

## Test Principles

Future admin auth tests should verify:

- Signed-out users receive `401` or login-required UI.
- Signed-in non-admin users receive `403` or not-admin UI.
- Admin users can reach read-only admin surfaces.
- High-risk mutations require separate scoped tests and confirmations.
- No admin route exposes secrets, private keys, production config, or sensitive logs.

## Page Coverage Matrix

| Page | Signed out | Non-admin | Admin positive | Notes |
|---|---:|---:|---:|---|
| `/admin` | Required | Required | Required | Market content dashboard. |
| `/admin/deposits` | Required | Required | Required | Finance route; no rescan mutation in auth smoke. |
| `/admin/withdrawals` | Required | Required | Required | Finance route; no complete/reject mutation in auth smoke. |
| `/admin/reference-markets` | Required | Required | Required | Bot/reference route; no import/seed mutation in auth smoke. |
| `/admin/bots` | Required | Required | Required | Monitor-only smoke first. |
| `/admin/agents` | Required | Required | Required | Add no-secret checks for logs/files later. |
| `/admin/system` | Required | Required | Required | Add no-secret checks for config/status later. |
| `/admin/markets/[marketId]/invariants` | Required | Required | Required | Requires fixture market id. |

## API Route Group Matrix

| Group | Routes | Signed out | Non-admin | Admin positive | Mutation tests |
|---|---|---:|---:|---:|---|
| Markets read/edit | `/api/admin/markets*` | Required | Required | Required | Separate PR |
| Market resolution/invariants | `/api/admin/markets/*/resolve`, `/invariants` | Required | Required | Required | Separate LedgerWalletReviewerAgent PR |
| Events/templates | `/api/admin/events*` | Required | Required | Required | Separate PR |
| Deposits | `/api/admin/deposits*` | Required | Required | Read-only only | Separate funding PR |
| Withdrawals | `/api/admin/withdrawals*` | Required | Required | Read-only only | Separate withdrawal PR |
| Reference markets | `/api/admin/reference-markets*` | Required | Required | Read-only only | Separate BotAgent PR |
| Bots | `/api/admin/bots*` | Required | Required | Read-only only | Separate BotAgent PR |
| Agents | `/api/admin/agents*` | Required | Required | Required | No-secret checks required |
| System | `/api/admin/system`, `/api/admin/market-ops-stats` | Required | Required | Required | No-secret checks required |

## First Safe Test PR Scope

The first implementation PR should be narrow:

- Add 401/403/admin-positive tests for read-only admin APIs only.
- Avoid deposit rescan, withdrawal completion/rejection, market resolution, seed-bot, import, or live-risk mutations.
- Use test-local fixtures only.
- Do not require production credentials.

## Not Auto-Mergeable By Default

Admin auth tests are high-risk by domain. Even if test-only, future implementation should not be auto-merged unless the task is explicitly scoped as low-risk, read-only, and full validation passes.

## Required Validation For Future Test PR

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

## Forbidden Scope

Future admin auth test work must not change:

- Admin auth implementation.
- Middleware.
- Admin route behavior.
- Financial operations.
- Market resolution.
- Bot live behavior.
- Production config.
- Prisma schema or migrations.

## Validation For This Matrix

This matrix is docs-only. Validation for this PR should be:

```bash
git diff --check
```
