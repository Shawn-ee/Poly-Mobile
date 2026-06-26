# World Cup Combo Risk + Cash-Out Engine V1 Report

Date: 2026-06-26

Starting score: `87/100`

Target score: `90/100`

## Selected Task

```text
World Cup Combo Risk + Cash-Out Engine V1
```

## Assigned Subagents

- Lead Agent: scoped the tranche to combo risk and cash-out only, without restarting broad World Cup planning.
- Trading Engine Agent: implemented combo validation v1 and cash-out estimate v1.
- Backend Agent: wired combo risk into server-side quote/submit before ledger locks.
- Frontend Agent: surfaced combo quote rejection reason codes in the World Cup combo slip.
- Testing/Harness Agent: added targeted unit/route/service tests and ran required validation.
- Security/Safety Agent: verified no public beta, real wallet, private-key, deposit, withdrawal, real-money external movement, or production live bot path was enabled.
- Validation Agent: classified targeted tests, TypeScript, Prisma, CI tests, and build output.
- Reviewer Agent: audited diff scope and safety implications.

## Files Changed

- `src/lib/orderbookPricing.ts`
- `src/server/services/comboRisk.ts`
- `src/server/services/comboOrders.ts`
- `src/server/services/cashOut.ts`
- `src/app/events/[slug]/page.tsx`
- `src/__tests__/combo-risk.service.test.ts`
- `src/__tests__/combo-orders.service.test.ts`
- `src/__tests__/combo-orders.route.test.ts`
- `src/__tests__/cash-out.service.test.ts`
- `agent-orchestrator/scorecards/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_SCORECARD.md`
- `agent-orchestrator/runs/20260626T153500Z-world-cup-combo-risk-cashout-v1/REPORT.md`

## Implementation Summary

Combo validation v1:

- Allows independent different-event combos within limits.
- Blocks same-event multi-leg combos in v1 unless a future explicit correlation model is added.
- Blocks duplicate market and duplicate outcome combos.
- Blocks same-event moneyline mutual exclusivity.
- Blocks YES/NO conflict, over/under same-line conflict, spread opposite-side same-line conflict, correlated total/spread line ladders, and equivalent markets.
- Blocks private/internal/unlisted/non-orderbook/closed markets and inactive/non-tradable outcomes.
- Blocks missing quotes and stale source quotes.
- Enforces max legs, max stake, and max payout.
- Returns canonical reason codes from combo quote/submit APIs.

Cash-out estimate v1:

- Supports single-leg position estimates only.
- Uses current bid as exit quote.
- Calculates estimated exit value and estimated P/L against entry cost.
- Blocks closed markets, stale quotes, missing bid quote, missing/non-positive position, and combo positions.
- Combo cash-out is explicitly unsupported with `CASH_OUT_COMBO_UNSUPPORTED`.

UI/API behavior:

- The combo quote API returns clear canonical error codes.
- The World Cup combo slip shows server quote rejection reason code and message when internal trading UI is enabled.
- Submit remains server-gated by internal trading beta auth/allowlist/kill switch.

## Commands Run

Targeted validation:

```text
npx jest --runInBand src/__tests__/combo-risk.service.test.ts src/__tests__/combo-orders.service.test.ts src/__tests__/combo-orders.route.test.ts src/__tests__/cash-out.service.test.ts
```

Result:

```text
4 test suites passed
26 tests passed
```

Targeted validation after UI integration:

```text
npx jest --runInBand src/__tests__/combo-risk.service.test.ts src/__tests__/combo-orders.service.test.ts src/__tests__/combo-orders.route.test.ts src/__tests__/cash-out.service.test.ts src/__tests__/world-cup-market-structure.test.ts
```

Result:

```text
5 test suites passed
32 tests passed
```

TypeScript:

```text
npx tsc --noEmit --pretty false --incremental false
```

Result: passed.

## Validation Evidence

Required coverage:

- Unit tests for combo validation rules: passed in `combo-risk.service.test.ts`.
- API/service tests for combo validation response: passed in `combo-orders.service.test.ts` and `combo-orders.route.test.ts`.
- Unit tests for cash-out estimate model: passed in `cash-out.service.test.ts`.
- Route/security no-leak tests: no public payload changed; combo quote/order endpoints remain canonical-auth routes. Existing no-leak suites remain covered by standard validation.
- TypeScript: passed.
- Prisma generate/validate: passed with local Docker Postgres `DATABASE_URL`; no schema change was made.
- `npm run test:ci`: passed, 13 suites and 39 tests.
- `npm run build`: passed with non-secret local placeholders for required runtime config.

Full validation block:

```text
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run build
```

Result: passed.

## Reviewer Decision

Status: `ready_for_validation_merge`

Reason:

- The implementation changes internal combo validation and read-only cash-out estimation only.
- No schema migration was added.
- No public trading, public funding, production live bot, wallet custody, private-key, deposit, withdrawal, or real external fund movement path was enabled.
- Ledger mutation behavior is not expanded; combo risk now blocks earlier before ledger locks.
- Cash-out v1 is read-only estimate logic and does not execute a sell, settlement, or balance mutation.

## Scorecard Impact

Recommended score:

```text
90/100
```

Impact:

- Combo validation and risk model improves from partial/basic to v1 implemented and tested.
- Early cash-out estimate improves from missing to single-leg estimate v1 implemented and tested.
- Safety posture improves because missing/stale quotes and unsupported same-event/correlated combos now block before combo order creation.

## Remaining Warnings

1. Same-event combos remain unsupported until a sportsbook-grade correlation model exists.
2. Combo cash-out remains unsupported.
3. Cash-out v1 is estimate-only and does not execute exits.
4. Bot repo hygiene cleanup for tracked `live-internal.env` remains open.
5. Authenticated full reference-liquidity dry-run with local admin session cookie remains open.
6. Public beta remains not ready.

## Next Action

Proceed to:

```text
bot repo hygiene cleanup for tracked live-internal.env
```

Alternative next product phase:

```text
cash-out execution design and explicit no-execution UI state
```

Do not start public beta, enable real deposits/withdrawals, expose private keys, move real external funds, or enable production live bots.
