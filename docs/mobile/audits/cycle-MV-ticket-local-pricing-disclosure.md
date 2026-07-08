# Cycle MV - Ticket Local Pricing Disclosure

## Scope

Make local line-market pricing disclosure visible inside the Trade Ticket before swipe submit.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or non-MVP polish.

## Why

Cycle MU disclosed `Local test pricing` on Event Detail line rows. The same warning needs to travel into the amount-entry ticket because that is the final decision point before the user swipes to buy/sell.

## Acceptance Criteria

- P0: A ticket opened from a `contract-fixture` line market shows `Local test pricing`.
- P0: Android UI hierarchy exposes the ticket disclosure as `ticket-local-test-pricing`.
- P0: The existing ticket still preserves market type, line, period, outcome, and source identity.
- P0: Swipe buy still reaches Portfolio/history with filled activity.
- P0: No backend route/schema/order logic is changed.

## Implementation Result

Pass.

- Added `ticketSourceNote()` in `TradeTicket.tsx`.
- Contract-fixture tickets now show `Local test pricing` below the Local source pill.
- Provider-backed tickets show `Provider market`.
- Updated S23 proof assertions for the ticket-level disclosure.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MV-ticket-local-pricing-disclosure/cycle-MV-current-mvp-s23-visible-flow.json`.
- Counterparty proof: `docs/mobile/harness/cycle-MV-ticket-local-pricing-disclosure/cycle-MV-current-mvp-counterparty.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-MV-ticket-local-pricing-disclosure/`, `docs/mobile/harness/cycle-MV-ticket-local-pricing-disclosure/`.
- Tests:
  - `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` parse check
  - `npm --prefix mobile exec tsc -- --noEmit --pretty false`
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/marketListsHomeCardSelections.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`

## Audit Gate

Result: Pass for focused Trade Ticket local-pricing disclosure.

Remaining P1:

- Real provider-backed Spread/Totals/Team Total line markets remain unavailable for inspected events.
- The disclosure does not replace future provider mapping work.
