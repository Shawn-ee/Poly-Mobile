# Public Route Cleanup Gap Analysis

Task id: DOC-018
Assigned subagents: PlannerAgent, BackendAgent, TestingAgent, SecurityAgent
Risk level: Medium
Status: Docs-only gap analysis

## Purpose

This analysis maps current public read route behavior against the target public contracts and boundary decisions now documented in `docs/reviews/`.

It is intended to help future agents choose safe cleanup or test tasks without changing route behavior now.

This document does not change API routes, tests, UI, package scripts, CI, Prisma, wallet, ledger, matching, settlement, admin auth, bots, deployment, or production settings.

## Source Documents

- `docs/reviews/PUBLIC_READ_API_CONTRACT_DRAFT.md`
- `docs/reviews/PUBLIC_EVENTS_SPORTS_MARKETS_CONTRACT_DECISION.md`
- `docs/reviews/MARKET_DETAIL_PUBLIC_CONTRACT_DECISION.md`
- `docs/reviews/MARKET_CHART_RESPONSE_SHAPE_DECISION.md`
- `docs/reviews/REFERENCE_LIQUIDITY_PUBLIC_ADMIN_SPLIT_DECISION.md`
- `docs/reviews/PUBLIC_API_NO_LEAK_COVERAGE_MAP.md`
- `docs/reviews/PUBLIC_API_TEST_LANE_DECISION.md`

## Summary

Public taxonomy, event, sports, market list, event-market, and chart routes now have targeted no-leak evidence.

The remaining cleanup work is mostly contract alignment:

- Make market detail responses match a display-safe public contract.
- Split reference/liquidity public summaries from admin/operator diagnostics.
- Decide whether chart responses should include explicit range, empty, stale, and unavailable fields.
- Define quote/orderbook/trade-tape field allowlists before tests.
- Decide when targeted public no-leak tests should become a named test lane.

## Gap Matrix

| Route group | Current evidence | Target decision | Gap | Future owner | Implementation risk |
|---|---|---|---|---|---|
| Taxonomy reads | Targeted no-leak tests | Public taxonomy fields only | No major known gap | TestingAgent | Low |
| Event reads | Targeted no-leak tests | Public event and grouped-market fields | Contract can be tightened with allowlists | TestingAgent + BackendAgent | Low/Medium |
| Sports reads | Targeted no-leak tests | Sports-first event browse fields | Contract can be tightened with allowlists | TestingAgent + BackendAgent | Low |
| Market list | Targeted no-leak tests | Public listed market summaries | Liquidity/reference fields need careful display policy | BackendAgent + SecurityAgent | Medium |
| Event markets | Targeted no-leak tests | Public event market summaries | Allowlist tests could be added later | TestingAgent | Low/Medium |
| Market detail | Boundary and contract decision | Display-safe auth-aware market detail | Current route may expose extra owner/listing/reference fields | BackendAgent + SecurityAgent | Medium |
| Market chart | Boundary, response decision, no-leak tests | Auth-aware chart response with optional richer empty/stale fields | Current response may be narrower than target | BackendAgent + TestingAgent | Low/Medium |
| Reference route | Boundary and split decision | Public summary split from admin diagnostics | Current route appears diagnostic-heavy | SecurityAgent + BotAgent + LedgerWalletReviewerAgent | High |
| Quote/orderbook/trade tape | Scope exists | Trading-adjacent display-safe reads | Field allowlists not decided yet | TestingAgent + LedgerWalletReviewerAgent | Medium/High |

## Recommended Cleanup Sequence

1. Add allowlist-style tests for taxonomy/event/sports route groups without changing behavior.
2. Add a market detail cleanup implementation plan, docs-only.
3. Add a reference-liquidity split implementation plan, docs-only.
4. Add chart response-shape implementation plan, docs-only or test-only.
5. Add quote/orderbook/trade-tape field allowlist decision, docs-only.
6. Decide `test:public-api` package-script promotion in a separate human-reviewed PR.

## Tasks That Can Remain Automated

These can be automated when scoped carefully:

- Docs-only contract refinements.
- Mocked public read no-leak tests.
- Mocked public read response-shape tests for low-risk route groups.
- Route inventory updates.
- Evidence tracker updates.

## Tasks Requiring Human Review

Human review is required for:

- Any route behavior change.
- Any package script or CI workflow change.
- Any market detail field removal/addition.
- Any public/admin reference route split implementation.
- Any quote/orderbook/trade-tape implementation test touching trading-adjacent semantics.
- Any task touching wallet, ledger, matching, settlement, orders, fills, trades, positions, deposits, withdrawals, admin auth, bots, deployment, Prisma, migrations, production config, secrets, or real credentials.

## Non-Goals

This analysis does not:

- Change route behavior.
- Add tests.
- Change CI.
- Change package scripts.
- Change UI.
- Change wallet, ledger, matching, settlement, admin auth, bots, deployment, Prisma, migrations, or production behavior.

## Validation For This Analysis

This analysis is docs-only. Validation for this PR should be:

```bash
git diff --check
```
