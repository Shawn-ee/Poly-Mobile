# Cycle WH - Trade Ticket Header Simplification

## Scope

Local MVP retail betting flow: Event Detail -> Team Total line -> full-screen Trade Ticket amount entry.

This cycle only simplifies the amount-entry header. It does not change backend order logic, market routes, order book UI, chat, live stats, social, auth, schemas, or portfolio behavior.

## Polymarket Reference Behavior

The Polymarket-style amount-entry ticket keeps the top context compact:

- Close button at top left.
- Team/logo beside the event title.
- One short selection line under the event title.
- Large amount, to-win line, odds/balance, presets, keypad, and bottom swipe zone.
- The ticket avoids extra debug/provider/status labels in the main visual path.

## Holiwyn Acceptance Criteria

P0:

- Header selection text must show the actual selected market/outcome line, not only the generic market group.
- The extra visible `Buy/Sell <outcome>` badge must not appear between the to-win line and the keypad.
- The order mode can remain available to automation/audit through hidden accessibility metadata.
- Amount, keypad, and swipe footer remain visible and separated on Samsung S23.
- Existing fake-token submit flow and portfolio/history proof still pass.

P1:

- Continuous gesture video proof would be stronger than still screenshots for final swipe polish.
- Full visual polish against the latest logged-in Polymarket ticket can continue in a later ticket-specific cycle.

## Implementation

- `mobile/src/components/TradeTicket.tsx`
  - Uses `ticket.selection?.referenceOutcomeLabel ?? outcomeLabel` for the header selection label.
  - Adds explicit header audit labels: `ticket-header-selected-outcome-simple` and `ticket-header-actual-outcome-label`.
  - Replaces the visible order-mode badge with hidden audit-only metadata: `ticket-order-mode-audit-only`.
- `mobile/src/__tests__/tradeTicketHeaderDensityContract.test.ts`
  - Guards the simplified header contract and rejects the old visible order-mode marker.

## Device Proof

Holiwyn device:

- Samsung S23 `SM-S911U1`
- ADB: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`

Evidence:

- Summary: `docs/mobile/harness/cycle-WH-ticket-header-simplification/cycle-WH-current-mvp-s23-visible-flow.json`
- Ticket-ready screenshot: `docs/mobile/screenshots/cycle-WH-ticket-header-simplification/cycle-WH-current-mvp-ticket-ready.png`
- Ticket-ready XML: `docs/mobile/harness/cycle-WH-ticket-header-simplification/cycle-WH-current-mvp-ticket-ready.xml`

Proof result:

- Pass.
- XML contains `ticket-header-actual-outcome-label`.
- XML contains `Argentina Over 1.5`.
- XML contains `ticket-order-mode-audit-only`.
- XML does not contain the old exact visible marker `ticket-order-mode-visible ticket-order-mode-`.
- Order book and chat remain hidden in the Local MVP path.

## Audit Gate

Gate status: Pass for focused Trade Ticket header simplification.

Unresolved P0 gaps: 0 for this focused scope.

Remaining P1/P2:

- P1: stronger continuous gesture/video proof for the swipe motion.
- P1: further ticket visual polish may be needed after the next real Polymarket logged-in ticket comparison.
