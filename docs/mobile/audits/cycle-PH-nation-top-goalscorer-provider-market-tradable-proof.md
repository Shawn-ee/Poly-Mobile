# Cycle PH - Nation Top Goalscorer Provider Market Tradable Proof

## Scope

Local MVP retail betting flow support only. This cycle expands provider-visible-to-tradable coverage into the `World Cup: Nation of Top Goalscorer` event family by making the Argentina nation market local-MM-ready and proving fake-token order/Portfolio state.

No order book UI, chat, live stats, social features, deposits, withdrawals, backend schema work, or cosmetic UI work was touched.

## Acceptance Criteria

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| PH-P0-01 | P0 | Select a real Polymarket-backed Nation of Top Goalscorer market not previously local-MM-proven. | Pass | Argentina market `94644351-61b3-474d-9f08-7f9b9ab169d3` |
| PH-P0-02 | P0 | Backend helper verifies internal trading and local bot-seeding flags remain active enough for the cycle target. | Partial | Global helper check found stale snapshots before refresh, then target refresh/live proof passed. |
| PH-P0-03 | P0 | Market is approved tradable, MM-enabled, seeded, live-ready, and live-enabled. | Pass | approve/enable/prepare/live-ready/live-enabled evidence |
| PH-P0-04 | P0 | Live-local bot places quotes without exposure-cap blocking. | Pass | `cycle-PH-bot-live-local-argentina-nation.txt` |
| PH-P0-05 | P0 | Holiwyn mobile can open the provider-backed event/market on Android. | Pass | Direct S23 event-detail proof for `world-cup-nation-of-top-goalscorer` |
| PH-P0-06 | P0 | Mobile server-mode order fills against local MM liquidity. | Pass | `cycle-PH-provider-argentina-nation-order-portfolio-proof.json` |
| PH-P0-07 | P0 | Portfolio/history preserve provider market/outcome/token identity. | Pass | `cycle-PH-provider-argentina-nation-order-portfolio-proof.json` |

## Reference/Provider Data

- Event: `world-cup-nation-of-top-goalscorer`
- Market: `Will a player representing Argentina be the top goalscorer at the 2026 FIFA World Cup?`
- Market id: `94644351-61b3-474d-9f08-7f9b9ab169d3`
- Provider market id: `2070987`
- Condition id: `0xb258d0370d1d409b3fe03ba0d6e0ae88a55b0a179edf8b4a6b0e386542ca0b9c`
- Filled proof outcome: Argentina / Yes

## Proof Summary

- Provider refresh returned fresh high-quality bid/ask data for Argentina, with reference bid `0.374`, ask `0.379`, and spread `0.005`.
- Argentina was initially imported as reference-only, so this cycle explicitly approved it as internal-test tradable before live enablement.
- Argentina nation seed produced local bot capital and inventory with proof identifiers redacted from committed evidence.
- Live-local placed four quotes:
  - Argentina YES buy/sell
  - Argentina NO buy/sell
- Mobile proof filled an Argentina YES order at `0.40`, size `3`, total `1.20`.
- Portfolio/history retained `referenceSource=polymarket`, provider market id `2070987`, condition id, and token id.
- S23 direct event-detail proof opened `world-cup-nation-of-top-goalscorer` in server mode and captured the provider-backed Argentina market.

## Search/Navigation Note

Two S23 attempts to force Search directly to `representing Argentina` did not land on the Search result surface. The app instead stayed on or opened the match detail surface. This did not block direct detail proof, route proof, or order proof for the target market, but it remains a navigation/search-deep-link gap.

## Runtime Notes

- No app or backend source changed.
- The standalone `poly-bot` live-local process was run with local proof env `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
- This cycle proves a fourth provider event family after World Cup Winner, Continent Winner, and Golden Boot.

## Audit Result

P0 pass for the selected Nation of Top Goalscorer provider-backed internal-test tradable market scope.

This does not claim current-match Spread/Totals/Team Total provider parity. Those remain unavailable from the current Polymarket-backed source path.

## Remaining Gaps

- P1: direct Search deep link did not reliably show the Nation of Top Goalscorer result on S23, although backend search route returned it and direct detail proof passed.
- P1: current-match Spread/Totals/Team Total provider-backed lines remain unavailable.
- P1: Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
- P2: source/debug labels should remain useful internally but less dominant in final tester UI.

