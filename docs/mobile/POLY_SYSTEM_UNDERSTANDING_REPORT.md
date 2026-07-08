# Poly System Understanding Report

Date: 2026-07-06
Branch: `cycle/fj-real-provider-home-ticket`
Remote for mobile work: `poly-mobile`
Scope: architecture understanding only. No service startup, bot execution, schema change, or feature implementation was performed for this report.

## 1. Product Model

Holiwyn/Poly is an internal prediction-market app that uses Polymarket as a reference-data source, not as the user execution venue. The intended product model is:

1. Discover relevant Polymarket markets.
2. Import selected markets into Poly's own `Event -> Market -> Outcome` structure.
3. Store Polymarket ids, slugs, condition ids, token ids, and reference metadata beside the local markets/outcomes.
4. Refresh public Polymarket reference prices and orderbook/depth snapshots.
5. Let a local/internal market maker quote Poly's own local orderbook using those reference prices with a controlled spread/shift.
6. Let the mobile app display and trade the Poly backend markets through Poly routes.

Users should trade against Poly's backend/local market, not directly against Polymarket. The mobile app submits to Poly's `/api/orders`, which enters the local canonical order/matching path. The Polymarket connection is used for public discovery, metadata, token mapping, and reference prices.

The two-tick shifted market-making idea fits in the external `poly-bot` reference-market runtime. `src/referenceMarket/liveMarketMaker.ts` builds desired local bid/ask quotes from Polymarket reference bid/ask values and applies `quoteOffsetTicks` with `tickSize`. The default runtime config in `scripts/liquidityRuntime.ts` uses `QUOTE_OFFSET_TICKS=2` and `TICK_SIZE=0.01`, so a reference bid/ask can be quoted locally two ticks worse/wider, subject to non-crossing checks, inventory, open-order caps, exposure caps, stale-reference checks, and live-confirmation gates.

Current architecture supports the two-tick shifted local market-maker model for binary reference markets that are imported, approved, listed, seeded, and enabled. What is still missing is a clean, repeated import/classification/visibility pipeline that brings many Polymarket markets into the local DB in the shape mobile expects.

## 2. Data Pipeline

### Discovery

Polymarket discovery exists in both repositories:

- Poly repo:
  - `scripts/scan_polymarket_sports.ts`
  - `scripts/scan_polymarket_reference_candidates.ts`
- poly-bot repo:
  - `npm run bot:polymarket:discover`
  - `scripts/importPolymarketWorldCup.ts`
  - `src/referenceMarket/polymarketGammaClient.ts`
  - `docs/polymarket-import-engine.md`

Discovery uses public Polymarket/Gamma data. It can find candidates, inspect metadata, and produce reports. Discovery by itself does not make markets visible in mobile. A candidate must be imported into Poly's local `Event`, `Market`, and `Outcome` tables and then satisfy listing/status filters.

### Import

Poly-side import for grouped Polymarket events is centered on:

- `scripts/import_polymarket_event.ts`
- `src/server/services/polymarketEventImport.ts`
- `src/server/services/polymarketReferenceImport.ts`

This path fetches a Gamma event by slug, filters active binary child markets with CLOB token ids, upserts a local `Event`, and creates/upserts local `Market`/`Outcome` rows with Polymarket reference metadata. It marks imported markets with review metadata such as `importStatus`, `referenceOnly`, `tradable`, and `mmEnabled`.

The older/general poly-bot import path can also create local markets through admin APIs:

- `poly-bot/scripts/importPolymarketWorldCup.ts`
- `poly-bot/src/referenceMarket/importWorldCupMarkets.ts`

That path is documented as dry-run by default and explicitly gated for local creation. It is useful, but the Poly repo's grouped event import currently appears to be the more direct path for the World Cup Winner grouped event that mobile can display.

### Grouping And Classification

Grouping/classification is handled by:

- `scripts/group_worldcup_event.ts`
- `src/server/services/eventGroupedMarkets.ts`
- `src/server/services/eventReadModel.ts`
- `src/server/services/mobileLiveEventDetail.ts`
- `scripts/backfill_event_grouping_metadata.ts`

The local model stores:

- `Event`: source, external event ids/slugs, sport/league/event type, teams, metadata, status.
- `Market`: local tradable condition, event link, market type/group/period/line, visibility/listing/status, external Polymarket ids/slugs/condition ids, reference metadata.
- `Outcome`: local tradable outcome with display order, side/label, reference token id, reference label, and reference metadata.

The mobile contract derives event-level market rules from actual backend data:

- `marketProfile`
- `resultMode`
- `gameRules`
- `supportedMarketTypes`

