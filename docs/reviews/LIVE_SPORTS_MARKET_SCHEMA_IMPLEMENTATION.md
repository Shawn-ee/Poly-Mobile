# Live Sports Market Schema Implementation

Date: 2026-06-24

## Summary

Phase C adds narrow, additive Prisma schema support for grouped live sports event markets and props.

This phase does not implement UI changes, order placement, matching, ledger holds, settlement, provider sync, funding, withdrawal, or bot behavior.

## Migration

Migration file:

```text
prisma/migrations/20260624112446_live_sports_market_schema/migration.sql
```

The migration is additive:

- Adds nullable columns to `Event`.
- Adds nullable columns plus one defaulted display-order column to `Market`.
- Adds nullable columns to `Outcome`.
- Adds indexes for grouped event market reads and outcome side/result lookups.
- Does not drop tables.
- Does not drop columns.
- Does not rename columns.
- Does not change funding, wallet, withdrawal, ledger, order, bot, or auth tables.

Local Docker Postgres was started with `docker compose up -d db`, and `poly_postgres` reached a healthy state. `npx prisma migrate dev --name live_sports_market_schema --schema=prisma/schema.prisma` applied this migration locally, then exited nonzero because `migrate dev` is interactive and this shell is non-interactive. Follow-up validation with `npx prisma migrate status --schema=prisma/schema.prisma` reported the database schema is up to date, and `npx prisma migrate deploy --schema=prisma/schema.prisma` reported no pending migrations.

The PR must remain open for reviewer and database migration review before merge.

## Event Fields Added

`Event` now supports live game metadata:

- `liveStatus`
- `period`
- `clock`
- `homeScore`
- `awayScore`
- `venue`
- `sourceUpdatedAt`

Indexes added:

- `@@index([sportKey, leagueKey, liveStatus])`
- `@@index([startTime])`

These fields support future event detail pages with scheduled/live/suspended/final states, scores, clocks, and provider freshness indicators.

## Market Fields Added

`Market` now supports grouped sports markets and props:

- `marketGroupKey`
- `marketGroupTitle`
- `displayOrder`
- `line`
- `unit`
- `period`
- `participantType`
- `participantName`
- `participantId`
- `propCategory`
- `rulesText`
- `resolutionEvidenceText`
- `resolutionEvidenceUrl`
- `voidReason`
- `settlementStatus`
- `sourceUpdatedAt`

Indexes added:

- `@@index([eventId, marketGroupKey, displayOrder])`
- `@@index([eventId, status, displayOrder])`
- `@@index([marketType, propCategory])`

These fields support moneyline, spread, total, team prop, player prop, period prop, special, and live market grouping under one event.

## Outcome Fields Added

`Outcome` now supports side semantics and future resolution result metadata:

- `side`
- `resolvedResult`

Indexes added:

- `@@index([marketId, side])`
- `@@index([marketId, resolvedResult])`

This supports YES/NO, OVER/UNDER, team side, player prop side, and named multi-outcome choices without forcing a new enum migration.

## Example Event Shape

One event can now represent:

- `Lakers vs Warriors`
- Main market: `Game Winner`
- Spread market: `Lakers -5.5`
- Total market: `Total Points 221.5`
- Player prop market: `LeBron James Points 26.5`

Each market can store group key, display order, line, unit, period, participant type/name, and ordered outcomes.

## Backward Compatibility

Existing event, market, and outcome rows remain valid because new fields are nullable except `Market.displayOrder`, which has a default of `0`.

Existing `MarketStatus`, `MarketType`, orderbook, ledger, funding, deposit, withdrawal, and bot models were not changed.

No runtime behavior changed. Existing public routes continue to use their existing serializers.

## Validation Results

Passed:

- `npx prisma validate --schema=prisma/schema.prisma`
- `npx prisma generate --schema=prisma/schema.prisma`
- `npx prisma migrate status --schema=prisma/schema.prisma`
- `npx prisma migrate deploy --schema=prisma/schema.prisma`
- `npx jest --runInBand src/__tests__/live-sports-market-schema.test.ts`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`

Partially non-interactive:

- `npx prisma migrate dev --name live_sports_market_schema --schema=prisma/schema.prisma`

Result:

- Applied `20260624112446_live_sports_market_schema` to local Docker Postgres.
- Exited nonzero afterward because Prisma `migrate dev` is interactive and this shell is non-interactive.
- Follow-up `migrate status` and `migrate deploy` confirmed no pending migrations.

Not run:

- `npm run build`, because this phase did not change Next.js routes or UI.

## Targeted Tests Added

Added:

```text
src/__tests__/live-sports-market-schema.test.ts
```

Coverage:

- Event live metadata fields and indexes.
- Market grouping, prop, line, unit, period, participant, and index fields.
- Outcome side and future resolved-result fields.
- Representative fixture for one event with moneyline, spread, total, and player prop markets.

## Risk Assessment

Risk level: review-required schema migration.

Primary risks:

- The migration must be reviewed against the target database before merge.
- Local migration application was not exercised because the local DB was offline.
- Prisma formatting changed alignment in `schema.prisma`, so reviewers should inspect the migration SQL as the source of truth for database impact.

No funding, withdrawal, ledger, trading, settlement, auth, bot, workflow, or deployment behavior changed.

## Enables Next

After this PR is reviewed, merged, and the migration is applied safely, the next recommended phase is:

```text
Phase D: Event Detail Page with Market Groups
```

Phase D should build display-only grouped market UI using these fields. It should not implement real order placement, settlement, or live provider sync.
