# PR #25 Split And Merge Decision

Task id: DOC-029

Phase: Phase D - UI readiness and display-only implementation

Assigned subagents: PlannerAgent, FrontendAgent, SecurityAgent

Risk level: Medium by UI/admin/wallet topic, docs-only in this task

## Decision

Do not merge PR #25 directly through autonomous execution.

Prefer replacing PR #25 with smaller, focused display-only PRs. Each replacement PR must be reviewed independently and must document that it does not change API calls, event handlers, request payloads, auth behavior, admin behavior, wallet/funding behavior, private pool action semantics, or production behavior.

This decision does not modify PR #25, does not push to the PR #25 branch, and does not approve merging PR #25.

## Rationale

PR #25 is broad and touches multiple sensitive UI surfaces:

- `/wallet`
- `/admin/deposits`
- `/admin/withdrawals`
- `/my-pools`
- `src/components/PoolMarketDetail.tsx`

Even if intended as display-only work, these pages include funding-adjacent controls, admin operator controls, wallet account actions, and private pool actions. Reviewing them as one large PR increases the risk of missing accidental behavior changes.

## Recommended Replacement PR Order

1. Documentation/current-state update only.
2. Private pool listing display-only polish.
3. Pool detail shell display-only polish without changing action handlers.
4. Admin deposits page display-only polish.
5. Admin withdrawals page display-only polish.
6. Wallet page display-only polish.

The safest first replacement PR is private pool listing display-only polish because it is less funding-adjacent than wallet/admin deposit/withdrawal pages.

## Required Scope Rules For Replacement PRs

Each replacement PR must:

- Change only one route/surface group.
- Avoid backend/API changes.
- Avoid package/workflow/script changes.
- Avoid Prisma or migration changes.
- Avoid auth/admin behavior changes.
- Avoid wallet/deposit/withdrawal behavior changes.
- Avoid ledger, balance, matching, settlement, order, fill, trade, or position behavior changes.
- Avoid bot, liquidity, deployment, or production config changes.
- Keep existing fetch endpoints and request payloads unchanged.
- Keep existing event handlers semantically unchanged.
- Run full validation.
- Include screenshots or a visual smoke summary when practical.

## Auto-Merge Guidance

Autonomous auto-merge may be considered only for small display-only PRs that:

- Avoid wallet, deposit, withdrawal, admin operation, trading, order ticket, and private pool action behavior.
- Change only presentation/layout text/classes/component wrappers.
- Pass full validation.
- Pass FrontendAgent, ReviewerAgent, and SecurityAgent self-review.
- Are small enough to inspect line-by-line.

Do not auto-merge replacement PRs that touch:

- `/wallet`
- `/admin/deposits`
- `/admin/withdrawals`
- pool bet/cancel/resolve/invite action semantics
- auth behavior
- API calls or payloads
- any funding, balance, trading, or admin operation semantics

These may still be opened, but they must remain human-reviewed.

## Suggested Future Branches

- `agent/fe-001-private-pool-list-display-polish`
- `agent/fe-002-pool-detail-shell-display-polish`
- `agent/fe-003-admin-deposits-display-polish`
- `agent/fe-004-admin-withdrawals-display-polish`
- `agent/fe-005-wallet-display-polish`

## Required Validation For Future UI PRs

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

Run `npm run lint` or a focused lint command only if it is already stable and safe for the changed files.

## Human Review Required

Human review is required for any replacement PR that changes:

- funding-adjacent UI
- admin operator controls
- wallet account actions
- private pool action controls
- API calls
- auth assumptions
- copy that could imply real-money readiness

## Status

PR #25 should remain open as draft until a human closes it, splits it, or explicitly approves a review path.
