# Poly Runtime Integration Test Report

Generated: 2026-07-07

Latest update: 2026-07-07 01:27 CT

Branch: `cycle/fj-real-provider-home-ticket`

Remote target: `poly-mobile`

## Summary

This loop tested Holiwyn mobile as a local/internal frontend for the Poly backend exchange and corrected the provider-ingestion model for soccer.

Result:

- Ready for internal bot-backed local testing: yes, with P1 trading breadth caveats.
- Ready for server deployment rehearsal: no.
- Ready for production/public launch: no.

Polymarket is used as provider/reference metadata and pricing input. Mobile users trade against Poly backend/local fake-token markets through Poly routes. No real Polymarket orders were placed.

## Architecture Correction

The runtime now has a normalized soccer provider-ingestion layer:

- `src/server/services/soccerProviderNormalization.ts`

The layer maps raw Polymarket/Gamma event and market data into Poly-owned fields before mobile or bot usage:

- Event: `sportKey`, `leagueKey`, `eventType`, `homeTeamName`, `awayTeamName`, `marketProfile`, `resultMode`, `gameRules`, `supportedMarketTypes`
- Market: `marketType`, `marketGroupKey`, `marketGroupTitle`, `period`, `line`, `participantType`, `participantName`, `participantId`, `rules`, `rulesText`
- Provider identity: provider slug, market id, condition id, token ids, reference bid/ask, quality state, MM eligibility

World Cup Winner child markets are now normalized as:

- `eventType=future`
- `marketProfile=outright`
- `resultMode=one_winner`
- `marketType=outright`
- `marketGroupKey=outrights`
- `period=futures`
- `participantType=team`

They are no longer stored as generic `moneyline` / `Game Lines` markets.

Ballon d'Or Winner 2026 is also normalized as a soccer awards future:

- `eventType=future`
- `leagueKey=soccer_awards`
- `marketProfile=outright`
- `resultMode=one_winner`
- `marketType=outright`
- `participantType=player`

Important boundary: the normalized fields currently live in existing Event/Market/Outcome columns plus `metadata.normalizedSoccer` / `referenceMetadata.normalizedSoccer`. A later schema-hardening pass can promote `marketProfile`, `resultMode`, `gameRules`, and `supportedMarketTypes` to first-class Event columns if needed.

## Services Verified

| Service | URL/port | Result |
| --- | --- | --- |
| Poly backend/API | `http://127.0.0.1:3002` | Pass |
| Postgres | `5432` | Pass through backend readiness |
| Expo mobile dev server | `exp://172.16.200.14:8081` | Pass |
| Samsung S23 | ADB `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` | Pass |

Mobile runtime mode:

- `EXPO_PUBLIC_ORDER_MODE=server`
- `EXPO_PUBLIC_MARKET_DATA_MODE=server`
- Local dev API credential only

Secrets are intentionally omitted.

## Commands And Proof

| Area | Command/proof | Classification | Result |
| --- | --- | --- | --- |
| Normalization tests | `soccerProviderNormalization.test.ts`, `polymarketEventImport.test.ts` | Read-only test | Pass, 10 tests |
| TypeScript | `npx tsc --noEmit --pretty false` | Read-only test | Pass |
| Mobile feed/API tests | `api`, `homeEventFeedService`, `searchEventService` | Read-only test | Pass, 22 tests |
| Provider prep | `prove_mobile_real_provider_world_cup_winner.ts --marketLimit=10` | Local-mutating fake-token/reference prep | Pass |
| Route proof | `/api/events`, `/api/mobile/events/:slug/live-detail` | Read-only | Pass |
| Readiness | `poly:internal-exchange-readiness --summaryPath .runtime/poly-runtime-readiness-normalized-breadth-after-seed.json` | Read-only | Pass |
| Local fake-token MM seed | `seedReferenceLiquidityBotForMarket` for Argentina, England, France | Local fake-token mutation | Pass |
| Live-ready marking | `mark_launch_liquidity_live_ready.ts --mode apply --confirm MARK_LAUNCH_LIVE_READY` | Local metadata mutation | Pass |
| Bot dry-run | poly-bot `bot:polymarket:mm:dry-run` allowlist England/Argentina/France | Dry-run | Pass |
| Backend order safety | `canonical_order_submission.phase5.test.ts` | Read-only test | Pass, 11 tests |
| Mobile cashout/cancel services | `positionCloseService`, `openOrderService`, `api` tests | Read-only test | Pass, 32 tests |
| S23 Home proof | UI hierarchy inspection | Device proof | Pass |
| S23 Portfolio proof | UI hierarchy inspection | Device proof | Pass |

