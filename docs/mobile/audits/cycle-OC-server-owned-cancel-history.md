# Cycle OC - Server-Owned Cancel History

## Scope
- Local MVP retail flow: Home -> Event Detail -> line market -> Buy ticket -> fake-token server order -> Portfolio open order -> cancel -> History.
- No order book UI, chat, live stats, social, schema migration, or non-MVP polish.

## Inspection Result
- The current service is enough for the MVP order lifecycle path: `/api/events`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are reachable locally.
- Regulation Winner is Polymarket-backed in the current provider path.
- Spread, totals, and team-total rows remain contract-shaped fixture markets, not fully real Polymarket-backed markets yet. This is still the next structural gap before broader market parity.

## Acceptance Criteria
- P0: Canceling a server-backed open order must wait for `DELETE /api/orders/:id` before updating visible mobile portfolio state.
- P0: After cancel, mobile must refresh from `/api/portfolio` and `/api/portfolio/history`.
- P0: If `/api/portfolio/history` returns `canceled-order-${order.id}`, mobile must use that server-owned activity instead of appending a duplicate local cancellation row.
- P0: If the server history route does not include the canceled row, mobile may append the existing local fallback activity to keep the user-visible History path working.
- P0: Selected market, line, outcome, side, and provider identity must stay visible through ticket, open order, cancel, and history.
- P1: Proof wrapper filenames should be renamed from the inherited cycle-OB prefix in a later harness cleanup.

## Implementation
- `mobile/App.tsx`
  - `refreshServerPortfolio()` now returns the loaded server portfolio state after applying it.
  - Server-mode cancel checks refreshed server activities for `canceled-order-${order.id}`.
  - Local cancel activity is appended only when server history did not include the canceled order.
- `mobile/src/__tests__/mvpBackendReadinessGate.test.ts`
  - Updated readiness check to guard the server-owned cancellation behavior.

## Route and Data Dependencies
- `DELETE /api/orders/:id`
  - Required for fake-token order cancellation.
  - Mobile requires a successful response before server-mode portfolio mutation.
- `GET /api/portfolio`
  - Required after cancel to refresh positions and open orders.
- `GET /api/portfolio/history`
  - Required after cancel to return canceled order activity with preserved `selection`.

## Proof
- Typecheck: pass via S23 proof wrapper.
- Route contract proof: `docs/mobile/harness/cycle-OC-server-owned-cancel-history/cycle-OC-open-order-cancel-route-contract.json`
- Portfolio sync proof: `docs/mobile/harness/cycle-OC-server-owned-cancel-history/cycle-OC-portfolio-sync-route-contract.json`
- S23 proof summary: `docs/mobile/harness/cycle-OC-server-owned-cancel-history/cycle-OC-server-owned-cancel-history-proof.json`
- S23 screenshots: `docs/mobile/screenshots/cycle-OC-server-owned-cancel-history/`

## Audit Gate
- Result: pass for the narrow OC scope.
- Visible user behavior improved: cancel/history now relies on server-owned history when available, so the mobile Portfolio/history path is closer to a real account-backed flow.
- Remaining P1/P2 debt:
  - Spread, totals, and team-total markets still need real Polymarket-backed discovery/mapping where available.
  - Proof wrapper internal artifact names still use the previous cycle prefix.
