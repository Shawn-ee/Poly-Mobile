# Cycle OW - Provider Visible To Tradable Flow

Date: 2026-07-08

## Scope

Convert one provider-visible Polymarket World Cup market into a local internal-test tradable market and prove the mobile path can see it, open it, quote it, submit a fake-token order, and show Portfolio/history state.

Out of scope:

- Order book UI.
- Chat, live stats, social/watchlist work.
- Cosmetic UI changes.
- Home/Live broad futures feed changes.

## Selected Event And Market

- Event: `provider-breadth-world-cup-winner`
- Title: `World Cup Winner`
- Event type: `future`
- Market: `49ca30ca-afa9-45ee-8962-1941ad7524fe`
- Market title: `Will England win the 2026 FIFA World Cup?`
- Provider source: `polymarket`
- Provider market id: `558935`
- External slug: `will-england-win-the-2026-fifa-world-cup-937`

## P0 Criteria

| ID | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| OW-P0-01 | OV must be clean/pushed before starting. | Pass | Remote `cycle/or-home-provider-breadth-feed` was `4c09fabf`; remote OV branch was `4d99552e`; OW branch started clean. |
| OW-P0-02 | Pick one newly imported provider-visible event/market. | Pass | `provider-breadth-world-cup-winner` / England market selected. |
| OW-P0-03 | Make it local-MM-ready without exposure-cap blocking. | Pass | Small seed: capital `50000` cents, mint `2500` cents; bot dry-run exposure `3355` cents vs cap `20000`. |
| OW-P0-04 | Bot live-local quote placement succeeds. | Pass | `cycle-OW-bot-live-local-england-success.txt` shows four placed quotes. |
| OW-P0-05 | Mobile can see and open the provider event. | Pass | S23 Search and Event Detail XML/screenshots captured. |
| OW-P0-06 | Mobile server-mode ticket can place a fake-token order against the bot quote. | Pass | `cycle-OW-provider-visible-tradable-flow.json` shows `status=FILLED`. |
| OW-P0-07 | Portfolio/history shows the provider-backed order result. | Pass | `portfolioPositionVisible=true`, `historyTradeVisible=true`. |
| OW-P0-08 | Home/Live match-only guard remains clean. | Pass | This cycle did not change Home/Live filters; provider future remained visible through Search/detail, not Live match feed. |

## Bot Results

- Dry-run: pass for readiness/risk sizing. It intentionally did not place orders because dry-run and live orders were disabled.
- Live-local initial failures:
  - Fixed exposure-cap blocker by using small seed/mint sizing.
  - Fixed kill-switch blocker by restarting the local backend with `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false`.
  - Fixed allowlist blocker by allowing `system-liquidity-bot@local.test` in the local proof server.
- Final live-local: pass. The bot placed BUY/SELL quotes on both provider outcomes.

## Mobile Order Result

- Selected available bot ask: NO outcome at `0.86`.
- Mobile ticket amount: `0.86`.
- Order result: `FILLED`.
- Filled size: `1`.
- Portfolio position: visible.
- Portfolio history: visible.
- Provider identity preserved through order, position, and history:
  - `referenceSource=polymarket`
  - provider market id `558935`
  - condition id preserved
  - token id preserved

## Evidence

- `docs/mobile/harness/cycle-OW-provider-visible-tradable-flow/cycle-OW-provider-visible-tradable-flow.json`
- `docs/mobile/harness/cycle-OW-provider-visible-tradable-flow/cycle-OW-bot-dry-run-england.txt`
- `docs/mobile/harness/cycle-OW-provider-visible-tradable-flow/cycle-OW-bot-live-local-england-success.txt`
- `docs/mobile/harness/cycle-OW-provider-visible-tradable-flow/cycle-OW-s23-search-england.xml`
- `docs/mobile/screenshots/cycle-OW-provider-visible-tradable-flow/cycle-OW-s23-search-england.png`
- `docs/mobile/harness/cycle-OW-provider-visible-tradable-flow/cycle-OW-s23-provider-winner-detail.xml`
- `docs/mobile/screenshots/cycle-OW-provider-visible-tradable-flow/cycle-OW-s23-provider-winner-detail.png`

## Remaining Gaps

- P0: none for this cycle scope.
- P1: the local proof server must be started with internal beta flags and allowlist for live-local trading; this should become a repeatable startup/harness command.
- P1: Home/Live still only show match-scoped MVP content, so broad provider futures are visible in Search/detail only.
- P1: provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
- P2: final tester UI should keep internal source/debug labels less visually dominant while preserving XML/test labels.
