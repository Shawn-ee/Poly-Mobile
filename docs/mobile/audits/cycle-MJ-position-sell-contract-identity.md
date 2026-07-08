# Cycle MJ - Position Sell Contract Identity

## Scope

Local MVP Portfolio position action identity only.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or provider discovery breadth.

## Current Reference/Acceptance Logic

Polymarket-style trading separates action direction from contract identity:

- A user can sell an owned Yes position without changing the contract into No.
- `SELL` means close/reduce the owned contract.
- `YES` or `NO` remains the binary contract being traded.
- The ticket/order/portfolio/history path must preserve selected event, market, outcome, line, period, and contract side.

## Holiwyn Criteria

P0:

- Owned Yes position ticket identity must keep `contractSide=yes`.
- Owned No position ticket identity must keep `contractSide=no`.
- Position selection snapshot must preserve `marketId`, `outcomeId`, `line`, `period`, display label, and source metadata.
- The app must not force `contractSide=no` just because the action is `sell`.
- Current S23 Local MVP flow must still pass after the change.

P1:

- Add a fresh visible S23 proof for a dedicated position-sell/retrade surface if Holiwyn exposes it separately from Cash out.

P2:

- Polish Portfolio copy for the difference between Cash out and explicit Sell/Ret trade actions.

## Implementation Result

Pass for focused P0 scope.

- Added `buildPositionTradeTicketIdentity()` as a shared resolver.
- `openPositionTrade()` now uses the resolver instead of sell-action side flipping.
- Added focused unit tests for owned Yes, owned No, and legacy fallback positions.
- Updated stale server-position-trade smoke expectation to require `ticket-contract-side-yes` for an owned Yes sell/retrade ticket.

## Evidence

- Identity proof: `docs/mobile/harness/cycle-MJ-position-sell-contract-identity/cycle-MJ-position-sell-contract-identity.json`.
- S23 proof: `docs/mobile/harness/cycle-MJ-position-sell-contract-identity/cycle-MJ-current-mvp-s23-visible-flow.json`.
- S23 screenshots: `docs/mobile/screenshots/cycle-MJ-position-sell-contract-identity/`.
- Focused tests: `mobile/src/__tests__/positionTradeTicketService.test.ts`, `mobile/src/__tests__/positionTradeTargetService.test.ts`, `mobile/src/__tests__/orderService.test.ts`.

## Audit Gate

Result: Pass for the focused identity fix.

Remaining tracked P1:

- Real provider-backed Spread/Totals/Team Total line markets remain unavailable for the inspected MVP event.
- A dedicated visible position-sell/retrade Android proof is deferred until the product exposes that separate from the visible Cash out path.