## Provider Import And Visibility

Provider-backed events:

- Slug: `mobile-fj-real-world-cup-winner`
- Title: `World Cup Winner`
- Provider event slug: `world-cup-winner`
- Market profile: `outright`
- Result mode: `one_winner`
- Supported market types: `outright`
- Mobile-visible provider markets: 9

- Slug: `ballon-dor-winner-2026`
- Title: `Ballon d'Or Winner 2026`
- Provider event slug: `ballon-dor-winner-2026`
- League: `soccer_awards`
- Market profile: `outright`
- Result mode: `one_winner`
- Supported market types: `outright`
- Mobile-visible provider markets: 2
- Trading status: provider/reference-visible only; not local-MM enabled yet

Mobile route proof:

- `/api/events?source=polymarket&includeMobileMarkets=1&limit=10`
  - returned `ballon-dor-winner-2026` and `mobile-fj-real-world-cup-winner`
  - Ballon d'Or sample outcomes: `Kylian Mbappé` / `No`, `Erling Haaland` / `No`
  - World Cup sample outcomes: `Argentina` / `No`, `England` / `No`
- `/api/events?sportKey=soccer&leagueKey=soccer_awards&includeMobileMarkets=1&limit=10`
  - returned `ballon-dor-winner-2026`
  - market count: 2
  - outcome sides: `yes` / `no`
- `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10`
  - returned `mobile-fj-real-world-cup-winner`
  - market count: 9
- `/api/mobile/events/mobile-fj-real-world-cup-winner/live-detail`
  - detail market count: 9
  - market types: `outright`
  - groups: `outrights`
  - sample participants: Argentina, France, Spain, England, Belgium
- `/api/mobile/events/ballon-dor-winner-2026/live-detail`
  - detail market count: 2
  - market types: `outright`
  - groups: `outrights`
  - sample participants: Kylian Mbappé, Erling Haaland
  - quote snapshots refreshed, but orderbook-depth lifecycle remains unavailable until seeded/refreshed

Readiness gate:

- DB connected: yes
- Mobile-visible event count: 7
- Provider-backed mobile-visible event count: 2
- Provider markets inspected: 11
- Snapshot-ready provider markets: 11
- Local market-maker-ready provider markets: 3
- Open-order-backed provider markets: 0
- Readiness blockers: none

Local-MM-ready seeded markets:

- Argentina World Cup Winner
- England World Cup Winner
- France World Cup Winner

These are seeded with local fake-token bot inventory/credentials only. No real Polymarket orders were placed. The readiness gate does not require open local orders, so `openOrderBackedCount=0` remains a next runtime action rather than a P0 gate failure.

Mobile Home/Search feed behavior:

- The mobile API adapter still supports the old World Cup-only call.
- Home/Search now pass `leagueKey: null` with `source=polymarket`, so provider-backed soccer events are not hidden by the old `world_cup` filter.
- This is a data-contract widening only; no visual redesign was done.

## Reference Prices And Market Maker

Reference snapshots refreshed for 9 provider-backed World Cup Winner markets.

Bot dry-run settings:

- `SYSTEM_LIQUIDITY_DRY_RUN=true`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=false`
- `QUOTE_OFFSET_TICKS=2`
- `TICK_SIZE=0.01`
- Allowlist: England, Argentina, France

Observed shifted quote plans:

- England reference `0.146 / 0.147`, planned local `0.13 / 0.17`
- Argentina reference `0.184 / 0.185`, planned local `0.16 / 0.20`
- France reference `0.331 / 0.332`, planned local `0.31 / 0.35`

This proves the core model: local bid is worse than Polymarket bid by configured ticks, and local ask is worse than Polymarket ask by configured ticks. No orders were placed in dry-run.

Earlier live-local fake-token proof also moved England, France, and Argentina through `live_enabled`/`manage_quotes` with local Poly orders only. No real Polymarket order path was used.

## S23 Proof

S23 Home after normalization:

- `World Cup Winner` visible
- backend card marker `event-card-mobile-fj-real-world-cup-winner` visible
- outcome rail marker `home-card-outright-market` visible
- visible provider outcomes included Argentina, France, England, Spain, plus additional provider outcomes such as Belgium/Norway/Morocco

S23 Event Detail after provider breadth:

- `Ballon d'Or Winner 2026` visible as a normalized backend/provider event.
- `Outrights` visible with provider-backed Kylian Mbappe and Erling Haaland rows.
- The S23 accessibility contract now shows both Ballon provider `Yes` outcomes as `selection-contract-side-yes`.
- This fixes the mobile-only contract-side mismatch where the second flattened outright row could be treated as contract `No`.
- Screenshot proof is intentionally kept out of git: `.runtime/s23-ballon-detail-contract-side-fixed.png`.

