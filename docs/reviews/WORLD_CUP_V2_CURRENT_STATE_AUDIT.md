# World Cup Tradable Internal Beta V2 Current-State Audit

Date: 2026-06-26

Goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

## Executive Summary

Lead Agent started the V2 goal loop without using `loop_forever.sh`.

Current status:

```text
74/100
Below 85/100 controlled internal beta candidate target
Continue with focused evidence and implementation tasks
```

POLY has a real foundation for internally tradable World Cup markets:

- World Cup grouped event UI and line selectors.
- Backend combo quote and combo order creation.
- Ledger lock/unlock for combo orders.
- Admin combo settlement preview and settlement.
- Portfolio visibility for open, settled, and voided combos.
- Bot repo reference import/liquidity/arbitrage/risk-control tests.

POLY is not yet at the V2 target because:

- bot inventory cleanup is not complete;
- app clean `dev` does not contain the newer harness scripts;
- reference sync evidence is mostly bot-level, not integrated app workflow evidence;
- two-tick pricing has evidence in bot tests but needs dedicated active-goal evidence;
- market-making guardrails need World Cup-specific dry-run inventory evidence;
- early cash-out estimate model is not implemented/evidenced;
- combo risk model is still basic and not sportsbook-grade.

## Agent-Driven Cycle Record

Lead Agent decision:

- Start with current-state audit.
- Then verify bot inventory.
- Then verify reference sync dry-run evidence.
- Then verify two-tick pricing tests.
- Do not run old loop scripts as manager.
- Do not start live trading.

Subagent work simulated in this cycle:

- Planner Agent: mapped current goal to evidence tasks and scorecard.
- Bot Engineer Agent: inspected bot repo inventory and ran safe bot tests.
- Trading Engine Agent: verified combo/order/settlement test evidence in app repo.
- Validation Agent: selected and interpreted tests/commands.
- Security/Safety Agent: identified local credential-shaped bot config files without printing contents.
- Reviewer Agent: audited scope as docs/evidence only and approved continuation.

## Current Capability Findings

### World Cup Grouped Event UI

Status: implemented, needs fresh browser smoke.

Evidence:

- `docs/reviews/WORLD_CUP_EVENT_MARKET_STRUCTURE_EVIDENCE.md`
- `src/__tests__/world-cup-market-structure.test.ts`

Current structure supports compact match-level market bundles, including spread and total line selectors.

### Unified Order Ticket / Recalculation

Status: implemented for current internal model, needs browser/API smoke.

Evidence:

- event page source and tests verify ticket context and backend combo quote usage.
- targeted Jest passed in this cycle.

### Combo Order / Backend Calculation

Status: implemented and guarded.

Evidence:

- `POST /api/combo-orders/quote`
- `POST /api/combo-orders`
- `docs/reviews/WORLD_CUP_REAL_COMBO_ORDER_EVIDENCE.md`
- targeted combo route/service tests passed.

Current formula is deterministic:

```text
comboPrice = product(server leg prices)
potentialPayout = stakeUSDC / comboPrice
```

Sportsbook-grade correlation/exposure risk model is not yet implemented.

### Combo Settlement

Status: implemented for internal/admin-controlled combo settlement.

Evidence:

- `docs/reviews/COMBO_SETTLEMENT_RESOLUTION_EVIDENCE.md`
- targeted combo settlement tests passed.

Settlement rules:

- all legs win: credit stored payout and release stake lock;
- any leg loses: consume locked stake;
- any void/push leg: refund locked stake.

### Bot Inventory Verification

Status: partial; cleanup task required.

Evidence:

- poly-bot typecheck passed.
- `npm run bots:safety` passed.
- Local ignored config files exist in bot repo, including `.env`, `bots.json`, `generated.bots.json`, and `reference-arb.dry-run.json`.

Security note:

- Contents were not printed into docs.
- Files are local/ignored but credential-shaped and should be cleaned, quarantined, regenerated with placeholders, or explicitly documented as unsafe local artifacts.

### Reference Sync Dry-Run

Status: bot-level tests pass; integrated app workflow evidence still needed.

Evidence:

- `npm run test:reference-market-import`: passed.
- `npm run test:reference-liquidity`: passed.
- `npm run test:reference-arbitrage-rebalancer`: passed.

Gap:

- clean app `dev` does not contain concrete harness scripts under `agent-orchestrator/harnesses`.
- Lead Agent should assign Testing/Harness Agent to restore or recreate goal-specific evidence tools if needed.

### Two-Tick-Worse Pricing

Status: bot-level evidence exists; dedicated active-goal test/evidence needed.

