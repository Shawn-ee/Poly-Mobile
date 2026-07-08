# Cycle NQ - Server-Mode Line Family Readiness

## Scope

Local MVP inspection/proof cycle for the current server-backed user journey:

Home -> Live -> Home -> Event Detail -> Game Lines -> Spread line -> Buy ticket -> Portfolio open order.

This cycle responds to the service inspection concern that Regulation Winner is provider-backed, but line markets may still be fixture-backed.

## Reference / Service State

- Current route event: `argentina-vs-egypt`.
- Regulation Winner: provider-backed.
- Spread/Totals/Team Total: backend `contract-fixture`.
- Orderbook/chat/live stats: hidden for Local MVP.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NQ-P0-01 | P0 | Samsung S23 can open the server-backed current Home/Live route. | Pass |
| NQ-P0-02 | P0 | Event Detail displays and exposes audit markers for provider winner plus local line-family readiness. | Pass |
| NQ-P0-03 | P0 | The user can select a spread line and the ticket preserves `marketType`, `line`, and source identity. | Pass |
| NQ-P0-04 | P0 | Swipe submit posts through the server order route and reaches Portfolio. | Pass |
| NQ-P0-05 | P0 | Portfolio open order preserves spread line/source identity. | Pass |
| NQ-P1-01 | P1 | Real provider-backed Spread/Totals/Team Total markets are available. | Partial |

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Backend: `http://172.16.200.14:3002`
- Expo proof port: `8298`

Evidence:

- `docs/mobile/harness/cycle-NQ-server-mode-line-family-readiness/cycle-NQ-current-mvp-s23-visible-flow.json`
- `docs/mobile/screenshots/cycle-NQ-server-mode-line-family-readiness/cycle-NQ-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-NQ-server-mode-line-family-readiness/cycle-NQ-current-mvp-live.png`
- `docs/mobile/screenshots/cycle-NQ-server-mode-line-family-readiness/cycle-NQ-current-mvp-detail-top.png`
- `docs/mobile/screenshots/cycle-NQ-server-mode-line-family-readiness/cycle-NQ-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-NQ-server-mode-line-family-readiness/cycle-NQ-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-NQ-server-mode-line-family-readiness/cycle-NQ-current-mvp-after-submit.png`

## Audit Result

Pass for current Local MVP service-state proof.

Not a final Polymarket line-market parity pass. The app now clearly discloses the current provider/local split, but real provider-backed line ingestion remains a P1 service milestone.
