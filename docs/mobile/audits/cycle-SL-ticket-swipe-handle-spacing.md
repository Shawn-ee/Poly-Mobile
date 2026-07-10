# Cycle SL - Ticket Swipe Handle Spacing

## Scope

Trade Ticket amount-entry swipe-to-buy/sell footer in the Local MVP path.

## Reference/Product Direction

The Polymarket ticket reference keeps the swipe handle visually above the submit label. In Cycle SK, Holiwyn's ticket header was cleaner, but the S23 screenshot still showed the swipe chevron sitting on top of `Swipe to buy`, making the footer feel messy.

## Criteria

### P0

- The swipe footer must keep the handle visibly above the `Swipe to buy` / `Swipe to sell` label on Samsung S23.
- The handle must still move upward with swipe progress and keep the existing threshold-submit behavior.
- The amount, keypad, odds/balance, and fixed bottom swipe area must remain visible and non-overlapping.
- No order book, chat, live stats, backend schema, or order route behavior may change.

### P1

- Future proof should capture a mid-drag screenshot after a broader swipe-motion cycle.

## Implementation

- Changed the swipe handle from an absolute overlay to normal-flow placement above the label.
- Kept `handleLift = -118 * swipeProgress` so gesture progress still moves the handle upward.
- Added `swipe-submit-handle-above-label-s23` markers to the submit control and handle.
- Updated `tradeTicketSwipeMotionContract.test.ts` to reject the old absolute `left: "50%"` / `marginLeft: -19` layout.

## Audit Gate

Status: passed.

Proof:

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Summary: `docs/mobile/harness/cycle-SL-ticket-swipe-handle-spacing/cycle-SL-current-mvp-s23-visible-flow.json`.
- Ticket screenshot: `docs/mobile/screenshots/cycle-SL-ticket-swipe-handle-spacing/cycle-SL-current-mvp-ticket-ready.png`.
- Ticket XML: `docs/mobile/harness/cycle-SL-ticket-swipe-handle-spacing/cycle-SL-current-mvp-ticket-ready.xml`.
- XML bounds prove separation: `swipe-submit-handle` is `[489,1920][591,1980]`; `Swipe to buy` starts at `[385,1992]`, leaving visible vertical clearance.

## Remaining Gaps

- P0: 0 for this focused swipe-handle spacing scope.
- P1: mid-drag screenshot proof and broader swipe-motion polish remain future work.
