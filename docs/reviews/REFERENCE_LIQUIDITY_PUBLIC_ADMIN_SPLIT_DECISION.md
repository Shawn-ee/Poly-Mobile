# Reference Liquidity Public/Admin Split Decision

Task id: DOC-014
Assigned subagents: SecurityAgent, BotAgent, LedgerWalletReviewerAgent, PlannerAgent
Risk level: High by topic
Status: Docs-only boundary decision proposal

## Purpose

This decision proposal defines the target boundary between public liquidity/reference information and admin/operator reference diagnostics.

It follows `docs/reviews/REFERENCE_ROUTE_PUBLIC_BOUNDARY_REVIEW.md` and `docs/reviews/REFERENCE_LIQUIDITY_UX_BOUNDARY_PLAN.md`.

This document does not change `/api/markets/[id]/reference`, bot behavior, reference sync, liquidity behavior, route behavior, auth, tests, Prisma, wallet, ledger, matching, settlement, deployment, secrets, or production settings.

## Decision

POLY should split reference/liquidity behavior into two conceptual surfaces:

1. Public liquidity summary for normal users.
2. Admin/operator reference diagnostics for internal operations.

The current `/api/markets/[id]/reference` response shape should not be treated as a normal public-user contract because it includes bot, order, balance, position, live-mode, and operational diagnostic concepts.

## Public User Surface

Public users may see simple, display-safe liquidity and pricing context such as:

- `marketId`
- `status`
- `liquidityStatus`
- `priceStatus`
- `isStale`
- `unavailableReason`
- `lastUpdatedAt`
- display-safe outcome quote summaries
- plain-language liquidity copy

Public users should not need to know whether a bot, reference market, seed action, or operational process produced the display value.

## Admin/Operator Surface

Admin/operator diagnostics may include:

- reference source details
- external market ids
- condition ids
- reference snapshot availability
- quote plan details
- bot initialization status
- dry-run/live status
- active bot bid/ask details
- active bot order ids
- bot capital summaries
- bot open-order notional
- bot daily loss calculations
- readiness, stale-data, cap, allowlist, and kill-switch state

These details should be behind admin-only or operator-only surfaces and reviewed before public exposure.

## Current Route Classification

Until implementation changes are approved, classify `/api/markets/[id]/reference` as:

- Reference diagnostics route.
- Not a final public-user contract.
- Not eligible for low-risk public no-leak contract tests that approve current response shape.
- Eligible for docs-only reviews and future human-reviewed test plans.

## Target Future Architecture

Recommended future architecture:

- Public route: display-safe liquidity/reference summary.
- Admin route: detailed reference/bot diagnostics.
- Admin mutating routes: import, refresh, seed, live controls, and risk operations, all with confirmation and audit requirements.

The exact route names should be decided in a future implementation plan. Do not rename or split routes automatically.

## Forbidden Public Fields

The public surface should not expose:

- `botUserId`
- bot account ids
- active bot order ids
- bot balance values
- bot position values
- bot daily PnL/loss calculations
- `dryRun` as an operational flag
- `liveOrdersEnabled`
- internal formulas
- risk caps or kill-switch internals
- credential ids
- private keys or signer references
- admin action state

## Testing Decision

Future tests should be split:

### Public Summary Tests

Allowed after a public summary contract exists:

- no-leak checks
- stale/unavailable states
- display-safe outcome quote summaries
- no bot/internal diagnostic fields

### Admin Diagnostics Tests

Require specialist review:

- admin auth checks
- bot diagnostics shape
- dry-run/live state display
- order/balance/position-derived summaries
- no-secret assertions

Admin diagnostics tests are not auto-mergeable by default.

## Review Requirements

Future implementation or test PRs require:

- SecurityAgent review for exposure and secret safety.
- BotAgent review for reference/bot/liquidity fields.
- LedgerWalletReviewerAgent review if bot balances, orders, positions, notional, losses, matching, settlement, or funds are involved.
- Human review before public exposure, admin diagnostics, live controls, or production settings change.

## Acceptance Criteria For Future Work

Future implementation should:

- Keep public users away from bot/reference internals.
- Keep admin diagnostics protected.
- Provide plain-language liquidity status.
- Never imply reference prices guarantee fills.
- Preserve dry-run/live separation.
- Add no-leak tests for the public summary route before UI relies on it.

## Non-Goals

This decision does not:

- Change route code.
- Change bot or reference behavior.
- Add tests.
- Change auth.
- Change wallet, ledger, matching, settlement, orders, fills, trades, positions, deposits, withdrawals, admin auth, deployment, Prisma, migrations, or production behavior.

## Validation For This Decision

This decision is docs-only. Validation for this PR should be:

```bash
git diff --check
```
