# Cycle PM - France Nation Top Goalscorer Tradable Proof

Date: 2026-07-08

## Scope

Local MVP retail betting flow only. This cycle fixes the local bot seed/risk-cap blocker and proves one provider-visible Nation of Top Goalscorer market can become internally tradable, accept a fake-token mobile order, and show Portfolio/history state.

Out of scope:

- Order book UI.
- Chat, live stats, social/watchlist work.
- Cosmetic UI work.
- Backend schema changes.

## Selected Event And Market

- Event: `world-cup-nation-of-top-goalscorer`
- Title: `World Cup: Nation of Top Goalscorer`
- Market: `42203d58-497f-49e6-a660-87eca202bd59`
- Market title: `Will a player representing France be the top goalscorer at the 2026 FIFA World Cup?`
- Provider source: `polymarket`
- Provider market id: `2070983`
- Provider condition id: `0x919c3aa6286d165c579ccaa3c17ffafd47d851d692f47d46192c3a71c85e22c3`
- Filled outcome: France / YES

## P0 Criteria

| ID | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| PM-P0-01 | Start from clean pushed integrated branch. | Pass | Baseline `cycle/or-home-provider-breadth-feed` was clean and pushed before branch creation. |
| PM-P0-02 | Fix seed/risk-cap path so stale large local bot inventory no longer blocks quote placement. | Pass | `referenceLiquiditySeeding.ts` burns excess unreserved complete sets when reseeding to a smaller local proof target. |
| PM-P0-03 | Bot dry-run must show exposure below cap after reseed. | Pass | `cycle-PM-bot-dry-run-france-nation-after-seed.txt` shows `2525` cents exposure vs `20000` cap. |
| PM-P0-04 | Bot live-local must place quotes. | Pass | `cycle-PM-bot-live-local-france-nation-success.txt` shows four placed quotes. |
| PM-P0-05 | Mobile service proof must fill a fake-token order against local MM liquidity. | Pass | `cycle-PM-provider-france-nation-order-portfolio-proof.json` shows `FILLED`. |
| PM-P0-06 | Portfolio/history must preserve provider identity. | Pass | Portfolio/history retain provider market id `2070983`, condition id, and token id. |
| PM-P0-07 | S23 must show the provider event and target market in visible UI. | Pass | S23 Search/detail XML and screenshots captured. |
| PM-P0-08 | Home/Live match-only scope remains clean. | Pass | No Home/Live feed code changed; broad future remains Search/detail only. |

## Implementation Result

Pass.

The first France dry-run reproduced the old blocker: `per_market_exposure_cap_reached_20200_of_20000`. The seeding helper now downsizes stale, unreserved local complete-set inventory during live local reseed. After reseeding France to capital `50000` cents and mint `2500` cents, dry-run reported `2525` cents exposure and live-local placed quotes.

## Proof Summary

- Bot dry-run before fix: blocked by exposure cap.
- Bot dry-run after fix/reseed: pass, exposure below cap.
- Bot live-local: pass, placed four quotes:
  - France YES buy/sell
  - France NO buy/sell
- Mobile order proof: fake-token France YES buy filled at `0.44`, size `2.27`.
- Portfolio/history proof: filled position/trade visible with Polymarket provider identity.
- S23 visible proof: Search showed `World Cup: Nation of Top Goalscorer` with `Polymarket 8 markets`; Event Detail showed France outcome with provider market `2070983`.

## Evidence

- `docs/mobile/harness/cycle-PM-provider-france-nation-tradable-proof/cycle-PM-bot-dry-run-france-nation.txt`
- `docs/mobile/harness/cycle-PM-provider-france-nation-tradable-proof/cycle-PM-bot-dry-run-france-nation-after-seed.txt`
- `docs/mobile/harness/cycle-PM-provider-france-nation-tradable-proof/cycle-PM-bot-live-local-france-nation-success.txt`
- `docs/mobile/harness/cycle-PM-provider-france-nation-tradable-proof/cycle-PM-provider-france-nation-order-portfolio-proof.json`
- `docs/mobile/harness/cycle-PM-provider-france-nation-tradable-proof/cycle-PM-s23-search-france-rerun.xml`
- `docs/mobile/screenshots/cycle-PM-provider-france-nation-tradable-proof/cycle-PM-s23-search-france-rerun.png`
- `docs/mobile/harness/cycle-PM-provider-france-nation-tradable-proof/cycle-PM-s23-france-nation-detail-from-search.xml`
- `docs/mobile/screenshots/cycle-PM-provider-france-nation-tradable-proof/cycle-PM-s23-france-nation-detail-from-search.png`

## Audit Result

P0 pass for the selected France Nation Top Goalscorer provider-visible-to-internal-test-tradable flow.

## Remaining Gaps

- P1: Home/Live remain match-only by product direction; broad futures are Search/detail surfaces.
- P1: Current-match Spread/Totals/Team Total provider-backed line markets remain unavailable.
- P1: The event-detail chart for broad futures may show unavailable chart history even when quote/order flow is tradable.
- P2: Source/debug labels should stay available for internal proof but be less dominant in final tester UI.