Evidence:

- `testReferenceLiquidity.ts` includes `plannedBotBid = referenceBid - 2 ticks` and `plannedBotAsk = referenceAsk + 2 ticks` behavior.
- reference liquidity and arbitrage tests passed.

Gap:

- no dedicated app-side two-tick harness exists on clean `dev`.

### Market-Making Bot Guardrails

Status: partially evidenced.

Evidence:

- `npm run test:production-risk-controls`: passed.
- `npm run bots:safety`: passed.

Validation interpretation:

- defaults are safe: bots disabled, live trading disabled, global kill switch true, live placement not allowed.

Gap:

- World Cup-specific dry-run inventory cleanup and market-making readiness report still needed.

### Early Cash-Out Estimate

Status: not implemented/evidenced in this cycle.

Gap:

- needs model design and test plan before implementation.

## Validation Commands Run

App repo:

```text
npx jest --runInBand src/__tests__/world-cup-market-structure.test.ts src/__tests__/combo-orders.service.test.ts src/__tests__/combo-orders.route.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/server/services/__tests__/comboSettlement.test.ts src/__tests__/admin.combo-settlement.routes.test.ts
npx tsc --noEmit --pretty false --incremental false
```

Result:

- 6 test suites passed.
- 31 tests passed.
- TypeScript passed.

Bot repo:

```text
npm run typecheck
npm run bots:safety
npm run test:reference-market-import
npm run test:reference-liquidity
npm run test:reference-arbitrage-rebalancer
npm run test:production-risk-controls
```

Result:

- Typecheck passed.
- Bot safety passed.
- Reference market import tests passed.
- Reference liquidity tests passed.
- Reference arbitrage rebalancer checks passed.
- Production risk control checks passed.

## First Task Batch

1. `bot-inventory-cleanup-evidence`
   - Agent: Bot Engineer Agent + Security/Safety Agent.
   - Goal: inventory ignored/local bot config artifacts, document cleanup policy, ensure no secret values committed.
   - Validation: bot safety check, secret scan, git status, report.

2. `reference-sync-integrated-dry-run-evidence`
   - Agent: Bot Engineer Agent + Backend Agent + Validation Agent.
   - Goal: prove app/bot reference sync dry-run path for World Cup references without live trading or secrets.
   - Validation: reference import/liquidity tests, app-side reference route/API evidence, no external fund movement.

3. `two-tick-worse-pricing-active-goal-tests`
   - Agent: Trading Engine Agent + Testing/Harness Agent.
   - Goal: add or restore dedicated two-tick-worse pricing tests/evidence for active goal.
   - Validation: deterministic planned bid/ask from reference bid/ask, stale/missing/closed market cases.

4. `world-cup-market-making-guardrails`
   - Agent: Bot Engineer Agent + Security/Safety Agent.
   - Goal: World Cup-specific dry-run market-making guardrail and inventory caps evidence.
   - Validation: production risk controls, bot safety, dry-run quote plan, no live order placement.

5. `world-cup-ui-order-ticket-smoke`
   - Agent: Frontend Agent + Validation Agent.
   - Goal: browser/API smoke for World Cup grouped event UI and order ticket recalculation.
   - Validation: Playwright/browser evidence or documented blocker if no seeded data.

6. `internal-test-trade-smoke`
   - Agent: Trading Engine Agent + Security/Safety Agent.
   - Goal: internal/test trade and portfolio smoke with gates.
   - Validation: auth/allowlist/kill-switch evidence, no public trading.

7. `combo-risk-engine-v1-plan`
   - Agent: Trading Engine Agent + Planner Agent.
   - Goal: design sportsbook-grade combo risk v1 before implementation.
   - Validation: reviewer-approved design, no runtime behavior yet.

8. `cash-out-estimate-model-plan`
   - Agent: Trading Engine Agent + Backend Agent.
   - Goal: design early cash-out estimate model and tests.
   - Validation: reviewer-approved model, no misleading user-facing promise.

## Blocked Areas

Still blocked:

- real wallet custody;
- private keys;
- real public deposits;
- real withdrawals;
- real-money ledger movement;
- destructive migrations;
- actually enabling production live bots with real funds;
- any code path that moves real external funds.

## Reviewer Agent Audit

Decision: `continue`.

Scope reviewed:

- current-state audit;
- scorecard;
- evidence commands;
- no product feature implementation.

No runtime code changed in this audit cycle.

## Next Lead Agent Decision

Proceed to `bot-inventory-cleanup-evidence` unless owner redirects.

Do not start old loop scripts as managers.

Harnesses remain evidence tools only.
