# Cycle EQ - Local MVP Sell Flow Gate

Cycle: EQ
Feature: Local MVP simple Sell ticket, order placement, and Portfolio proof with default orderbook hidden.
Date: 2026-07-04

## Scope

Validate the selected local MVP retail path:

- Open Holiwyn on Android tablet.
- Open event detail with visible Book/orderbook controls hidden by default.
- Select Spread `2.5`, `1st Half`.
- Open the simple ticket, switch from Buy/Yes to Sell/No, enter `$25`, submit fake-token Sell, and verify Portfolio/activity.

## Acceptance Criteria

P0:

- Event detail shows chart/probability, game lines, spread/totals selectors, and no visible default Book/orderbook entry points.
- Selected spread line preserves `marketType=spread`, `line=2.5`, `period=1st Half`, and display label `MEX -2.5 1H`.
- Sell ticket visibly switches to Sell/No, uses current probability pricing, exposes `ticket-contract-side-no`, and shows `Swipe up to sell`.
- Submit creates a fake-token Sell order.
- Portfolio/latest order/latest activity/position preserve selected line identity, `portfolio-side-sell`, `portfolio-contract-side-no`, and `MOCK - Sell - No - MEX -2.5 1H`.

P1:

- Repeat the same Buy/Sell path with real provider-backed spread, totals, and team-total route data.
- Replace compact Sell `To win` copy with clearer proceeds/cash-out wording after a dedicated ticket copy pass.
- Prove loading/stale/unavailable non-Book states in the retail flow.

P2:

- Improve phone-density visual polish and motion.

## Implementation Notes

- `mobile/src/components/TradeTicket.tsx` now passes the active contract side into the ticket identity label. This fixed the stale metadata where the Sell/No ticket still exposed `ticket-contract-side-yes`.
- `mobile/scripts/smoke.ps1` and `mobile/scripts/smoke-tablet.ps1` now support `-LocalMvpSellFlow`.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-EQ-local-mvp-sell-flow/cycle-EQ-local-mvp-trade-flow-proof.json`
- Screenshots: `docs/mobile/screenshots/cycle-EQ-local-mvp-sell-flow/`
- UI XML: `docs/mobile/harness/cycle-EQ-local-mvp-sell-flow/`

Validation:

- PowerShell smoke script parser check: pass.
- `npm --prefix mobile run typecheck`: pass.
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/eventDetailLineTicketService.test.ts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/openOrderService.test.ts`: 17 passed.
- Samsung tablet proof: pass on `172.16.200.30:41299`.

## Gate Result

Pass for the selected Local MVP Sell journey.

Unresolved P0 gaps: 0 for this selected flow.

Remaining P1/P2 gaps are tracked in `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`.