For outrights/futures, `eventType` is mapped to `marketProfile: outright`, `resultMode: one_winner`, and `marketType: outright`. For game/match events, the serializer inspects actual markets/outcomes to decide whether draw, advance, spread, totals, team totals, first half, second half, and prop surfaces are supported.

### Provider Identity Mapping

Provider identity is stored on local markets/outcomes:

- `Market.referenceSource`
- `Market.externalMarketId`
- `Market.conditionId`
- `Market.externalSlug`
- `Market.referenceMetadata`
- `Outcome.referenceTokenId`
- `Outcome.referenceOutcomeLabel`
- `Outcome.referenceMetadata`

Mobile/provider refresh services include:

- `src/server/services/mobileLiveProviderMapping.ts`
- `src/server/services/mobileLiveProviderIdentityAttach.ts`
- `src/server/services/mobileLiveProviderRefresh.ts`
- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/server/services/mobileLiveProviderScheduler.ts`

These services attach or refresh provider identities for mobile-visible provider-backed markets. They do not replace import/grouping; they depend on local rows existing.

### Reference Price And Snapshot Refresh

Reference price/snapshot refresh is handled by:

- `scripts/refresh_reference_snapshots.ts`
- `src/server/services/polymarketReferenceSnapshots.ts`
- `src/server/services/referenceQuoteSnapshots.ts`
- `src/server/services/referenceOrderbookDepthSnapshots.ts`
- `src/server/services/polymarketOrderbookDepthSnapshots.ts`
- `src/server/services/polymarketPriceHistorySnapshots.ts`

The refresh path finds local `Market` rows with `referenceSource: polymarket`, external slugs, listed/approved state, and optional `mmEnabled` filtering. It fetches public Gamma/CLOB data and writes `ReferenceQuoteSnapshot` and depth/history snapshots. Snapshot quality flags include missing book, invalid price, wide spread, available, and high quality. Market-maker eligibility is derived from snapshot quality plus market review state.

### Mobile Feed Exposure

Mobile feed exposure is route-driven:

- Home/Search/Live feed: `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`
- Event detail: `/api/mobile/events/:slug/live-detail`, fallback `/api/events/:slug`
- Game Lines: `/api/events/:slug/markets`
- Quote: `/api/markets/:id/quote`
- Order submit: `/api/orders`
- Portfolio: `/api/portfolio`, `/api/portfolio/history`, `/api/portfolio/value-history`
- Account: `/api/profile/summary`, `/api/profile/preferences`, `/api/account/balance`

The `/api/events` mobile feed filters to events that have public/listed markets. The live-detail route currently includes markets with `visibility: PUBLIC`, `mechanism: ORDERBOOK`, and `status: LIVE`. So an imported market that is still draft/paused/unlisted/reference-only will not behave like a mobile-visible tradable market.

## 3. Market Maker Pipeline

### Bot Categories

The external `poly-bot` repo contains several bot categories:

- Discovery/import bots:
  - `bot:polymarket:discover`
  - `import:polymarket-worldcup`
  - `import:polymarket-market`
  - `marketDiscoveryAgent`
- Reference sync / quote-read bots:
  - `bot:polymarket:reference-sync`
  - `reference:cache-dry-run`
  - `ReferencePriceUpdater`
- Reference/local market maker bots:
  - `bot:polymarket:mm:dry-run`
  - `bot:polymarket:mm:live-local`
  - `liquidity:runtime`
  - `liquidity:live-market`
  - `liquidity:live-event`
- Liquidity setup tools:
  - `liquidity:seed-market-bot`
  - `liquidity:prepare-event`
  - `liquidity:check-event-readiness`
  - `liquidity:enable-event-mm`
  - `markets:enable-event-trading`
- Risk/ops/review bots:
  - `bots:safety`
  - `bots:stop-all`
  - `bots:reset`
  - `bot:risk:stale-quotes`
  - `bot:resolution:proposal`
  - `bot:ops:report`
- Dev-only simulation bots:
  - `sim:*`
  - noise/user simulation strategies

### Dry-Run, Live-Local, And Unsafe Commands

The default documented bot posture is dry-run/off/kill-switched:

- `POLY_BOTS_ENABLED=false`
- `POLY_BOTS_LIVE_TRADING=false`
- `POLY_BOTS_GLOBAL_KILL_SWITCH=true`
- `SYSTEM_LIQUIDITY_DRY_RUN=true`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=false`

Dry-run commands are safe for reports and planning when credentials are local:

- `bot:polymarket:discover`
- `reference:cache-dry-run`
- `bot:polymarket:mm:dry-run`
- `liquidity:check-event-readiness`

