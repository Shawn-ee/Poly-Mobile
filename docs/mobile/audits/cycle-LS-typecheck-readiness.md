# Cycle LS Typecheck Readiness

Date: 2026-07-08

## Scope

Restore full backend TypeScript validation for the Holiwyn mobile MVP route contracts.

This supports the audit-gated loop by making future Home, Event Detail, ticket, Portfolio, and history route changes eligible for full typecheck proof again.

Out of scope: mobile UI changes, order book UI, chat, live stats, social features, schema migrations, and Android proof.

## Problem

Previous cycles passed focused tests, but full typecheck failed in `src/server/services/eventReadModel.ts` because TypeScript widened `marketProfile` and `resultMode` to plain `string`.

That meant full route contract validation could not be used as a clean gate.

## Implementation

Updated `eventReadModel.ts` with:

- explicit `MarketProfile` and `ResultMode` aliases
- literal allowed-value arrays
- type guards for market profile, result mode, and supported market type
- explicit `deriveEventMarketRules(): EventMarketRules` return typing

No runtime behavior was intentionally changed.

## Acceptance Criteria

| Criterion ID | Priority | Result | Evidence |
| --- | --- | --- | --- |
| LS-TYPE-P0-01 | P0 | Pass | `npx tsc --noEmit --pretty false --skipLibCheck` passes. |
| LS-TYPE-P0-02 | P0 | Pass | Focused MVP route tests still pass. |
| LS-TYPE-P0-03 | P0 | Pass | Event market rules contract test still passes. |
| LS-TYPE-P0-04 | P0 | Partial | Android proof not applicable; no ADB device visible. |

## Evidence

- `src/server/services/eventReadModel.ts`

Validation:

- `npx tsc --noEmit --pretty false --skipLibCheck`
- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts src/__tests__/mobile-event-market-rules-contract.test.ts`

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| S23 visible proof for Home -> Event Detail -> line ticket -> Portfolio/history | P0 | Open; no ADB device visible |
| Real provider-backed line markets | P1 | Open; selected Gamma event exposes none |
| Mobile UI consumption of source summaries | P1 | Open |
