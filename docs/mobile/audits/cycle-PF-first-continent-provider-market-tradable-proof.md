# Cycle PF - First Continent Provider Market Tradable Proof

## Scope

Local MVP retail betting flow support only. This cycle expands provider-visible-to-tradable coverage beyond the `World Cup Winner` event family by making a market from `Which continent will win the World Cup?` local-MM-ready and proving fake-token order/Portfolio state.

No order book UI, chat, live stats, social features, deposits, withdrawals, backend schema work, or cosmetic UI work was touched.

## Acceptance Criteria

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| PF-P0-01 | P0 | Select a real Polymarket-backed market from a different provider event than `provider-breadth-world-cup-winner`. | Pass | Europe market `44dfd0c8-a46b-4ec0-aa2a-a5904088bbf8` in `which-continent-will-win-the-world-cup` |
| PF-P0-02 | P0 | Backend helper verifies internal trading and local bot-seeding flags remain active. | Pass | `cycle-PF-internal-beta-backend-check.json` |
| PF-P0-03 | P0 | Market is MM-enabled, seeded, live-ready, and live-enabled. | Pass | enable/prepare/live-ready/live-enabled evidence |
| PF-P0-04 | P0 | Live-local bot places quotes without exposure-cap blocking. | Pass | `cycle-PF-bot-live-local-europe-success.txt` |
| PF-P0-05 | P0 | Holiwyn mobile can see/open the provider-backed event/market on Android. | Pass | `cycle-PF-s23-continent-europe-summary.json`, `.xml`, and `.png` |
| PF-P0-06 | P0 | Mobile server-mode order fills against local MM liquidity. | Pass | `cycle-PF-provider-europe-order-portfolio-proof.json` |
| PF-P0-07 | P0 | Portfolio/history preserve provider market/outcome/token identity. | Pass | `cycle-PF-provider-europe-order-portfolio-proof.json` |

## Reference/Provider Data

- Event: `which-continent-will-win-the-world-cup`
- Market: `Will Europe (UEFA) win the 2026 FIFA World Cup?`
- Market id: `44dfd0c8-a46b-4ec0-aa2a-a5904088bbf8`
- Provider market id: `840929`
- Condition id: `0x3561a95d16ac2edfd3831aba4612c88c6f5b84a6f0924bdb6b07dc7cfe73e121`
- Filled proof outcome: Europe (UEFA) / Yes

## Proof Summary

- Backend check confirmed the internal beta trading runtime stayed healthy.
- Initial seed attempt with allowlist `Europe` matched zero markets because the provider group label is `Europe (UEFA)`.
- Corrected seed with exact label `Europe (UEFA)` produced local bot capital and inventory.
- Europe live-local placed four quotes:
  - Europe YES buy/sell
  - Europe NO buy/sell
- Mobile proof filled a Europe YES order at `0.80`, size `3`, total `2.40`.
- Portfolio/history retained `referenceSource=polymarket`, provider market id `840929`, condition id, and token id.
- S23 proof shows the continent event detail with the Europe provider-backed outcome visible and selectable.

## Runtime Notes

- No app or backend source changed.
- The standalone `poly-bot` live-local process was run with local proof env `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` so quote placement matched the backend helper's internal beta runtime.
- This cycle proves a second provider event family, not another World Cup Winner team market.

## Audit Result

P0 pass for the first continent provider-backed internal-test tradable market scope.

This does not claim current-match Spread/Totals/Team Total provider parity. Those remain unavailable from the current Polymarket-backed source path.

## Remaining Gaps

- P1: current-match Spread/Totals/Team Total provider-backed lines remain unavailable.
- P1: Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
- P1: other continent markets, top goalscorer nation markets, and golden boot player markets remain provider-visible but not fully local-MM-proven.
- P2: source/debug labels should remain useful internally but less dominant in final tester UI.