Live-local/internal commands can place local Poly orders and must be treated as controlled internal runtime actions, not casual proof commands:

- `bot:polymarket:mm:live-local`
- `liquidity:runtime --dryRun false --confirmLive true`
- `liquidity:live-market`
- `liquidity:live-event`

The repo docs and source indicate that these live-local commands place orders against Poly's backend using a bot API credential. They are not supposed to place real Polymarket orders. Still, they are unsafe for production unless the environment, allowlists, limits, kill switches, internal trading gates, and fake-token boundaries are intentionally set.

### Two-Tick Shift Implementation

The two-tick shifted quoting logic is implemented in `poly-bot/src/referenceMarket/liveMarketMaker.ts`:

- `buildDesiredQuotes()` reads reference bid/ask pairs.
- It applies `clampPrice(referenceBid, tickSize, -quoteOffsetTicks)` for bid and `clampPrice(referenceAsk, tickSize, quoteOffsetTicks)` for ask.
- It prevents crossing the local book.
- It sizes orders based on available cash, inventory, per-order notional caps, share caps, and minimum inventory reserve.
- It only places quotes through the runtime supervisor when readiness passes and live-local placement is explicitly enabled.

`poly-bot/scripts/liquidityRuntime.ts` sets defaults:

- `QUOTE_OFFSET_TICKS=2`
- `TICK_SIZE=0.01`
- max single order notional: $10 by default
- per-market exposure cap: $200 by default
- global exposure cap: $60,000 by default
- max open orders per market: 4 by default

### Relationship To Import

The market maker is not the importer. It expects markets already to exist locally with:

- `referenceSource: polymarket`
- approved import status
- listed market state
- `status: LIVE`
- two active outcomes for current binary runtime
- reference token ids on outcomes
- `tradable=true`
- `mmEnabled=true`
- seeded bot capital/inventory/runtime credential
- fresh reference snapshots

If those conditions are not met, the runtime skips or previews instead of quoting.

## 4. Mobile Pipeline

### Mobile API Client

`mobile/src/api.ts` is the main mobile API client. In server mode it calls:

- `listWorldCupEvents()` -> `/api/events?...includeMobileMarkets=1`
- `getEvent()` -> `/api/mobile/events/:slug/live-detail`, fallback `/api/events/:slug`
- `getEventMarkets()` -> `/api/events/:slug/markets`
- `getMarketQuote()` -> `/api/markets/:id/quote`
- `getMarketChart()` -> `/api/markets/:id/chart`
- `getOrderbook()` -> `/api/orderbook/:marketId/book`
- `placeLimitOrder()` -> `/api/orders`
- `cancelOrder()` -> `/api/orders/:id`
- `getPortfolio()` -> `/api/portfolio`
- `getPortfolioHistory()` -> `/api/portfolio/history`
- `getPortfolioValueHistory()` -> `/api/portfolio/value-history`
- `getAccountBalance()` -> `/api/account/balance`
- `getProfileSummary()` -> `/api/profile/summary`
- `getProfilePreferences()` / `saveProfilePreferences()` -> `/api/profile/preferences`

### Page Flow

Home:

- Uses `/api/events` with World Cup sport/league filters and `includeMobileMarkets=1`.
- Displays backend event cards and compact backend markets/outcomes when server mode is healthy.
- Local fixtures remain for offline/mock fallback.

Search:

- Uses the same `/api/events` route with `search`, `limit`, and `cursor`.
- Saves/preferences use profile preference routes.

Event Detail:

- Hydrates with `/api/mobile/events/:slug/live-detail`.
- Loads Game Lines catalog with `/api/events/:slug/markets`.
- Refreshes market/outcome quotes with `/api/markets/:id/quote`.
- The chart/chat/order-book visual surfaces have been removed or hidden from normal MVP mode, but route metadata may still exist for proof/degraded states.

Trade Ticket:

- Opens from a backend market/outcome id.
- Reads quote via `/api/markets/:id/quote`.
- Submits limit orders to `/api/orders` using local `marketId` and `outcomeId`.
- The resulting order is local Poly state, not a Polymarket order.

Portfolio:

- Reads route-backed positions, open orders, history, canceled orders, recent trades, and value history.
- Cashout/sell uses the local order route and backend safety checks.
- It should not display a successful cashout unless backend accepts the sell/order.

Account:

- Reads profile/account summary and preferences from backend routes.
- Unsupported account-menu rows are intentionally unavailable/outside MVP.

### What Makes A Market Visible

A market becomes visible to mobile when it exists in Poly's DB and passes the relevant route filters:

