# PR #25 Admin And Funding UI Review Packet

Task id: DOC-035

Phase: Phase D - UI readiness and display-only implementation

Assigned subagents: PlannerAgent, FrontendAgent, SecurityAgent

Risk level: Medium by topic, docs-only in this task

## Purpose

This packet gives a human reviewer and future FrontendAgent work a controlled path for handling PR #25:

- PR: <https://github.com/Shawn-ee/POLY/pull/25>
- Branch: `agent/ui-admin-subpages-wallet-pools-light`
- Current status: open draft
- Autonomous merge status: not eligible

This document does not modify PR #25, does not push to the PR #25 branch, does not approve PR #25, and does not change product code.

## Current PR #25 Scope

Observed changed files:

- `docs/CURRENT_STATE.md`
- `docs/agent-reports/2026-06-18-ui-admin-subpages-wallet-pools-light.md`
- `src/app/admin/deposits/page.tsx`
- `src/app/admin/withdrawals/page.tsx`
- `src/app/my-pools/page.tsx`
- `src/app/wallet/page.tsx`
- `src/components/PoolMarketDetail.tsx`

The PR body says the intent is display-only polish and explicitly claims no wallet, deposit, withdrawal, custody, payment, ledger, matching, orderbook, settlement, trading, API payload, pool action, admin operation, deployment, or main-branch behavior changes.

That claim still requires human verification because the touched UI surfaces include funding-adjacent, admin, wallet, and action-heavy private pool screens.

## Autonomous Decision

Do not merge PR #25 automatically.

Reasons:

- It changes `src/` product-code files.
- It changes wallet and admin funding-adjacent pages.
- It changes private pool action surfaces.
- It is broad rather than one surface at a time.
- It is a draft PR.
- The current autonomous policy forbids auto-merging UI code that touches wallet, funding-adjacent, admin, or private pool action surfaces.

## Human Review Checklist

Before PR #25 or any replacement PR can merge, a reviewer should confirm:

- No API endpoint path, HTTP method, request payload, request timing, or mutation trigger changed.
- No wallet, deposit, withdrawal, custody, balance, ledger, matching, settlement, order, fill, trade, or position behavior changed.
- No admin deposit or withdrawal operation semantics changed.
- No auth, admin permission, or admin route access behavior changed.
- No pool bet, cancel, resolve, invite, or owner action semantics changed.
- No production deployment, environment, secret, or credential handling changed.
- Loading, error, empty, disabled, and busy states still prevent duplicate or unsafe actions.
- Inputs required for admin withdrawal completion, rejection, deposit rescans, and wallet-related actions are unchanged.
- Copy does not imply public real-money readiness.
- No private notes, addresses, hashes, wallet details, internal IDs, or secret-like values are newly exposed.
- Mobile layouts remain usable for `/wallet`, `/admin/deposits`, `/admin/withdrawals`, `/my-pools`, and pool detail.

## Replacement PR Strategy

Prefer closing or superseding PR #25 with smaller replacement PRs.

Recommended order:

1. Documentation/current-state update only.
2. Private pool listing display-only polish.
3. Pool detail shell display-only polish without action semantics changes.
4. Admin deposits display-only polish.
5. Admin withdrawals display-only polish.
6. Wallet display-only polish.

The safest first UI replacement is the private pool listing page because it is less funding-adjacent than wallet/admin deposit/withdrawal pages. It still requires full validation and human review if any action semantics are touched.

## Replacement PR Scope Rules

Every replacement PR should:

- Touch only one surface group.
- Avoid backend/API changes.
- Avoid Prisma and migration changes.
- Avoid package, workflow, and executable script changes.
- Avoid auth/admin behavior changes.
- Avoid wallet, deposit, withdrawal, ledger, balance, matching, settlement, order, fill, trade, and position behavior changes.
- Avoid bot, liquidity, deployment, production config, and secret handling changes.
- Keep existing fetch calls and request payloads unchanged.
- Keep event handlers semantically unchanged.
- Include validation output in the PR body.
- Include screenshots or a short visual QA summary when practical.

## Surface-Specific Review Notes

### `/wallet`

Human review required.

Check that:

- Balance display is presentational only.
- Deposit/withdrawal controls remain disabled or beta-safe exactly as intended.
- Faucet, link wallet, manual link, withdrawal request, and transaction history behavior is unchanged.
- Copy is clearly beta-safe and does not imply production custody readiness.

### `/admin/deposits`

Human review required.

Check that:

- Rescan behavior, buttons, request parameters, and disabled states are unchanged.
- Deposit status labels do not hide reconciliation risk.
- Operator actions remain visually distinct from user-facing flows.

### `/admin/withdrawals`

Human review required.

Check that:

- Complete and reject actions require the same inputs as before.
- Transaction hash requirements are unchanged.
- Busy/disabled states still prevent duplicate completion/rejection.
- Copy does not imply automatic or production-ready withdrawal processing.

### `/my-pools`

Human review required if actions or navigation change.

Check that:

- Listing/cards are display-only unless explicitly reviewed.
- Private pool status, role, and action labels remain accurate.
- Empty states do not invite unsupported funding/trading behavior.

### `PoolMarketDetail`

Human review required.

Check that:

- Bet, cancel, resolve, invite, and owner panels keep the same event handlers and payloads.
- Presentation changes do not change disabled states or accidental-action prevention.
- Order/trade-like language remains clear and beta-safe.

## Required Validation For Replacement UI PRs

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

Run screenshots or Playwright smoke checks when practical for the specific changed route.

## Auto-Merge Guidance

Autonomous auto-merge remains forbidden for PR #25.

Autonomous auto-merge for smaller replacement UI PRs should remain off unless all of the following are true:

- The PR is small and display-only.
- Changed files are limited to safe UI display pages/components.
- No wallet, funding, admin operation, trading, order, private pool action, auth, bot, deployment, package, workflow, script, Prisma, or secret behavior changes.
- Full validation passes.
- FrontendAgent, ReviewerAgent, and SecurityAgent self-review pass.
- The PR body clearly documents the display-only scope.

If any replacement PR touches `/wallet`, `/admin/deposits`, `/admin/withdrawals`, API calls, request payloads, or private pool action semantics, leave it open for human review.

## Recommended Next Step

Keep PR #25 open as draft until a human chooses one of these paths:

- Close PR #25 and replace it with smaller display-only PRs.
- Ask a human reviewer to inspect and approve the combined PR.
- Manually split PR #25 by surface and re-run full validation for each replacement.

Future autonomous work should prefer new, small, single-surface UI branches rather than modifying the PR #25 branch directly.
