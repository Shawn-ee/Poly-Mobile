# Cycle ST - Portfolio History Row Density

## Scope

Local MVP Portfolio History tab after a fake-token/server-backed buy/cashout.

Out of scope: order book UI, chat, live stats, social features, deposits/withdrawals, backend schema changes, Orders tab redesign, and native Google OAuth proof.

## Reference Behavior

Polymarket mobile Portfolio History rows present compact event context, a side/status treatment, market/outcome title, amount on the right, relative time, and enough execution context to understand what happened without opening a separate internal/debug panel.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | History row keeps event and market context visible. | Pass |
| P0 | History row separates the action verb, Yes/No side pill, and outcome title. | Pass |
| P0 | History row shows amount/proceeds, shares, and execution price/probability as a compact visible metric strip. | Pass |
| P0 | Row tap still expands the existing detail panel. | Pass |
| P0 | No backend/order route or schema behavior changes. | Pass |
| P0 | Samsung S23 proof covers buy/cashout History visibility after a Local MVP order. | Pass |
| P1 | Orders rows match Polymarket density. | Open |

## Implementation Notes

- Component: `mobile/src/components/Portfolio.tsx`.
- Contract test: `mobile/src/__tests__/portfolioHistoryDensityContract.test.ts`.
- Existing backend fields consumed: activity amount/proceeds, shares, probability, action, side, selection identity, event title, and market title.

## Android Proof

- Device: Samsung S23 `SM-S911U1`.
- Proof summary: `docs/mobile/harness/cycle-ST-portfolio-history-density/cycle-ST-current-mvp-s23-visible-flow.json`.
- Screenshots: `docs/mobile/screenshots/cycle-ST-portfolio-history-density/`.
- Result: Pass. The proof reached Home -> Live -> Event Detail -> Trade Ticket -> server-backed buy -> Portfolio position row -> Cash out Sell Ticket -> cashout History.

## Audit Result

P0 pass. Remaining P1 gap: Orders row density still needs its own Local MVP parity cycle.
