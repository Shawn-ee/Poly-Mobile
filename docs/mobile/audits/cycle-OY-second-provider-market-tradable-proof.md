# Cycle OY - Second Provider Market Tradable Proof

## Scope

Local MVP retail betting flow support only. This cycle expands provider-visible-to-tradable coverage from one World Cup Winner market to two markets by making France local-MM-ready and proving fake-token order/Portfolio state.

No order book UI, chat, live stats, social features, deposits, withdrawals, or cosmetic UI work was touched.

## Acceptance Criteria

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| OY-P0-01 | P0 | Select a second real Polymarket-backed World Cup Winner market beyond England. | Pass | France market `162bc614-c644-49fd-a2bc-3a1f2ceb3d04` |
| OY-P0-02 | P0 | Backend helper starts with both internal trading and local bot-seeding flags. | Pass | `cycle-OY-internal-beta-backend-restart.json` |
| OY-P0-03 | P0 | Market is MM-enabled, seeded, live-ready, and live-enabled. | Pass | enable/prepare/live-ready/live-enabled evidence |
| OY-P0-04 | P0 | Live-local bot places quotes without exposure-cap blocking. | Pass | `cycle-OY-bot-live-local-france-after-seed-success.txt` |
| OY-P0-05 | P0 | Holiwyn mobile can see/open the provider-backed market on Android. | Pass | `cycle-OY-s23-search-france.xml` and `.png` |
| OY-P0-06 | P0 | Mobile server-mode order fills against local MM liquidity. | Pass | `cycle-OY-provider-france-order-portfolio-proof.json` |
| OY-P0-07 | P0 | Portfolio/history preserve provider market/outcome/token identity. | Pass | `cycle-OY-provider-france-order-portfolio-proof.json` |

## Reference/Provider Data

- Event: `provider-breadth-world-cup-winner`
- Market: `Will France win the 2026 FIFA World Cup?`
- Market id: `162bc614-c644-49fd-a2bc-3a1f2ceb3d04`
- Provider market id: `558936`
- Condition id: `0x9b6fef249040fd17e9c107955b37ac2c3e923509b6b0ff01cc463a331ddeb894`
- Filled proof outcome: France / Yes

## Implementation Notes

- Extended `scripts/start_holiwyn_internal_beta_backend.ps1` so local backend startup includes the bot-seeding env required by `/api/admin/reference-markets/:id/seed-bot`.
- Extended `scripts/prove_mobile_provider_visible_tradable_flow.ts` with `--search=<query>` so OY proof searches France instead of inheriting the England query.
- France seed initially failed before the helper carried bot-seeding env. After helper restart, seed and live-local quote placement passed.

## Proof Summary

- Backend restart summary shows internal trading and local bot flags enabled.
- France seed produced local bot capital and runtime credentials.
- France live-local placed four quotes:
  - France YES buy/sell
  - France NO buy/sell
- Mobile proof filled a France YES order at `0.35`, size `2`, total `0.70`.
- Portfolio/history retained `referenceSource=polymarket`, provider market id `558936`, condition id, and token id.
- S23 proof shows World Cup Winner detail with the France provider-backed outcome visible and selectable.

## Audit Result

P0 pass for the second provider-backed internal-test tradable market scope.

This does not claim current-match Spread/Totals/Team Total provider parity. Those remain unavailable from the current Polymarket-backed source path.

## Remaining Gaps

- P1: current-match Spread/Totals/Team Total provider-backed lines remain unavailable.
- P1: Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
- P2: source/debug labels should remain useful internally but less dominant in final tester UI.
