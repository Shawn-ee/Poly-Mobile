# Batch Odds API Internal Usability

## Scope
- Polymarket provider parity is deferred P1 for this pass because cached evidence is fresh and no attach-ready Polymarket match/line candidate is available.
- This pass makes Holiwyn Mobile internally usable with one backend-owned sportsbook-derived soccer event and local fake-token exchange.
- No new Odds API quota was used during the proof pass; S23 used the redacted one-event fixture replay.
- No real-money deployment, deposit, withdraw, chat, live stats, social, order book UI, or broad provider scan work is included.

## Event Used
- Event: Switzerland vs. Argentina
- Local slug: `odds-api-single-soccer-test`
- Provider source: `the-odds-api`
- Reference source stored in Holiwyn: `sportsbook-odds`
- External event id: `200d9cd5eda092c7eb778cc104cd2fd2`
- Sport key: `soccer_fifa_world_cup`
- Start time: `2026-07-12T01:00:00Z`

## Markets Imported
- Winner / 3-way winner: imported from `h2h` and `h2h_3_way`
- Spread: imported from `spreads`
- Totals: imported from `totals`
- Alternate spreads: imported from `alternate_spreads`
- Alternate totals: imported from `alternate_totals`
- Team totals were available from provider metadata, but not requested in the original one-event odds fetch to stay inside the eight-credit cap.
- Normalized backend count: 10 markets, 22 outcomes.

## Routes Proved
- `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1`
- `GET /api/mobile/events/:slug/live-detail`
- `GET /api/markets/:marketId/quote`
- `POST /api/orders`
- `GET /api/portfolio`
- `GET /api/portfolio/history`

## Schema And Runtime Assumptions
- Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, `Position`, `UserBalance`, and API credential models are reused.
- `Market.referenceSource` is `sportsbook-odds`; this must not be presented as Polymarket-backed data.
- `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, and `Outcome.referenceOutcomeLabel` carry deterministic local identities derived from the sportsbook event, bookmaker, market, line, and outcome.
- The fake-token exchange still uses the existing orderbook/matching service internally, but order book UI remains hidden from the default mobile path.
- Local maker liquidity is seeded only for proof: a resting SELL ask fills the mobile buy, then a resting BUY bid fills the mobile cashout/sell.

## Bot Runtime
- No continuous bot is required or running for this milestone.
- Proof liquidity is one-shot deterministic local maker liquidity from harness scripts, not autonomous market making.
- Production liquidity and risk policy remain P1/P2 future work.

## Real Data Vs Local Fake-Token Data
- Real provider data: event identity, teams, start time, available market keys, bookmaker market keys, decimal odds, line points, and sportsbook-derived implied probabilities captured in redacted fixtures.
- Local fake-token data: maker orders, taker orders, fills, cashout bid, Portfolio position, Portfolio history, balances, and proof API credentials.
- The app is internally tradable but not real-money enabled.

## Proof
- Backend proof: `docs/mobile/harness/the-odds-api-single-event/mobile-flow-proof.redacted.json`
- S23 proof summary: `docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23-odds-api-s23-visible-flow.json`
- S23 screenshots: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/`
- Device: `SM-S911U1`
- Result: PASS for Home, Event Detail, spread line selection, Buy ticket, order placement, Portfolio, Cash out/Sell ticket, and Portfolio History.

## Remaining Gaps
- P0: none for this single-event internal usability milestone.
- P1: full Polymarket provider parity remains deferred until provider evidence is stale or a real attach-ready match/line candidate appears.
- P1: team totals were available but not imported in the existing one-event odds payload because quota discipline took priority.
- P2: production liquidity, bot risk policy, richer cashout preview, and release-channel hardening remain future work.
