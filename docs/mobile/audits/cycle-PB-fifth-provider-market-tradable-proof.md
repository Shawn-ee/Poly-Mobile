# Cycle PB - Fifth Provider Market Tradable Proof

## Scope

Local MVP retail betting flow support only. This cycle expands provider-visible-to-tradable coverage from four World Cup Winner markets to five markets by making Argentina local-MM-ready and proving fake-token order/Portfolio state.

No order book UI, chat, live stats, social features, deposits, withdrawals, backend schema work, or cosmetic UI work was touched.

## Acceptance Criteria

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| PB-P0-01 | P0 | Select a fifth real Polymarket-backed World Cup Winner market beyond England, France, Spain, and Switzerland. | Pass | Argentina market `8210401b-3b19-49fa-bf50-ba985a8843e2` |
| PB-P0-02 | P0 | Backend helper verifies internal trading and local bot-seeding flags remain active. | Pass | `cycle-PB-internal-beta-backend-check.json` |
| PB-P0-03 | P0 | Market is MM-enabled, seeded, live-ready, and live-enabled. | Pass | enable/prepare/live-ready/live-enabled evidence |
| PB-P0-04 | P0 | Live-local bot places quotes without exposure-cap blocking. | Pass | `cycle-PB-bot-live-local-argentina-success.txt` |
| PB-P0-05 | P0 | Holiwyn mobile can see/open the provider-backed market on Android. | Pass | `cycle-PB-s23-search-argentina.xml` and `.png` |
| PB-P0-06 | P0 | Mobile server-mode order fills against local MM liquidity. | Pass | `cycle-PB-provider-argentina-order-portfolio-proof.json` |
| PB-P0-07 | P0 | Portfolio/history preserve provider market/outcome/token identity. | Pass | `cycle-PB-provider-argentina-order-portfolio-proof.json` |

## Reference/Provider Data

- Event: `provider-breadth-world-cup-winner`
- Market: `Will Argentina win the 2026 FIFA World Cup?`
- Market id: `8210401b-3b19-49fa-bf50-ba985a8843e2`
- Provider market id: `558938`
- Condition id: `0x0c4cd2055d6ea89354ffddc55d6dbcef9355748112ea952fc925f3db6a5c457f`
- Filled proof outcome: Argentina / Yes

## Proof Summary

- Backend check confirmed the internal beta trading runtime stayed healthy.
- Argentina seed produced local bot capital and inventory with proof identifiers redacted from committed evidence.
- Argentina live-local placed four quotes:
  - Argentina YES buy/sell
  - Argentina NO buy/sell
- Mobile proof filled an Argentina YES order at `0.22`, size `3`, total `0.66`.
- Portfolio/history retained `referenceSource=polymarket`, provider market id `558938`, condition id, and token id.
- S23 proof shows World Cup Winner detail with the Argentina provider-backed outcome visible and selectable.

## Runtime Notes

- No app or backend source changed.
- The standalone `poly-bot` live-local process was run with local proof env `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` so quote placement matched the backend helper's internal beta runtime.

## Audit Result

P0 pass for the fifth provider-backed internal-test tradable market scope.

This does not claim current-match Spread/Totals/Team Total provider parity. Those remain unavailable from the current Polymarket-backed source path.

## Remaining Gaps

- P1: current-match Spread/Totals/Team Total provider-backed lines remain unavailable.
- P1: Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
- P2: source/debug labels should remain useful internally but less dominant in final tester UI.
