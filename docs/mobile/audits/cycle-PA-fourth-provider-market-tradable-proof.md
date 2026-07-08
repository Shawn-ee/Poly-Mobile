# Cycle PA - Fourth Provider Market Tradable Proof

## Scope

Local MVP retail betting flow support only. This cycle expands provider-visible-to-tradable coverage from three World Cup Winner markets to four markets by making Switzerland local-MM-ready and proving fake-token order/Portfolio state.

No order book UI, chat, live stats, social features, deposits, withdrawals, backend schema work, or cosmetic UI work was touched.

## Acceptance Criteria

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| PA-P0-01 | P0 | Select a fourth real Polymarket-backed World Cup Winner market beyond England, France, and Spain. | Pass | Switzerland market `bd114913-161d-43c0-9770-58e90846f172` |
| PA-P0-02 | P0 | Backend helper verifies internal trading and local bot-seeding flags remain active. | Pass | `cycle-PA-internal-beta-backend-check.json` |
| PA-P0-03 | P0 | Market is MM-enabled, seeded, live-ready, and live-enabled. | Pass | enable/prepare/live-ready/live-enabled evidence |
| PA-P0-04 | P0 | Live-local bot places quotes without exposure-cap blocking. | Pass | `cycle-PA-bot-live-local-switzerland-success.txt` |
| PA-P0-05 | P0 | Holiwyn mobile can see/open the provider-backed market on Android. | Pass | `cycle-PA-s23-search-switzerland.xml` and `.png` |
| PA-P0-06 | P0 | Mobile server-mode order fills against local MM liquidity. | Pass | `cycle-PA-provider-switzerland-order-portfolio-proof.json` |
| PA-P0-07 | P0 | Portfolio/history preserve provider market/outcome/token identity. | Pass | `cycle-PA-provider-switzerland-order-portfolio-proof.json` |

## Reference/Provider Data

- Event: `provider-breadth-world-cup-winner`
- Market: `Will Switzerland win the 2026 FIFA World Cup?`
- Market id: `bd114913-161d-43c0-9770-58e90846f172`
- Provider market id: `558974`
- Condition id: `0x3a26ca6425e2d98f14935670bc22cdb0744defc6f6d83c65f8c413a921c5c70c`
- Filled proof outcome: Switzerland / Yes

## Proof Summary

- Backend check confirmed the internal beta trading runtime stayed healthy.
- Switzerland seed produced local bot capital and inventory with proof identifiers redacted from committed evidence.
- Switzerland live-local placed four quotes:
  - Switzerland YES buy/sell
  - Switzerland NO buy/sell
- Mobile proof filled a Switzerland YES order at `0.04`, size `3`, total `0.12`.
- Portfolio/history retained `referenceSource=polymarket`, provider market id `558974`, condition id, and token id.
- S23 proof shows World Cup Winner detail with the Switzerland provider-backed outcome visible and selectable.

## Implementation/Runtime Notes

- No app or backend source changed.
- The standalone `poly-bot` live-local process needed local proof env `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` in addition to `--confirmLive true`; without that process env the market metadata was live-enabled but the bot runtime stayed disabled.

## Audit Result

P0 pass for the fourth provider-backed internal-test tradable market scope.

This does not claim current-match Spread/Totals/Team Total provider parity. Those remain unavailable from the current Polymarket-backed source path.

## Remaining Gaps

- P1: current-match Spread/Totals/Team Total provider-backed lines remain unavailable.
- P1: Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
- P2: source/debug labels should remain useful internally but less dominant in final tester UI.
