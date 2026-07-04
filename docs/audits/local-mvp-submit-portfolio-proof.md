# Local MVP Submit To Portfolio Audit

## Scope

Feature: selected World Cup line market -> ticket -> fake-token order -> Portfolio/history.

Cycle: FN - Local MVP Submit To Portfolio Proof.

## Polymarket Reference Behavior

Reference behavior from prior mobile audits: a user selects a market/outcome/line, reviews the ticket economics, submits the order through the bottom-sheet confirmation control, and the position/order is reflected in portfolio/activity with the same selected contract identity.

## Holiwyn Acceptance Criteria

### P0

- Event Detail must expose the selected spread line and period without default order book UI.
- Ticket must show selected line/outcome identity, price, estimated shares, payout, and submit control before order placement.
- Fake-token submit must close the ticket and navigate to Portfolio.
- Portfolio must show updated fake balance, latest order, recent activity, and position card.
- Portfolio must preserve market type, line, period, side, display label, and contract side.
- Android proof must cover the whole path in one run.

### P1

- Server-backed order and Portfolio sync should pass the same visible flow once backend health and API credentials are available.

### P2

- Exact Polymarket animation parity for the submit gesture remains polish.

## Audit Gate Result

Status: pass.

Device proof: `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8218` passed on Samsung tablet `SM_X526C`.

Implementation/proof change: `scripts/smoke.ps1` now requires `ticket-order-review`, line/period/shares/payout assertions, `ticket-order-review-payout`, submit, and Portfolio identity in the same Local MVP proof.
