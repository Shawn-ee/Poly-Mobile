# Cycle PG - First Golden Boot Provider Market Tradable Proof

## Scope

Local MVP retail betting flow support only. This cycle expands provider-visible-to-tradable coverage into the `World Cup: Golden Boot Winner` event family by making Lionel Messi local-MM-ready and proving fake-token order/Portfolio state.

No order book UI, chat, live stats, social features, deposits, withdrawals, backend schema work, or cosmetic UI work was touched.

## Acceptance Criteria

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| PG-P0-01 | P0 | Select a real Polymarket-backed Golden Boot player market from a provider event family not previously local-MM-proven. | Pass | Messi market `6e0eac54-df5e-4cb0-bab8-cb575ea5b4f0` |
| PG-P0-02 | P0 | Backend helper verifies internal trading and local bot-seeding flags remain active. | Pass | `cycle-PG-internal-beta-backend-check.json` |
| PG-P0-03 | P0 | Market is approved tradable, MM-enabled, seeded, live-ready, and live-enabled. | Pass | approve/enable/prepare/live-ready/live-enabled evidence |
| PG-P0-04 | P0 | Live-local bot places quotes without exposure-cap blocking. | Pass | `cycle-PG-bot-live-local-messi-success.txt` |
| PG-P0-05 | P0 | Holiwyn mobile can see/open the provider-backed event/market on Android. | Pass | `cycle-PG-s23-golden-boot-messi-summary.json`, `.xml`, and `.png` |
| PG-P0-06 | P0 | Mobile server-mode order fills against local MM liquidity. | Pass | `cycle-PG-provider-messi-order-portfolio-proof.json` |
| PG-P0-07 | P0 | Portfolio/history preserve provider market/outcome/token identity. | Pass | `cycle-PG-provider-messi-order-portfolio-proof.json` |

## Reference/Provider Data

- Event: `world-cup-golden-boot-winner`
- Market: `Will Lionel Messi be the top goalscorer at the 2026 FIFA World Cup?`
- Market id: `6e0eac54-df5e-4cb0-bab8-cb575ea5b4f0`
- Provider market id: `2069635`
- Condition id: `0xd2a8caba5559bc21e14f6b2aa504cb14a1782751658b71409e25b82e432c0a97`
- Filled proof outcome: Lionel Messi / Yes

## Proof Summary

- Backend check confirmed the internal beta trading runtime stayed healthy.
- Messi was initially imported as reference-only, so this cycle explicitly approved it as internal-test tradable before live enablement.
- Messi seed produced local bot capital and inventory with proof identifiers redacted from committed evidence.
- Messi live-local placed four quotes:
  - Messi YES buy/sell
  - Messi NO buy/sell
- Mobile proof filled a Messi YES order at `0.40`, size `3`, total `1.20`.
- Portfolio/history retained `referenceSource=polymarket`, provider market id `2069635`, condition id, and token id.
- S23 proof shows the Golden Boot detail with the Messi provider-backed outcome visible and selectable.

## Runtime Notes

- No app or backend source changed.
- The standalone `poly-bot` live-local process was run with local proof env `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
- This cycle proves a third provider event family after World Cup Winner and Continent Winner.

## Audit Result

P0 pass for the first Golden Boot provider-backed internal-test tradable market scope.

This does not claim current-match Spread/Totals/Team Total provider parity. Those remain unavailable from the current Polymarket-backed source path.

## Remaining Gaps

- P1: current-match Spread/Totals/Team Total provider-backed lines remain unavailable.
- P1: Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
- P1: remaining Golden Boot and nation top-goalscorer markets remain provider-visible but not fully local-MM-proven.
- P2: source/debug labels should remain useful internally but less dominant in final tester UI.