S23 Portfolio:

- same local backend account showed `Will England win the 2026 FIFA World Cup?`
- displayed `Cash out`
- displayed `Portfolio route proof`
- displayed `Filled shares`

This closes the previous account-split caveat: the S23 app and backend order/portfolio proof now align on the same local account state.

## Cashout, Sell, And Cancel Safety

Backend safety:

- `canonical_order_submission.phase5.test.ts` passed.
- SELL without enough position is rejected and stored as failed canonical order response.
- Oversell returns conflict/insufficient balance semantics.

Mobile safety:

- `positionCloseService.test.ts` passed.
- Cashout is full-position only.
- Cashout is unavailable without a positive position.
- `openOrderService.test.ts` passed.
- Server-mode cancel waits for backend success.

Status: no unresolved P0 safety gap found in this loop.

## Provider Breadth Search

Read-only Gamma searches were run for soccer provider breadth. The first safe second event found and imported was:

- `ballon-dor-winner-2026`

This closes the earlier "only one provider-backed soccer event" finding for read/display breadth. It does not close the trading-liquidity breadth gap because Ballon d'Or markets are currently imported as provider/reference-visible only:

- `referenceOnly=true`
- `tradable=false`
- `mmEnabled=false`

That is intentional until local-MM seeding, risk limits, and orderbook-depth refresh are enabled for that event.

## Issues

### P0

None remaining from this loop.

### P1

1. Only selected World Cup Winner markets are currently local-MM/trade-ready.
   - Current state: 9 normalized trade-ready provider markets under World Cup Winner.
   - Argentina, England, and France are seeded/local-MM-ready.
   - Ballon d'Or adds 2 normalized provider-visible markets, but they are not MM-enabled yet.
   - Next action: add a safe local-MM approval/seeding path for selected normalized non-World-Cup soccer futures.

2. Some local non-provider World Cup match rows may remain visible outside the provider-only feed.
   - They are useful for UI/game-line testing but are not provider-backed.
   - Next action: add an internal provider-backed-only proof mode if needed.

3. Live-local bot runtime files contain local credentials.
   - They must remain uncommitted and ignored.
   - Next action: sanitize bot output so credential material is never printed during seeding.

4. Chart/history lifecycle can become `refresh_due` faster than quote snapshots.
   - Quotes are fresh and trading proof is not blocked.
   - Next action: keep chart/history out of MVP trading readiness unless explicitly required.

### P2

1. Broaden normalized soccer classifier coverage for corners, cards, and player props when valid provider data exists.
2. Add a clean-book quote-creation proof after local noise cleanup.
3. Add a formal S23 screenshot capture only when needed for stakeholder review.

## Readiness Decision

Ready for internal bot-backed local testing: yes.

Ready for server deployment rehearsal: no.

Ready for production/public launch: no.

Reason: local backend, normalized provider ingestion, mobile server-mode feed, reference snapshots, shifted bot dry-run, fake-token order/portfolio state, cashout/sell safety tests, cancel tests, and S23 Home/Event Detail/Portfolio proof passed. Server deployment and production still need broader provider coverage, environment hardening, credential/output sanitization, monitoring, and public-money safety review.

## Next Recommended Loop

Run a provider breadth loop:

1. Improve read-only discovery for soccer provider events beyond the current top Gamma search slice.
2. Keep unsupported or ambiguous raw markets hidden.
3. Import only a small allowlist through `soccerProviderNormalization`.
4. Prove route/mobile/bot behavior for each imported normalized profile.
5. Commit only source/docs, not generated runtime artifacts.
