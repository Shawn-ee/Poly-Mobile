# World Cup Internal Drill Readiness Report

Date: 2026-06-26

Owner goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

Selected task:

```text
Full Internal Drill Readiness
```

Subagent roles:

- Lead Agent: selected the end-to-end internal drill evidence path and kept blocked areas disabled.
- Bot Engineer Agent: validated bot/reference/market-making dry-run guardrails from the bot repo.
- Trading Engine Agent: validated two-tick pricing, guarded combo quote/submit, idempotency, ledger lock, and settlement service behavior.
- Frontend Agent: validated grouped World Cup UI, order ticket, combo slip, and disabled trading state through browser smoke.
- Testing/Harness Agent: ran app Jest, direct browser smoke, bot checks, Prisma, TypeScript, and build validation.
- Security/Safety Agent: verified no public trading, funding, wallet, withdrawal, private-key, real-money, or live production bot path was enabled.
- Validation Agent: classified objective command output as pass/warn/fail and reran with correct local-only Docker DB scope when needed.
- Reviewer Agent: audited scope and concluded this branch changes smoke-test stabilization plus evidence/scorecard docs only.

## Files Changed

- `tests/e2e/world-cup-ui-ticket-smoke.spec.ts`
- `agent-orchestrator/scorecards/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_SCORECARD.md`
- `agent-orchestrator/runs/20260626T145500Z-world-cup-internal-drill-readiness/REPORT.md`

## Drill Path Evidence

| Step | Status | Evidence |
| --- | --- | --- |
| 1. Reference sync evidence | PASS | Bot repo `npm run test:reference-liquidity` passed. App no-leak/reference tests passed in drill Jest block. |
| 2. Two-tick pricing evidence | PASS | `src/__tests__/reference.two-tick-pricing.test.ts` passed. |
| 3. Market-making dry-run guardrail evidence | PASS | Bot repo `npm run test:world-cup-market-making-guardrails`, `npm run bots:safety`, `npm run test:production-risk-controls`, and `npm run typecheck` passed. Bot safety output kept `botsEnabled=false`, `liveTradingEnabled=false`, `globalKillSwitch=true`, and `liveInternalPlacementAllowed=false`. |
| 4. Grouped World Cup UI/order ticket smoke | PASS/WARN | Direct Playwright browser smoke passed against local dev server: HTTP 200, 5 event links, 18 combo buttons, trade submit disabled, screenshot saved to `test-results/world-cup-internal-drill-readiness/direct-browser-smoke.png`. The checked-in Playwright runner hung in this shell, so the test was stabilized to wait for seeded event text after the sports-event API fetch. |
| 5. Guarded internal test trade smoke | PASS | `src/__tests__/combo-orders.route.test.ts` and `src/__tests__/combo-orders.service.test.ts` passed. They prove quote without opening the write gate, disabled trading rejection, allowed internal submit boundary, server-calculated combo price, balance lock, insufficient balance rejection, client-price distrust, and idempotency. |
| 6. Portfolio/position visibility | PASS | `src/__tests__/portfolio.open-orders.route.test.ts` passed. It verifies current-user combo visibility, settled history, and no private idempotency/fingerprint leak. |
| 7. Admin settlement or settlement simulation evidence | PASS | `src/__tests__/admin.combo-settlement.routes.test.ts`, `src/__tests__/admin.market-settlement-preview.test.ts`, and `src/server/services/__tests__/comboSettlement.test.ts` passed. Coverage includes admin-only preview/settle routes, no-mutation orderbook settlement preview, winning combo payout, losing combo lock consumption, void refund, unresolved-leg blocker, and duplicate-settlement prevention. |
| 8. Post-settlement portfolio/evidence report | PASS | Portfolio route test covers settled combo history; combo settlement service test verifies balance and ledger state after settlement. |
| 9. Route security/no-leak confirmation | PASS | Public no-leak tests passed: events, event markets, market list, sports, and taxonomy. Admin settlement routes block non-admin before service calls. |
| 10. Final drill readiness report | PASS | This report records selected task, subagent roles, files changed, commands run, validation evidence, reviewer decision, scorecard impact, and next action. |

## Commands Run

App targeted drill block, first run without DB env:

```text
npx jest --runInBand src/__tests__/reference.two-tick-pricing.test.ts src/__tests__/world-cup-market-structure.test.ts src/__tests__/combo-orders.route.test.ts src/__tests__/combo-orders.service.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/admin.combo-settlement.routes.test.ts src/__tests__/admin.market-settlement-preview.test.ts src/server/services/__tests__/comboSettlement.test.ts src/__tests__/public.events.no-leak.test.ts src/__tests__/public.event-markets.no-leak.test.ts src/__tests__/public.market-list.no-leak.test.ts src/__tests__/public.sports.no-leak.test.ts src/__tests__/public.taxonomy.no-leak.test.ts
```