- Event exists and matches mobile filters such as `sportKey=soccer`, `leagueKey=world_cup`, or `source=polymarket` depending on request.
- Market belongs to that event.
- Market is `visibility: PUBLIC`.
- Market is `isListed: true`.
- Event detail live route additionally expects `mechanism: ORDERBOOK` and `status: LIVE`.
- Outcomes are active.
- Market metadata/classification fields are present enough for mobile grouping.
- Quotes are available from local orderbook and/or provider snapshots.

### Why Only World Cup Winner Is Currently Visible As Provider-Backed Data

The runtime proof showed the World Cup Winner outright because that grouped Polymarket event had been imported and classified into local backend rows with the right mobile contract (`marketProfile: outright`, `resultMode: one_winner`, `marketType: outright`). Other Polymarket candidates may exist on Polymarket, and discovery scripts may find them, but they are not automatically local mobile-visible rows.

In short: the app is backend-driven now; if the backend has only one imported/listed/classified provider-backed event, the app should only show that one real provider-backed event.

## 5. Current Gap Direct Answers

### Why are multiple Polymarket markets not appearing in the mobile app?

Because multiple Polymarket markets have not been fully moved through the local Poly pipeline. Discovery is not enough. For mobile visibility, each market/event must be imported into Poly's `Event/Market/Outcome` tables, grouped/classified, approved/listed/live as appropriate, mapped to provider ids/tokens, refreshed with reference snapshots, and exposed by `/api/events` and event-detail routes.

The current mobile app is doing the right thing by reading backend routes. It should not invent extra markets just because Polymarket has them. The missing piece is backend import/classification/visibility breadth.

### Is the market maker expected to import markets, or only trade already-imported markets?

The market maker should trade/quote already-imported markets. It is not the canonical importer. It can include discovery/import helper scripts in the bot repo, but the live market-maker runtime expects local markets already to be approved, listed, tradable, mm-enabled, seeded, and snapshot-refreshed.

### Which existing script/service should import more markets?

Recommended Poly-side path:

- Discovery/review: `scripts/scan_polymarket_sports.ts` or `scripts/scan_polymarket_reference_candidates.ts`
- Grouped event import: `scripts/import_polymarket_event.ts`
- Service: `src/server/services/polymarketEventImport.ts`
- Reference market upsert: `src/server/services/polymarketReferenceImport.ts`

Existing poly-bot path:

- `npm run import:polymarket-worldcup`
- `poly-bot/scripts/importPolymarketWorldCup.ts`
- `poly-bot/src/referenceMarket/importWorldCupMarkets.ts`

The next implementation should choose one canonical path for the next batch, likely the Poly-side grouped event import for mobile-visible World Cup groups, and use the poly-bot import path only where it still provides missing candidate selection/reporting value.

### Which existing script/service should group and classify them?

- `scripts/group_worldcup_event.ts`
- `scripts/backfill_event_grouping_metadata.ts`
- `src/server/services/eventGroupedMarkets.ts`
- `src/server/services/eventReadModel.ts`
- `src/server/services/mobileLiveEventDetail.ts`

For new market families, classification should live in backend metadata/serializers, not in mobile guesses. The backend should own whether a market is an outright, regulation 90-minute result, to-advance market, full-match/overtime market, spread, total, team total, first-half, second-half, or future player-prop placeholder.

### Which existing bot/service should quote shifted prices?

- `poly-bot/src/referenceMarket/liveMarketMaker.ts`
- `poly-bot/src/referenceMarket/runtimeSupervisor.ts`
- `poly-bot/scripts/liquidityRuntime.ts`
- Commands:
  - dry-run: `npm run bot:polymarket:mm:dry-run`
  - live-local/internal: `npm run bot:polymarket:mm:live-local`

The shifted quoting is local Poly order placement. It uses Polymarket as reference data and posts orders to Poly's backend.

### What is the minimum safe sequence to get multiple Polymarket markets into the app?

1. Run discovery in dry-run/review mode and choose a small allowlist of World Cup markets.
2. Import those selected markets/events into Poly local `Event/Market/Outcome` rows with provider ids/tokens preserved.
3. Group/classify them with backend event-level rules and market types.
4. Mark only reviewed markets/events as listed/mobile-visible; keep unreviewed imports hidden or paused.
5. Refresh reference snapshots for the imported allowlist.
6. Verify backend routes:
   - `/api/events?...includeMobileMarkets=1`
   - `/api/mobile/events/:slug/live-detail`
   - `/api/events/:slug/markets`
   - `/api/markets/:id/quote`
