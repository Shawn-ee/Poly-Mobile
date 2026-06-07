# Polymarket Structure Transition

## Goal

Add a Polymarket-like metadata layer:

- `Event`
- `Market`
- `Outcome`

without changing current trading behavior.

## What Changed

This phase adds schema-only metadata support:

- new `Event` model
- optional `Market.eventId` relation
- external/reference metadata on `Market`
- external/reference metadata on `Outcome`

New fields are additive only. Existing binary markets continue to work with:

- `eventId = null`
- no external market metadata
- no reference token metadata

## Event -> Market -> Outcome

The new intended structure is:

- `Event`
  - shared title/description/source/external identifiers
- `Market`
  - local tradable condition/question
  - optionally belongs to an `Event`
- `Outcome`
  - tradable outcomes/tokens for a market

This supports:

1. existing binary markets
2. grouped binary markets under one event
3. future multi-outcome metadata storage

## What Did Not Change

This phase does **not** change:

- matching logic
- collateral logic
- settlement logic
- order placement APIs
- bot strategy
- frontend trading behavior

No changes were made to:

- `matching.ts`
- `orderbookCollateral.ts`
- settlement services
- bot market-making logic

## Why Matching Was Not Touched

Current matching and collateral logic still contain binary assumptions:

- binary sibling inference
- `YES + NO = 1` resting-book invariants
- complete-set mint / collateral accounting

Those are a separate migration phase. This phase only creates the metadata foundation needed before any trading-engine redesign.

## Schema Additions

### Event

Added:

- `slug`
- `title`
- `description`
- `category`
- `status`
- `source`
- `externalEventId`
- `externalSlug`
- `image`
- `icon`
- `metadata`
- `createdBy`
- timestamps

### Market

Added:

- `eventId`
- `externalMarketId`
- `conditionId`
- `referenceSource`
- `externalSlug`
- `referenceMetadata`

### Outcome

Added:

- `isTradable`
- `referenceTokenId`
- `referenceOutcomeLabel`
- `referenceMetadata`

## Next Recommended Phase

Phase 2 should migrate discovery/admin/reference-data code to use the new structure:

1. include event metadata in market reads
2. allow admin/import flows to attach markets to events
3. keep legacy binary market APIs compatible
4. avoid changing trading behavior yet

Only after the metadata and API layer are stable should later phases consider:

- grouped event UI
- external reference market linking
- eventual N-outcome matching/collateral redesign

## Phase 2 Read Model

The market read APIs should expose:

- optional `event` metadata on each market
- richer `outcomes[]` entries with:
  - `displayOrder`
  - `isTradable`
  - reference token metadata
  - read-only quote fields like `price`, `bestBid`, `bestAsk`, and `spread`
- generic `pricesByOutcome`

Backward compatibility should remain for binary markets:

- preserve `prices.YES`
- preserve `prices.NO`

These legacy fields should only be populated for true binary YES/NO markets. Non-binary or grouped-event markets should use `pricesByOutcome` and `outcomes[]` instead.

## Phase 3 Event APIs

Phase 3 adds first-class event browsing without changing trading behavior:

- `GET /api/events`
- `GET /api/events/[slug]`
- `GET /api/events/[slug]/markets`

The event market route reuses the Phase 2 market read model:

- optional `event`
- rich `outcomes[]`
- `pricesByOutcome`
- legacy binary `prices.YES` / `prices.NO` only for true YES/NO markets

## Event Page Behavior

The minimal event page at `src/app/events/[slug]/page.tsx`:

- loads one event by slug
- loads child markets for that event
- renders binary child markets through the existing `MarketCard`
- leaves trading links unchanged (`/markets/[id]`)

This phase is browsing-only. It does not change:

- order placement
- matching
- collateral
- settlement
- bot behavior

## What Remains Binary-Only

Even with the new Event layer:

- matching and collateral still assume binary public orderbook semantics
- legacy card/list UX still centers on binary YES/NO markets
- grouped events are supported for browsing, not yet for generalized N-outcome trading

## Phase 4 Event Discovery

Phase 4 makes events visible in frontend navigation:

- `/events` lists event cards
- homepage / market discovery surfaces a small featured-events section
- market detail pages show event context and a link back to the parent event when available

The event page flow is now:

- `Event`
  - metadata and counts
- `Event -> Markets`
  - binary child markets rendered through the existing market card
  - non-binary child markets shown in a generic fallback layout

## What Still Remains Binary-Only

Frontend trading is still binary-first:

- market cards still expect binary YES/NO prices
- grouped event browsing does not change order placement
- non-binary child markets are discoverable, but not yet given a specialized trading card or generalized outcome-trading UX

## Phase 5 Event-Aware Polymarket Import

Phase 5 upgrades the importer from JSON-only discovery into idempotent metadata import for:

- `Event`
- `Market`
- `Outcome`

The importer still does **not**:

- place orders
- enable bots
- connect imported data to market making
- modify matching, collateral, or settlement

### Import Mapping

Polymarket Gamma market-level data maps as follows:

- Polymarket event or series
  - `Event`
- Polymarket market / condition
  - `Market`
- Polymarket outcomes + token IDs
  - `Outcome`

Primary reference/display fields now come from Gamma market-level metadata:

- `outcomePrices`
- `bestBid`
- `bestAsk`
- `spread`
- `lastTradePrice`
- `volume`
- `volume24hr`
- `liquidity`
- `liquidityClob`
- `acceptingOrders`

CLOB token-level endpoints remain optional validation/debug input and are stored as reference metadata only.

### Dry Run Usage

Bulk query import, dry-run only:

