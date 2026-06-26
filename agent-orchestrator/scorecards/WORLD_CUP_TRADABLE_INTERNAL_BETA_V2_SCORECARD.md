# World Cup Tradable Internal Beta V2 Scorecard

Date: 2026-06-26

Goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

Target:

```text
85/100 = controlled internal beta candidate
```

Current Lead Agent score:

```text
85/100
```

## Score Breakdown

| Area | Score | Evidence | Notes |
| --- | ---: | --- | --- |
| World Cup event/match grouping | 10/10 | `WORLD_CUP_V2_UI_ORDER_TICKET_SMOKE_EVIDENCE.md` | Browser smoke verifies World Cup route, event detail, grouped markets, ticket, combo slip, and gated submission. |
| Related contracts under one match | 8/10 | World Cup structure tests passed | Match, spread, totals, team totals, BTTS, first-team score supported. Player props intentionally not complete. |
| Unified order ticket | 9/10 | `WORLD_CUP_V2_UI_ORDER_TICKET_SMOKE_EVIDENCE.md` | Playwright verifies outcome selection, estimated cost/payout visibility, amount recalculation, and disabled submit state. |
| Internal/test trading flow | 9/10 | `WORLD_CUP_V2_INTERNAL_TEST_TRADE_SMOKE_EVIDENCE.md` | Route smoke proves quote, disabled gate, allowed internal submit boundary, ledger lock service behavior, and portfolio visibility. |
| Position tracking, mark value, P/L | 7/10 | `WORLD_CUP_V2_INTERNAL_TEST_TRADE_SMOKE_EVIDENCE.md` | Portfolio combo visibility is tested; full mark/P&L for live positions still needs a richer model. |
| Reference sync dry-run | 9/10 | `WORLD_CUP_V2_REFERENCE_SYNC_DRY_RUN_EVIDENCE.md` | Bot reference tests and app reference/no-leak boundary tests pass; authenticated full dry-run still needs local admin session. |
| Two-tick-worse pricing | 9/10 | `WORLD_CUP_V2_TWO_TICK_PRICING_EVIDENCE.md` | Active app-side tests verify two-tick bid/ask, clamps, dry-run default, and missing-book behavior. |
| Safe market-making bots | 9/10 | `WORLD_CUP_V2_MARKET_MAKING_GUARDRAILS_EVIDENCE.md`, Poly-bots PR #2 | World Cup guardrail tests verify default/live/dry-run gates, exposure caps, order caps, non-crossing desired quotes, and order-size caps. |
| Bot inventory cleanup | 5/10 | `WORLD_CUP_V2_BOT_INVENTORY_CLEANUP_EVIDENCE.md` | Inventory evidence exists; `live-internal.env` is tracked in bot repo and should be cleaned in a separate bot hygiene PR. |
| Combo validation and risk model | 6/10 | combo order/settlement tests passed | Basic validation exists; sportsbook-grade correlation/exposure/max-payout risk model not implemented. |
| Early cash-out estimate | 2/10 | no fresh implementation evidence found | Needs model/design or blocker report. |
| Settlement readiness | 8/10 | combo settlement tests passed | Admin combo settlement exists; full deployed drill still needed. |
| Harness/tooling availability | 6/10 | `tests/e2e/world-cup-ui-ticket-smoke.spec.ts` | Active-goal Playwright browser smoke now exists; broader harness suite still incomplete. |
| Safety posture | 8/10 | no live bots/funding/trading enabled by this cycle | Blocked areas remain blocked. |

## Current Classification

```text
Controlled internal beta candidate: reached 85/100 with warnings.
Public beta: not ready.
Live production bots: not approved.
Real public funding/withdrawals: blocked.
```

## Critical Gaps To Reach 85

1. Bot repo hygiene PR for tracked `live-internal.env` and generated config cleanup policy.
2. Authenticated full reference-liquidity dry-run with a local admin session cookie.
3. Combo risk engine v1 plan and implementation task.
4. Early cash-out estimate model.
5. Bot repo hygiene PR for tracked `live-internal.env`.
6. Full authenticated reference-liquidity dry-run with a local admin session cookie.

## Validation Agent Decision

Status: `warn`

Reason: current targeted tests pass, but the score target is not reached because several V2 capabilities are either only bot-level tested, not integrated in the app workflow, or missing implementation evidence.

## Reviewer Agent Decision

Status: `continue`

Reason: this cycle is evidence/planning only. No product runtime code changed. Proceed to scoped task batch creation.
