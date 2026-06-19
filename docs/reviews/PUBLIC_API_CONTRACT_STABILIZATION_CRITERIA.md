# Public API Contract Stabilization Criteria

Task id: DOC-032

Phase: Phase B - Public API safety and tests

Assigned subagents: PlannerAgent, BackendAgent, TestingAgent, SecurityAgent

Risk level: Low for this docs-only task

## Purpose

This document defines when the public/read-only API contract work is stable enough to support UI implementation and an optional public API test lane.

This task does not change route behavior, tests, package scripts, workflows, Prisma, wallet, ledger, matching, settlement, trading, admin auth, bots, deployment, or production settings.

## Stabilization Scope

Covered public/read-only route groups:

- taxonomy reads: `/api/categories`, `/api/tags`
- event reads: `/api/events`, `/api/events/[slug]`
- sports reads: `/api/sports`, `/api/sports/soccer/events`, `/api/sports/soccer/world-cup/events`
- market list reads: `/api/markets`
- event market reads: `/api/events/[slug]/markets`, `/api/events/[slug]/grouped-markets`
- market chart reads: `/api/markets/[id]/chart`
- market detail reads: `/api/markets/[id]`, once contract gaps are resolved or explicitly deferred

## Acceptance Criteria

Public API contract stabilization is ready for UI follow-up when:

1. Each covered route group has an owner and risk classification.
2. Each low-risk public route group has mocked no-leak coverage or an explicit deferral.
3. Response-shape expectations are documented for normal success paths.
4. Empty and missing-resource responses are documented or tested where practical.
5. Sensitive/internal fields are documented as forbidden or explicitly reviewed.
6. Market detail contract gaps are accepted, deferred, or scheduled for a human-reviewed implementation PR.
7. Reference/liquidity public/admin split is accepted, deferred, or scheduled for a human-reviewed implementation PR.
8. Quote, orderbook, and trade-tape routes are explicitly excluded from low-risk auto-merge lanes until reviewed as trading-adjacent.
9. Public no-leak test lane readiness is documented before package/workflow changes.
10. Beta readiness evidence tracker points to the current route/test evidence.

## Current Status

| Route group | Stabilization status | Blocking item |
| --- | --- | --- |
| Taxonomy | Partially stabilized | Optional CI lane not created. |
| Events | Partially stabilized | Optional CI lane not created. |
| Sports | Partially stabilized | Optional CI lane not created. |
| Market list | Partially stabilized | Optional CI lane not created. |
| Event markets | Partially stabilized | Optional CI lane not created. |
| Market chart | Partially stabilized | Optional CI lane not created. |
| Market detail | Not stabilized | Contract gap/cleanup remains human-reviewed. |
| Reference/liquidity | Not stabilized | Public/admin split remains planning-only. |
| Quote/orderbook/trade tape | Deferred | Trading-adjacent review required. |

## UI Readiness Gate

FrontendAgent may use public route contracts for display-only UI work when:

- The UI PR is limited to public discovery surfaces.
- The UI PR does not change API calls or payloads.
- The UI PR does not depend on unstable market detail internals.
- The UI PR avoids wallet, funding, trading mutation, auth/admin, bot, deployment, and Prisma behavior.
- The PR body identifies the route contracts it depends on.

## Test Lane Readiness Gate

An optional `test:public-api` lane may be proposed only after:

- `docs/reviews/PUBLIC_NO_LEAK_CI_PROMOTION_READINESS.md` is satisfied.
- Market detail and reference/liquidity route groups are either covered or explicitly deferred.
- The proposed command is documented and passes locally.
- The implementation PR is left open for human review if it changes `package.json`, workflows, or scripts.

## Non-Auto-Merge Boundaries

Do not auto-merge future PRs that:

- change route implementation
- change public response shapes
- change `package.json`
- change workflows
- change scripts
- touch Prisma
- touch wallet, ledger, matching, settlement, orders, fills, trades, positions
- touch admin auth
- touch bot runtime or liquidity runtime
- touch deployment or production configuration

## Recommended Next Work

1. Keep adding low-risk mocked error/empty-state tests for already covered public routes.
2. Keep market detail work docs-only until the implementation contract is approved.
3. Keep optional public API test lane work docs-first and human-reviewed for package/workflow changes.
4. Begin small display-only public UI PRs only after route dependencies are named and stable enough.

## Decision

Public API stabilization is partially complete. Continue with low-risk public tests and docs-only contract tracking. Do not treat market detail, reference/liquidity, quote, orderbook, or trade-tape routes as fully stabilized yet.
