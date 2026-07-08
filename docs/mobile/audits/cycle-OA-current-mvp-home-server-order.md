# Cycle OA - Current MVP Home Server Order Proof

Date: 2026-07-08

Scope:

- Inspect the current Local MVP service state after repeated provider-line gaps.
- Repair the S23 proof harness so it targets the current Home feed instead of the retired EL-A proof event.
- Prove the visible Home -> Event Detail -> line market -> Trade Ticket -> server-backed fake-token order -> Portfolio/open order path on Samsung S23.

Reference/service inspection:

- Selected current MVP event: `argentina-vs-egypt` / `Argentina vs. Egypt`.
- Regulation Winner is provider-backed from Polymarket.
- Spread, Total Goals, and Team Total Goals are present as backend-shaped `contract-fixture` line markets.
- Polymarket provider-backed Spread/Totals/Team Total markets are still not attached for this event.

Acceptance criteria:

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| OA-P0-01 | P0 | Current service inspection names the real selected Home event and separates provider-backed winner markets from local test line markets. | Pass | `docs/mobile/harness/cycle-OA-current-mvp-home-server-order/cycle-OA-current-mvp-state-inspection.json` |
| OA-P0-02 | P0 | S23 proof opens Home and shows `Argentina vs. Egypt` with source honesty copy. | Pass | `docs/mobile/screenshots/cycle-OA-current-mvp-home-server-order/cycle-OA-current-mvp-home-server-order-home.png` |
| OA-P0-03 | P0 | S23 proof opens Event Detail and reaches Game Lines without chat/orderbook work. | Pass | `docs/mobile/screenshots/cycle-OA-current-mvp-home-server-order/cycle-OA-current-mvp-home-server-order-detail-top.png` and `...line-markets.png` |
| OA-P0-04 | P0 | S23 proof opens a contract-shaped spread ticket with market, line, period, source, and token identity visible in hierarchy. | Pass | `docs/mobile/screenshots/cycle-OA-current-mvp-home-server-order/cycle-OA-current-mvp-home-server-order-spread-ticket.png` |
| OA-P0-05 | P0 | S23 proof submits a fake-token server order through the swipe ticket and lands on Portfolio open order. | Pass | `docs/mobile/screenshots/cycle-OA-current-mvp-home-server-order/cycle-OA-current-mvp-home-server-order-portfolio.png` |
| OA-P0-06 | P0 | Route proof separately verifies the order/portfolio lifecycle after backend restart with trading beta enabled. | Pass | `docs/mobile/harness/cycle-OA-current-mvp-home-server-order/cycle-OA-home-to-portfolio-route-journey-after-backend-restart.json` |

Implementation notes:

- `mobile/scripts/local-mvp-home-route-server-order-proof.ps1` now runs the current MVP inspection and passes `argentina-vs-egypt` into the S23 smoke harness.
- `mobile/scripts/smoke.ps1` now supports the current MVP Home/detail/ticket/portfolio labels and selects a visible spread row.
- `mobile/src/api.ts` raises the mobile API timeout to 12 seconds so real S23 server-mode order submission is not aborted prematurely on the local network.
- Local backend server must run with `INTERNAL_TRADING_BETA_ENABLED=true`, `TRADING_KILL_SWITCH=false`, and `NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true` for this internal fake-token order proof.

Audit result:

- Gate status: Pass for the Local MVP visible server-order path on Samsung S23.
- Remaining P1: real provider-backed Spread/Totals/Team Total ingestion is still open. Current line markets are honest `contract-fixture` rows and should not be called Polymarket-backed.
- Remaining P1: the S23 proof creates an open order for the visible selected spread row; route proof separately verifies a filled spread order with seeded liquidity.
