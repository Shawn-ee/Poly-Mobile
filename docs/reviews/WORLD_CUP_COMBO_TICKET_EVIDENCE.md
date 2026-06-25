# World Cup Combo Ticket Evidence

Date: 2026-06-25

## Summary

POLY now supports a World Cup combo ticket preview on the event detail page.

Users can:

- add outcomes from different markets into a combo slip
- remove combo legs
- clear the combo
- enter a combo amount
- see combined probability/price
- see estimated cost
- see potential payout
- see potential profit

This is a front-end/read-model foundation only. Real combo placement is intentionally not enabled in this phase.

## Why Placement Is Disabled

A true combo/parlay is not the same as placing several independent orders.

Real combo placement needs:

- combo order persistence
- combo lifecycle state
- idempotency
- one atomic ledger hold
- market close/void handling per leg
- combo settlement rules
- admin resolution compatibility
- portfolio display for combo positions
- cancel/refund rules

Those backend concepts do not exist yet as a dedicated safe model. Submitting multiple single-market orders would not create a real combo and could misrepresent user risk.

## Implemented Behavior

Event page:

- outcome tiles still select the single-market preview ticket
- each outcome tile also offers `Add to combo`
- combo allows one leg per market
- duplicate outcome legs are toggled off
- combo slip requires at least two priced legs to produce a valid combo estimate
- submit button remains disabled

Shared helper:

- `WorldCupComboLeg`
- `canAddWorldCupComboLeg`
- `estimateWorldCupComboTicket`

## Safety

- No `/api/orders` combo submission added.
- No `/api/combos` route added.
- No schema migration.
- No ledger changes.
- No balance mutation.
- No settlement changes.
- No funding/wallet/private-key changes.
- No public trading enabled.

## Tests

Added coverage in:

- `src/__tests__/world-cup-market-structure.test.ts`

Coverage:

- combo estimate multiplies leg prices
- one leg per market is enforced
- two-leg combo payout math is correct
- event page source contains combo preview copy
- event page source does not call `/api/orders`
- event page source does not call `/api/combos`

## Next Step For Real Placement

Implement a separate high-risk backend phase:

1. Add combo order schema.
2. Add guarded internal beta combo API.
3. Add atomic ledger hold.
4. Add portfolio combo display.
5. Add admin settlement/void rules.
6. Add idempotency and duplicate prevention.
7. Keep public trading disabled until reviewed.
