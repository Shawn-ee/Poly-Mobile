# Cycle OZ - Third Provider Market Tradable Proof

## Scope

Local MVP retail betting flow support only. This cycle expands provider-visible-to-tradable coverage from two World Cup Winner markets to three markets by making Spain local-MM-ready and proving fake-token order/Portfolio state.

No order book UI, chat, live stats, social features, deposits, withdrawals, backend schema work, or cosmetic UI work was touched.

## Acceptance Criteria

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| OZ-P0-01 | P0 | Select a third real Polymarket-backed World Cup Winner market beyond England and France. | Pass | Spain market `d0e4713c-623d-4bcd-9431-5b1501148a5f` |
| OZ-P0-02 | P0 | Backend helper verifies internal trading and local bot-seeding flags remain active. | Pass | `cycle-OZ-internal-beta-backend-check.json` |
| OZ-P0-03 | P0 | Market is MM-enabled, seeded, live-ready, and live-enabled. | Pass | enable/prepare/live-ready/live-enabled evidence |
| OZ-P0-04 | P0 | Live-local bot places quotes without exposure-cap blocking. | Pass | `cycle-OZ-bot-live-local-spain-success.txt` |
| OZ-P0-05 | P0 | Holiwyn mobile can see/open the provider-backed market on Android. | Pass | `cycle-OZ-s23-search-spain.xml` and `.png` |
| OZ-P0-06 | P0 | Mobile server-mode order fills against local MM liquidity. | Pass | `cycle-OZ-provider-spain-order-portfolio-proof.json` |
| OZ-P0-07 | P0 | Portfolio/history preserve provider market/outcome/token identity. | Pass | `cycle-OZ-provider-spain-order-portfolio-proof.json` |

## Reference/Provider Data

- Event: `provider-breadth-world-cup-winner`
- Market: `Will Spain win the 2026 FIFA World Cup?`
- Market id: `d0e4713c-623d-4bcd-9431-5b1501148a5f`
- Provider market id: `558934`
- Condition id: `0x7976b8dbacf9077eb1453a62bcefd6ab2df199acd28aad276ff0d920d6992892`
- Filled proof outcome: Spain / Yes

## Proof Summary

- Backend check confirmed the internal beta trading runtime stayed healthy.
- Spain seed produced local bot capital and inventory with proof identifiers redacted from committed evidence.
- Spain live-local placed four quotes:
  - Spain YES buy/sell
  - Spain NO buy/sell
- Mobile proof filled a Spain YES order at `0.21`, size `3`, total `0.63`.
- Portfolio/history retained `referenceSource=polymarket`, provider market id `558934`, condition id, and token id.
- S23 proof shows World Cup Winner detail with the Spain provider-backed outcome visible and selectable.

## Audit Result

P0 pass for the third provider-backed internal-test tradable market scope.

This does not claim current-match Spread/Totals/Team Total provider parity. Those remain unavailable from the current Polymarket-backed source path.

## Remaining Gaps

- P1: current-match Spread/Totals/Team Total provider-backed lines remain unavailable.
- P1: Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
- P2: source/debug labels should remain useful internally but less dominant in final tester UI.