7. Seed local market-maker capital/inventory for a tiny allowlist if internal quote testing is needed.
8. Run market-maker dry-run first and inspect desired quotes.
9. Enable live-local/internal quoting only after readiness gates pass.
10. Verify on Samsung S23 that Home/Search/Event Detail display real backend markets and that Trade Ticket/Portfolio operate against Poly backend routes.

## 6. Proposed Next Implementation Plan

### Step 1: Canonical Import/Visibility Audit For One New Batch

Pick 3-5 World Cup Polymarket candidates. Do not import hundreds yet.

Tasks:

- Use existing discovery dry-run to identify candidates.
- Decide whether each is an outright/future, single game, regulation 90, to-advance, spread/total, or unsupported for MVP.
- Confirm each candidate has stable external slug, market id, condition id, outcome labels, and token ids.

Validation:

- Candidate report saved outside the repo or as a lightweight audit doc if needed.
- No local DB mutation unless explicitly running import with confirmation.

Expected DB changes after import:

- New or updated `Event` rows.
- New or updated `Market` rows linked to events.
- New or updated `Outcome` rows with reference token ids.
- `referenceMetadata` containing review/import/group metadata.

Expected mobile-visible changes:

- None until markets are listed and route filters include them.

### Step 2: Import And Backend Classification For The Allowlist

Tasks:

- Use `scripts/import_polymarket_event.ts` or the chosen canonical import path for the allowlist.
- Apply or backfill grouping metadata.
- Ensure backend serializers produce correct `marketProfile`, `resultMode`, `gameRules`, and `supportedMarketTypes`.
- Keep unsupported/mismatched markets hidden or pending review.

Validation:

- Backend route checks for `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/events/:slug/markets`.
- Focused backend tests for serializer classification.
- Mobile service tests for route payload handling.

Expected DB changes:

- Imported markets become visible only after review/listing/status fields are correct.

Expected mobile-visible changes:

- Home/Search should show more real backend events/markets.
- Event Detail should show backend-driven Game Lines without invented rows.

### Step 3: Reference Snapshot And Local Quote Readiness

Tasks:

- Refresh reference snapshots for only the imported allowlist.
- Verify quote quality and freshness.
- Seed local liquidity bot only for markets that pass review and are intended for internal testing.
- Run market-maker dry-run and verify two-tick shifted desired quotes.

Validation:

- `scripts/refresh_reference_snapshots.ts --once --eventSlug <slug>` or market-specific equivalent.
- Admin/reference readiness route checks.
- poly-bot dry-run report showing no local orders placed.

Expected DB changes:

- `ReferenceQuoteSnapshot` rows.
- Potential `ReferenceOrderbookDepthSnapshot` / chart/history snapshots if route proof requires them.
- Bot initialization metadata only if seeding is explicitly run.

Expected mobile-visible changes:

- Event cards and ticket quotes should reflect backend/local quote routes using reference-backed snapshots/local orderbook, not hardcoded 50% dummy values.

### Step 4: Internal S23 Runtime Proof

Tasks:

- Start backend and mobile server mode only after backend data exists.
- Verify S23 displays real backend events.
- Verify Event Detail and Game Lines for at least two profiles:
  - outright/to-advance/no-draw style
  - regulation 90-minute game with draw when such a market is imported
- Verify Trade Ticket submit/cancel/cashout stays local Poly backend only.

Proof required:

- Lightweight route logs and S23 screenshots only where audit gate requires visual evidence.
- Avoid committing screenshot piles unless required.

### Risks

- Wrong provider mapping: similar Polymarket questions can map to the wrong local market/outcome.
- Resolution mismatch: Polymarket settlement rules may differ from Poly's local rule text.
- Over-broad import: too many unreviewed markets can pollute mobile feeds.
- Stale reference data: market maker must stop quoting stale/missing/wide markets.
- Binary limitation: current live-local reference market maker is binary-focused. Multi-outcome/correct-score style markets require separate risk/matching design.
- Visibility mismatch: a market can be imported but still invisible because it is unlisted, paused, not live, or filtered out by sport/league/status.
- Fake-token boundary: internal local testing is not public deployment readiness.

## Bottom Line

The system is designed for the product model you described: import Polymarket market information, expose Poly-owned markets to the mobile app, and let a local market maker quote Poly's local orderbook using Polymarket as the reference price. Users should not trade directly against Polymarket from the mobile app.

The current issue is not primarily the mobile UI. The immediate gap is that the backend does not yet have enough imported, grouped, classified, listed, and refreshed Polymarket-backed markets. The market maker can quote shifted prices only after that local market structure exists and passes safety/readiness gates.
