# Cycle SS - Portfolio Position Row Density

## Scope

Local MVP Portfolio Positions tab after a fake-token/server-backed buy fill.

Out of scope: order book UI, chat, live stats, social features, deposits/withdrawals, backend schema changes, Orders tab redesign, History row redesign, and native Google OAuth proof.

## Reference Behavior

Polymarket mobile Portfolio positions present compact event context, an outcome side pill, clear market/outcome title, cost/current/to-win values, and direct Cash out / add-to-position actions without forcing the user into an expanded detail panel.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Position row keeps event score/live context visible. | Pass |
| P0 | Position title separates the Yes/No side pill from the outcome label. | Pass |
| P0 | Position row shows Cost, Current, and To win as a compact three-column strip. | Pass |
| P0 | Cash out still opens the generic Sell Trade Ticket. | Pass |
| P0 | `+` action still opens the Buy Trade Ticket. | Pass |
| P0 | No backend/order route or schema behavior changes. | Pass |
| P0 | Samsung S23 proof covers filled position visibility after a Local MVP order. | Pass |
| P1 | Orders and History rows match Polymarket density. | Open |

## Implementation Notes

- Component: `mobile/src/components/Portfolio.tsx`.
- Contract test: `mobile/src/__tests__/portfolioPositionDensityContract.test.ts`.
- Existing backend fields consumed: position amount, current value, P/L, probability/current price, payout estimate, and selection identity.

## Android Proof

- Device: Samsung S23 `SM-S911U1`.
- Proof summary: `docs/mobile/harness/cycle-SS-portfolio-position-density/cycle-SS-current-mvp-s23-visible-flow.json`.
- Screenshots: `docs/mobile/screenshots/cycle-SS-portfolio-position-density/`.
- Result: Pass. The proof reached Home -> Live -> Event Detail -> Trade Ticket -> server-backed buy -> Portfolio position row -> Cash out Sell Ticket -> cashout history.

## Audit Result

P0 pass. Remaining P1 gap: Orders and History row density still need their own Local MVP parity cycle.