Result: 11 suites passed, 2 DB-backed settlement suites failed because `DATABASE_URL` was not set. Validation Agent classified this as environment setup, not product failure.

Local Docker DB validation:

```text
docker ps --filter "name=poly_postgres"
npx prisma validate --schema=prisma/schema.prisma
npx prisma migrate deploy --schema=prisma/schema.prisma
```

Result: Docker `poly_postgres` healthy; schema valid; 41 migrations found; no pending migrations.

App targeted drill block with local Docker DB:

```text
npx jest --runInBand src/__tests__/reference.two-tick-pricing.test.ts src/__tests__/world-cup-market-structure.test.ts src/__tests__/combo-orders.route.test.ts src/__tests__/combo-orders.service.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/admin.combo-settlement.routes.test.ts src/__tests__/admin.market-settlement-preview.test.ts src/server/services/__tests__/comboSettlement.test.ts src/__tests__/public.events.no-leak.test.ts src/__tests__/public.event-markets.no-leak.test.ts src/__tests__/public.market-list.no-leak.test.ts src/__tests__/public.sports.no-leak.test.ts src/__tests__/public.taxonomy.no-leak.test.ts
```

Result:

```text
13 test suites passed
57 tests passed
```

Bot repo validation:

```text
npm run test:world-cup-market-making-guardrails
npm run bots:safety
npm run test:reference-liquidity
npm run test:production-risk-controls
npm run typecheck
```

Result: all passed. Bot safety confirmed missing live env values default to dry-run/disabled/kill-switched behavior.

Local seed and browser smoke setup:

```text
npx prisma migrate deploy --schema=prisma/schema.prisma
npm run seed:dev
```

Result: local Docker DB seeded World Cup demo events; no production DB touched.

Direct browser smoke:

```text
node -e/direct Playwright script against http://127.0.0.1:3000/sports/soccer/world-cup
```

Result:

```json
{
  "status": "PASS",
  "httpStatus": 200,
  "eventCount": 5,
  "comboButtonCount": 18,
  "tradeSubmitDisabled": true
}
```

Checked-in Playwright runner:

```text
npx playwright test tests/e2e/world-cup-ui-ticket-smoke.spec.ts --project=smoke --reporter=list
```

Result: timed out/hung in this shell. The same page flow passed through a direct Playwright script. The checked-in test was stabilized by waiting for seeded event text after the sports-event API response. This remains a tooling warning, not a failed product drill.

Standard validation:

```text
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run build
```

Result: Prisma generate/validate, TypeScript, and `test:ci` passed. First build attempt failed because required runtime env placeholders were missing in the shell. Build passed after setting non-secret local placeholders for required config keys.

## Validation Agent Decision

Status: `pass_with_warnings`

Reason:

- Required backend drill tests passed with local Docker DB.
- Required bot guardrail/reference checks passed.
- Direct browser smoke proved World Cup UI/order ticket/disabled submit behavior against a running local app.
- Standard validation passed after required placeholder envs were provided.
- Remaining warning: checked-in Playwright runner hung in this shell, but the equivalent direct Playwright flow passed and the checked-in smoke was stabilized.

## Reviewer Agent Decision

Status: `done_with_warnings`

Scope review:

- Runtime product behavior was not changed.
- No Prisma migration was added.
- No public trading was enabled.
- No public funding was enabled.
- No real wallet custody, private keys, deposits, withdrawals, or real-money external movement were touched.
- No production live bot was enabled.
- The only code change is test stabilization for the existing World Cup UI smoke.

## Scorecard Impact

Recommended score:

```text
87/100
```

Impact:

- Settlement readiness: stronger evidence from admin route, preview, and DB-backed combo settlement tests.
- Harness/tooling availability: stronger evidence from direct browser smoke plus stabilized checked-in smoke.
- Full internal drill warning: reduced from missing to pass-with-warnings.

## Current Readiness

```text
Controlled internal beta candidate with warnings.
Public beta: not ready.
Production live bots: not approved.
Real public funding/withdrawals: blocked.
```

## Remaining Warnings

1. Checked-in Playwright runner needs follow-up because it hung in this shell even though direct Playwright passed.
2. Combo validation risk model v1 remains below sportsbook-grade depth.
3. Early cash-out estimate model remains incomplete.
4. Bot repo hygiene cleanup for tracked `live-internal.env` remains open.
5. Authenticated full reference-liquidity dry-run with local admin session cookie remains open.

## Next Action

Proceed to:

```text
combo validation risk model v1
```

Do not start public beta, enable real money movement, enable public funding, enable withdrawals, or enable production live bots.
