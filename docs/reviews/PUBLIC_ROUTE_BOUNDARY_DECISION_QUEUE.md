# Public Route Boundary Decision Queue

Task id: DOC-012
Assigned subagents: LeadAgent, PlannerAgent, SecurityAgent, TestingAgent
Risk level: Low
Status: Docs-only decision queue

## Purpose

This queue lists public-read route groups that still need boundary or contract decisions before future agents add tests, promote tests to CI, or rely on response shapes for UI implementation.

This document does not change tests, routes, API contracts, UI, backend logic, wallet, ledger, matching, settlement, admin auth, bots, deployment, Prisma, migrations, workflows, scripts, or production settings.

## Decision Status Summary

| Route group | Current status | Decision needed | Owner | Next safe action |
|---|---|---|---|---|
| Taxonomy reads | Tested with targeted no-leak coverage. | Decide CI/test-lane promotion later. | TestingAgent | Keep targeted evidence. |
| Event reads | Tested with targeted no-leak coverage. | Decide CI/test-lane promotion later. | TestingAgent | Keep targeted evidence. |
| Sports reads | Tested with targeted no-leak coverage. | Decide CI/test-lane promotion later. | TestingAgent | Keep targeted evidence. |
| Market list reads | Tested with targeted no-leak coverage. | Decide CI/test-lane promotion later. | TestingAgent | Keep targeted evidence. |
| Event market reads | Tested with targeted no-leak coverage. | Decide CI/test-lane promotion later. | TestingAgent | Keep targeted evidence. |
| Market detail reads | Boundary review exists. | Public vs auth-aware contract, owner/listing/reference fields. | BackendAgent + SecurityAgent | Contract decision doc before more tests. |
| Market chart reads | Boundary review exists. | Auth-aware visibility, range behavior, response shape. | BackendAgent + SecurityAgent | Contract decision doc or mocked test scope. |
| Reference reads | Boundary review exists. | Public summary vs admin/internal diagnostics. | SecurityAgent + BotAgent + LedgerWalletReviewerAgent | Boundary decision doc before tests. |
| Quote/orderbook/trade-tape reads | Test scope exists. | Trading-adjacent read-test policy and field allowlists. | TestingAgent + LedgerWalletReviewerAgent | Human-reviewed test implementation issue. |

## Existing Supporting Documents

- `docs/reviews/PUBLIC_API_NO_LEAK_COVERAGE_MAP.md`
- `docs/reviews/PUBLIC_NO_LEAK_TEST_LANE_PROMOTION_PLAN.md`
- `docs/reviews/MARKET_DETAIL_PUBLIC_BOUNDARY_REVIEW.md`
- `docs/reviews/MARKET_CHART_PUBLIC_BOUNDARY_REVIEW.md`
- `docs/reviews/REFERENCE_ROUTE_PUBLIC_BOUNDARY_REVIEW.md`
- `docs/reviews/QUOTE_ORDERBOOK_NO_LEAK_TEST_SCOPE.md`
- `docs/reviews/PUBLIC_API_TEST_SAFETY_GUIDE.md`

## Recommended Decision Order

1. Decide market detail public/auth-aware contract.
2. Decide market chart public/auth-aware contract.
3. Decide reference route split: public liquidity summary vs admin diagnostics.
4. Decide quote/orderbook/trade-tape field allowlists.
5. Decide whether current no-leak tests stay targeted, move to `test:ci`, or get a new `test:public-api` script.

## Automation Rules

Agents may automatically create docs-only review or decision-proposal PRs for this queue.

Agents must not automatically:

- Change route responses.
- Change auth behavior.
- Change package scripts or CI.
- Add trading-adjacent tests unless explicitly authorized.
- Promote tests into required CI.
- Modify wallet, ledger, matching, settlement, admin auth, bots, deployment, Prisma, migrations, or production behavior.

## Human Review Required

Human review is required for decisions involving:

- Public exposure of owner, listing, reference, bot, order, balance, position, or risk fields.
- Splitting public/admin route behavior.
- Required CI changes.
- Any route touching auth, wallet, ledger, matching, settlement, orders, fills, trades, positions, admin, bot, deployment, Prisma, migrations, secrets, or production data.

## Non-Goals

This queue does not:

- Add tests.
- Change API contracts.
- Change route behavior.
- Change CI or package scripts.
- Approve any public exposure decision.

## Validation For This Queue

This queue is docs-only. Validation for this PR should be:

```bash
git diff --check
```
