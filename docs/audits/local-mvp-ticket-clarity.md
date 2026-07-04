# Local MVP Ticket Clarity Audit

## Scope

Feature: Buy/Sell ticket for World Cup event/detail markets.

Cycle: FM - Local MVP Ticket Clarity.

## Polymarket Reference Behavior

Observed reference pattern from prior mobile audits: the trading ticket acts like a bottom sheet, keeps the selected outcome visible, shows the current price/probability, lets the user enter an amount, previews shares/payout economics, and uses an upward confirmation gesture for submit.

## Holiwyn Acceptance Criteria

### P0

- Ticket opens from an event/detail selected outcome without losing market/outcome identity.
- Ticket visibly shows selected outcome, event/market context, current price/probability, line, period, estimated shares, and estimated payout before submit.
- Ticket Yes/No switching updates the displayed contract price and payout math.
- Submit uses the selected contract side and existing fake-token order path.
- Android proof must show the visible review card and swipe submit in the same ticket flow.

### P1

- Provider/source IDs remain available in accessibility/device hierarchy for harness verification.
- The review card handles long line labels without pushing the submit control off the reachable flow.

### P2

- Match Polymarket's exact gesture animation and microcopy.

## Audit Gate Result

Status: pass.

Concrete implementation change: `src/components/TradeTicket.tsx` now renders a default visible order review card with market type, line, period, price, estimated shares, and estimated payout derived from the same ticket state used by submit.

Device proof: `npm run smoke:tablet:event-detail-trade` passed on Samsung tablet `SM_X526C`. The proof verified `ticket-order-review`, `ticket-order-review-price`, `ticket-order-review-payout`, amount preset behavior, advanced details, and alternate outcome ticket opening.
