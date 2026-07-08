# Cycle MN - Trade Ticket Source Badge

## Scope

Local MVP Trade Ticket source disclosure for the current mixed provider/local market state.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or provider discovery breadth.

## Inspection Result

- Cycle MM made Event Detail rows visibly distinguish Provider versus Local sources.
- The Trade Ticket already preserved provider/source identity in hidden labels and order payloads, but the user did not see that source state before swiping.

## Acceptance Criteria

- P0: Ticket header must visibly show `Provider` when the selected ticket is Polymarket-backed.
- P0: Ticket header must visibly show `Local` when the selected ticket is a `contract-fixture` line market.
- P0: Badge must be derived from `ticket.selection.referenceSource` or `ticket.market.referenceSource`.
- P0: Existing S23 line ticket -> swipe submit -> Portfolio/history flow must still pass.
- P1: Real provider-backed line markets still replace Local line tickets when attach-ready candidates exist.

## Implementation Result

Pass for focused P0 scope.

- Added `ticketSourceBadge()` in Trade Ticket.
- Added visible `Provider`/`Local` badge in the ticket header beside the selected contract text.
- Added focused source-contract test.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MN-ticket-source-badge/cycle-MN-current-mvp-s23-visible-flow.json`.
- S23 screenshot: `docs/mobile/screenshots/cycle-MN-ticket-source-badge/cycle-MN-current-mvp-ticket-ready.png`.
- S23 XML: `docs/mobile/harness/cycle-MN-ticket-source-badge/cycle-MN-current-mvp-ticket-ready.xml`.
- Tests:
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/tradeTicketSourceBadge.test.ts mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts mobile/src/__tests__/orderService.test.ts`
  - `npm run -s typecheck` in `mobile/`.

Observed S23 markers:

- `ticket-market-source-badge`
- `ticket-source-badge-local`
- Visible text: `Local`
- `ticket-provider-source-contract-fixture`
- `ticket-line-1.5`
- `ticket-market-family-spread`

## Audit Gate

Result: Pass for focused ticket-source disclosure scope.

Remaining tracked P1:

- Real provider-backed Spread/Totals/Team Total candidates are still unavailable for the inspected Local MVP event.
