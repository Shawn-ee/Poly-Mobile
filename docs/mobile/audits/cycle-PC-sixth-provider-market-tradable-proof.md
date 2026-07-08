# Cycle PC - Sixth Provider Market Tradable Proof

## Scope

Local MVP retail betting flow support only. This cycle expands provider-visible-to-tradable coverage from five World Cup Winner markets to six markets by making Belgium local-MM-ready and proving fake-token order/Portfolio state.

No order book UI, chat, live stats, social features, deposits, withdrawals, backend schema work, or cosmetic UI work was touched.

## Acceptance Criteria

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| PC-P0-01 | P0 | Select a sixth real Polymarket-backed World Cup Winner market beyond England, France, Spain, Switzerland, and Argentina. | Pass | Belgium market `67da89c1-2c5e-4cba-b259-e725a6ddcb09` |
| PC-P0-02 | P0 | Backend helper verifies internal trading and local bot-seeding flags remain active. | Pass | `cycle-PC-internal-beta-backend-check.json` |
| PC-P0-03 | P0 | Market is MM-enabled, seeded, live-ready, and live-enabled. | Pass | enable/prepare/live-ready/live-enabled evidence |
| PC-P0-04 | P0 | Live-local bot places quotes without exposure-cap blocking. | Pass | `cycle-PC-bot-live-local-belgium-success.txt` |
| PC-P0-05 | P0 | Holiwyn mobile can see/open the provider-backed market on Android. | Pass | `cycle-PC-s23-search-belgium.xml` and `.png` |
| PC-P0-06 | P0 | Mobile server-mode order fills against local MM liquidity. | Pass | `cycle-PC-provider-belgium-order-portfolio-proof.json` |
| PC-P0-07 | P0 | Portfolio/history preserve provider market/outcome/token identity. | Pass | `cycle-PC-provider-belgium-order-portfolio-proof.json` |

## Reference/Provider Data

- Event: `provider-breadth-world-cup-winner`
- Market: `Will Belgium win the 2026 FIFA World Cup?`
- Market id: `67da89c1-2c5e-4cba-b259-e725a6ddcb09`
- Provider market id: `558946`
- Condition id: `0x32cfa52198e85e070d1b17d1b53c5c3a6aaae7736cdc33fa6aa04d353f0c2811`
- Filled proof outcome: Belgium / Yes

## Proof Summary

- Backend check confirmed the internal beta trading runtime stayed healthy.
- Belgium seed produced local bot capital and inventory with proof identifiers redacted from committed evidence.
- Belgium live-local placed four quotes:
  - Belgium YES buy/sell
  - Belgium NO buy/sell
- Mobile proof filled a Belgium YES order at `0.05`, size `3`, total `0.15`.
- Portfolio/history retained `referenceSource=polymarket`, provider market id `558946`, condition id, and token id.
- S23 proof shows World Cup Winner detail with the Belgium provider-backed outcome visible and selectable.

## Runtime Notes

- No app or backend source changed.
- The standalone `poly-bot` live-local process was run with local proof env `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` so quote placement matched the backend helper's internal beta runtime.

## Audit Result

P0 pass for the sixth provider-backed internal-test tradable market scope.

This does not claim current-match Spread/Totals/Team Total provider parity. Those remain unavailable from the current Polymarket-backed source path.

## Remaining Gaps

- P1: current-match Spread/Totals/Team Total provider-backed lines remain unavailable.
- P1: Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
- P2: source/debug labels should remain useful internally but less dominant in final tester UI.
