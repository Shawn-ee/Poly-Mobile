# World Cup Tradable Internal Beta V2 Scorecard

Date: 2026-06-26

Goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

Target:

```text
85/100 = controlled internal beta candidate
```

Current Lead Agent score:

```text
81/100
```

## Score Breakdown

| Area | Score | Evidence | Notes |
| --- | ---: | --- | --- |
| World Cup event/match grouping | 9/10 | `WORLD_CUP_EVENT_MARKET_STRUCTURE_EVIDENCE.md`, targeted Jest passed | Event detail supports match-first grouped markets and line selectors. Needs fresh browser smoke. |
| Related contracts under one match | 8/10 | World Cup structure tests passed | Match, spread, totals, team totals, BTTS, first-team score supported. Player props intentionally not complete. |
| Unified order ticket | 7/10 | World Cup tests and event page source checks passed | Ticket context and backend quote exist; needs browser/API smoke with seeded data. |
| Internal/test trading flow | 7/10 | Guarded order/combo routes exist and tests passed | Off by default; needs fresh internal test trade smoke. |
| Position tracking, mark value, P/L | 6/10 | Portfolio route exists; combo history visible | Needs explicit mark/P&L evidence for World Cup positions and combos. |
| Reference sync dry-run | 9/10 | `WORLD_CUP_V2_REFERENCE_SYNC_DRY_RUN_EVIDENCE.md` | Bot reference tests and app reference/no-leak boundary tests pass; authenticated full dry-run still needs local admin session. |
| Two-tick-worse pricing | 9/10 | `WORLD_CUP_V2_TWO_TICK_PRICING_EVIDENCE.md` | Active app-side tests verify two-tick bid/ask, clamps, dry-run default, and missing-book behavior. |
| Safe market-making bots | 9/10 | `WORLD_CUP_V2_MARKET_MAKING_GUARDRAILS_EVIDENCE.md`, Poly-bots PR #2 | World Cup guardrail tests verify default/live/dry-run gates, exposure caps, order caps, non-crossing desired quotes, and order-size caps. |
| Bot inventory cleanup | 5/10 | `WORLD_CUP_V2_BOT_INVENTORY_CLEANUP_EVIDENCE.md` | Inventory evidence exists; `live-internal.env` is tracked in bot repo and should be cleaned in a separate bot hygiene PR. |
| Combo validation and risk model | 6/10 | combo order/settlement tests passed | Basic validation exists; sportsbook-grade correlation/exposure/max-payout risk model not implemented. |
| Early cash-out estimate | 2/10 | no fresh implementation evidence found | Needs model/design or blocker report. |
| Settlement readiness | 8/10 | combo settlement tests passed | Admin combo settlement exists; full deployed drill still needed. |
| Harness/tooling availability | 5/10 | prompt conventions exist; clean `dev` lacks harness scripts | Need restore/add harness scripts or agent-selected equivalents. |
| Safety posture | 8/10 | no live bots/funding/trading enabled by this cycle | Blocked areas remain blocked. |

## Current Classification

```text
Controlled internal beta progress: meaningful but not yet 85/100.
Public beta: not ready.
Live production bots: not approved.
Real public funding/withdrawals: blocked.
```

## Critical Gaps To Reach 85

1. Bot repo hygiene PR for tracked `live-internal.env` and generated config cleanup policy.
2. Authenticated full reference-liquidity dry-run with a local admin session cookie.
3. Browser/API smoke for World Cup grouped UI and order ticket recalculation.
4. Internal test trade smoke with gates and no public trading.
5. Combo risk engine v1 plan and implementation task.
6. Early cash-out estimate model.
7. Bot repo hygiene PR for tracked `live-internal.env`.

## Validation Agent Decision

Status: `warn`

Reason: current targeted tests pass, but the score target is not reached because several V2 capabilities are either only bot-level tested, not integrated in the app workflow, or missing implementation evidence.

## Reviewer Agent Decision

Status: `continue`

Reason: this cycle is evidence/planning only. No product runtime code changed. Proceed to scoped task batch creation.
