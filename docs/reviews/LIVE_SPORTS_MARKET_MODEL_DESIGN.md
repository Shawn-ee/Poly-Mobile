# Live Sports Event Market Model Design

Date: 2026-06-24

Branch: `agent/live-sports-market-model-design`

Base: `dev` at `287edbc Merge pull request #231 from Shawn-ee/agent/live-sports-product-gap-audit`

## Purpose

This document defines the target product model for POLY's live sports prediction-market experience. It is design-only and does not change runtime behavior, database schema, trading behavior, funding behavior, settlement behavior, admin auth, bots, or workflows.

The goal is a clean sports event trading model that can support one game or match with many related markets: moneyline, spread, totals, team props, player props, period props, custom binary markets, and selected multi-outcome markets.

## Design Principles

1. Keep sports/product taxonomy separate from trading mechanics.
2. Preserve the existing orderbook, balance, position, ledger, funding, and settlement systems.
3. Add first-class structure only where it improves UI, filtering, admin workflows, testing, and settlement evidence.
4. Keep provider/source data isolated from user-facing product fields.
5. Use internal/demo data first; do not require unauthorized scraping or unconfigured sportsbook APIs.
6. Keep funding and trading gates separate.
7. Avoid copycat branding, assets, proprietary layouts, colors, or copy.

## Current Model Summary

Existing `Event` fields cover basic sports discovery:

- `sportKey`
- `leagueKey`
- `eventType`
- `homeTeamName`
- `awayTeamName`
- `startTime`
- `status`
- `source`
- external IDs/slugs
- image/icon
- `metadata`

Existing `Market` fields cover basic event market attachment:

- `eventId`
- `marketType`
- `status`
- `visibility`
- `mechanism`
- `rules`
- `closeTime`
- `resolveTime`
- `resolutionTime`
- `resolvedOutcomeId`
- reference metadata

Existing `Outcome` fields cover labels, display order, tradability, status, and metadata.

These are enough for early internal beta, but not enough for a scalable sports event trading product.

## Target Domain Objects

### Sport

Represents a sport category.

Examples:

- Soccer
- Basketball
- Football
- Baseball
- Tennis
- MMA
- Esports

Target fields:

- `id`
- `key`
- `name`
- `displayOrder`
- `status`
- `metadata`

### League

Represents a sport-specific competition.

Examples:

- NBA
- NFL
- MLB
- UEFA Champions League
- FIFA World Cup

Target fields:

- `id`
- `sportId`
- `key`
- `name`
- `seasonLabel`
- `countryCode`
- `displayOrder`
- `status`
- `metadata`

### Team

Represents a team or competitor.

Target fields:

- `id`
- `sportId`
- `leagueId`
- `key`
- `name`
- `shortName`
- `abbreviation`
- `logoUrl`
- `primaryColor`
- `secondaryColor`
- `metadata`

### Player

Represents a player used in player props.

Target fields:

- `id`
- `sportId`
- `teamId`
- `key`
- `name`
- `position`
- `jerseyNumber`
- `status`
- `metadata`

### Event/Game/Match

Represents one scheduled or live contest.

Target fields:

- `id`
- `sportId`
- `leagueId`
- `season`
- `eventType`
- `title`
- `slug`
- `homeTeamId`
- `awayTeamId`
- `homeTeamName`
- `awayTeamName`
- `startsAt`
- `status`
- `period`
- `clock`
- `homeScore`
- `awayScore`
- `venue`
- `broadcastStatus`
- `source`
- `sourceEventId`
- `sourceUpdatedAt`
- `metadata`

Target statuses:

- `scheduled`
- `live`
- `halftime`
- `intermission`
- `suspended`
- `final`
- `canceled`
- `postponed`

### Market Group

Represents a visible section under an event.

Required groups:

- Main
- Spread
- Total
- Team Props
- Player Props
- Period Props
- Specials
- Live

Target fields:

- `id`
- `eventId`
- `key`
- `title`
- `description`
- `displayOrder`
- `status`
- `metadata`

Market groups should be product-controlled, not inferred from raw `marketType` strings.

### Market

Represents one tradable question or contract under an event and optionally under a market group.

Examples:

- Will Lakers win?
- Lakers -5.5 spread?
- Total points over 221.5?
- LeBron over 26.5 points?
- First quarter total over 55.5?
- France to win?
- Game goes to overtime?

Target fields:

- `id`
- `eventId`
- `marketGroupId`
- `title`
- `description`
- `rulesText`
- `marketType`
- `status`
- `line`
- `unit`
- `period`
- `participantType`
- `participantId`
- `propCategory`
- `displayOrder`
- `closeTime`
- `resolutionSource`
- `resolutionEvidenceText`
- `resolutionEvidenceUrl`
- `resolvedAt`
- `resolvedBy`
- `settlementStatus`
- `source`
- `sourceMarketId`
- `sourceUpdatedAt`
- `metadata`

Target market types:

- `binary`
- `multi_outcome`
- `spread`
- `total`
- `team_total`
- `player_prop`
- `team_prop`
- `period_prop`
- `custom`

Target market statuses:

- `draft`
- `open`
- `live`
- `suspended`
- `closed`
- `resolving`
- `resolved`
- `voided`

Mapping to existing exchange status can remain internal:

- product `draft` -> current `UPCOMING`
- product `open`/`live` -> current `LIVE`
- product `closed`/`resolving` -> current `CLOSED`
- product `resolved` -> current `RESOLVED`
- product `voided` may require a new behavior path in a later settlement phase