```powershell
cd C:\Users\hecto\Desktop\projects\PolyProj\poly-bot
cmd /c npm.cmd run import:polymarket-worldcup -- --limit 50 --dry-run true --create-local-markets false
```

Single market, dry-run only:

```powershell
cd C:\Users\hecto\Desktop\projects\PolyProj\poly-bot
cmd /c npm.cmd run import:polymarket-market -- --slug ukraine-signs-peace-deal-with-russia-before-2027 --dry-run true
```

### Create Mode Usage

Single market create/update:

```powershell
cd C:\Users\hecto\Desktop\projects\PolyProj\poly-bot
$env:POLY_BOT_BASE_URL='http://127.0.0.1:3001'
$env:POLY_SIM_SESSION_COOKIE='next-auth.session-token=...'
cmd /c npm.cmd run import:polymarket-market -- --slug ukraine-signs-peace-deal-with-russia-before-2027 --dry-run false --create-local-markets true
```

### Idempotency Behavior

Imported markets are matched in this order:

1. `conditionId`
2. `externalMarketId`
3. `externalSlug`

Imported events are matched in this order:

1. `externalEventId`
2. `externalSlug`
3. local `slug`

Imported outcomes are matched in this order:

1. `referenceTokenId`
2. normalized local outcome name
3. `referenceOutcomeLabel`

Re-running the same import updates metadata instead of duplicating:

- `Event`
- `Market`
- `Outcome`

### Imported Status Defaults

Imported markets do not auto-start trading.

The current local market status model does not have separate `draft` and `paused` enums, so importer status flags map conservatively:

- `draft` -> local `UPCOMING`
- `paused` -> local `UPCOMING`
- `live` -> local `LIVE`

This keeps imported markets non-live by default.

### Why Imported Markets Do Not Auto-Enable MM

Imported reference markets are metadata first:

- outcome token mapping must be verified
- event grouping must be reviewed
- resolution rules may differ
- market quality may be too poor for quoting

Only after manual review should imported references be considered for downstream market-making or pricing experiments.

## Phase 6 Review And Approval

Imported reference markets now have a review layer before they become visible or tradable.

### Review State Storage

Review state is stored additively inside `Market.referenceMetadata`:

- `importedFrom: "polymarket"`
- `importStatus: "pending_review" | "approved" | "rejected"`
- `referenceOnly: boolean`
- `tradable: boolean`
- `mmEnabled: boolean`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`

Imported outcomes are also created with:

- `isTradable = false`

Imported markets are created with:

- `status = UPCOMING` unless explicitly imported as live
- `isListed = false`

That keeps imported references out of public discovery and away from active trading by default.

### Admin Review Endpoints

List imported reference markets:

- `GET /api/admin/reference-markets`

Optional filters:

- `source=polymarket`
- `importStatus=pending_review|approved|rejected`
- `search=...`

Review/update one imported market:

- `PATCH /api/admin/reference-markets/[id]`

Supported actions / fields:

- `action: "approve" | "reject" | "reset"`
- `importStatus`
- `referenceOnly`
- `tradable`
- `mmEnabled`
- `isListed`
- `reviewNotes`

### Single-Market Import + Review Flow

1. Import one market in dry-run mode:

```powershell
cd C:\Users\hecto\Desktop\projects\PolyProj\poly-bot
cmd /c npm.cmd run import:polymarket-market -- --slug ukraine-signs-peace-deal-with-russia-before-2027 --dry-run true
```

2. Import it into the local DB:

```powershell
cd C:\Users\hecto\Desktop\projects\PolyProj\poly-bot
$env:POLY_BOT_BASE_URL='http://127.0.0.1:3001'
$env:POLY_SIM_SESSION_COOKIE='next-auth.session-token=...'
cmd /c npm.cmd run import:polymarket-market -- --slug ukraine-signs-peace-deal-with-russia-before-2027 --dry-run false --create-local-markets true
```

3. Review the imported market through the admin endpoint:

- confirm `conditionId`, `externalSlug`, event linkage, and token IDs
- inspect `outcomePrices`, `bestBid`, `bestAsk`, `spread`, `lastTradePrice`, `volume24hr`, and `liquidity`
- keep `referenceOnly = true` and `tradable = false` unless a later phase explicitly changes that

### Why Imported Markets Are Still Not Auto-Tradable

Even after approval:

- matching remains binary-first
- no MM integration has been added
- no automated quoting is enabled
- imported market semantics and resolution rules still require human review

Approval in this phase is for metadata confidence and discovery safety, not for automated trading enablement.

## Phase 7 Admin Review UI

Phase 7 adds a small admin review UI on top of the existing reference-market endpoints.

### Route

- `/admin/reference-markets`

### What The UI Shows

For each imported reference market:

- title / question
- event title
- external slug
- condition ID
- source
- import status
- `referenceOnly`
- `tradable`
- `mmEnabled`
- `isListed`
- `bestBid`
- `bestAsk`
- `spread`
- `lastTradePrice`
- `volume24hr`
- `liquidity`
- `acceptingOrders`
- outcome count

Expanded review rows also show:

- outcomes
- `referenceTokenId`
- `referenceOutcomeLabel`
- `outcomePrices`
- description preview
- summarized raw reference metadata

### Review Actions

The UI supports:

- approve
- reject
- reset
- update review notes
- toggle `isListed`
- toggle `referenceOnly`
- toggle `tradable`
- toggle `mmEnabled`

### Safety Rules

The review UI preserves the same safety defaults as the backend:

- approval does **not** automatically make a market tradable
- approval does **not** automatically enable MM
- rejected markets stay hidden and non-tradable
- risky actions require explicit confirmation in the UI

Imported markets remain review-first metadata objects until a later phase explicitly decides how approved references should be exposed more broadly.
