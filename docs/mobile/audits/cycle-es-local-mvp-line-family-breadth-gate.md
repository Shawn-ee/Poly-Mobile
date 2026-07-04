# Cycle ES - Local MVP Line-Family Ticket Breadth Gate

Cycle: ES
Feature: Local MVP simple ticket breadth for Totals and Team Total markets.
Date: 2026-07-04

## Scope

Validate the selected local MVP line-family ticket path:

- Open Holiwyn on Android tablet.
- Keep default Book/orderbook controls hidden.
- Open a Totals ticket after selecting line `3.5` and `2nd Half`.
- Open a Team Total ticket for `MEX Over 1.5`.

## Acceptance Criteria

P0:

- Game Lines exposes Spread, Totals, and Team Total sections without default Book/orderbook controls.
- Totals line selection opens a simple ticket with `ticket-market-type-totals`, `ticket-line-3.5`, `ticket-period-2nd Half`, and `ticket-display-label-Over 3.5 2H`.
- Team Total row opens a simple ticket with `ticket-market-type-team-total`, `ticket-line-1.5`, `ticket-period-Reg. Time`, and `ticket-display-label-MEX Over 1.5 RT`.
- No default Book/orderbook entry points appear during the proof.

P1:

- Replace deterministic Team Total fixture data with real provider-backed route data where Polymarket exposes it.
- Show explicit unavailable/stale route status for line-family markets that Polymarket does not expose.

P2:

- Improve copy and visual polish for line-family unavailable states.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/cycle-ES-local-mvp-line-family-breadth-proof.json`
- Screenshots: `docs/mobile/screenshots/cycle-ES-local-mvp-line-family-breadth/`
- UI XML: `docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/`

Validation:

- `npm --prefix mobile run typecheck`: pass.
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/eventDetailLineTicketService.test.ts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/openOrderService.test.ts`: 18 passed.
- Samsung tablet proof: pass on `172.16.200.30:41299`.

## Gate Result

Pass for the selected Local MVP Totals and Team Total ticket journeys.

Unresolved P0 gaps: 0 for this selected flow.

Remaining P1/P2 gaps are tracked in `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`.