### Outcome

Represents a tradable side.

Examples:

- YES / NO
- OVER / UNDER
- HOME / AWAY / DRAW
- Player/team choices

Target fields:

- `id`
- `marketId`
- `name`
- `label`
- `code`
- `side`
- `displayOrder`
- `status`
- `isTradable`
- `resolvedResult`
- `participantType`
- `participantId`
- `line`
- `metadata`

Target outcome statuses:

- `active`
- `suspended`
- `closed`
- `resolved`
- `voided`

Target resolved results:

- `win`
- `lose`
- `void`
- `push`

### Market Price Snapshot

The existing `MarketOutcomeSnapshot` and `ReferenceQuoteSnapshot` can remain the first source for price display. Product read models should normalize:

- best bid
- best ask
- last trade price
- probability
- spread
- volume
- liquidity
- freshness
- source

### Order, Fill, Position, Ledger

Existing order, fill, position, balance, and ledger models should remain authoritative for trading mechanics. The sports model should not fork these systems.

Needed product additions are mostly read-model and UI contract additions:

- event-level open orders
- event-level positions
- grouped market exposure
- status labels
- risk/cost/max payout estimates

## Product Read Models

### Sports Home Read Model

Purpose: list sports and leagues with event counts.

Shape:

- sports
- leagues
- live event counts
- upcoming event counts

### Event List Read Model

Purpose: show game cards.

Shape:

- event identity
- sport/league
- teams
- start/live/final status
- score/clock if known
- active market counts
- live/suspended counts

### Event Detail Read Model

Purpose: power the main sports event trading screen.

Shape:

- event header
- scoreboard/live state
- market groups in display order
- markets per group
- outcomes per market
- price/odds/probability summary
- liquidity/volume/freshness
- user position/open order summary when authenticated
- disabled reason for closed/suspended/untradable markets

### Market Detail Read Model

Purpose: show one contract with trading controls.

Shape:

- market metadata
- rules
- outcomes
- orderbook/quote
- recent trades
- chart snapshots
- current user's position/open orders
- settlement/resolution status

### Admin Event Management Read Model

Purpose: let admins create and manage game markets.

Shape:

- event core fields
- live status fields
- market groups
- markets and outcomes
- unresolved/resolving/resolved counts
- source metadata and freshness
- validation warnings

## Admin Workflow Design

Admin workflow should be staged:

1. Create or import event.
2. Add market groups.
3. Add markets under groups.
4. Add outcomes.
5. Preview public event page.
6. Open markets for internal beta trading.
7. Suspend or close markets as event state changes.
8. Resolve markets with evidence.
9. Run settlement.
10. Review reconciliation.

Admin mutations must remain admin-only and rate-limited where high-impact.

## Trading Workflow Design

User flow:

1. Browse sports.
2. Open event.
3. Select group.
4. Select market outcome.
5. Open ticket.
6. Review side, price, quantity, estimated cost, max payout, and risk.
7. Submit only if internal trading gate allows it.
8. See order status.
9. See position/open order in portfolio and event page.
10. See settlement when resolved.

Internal beta trading gate should be explicit and separate from funding:

- authenticated user required.
- internal trading beta flag required.
- trading kill switch off.
- allowlisted internal tester or admin required.
- market must be open/live and tradable.
- outcome must be tradable.
- balance/position checks must pass.

This design does not enable that gate. It only defines the required product contract.

## Resolution Workflow Design

Resolution flow:

1. Admin closes market.
2. Admin enters winning outcome(s), evidence note, and optional evidence URL.
3. System marks market `resolving`.
4. Settlement runs idempotently.
5. Winners are credited.
6. Losing positions close.
7. Voids/pushes refund when supported.
8. Market becomes `resolved` or `voided`.
9. Portfolio and event detail show final status.

Void/push behavior should be implemented only in a high-risk settlement phase with tests.

## Data Provider Design

Provider abstraction should support:

- internal/demo provider.
- event status updates.
- score/clock updates.
- market price snapshots.
- source freshness.
- stale warnings.

Provider records must not expose secrets. Any real sports data provider requires owner-supplied keys and permission.

## Phase C Decision Guidance

Phase C should be narrow. Add schema only for fields that cannot be reliably handled through existing `rules`/`metadata` without creating brittle UI and admin code.

Recommended minimal Phase C schema additions:

- `Event.liveStatus`
- `Event.period`
- `Event.clock`
- `Event.homeScore`
- `Event.awayScore`
- `Event.venue`
- `Event.sourceUpdatedAt`
- `Market.marketGroupKey`
- `Market.marketGroupTitle`
- `Market.displayOrder`
- `Market.line`
- `Market.unit`
- `Market.period`
- `Market.participantName`
- `Market.propCategory`
- `Market.rulesText`
- `Market.resolutionEvidenceText`
- `Market.resolutionEvidenceUrl`
- `Market.settlementStatus`
- `Outcome.side`
- `Outcome.resolvedResult`

Optional later normalized tables:

- `Sport`
- `League`
- `Team`
- `Player`
- `MarketGroup`

The project can ship useful grouped event UI before full normalization by adding the minimal fields above and leaving full sports/team/player normalization for a later migration.

## Final Recommendation

Proceed to a narrow Phase C schema proposal review. Do not implement schema changes until the owner accepts the migration scope. The safest product path is:

1. Add minimal grouped-market/prop fields.
2. Build display-only event detail UI.
3. Add explicit trading gates before broader order submission.
4. Extend admin management and resolution workflows after the read model is stable.
