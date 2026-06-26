# World Cup Tradable Internal Beta V2 Scorecard

Date: 2026-06-26

Goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

Target:

```text
85/100 = controlled internal beta candidate
```

Current Lead Agent score:

```text
75/100
```

## Score Breakdown

| Area | Score | Evidence | Notes |
| --- | ---: | --- | --- |
| World Cup event/match grouping | 9/10 | `WORLD_CUP_EVENT_MARKET_STRUCTURE_EVIDENCE.md`, targeted Jest passed | Event detail supports match-first grouped markets and line selectors. Needs fresh browser smoke. |
| Related contracts under one match | 8/10 | World Cup structure tests passed | Match, spread, totals, team totals, BTTS, first-team score supported. Player props intentionally not complete. |
| Unified order ticket | 7/10 | World Cup tests and event page source checks passed | Ticket context and backend quote exist; needs browser/API smoke with seeded data. |
| Internal/test trading flow | 7/10 | Guarded order/combo routes exist and tests passed | Off by default; needs fresh internal test trade smoke. |
| Position tracking, mark value, P/L | 6/10 | Portfolio route exists; combo history visible | Needs explicit mark/P&L evidence for World Cup positions and combos. |
| Reference sync dry-run | 8/10 | poly-bot reference import/liquidity tests passed | App-side harness directory absent on clean `dev`; need integrated evidence. |
| Two-tick-worse pricing | 7/10 | poly-bot reference liquidity/arbitrage tests passed | Tests verify planned bot bid/ask around reference bid/ask; needs dedicated app-level scorecard evidence. |
| Safe market-making bots | 7/10 | bot safety and production risk-control tests passed | Defaults safe: bots disabled, live trading disabled, global kill switch true. Local ignored credential-shaped files need cleanup policy. |
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
2. Integrated reference sync dry-run evidence from app and bot boundary.
3. Dedicated two-tick-worse pricing tests/evidence in the active app workflow.
4. Market-making bot guardrail evidence tied to World Cup reference mappings.
5. Browser/API smoke for World Cup grouped UI and order ticket recalculation.
6. Internal test trade smoke with gates and no public trading.
7. Combo risk engine v1 plan and implementation task.
8. Early cash-out estimate model.

## Validation Agent Decision

Status: `warn`

Reason: current targeted tests pass, but the score target is not reached because several V2 capabilities are either only bot-level tested, not integrated in the app workflow, or missing implementation evidence.

## Reviewer Agent Decision

Status: `continue`

Reason: this cycle is evidence/planning only. No product runtime code changed. Proceed to scoped task batch creation.
