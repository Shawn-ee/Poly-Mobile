# Batch Odds API Internal Environment

## Scope
- Active goal: turn the verified one-event sportsbook proof into a repeatable local internal testing environment.
- Backend-owned sportsbook data only; mobile reads from Holiwyn backend routes only.
- Fake-token local trading only.
- The Odds API remains a temporary provider; default proof uses committed redacted replay data and makes no provider API calls.
- Full Polymarket provider parity remains deferred P1 unless a real attach-ready candidate appears.

## Repeatable Harness
- Command: `npm run mobile:odds-api-internal-env-proof`
- Output: `docs/mobile/harness/the-odds-api-internal-environment/internal-environment-proof.redacted.json`
- Default provider input: `docs/mobile/harness/the-odds-api-single-event/event-odds.redacted.json`
- Default event slug: `odds-api-single-soccer-test`

## What The Harness Proves
- Replays/imports the sportsbook event into `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot`.
- Confirms backend health and local Postgres health.
- Confirms S23 reachability and consumes the latest S23 visible proof summary.
- Confirms no continuous bot is required; deterministic one-shot maker liquidity is seeded for buy and cashout proof.
- Verifies Home, Event Detail, market quote, order submit, Portfolio, and History routes.
- Proves fake-token buy fill, position visibility, cashout/sell fill, position reduction, and buy/sell history.

## Negative Cases
- Cannot cash out/sell without an owned position.
- Cannot sell more shares than owned.
- Closed/stale market status rejects order placement.
- Missing provider/market data fails with an API error instead of crashing the harness.

## Routes
- `GET /api/health`
- `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1`
- `GET /api/mobile/events/:slug/live-detail`
- `GET /api/markets/:marketId/quote`
- `POST /api/orders`
- `GET /api/portfolio`
- `GET /api/portfolio/history`

## Schema And Runtime Assumptions
- Reuses existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ApiCredential`, `UserBalance`, `Order`, `Trade`, `Position`, and `ApiOrderRequest`.
- `Market.referenceSource=sportsbook-odds` stays separate from `polymarket`.
- `externalMarketId`, `conditionId`, `Outcome.referenceTokenId`, and `Outcome.referenceOutcomeLabel` carry stable local provider identity.
- No Prisma schema change is required for this pass.
- The fake-token matching engine remains internal infrastructure; order book UI stays out of the mobile MVP.

## Bot Runtime
- Continuous bot: not required.
- Proof market maker: one-shot deterministic local maker ask for buy fill and one-shot local maker bid for cashout/sell fill.
- Future work may add a reusable local-MM service, but this harness intentionally avoids requiring long-lived bot processes for tester startup.

## Remaining Gaps
- P0: none if `internal-environment-proof.redacted.json` passes.
- P1: multiple live provider-backed events are not imported by default to protect quota.
- P1: team totals are imported only when present in the quota-safe payload.
- P1: Polymarket provider parity remains deferred until attach-ready markets exist.
- P2: production-grade bot risk policy and release-channel hardening remain future work.
