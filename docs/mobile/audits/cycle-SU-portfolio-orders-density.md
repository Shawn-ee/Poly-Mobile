# Cycle SU - Portfolio Orders Row Density

## Scope

Local MVP Portfolio Orders tab after a fake-token/server-backed open order.

Out of scope: order book UI, chat, live stats, social features, deposits/withdrawals, backend schema changes, History redesign, Positions redesign, and native Google OAuth proof.

## Reference Behavior

Polymarket mobile Portfolio Orders rows are compact and action-focused: the user can identify the event, side, market/outcome, order amount, price, remaining exposure, relative timing/status, and available cancel action without reading an internal/debug-style row.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Orders row keeps event and market context visible. | Pass |
| P0 | Orders row separates Buy/Sell side pill from the outcome/market title. | Pass |
| P0 | Orders row shows limit price, order value, and remaining quantity as a compact visible metric strip. | Pass |
| P0 | Cancel action remains visible and calls the existing cancel path. | Pass |
| P0 | Row tap still expands the existing detail panel. | Pass |
| P0 | No backend/order route or schema behavior changes. | Pass |
| P0 | Samsung S23 proof covers open-order visibility after a Local MVP order. | Pass |

## Implementation Notes

- Component: `mobile/src/components/Portfolio.tsx`.
- Contract test: `mobile/src/__tests__/portfolioOrdersDensityContract.test.ts`.
- Existing backend fields consumed: order title, outcome, side, status, limit price, order value, remaining shares, original shares, placed time, and selection identity.

## Android Proof

- Device: Samsung S23 `SM-S911U1`.
- ADB target: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Proof summary: `docs/mobile/harness/cycle-SU-portfolio-orders-density/cycle-SU-current-mvp-s23-visible-flow.json`.
- Screenshots: `docs/mobile/screenshots/cycle-SU-portfolio-orders-density/`.
- Result: Pass. The proof reached Home -> Live -> Event Detail -> Trade Ticket -> server-backed open order -> Portfolio Orders row and verified `openOrderVisible`, `openOrderSourceBadgeVisible`, and `fixtureLineOrderAccepted`.

## Audit Result

P0 pass. Remaining Portfolio parity work should focus on broader account-level visual parity only if it directly supports the Local MVP Home -> Event Detail -> Trade Ticket -> Portfolio/history path.
