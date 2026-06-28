# Live Sports Market Schema Proposal

Date: 2026-06-24

Branch: `agent/live-sports-market-model-design`

Base: `dev` at `287edbc Merge pull request #231 from Shawn-ee/agent/live-sports-product-gap-audit`

## Purpose

This is a schema proposal for Phase C. It is not a migration and does not change runtime behavior.

The goal is to support a richer sports event detail page with many grouped markets while preserving existing orderbook, settlement, ledger, funding, withdrawal, admin auth, and bot behavior.

## Recommended Approach

Use a two-layer approach:

1. Minimal additive fields now for event grouping, prop display, live state, and resolution evidence.
2. Full normalization later for sports, leagues, teams, players, and market groups.

This avoids a large migration while giving the UI and admin routes enough structure to stop depending on raw JSON/string inference.

## Phase C Minimal Additive Fields

### Event

Add nullable fields:

```prisma
liveStatus      String?
period          String?
clock           String?
homeScore       Int?
awayScore       Int?
venue           String?
sourceUpdatedAt DateTime?
```

Rationale:

- supports event header, scoreboard, live/suspended/final state, and source freshness.
- nullable fields preserve existing data.
- avoids full event-state table until real provider behavior is known.

Indexes:

```prisma
@@index([sportKey, leagueKey, liveStatus])
@@index([startTime])
```

### Market

Add nullable fields:

```prisma
marketGroupKey          String?
marketGroupTitle        String?
displayOrder            Int      @default(0)
line                    Decimal? @db.Decimal(18, 4)
unit                    String?
period                  String?
participantName         String?
participantType         String?
propCategory            String?
rulesText               String?
resolutionEvidenceText  String?
resolutionEvidenceUrl   String?
settlementStatus        String?
sourceUpdatedAt         DateTime?
```

Rationale:

- `marketGroupKey` and `marketGroupTitle` support Main, Spread, Total, Team Props, Player Props, Period Props, Specials, and Live without adding a new table immediately.
- `displayOrder` gives deterministic event page ordering.
- `line`, `unit`, `period`, `participantName`, `participantType`, and `propCategory` support spread/total/player/team/period props.
- `rulesText` gives UI/admin a human-readable rules field independent of JSON `rules`.
- resolution evidence fields prepare admin workflow without settlement changes.
- `settlementStatus` can represent pending/running/settled/failed in later high-risk settlement phases.

Indexes:

```prisma
@@index([eventId, marketGroupKey, displayOrder])
@@index([eventId, status, displayOrder])
@@index([marketType, propCategory])
```

### Outcome

Add nullable fields:

```prisma
side           String?
resolvedResult String?
```

Rationale:

- `side` distinguishes yes/no, over/under, home/away/draw, player/team choice, or custom side.
- `resolvedResult` prepares for `win`, `lose`, `void`, and `push` display.
- settlement behavior should not change in Phase C.

Indexes:

```prisma
@@index([marketId, side])
@@index([marketId, resolvedResult])
```

## Recommended Controlled Vocabularies

These can start as documented string values before becoming Prisma enums.

### Event Live Status

- `scheduled`
- `pregame`
- `live`
- `halftime`
- `intermission`
- `suspended`
- `final`
- `canceled`
- `postponed`

### Market Group Key

- `main`
- `spread`
- `total`
- `team_props`
- `player_props`
- `period_props`
- `specials`
- `live`

### Market Type

Existing `marketType` should accept:

- `moneyline`
- `match_winner`
- `match_winner_1x2`
- `spread`
- `total`
- `team_total`
- `player_prop`
- `team_prop`
- `period_prop`
- `both_teams_to_score`
- `correct_score`
- `custom_binary`
- `multi_outcome`

### Period

- `full_game`
- `first_half`
- `second_half`
- `first_quarter`
- `second_quarter`
- `third_quarter`
- `fourth_quarter`
- `first_period`
- `second_period`
- `third_period`
- `inning_1`
- `set_1`
- `map_1`

### Outcome Side

- `yes`
- `no`
- `over`
- `under`
- `home`
- `away`
- `draw`
- `choice`

### Resolved Result

- `win`
- `lose`
- `void`
- `push`

### Settlement Status

- `not_started`
- `pending`
- `running`
- `settled`
- `failed`
- `voided`

## Migration Safety

The Phase C migration should be additive only:

- no column drops.
- no enum conversions.
- no required fields without defaults.
- no data backfill required for existing markets.
- no order/position/ledger/funding/withdrawal table changes.
- no trading behavior changes.
- no settlement behavior changes.

After migration:

- existing events continue to load.
- existing markets continue to load.
- existing outcomes continue to load.
- existing admin routes remain compatible.
- new UI can fall back to current `marketType`, `rules`, and `metadata` when new fields are null.

## Seed/Demo Data Guidance

If Phase C adds seed data, keep it internal/demo only:

- one basketball event.
- one soccer event.
- groups: main, spread, total, player props, period props.
- markets with `UPCOMING` or `LIVE` status only.
- no real provider claims.
- no funding changes.
- no live bot enablement.

## API Contract Guidance

Phase C or D should expose a stable event-detail read model:

```ts
type EventDetailMarketGroup = {
  key: string;
  title: string;
  displayOrder: number;
  markets: EventDetailMarket[];
};

type EventDetailMarket = {
  id: string;
  title: string;
  marketType: string;
  status: string;
  line: string | null;
  unit: string | null;
  period: string | null;
  participantName: string | null;
  propCategory: string | null;
  rulesText: string | null;
  outcomes: EventDetailOutcome[];
};

type EventDetailOutcome = {
  id: string;
  label: string;
  side: string | null;
  status: string;
  resolvedResult: string | null;
  bestBid: string | null;
  bestAsk: string | null;
  lastTradePrice: string | null;
  probability: string | null;
};
```

## Tests Required For Phase C

Required if schema changes are implemented:

- Prisma generate.
- Prisma validate.
- TypeScript.
- targeted model/read-model tests.
- existing `npm run test:ci`.
- migration review.

Recommended tests:

- existing market without new fields serializes safely.
- event with grouped markets sorts by group/display order.
- line/unit/period fields serialize without leaking internal metadata.
- resolved result fields are display-only and do not change settlement.

## Do Not Include In Phase C

Do not include:

- order placement changes.
- ledger changes.
- settlement changes.
- funding changes.
- withdrawal changes.
- live provider integration.
- live bot changes.
- public funding.
- automatic withdrawal broadcast.
- enum conversion of existing status fields.
- destructive migrations.

## Phase C Review Recommendation

Leave the Phase C PR open if it includes a Prisma migration. It should be reviewed as a schema change even though it is additive.
