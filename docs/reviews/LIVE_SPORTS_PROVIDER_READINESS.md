# Live Sports Provider Readiness

Date: 2026-06-24

## Summary

POLY does not currently have a provider-approved live sports data integration.

Current sports market support is built from:

- local/admin-created `Event` records
- sports market templates
- grouped event/market schema
- admin market management
- public event/market read models
- reference snapshot tooling originally built around Polymarket-style reference markets

This is enough for controlled internal beta events and manual/operator-managed markets. It is not enough for automated live sports pricing, official scores, period clocks, injuries, player stat props, or settlement-grade event results.

No external API integration, scraping, key usage, runtime behavior, package change, bot behavior, funding behavior, settlement behavior, or deployment behavior was added in this phase.

## Current Runtime Capability

Implemented:

- Sports/event browsing through public sports and event routes.
- Event-linked grouped markets and props.
- Admin-created markets under sports events.
- Sports templates for common soccer-style markets.
- Manual/admin market creation as a provider fallback.
- Reference quote snapshot storage and stale-data classification.
- Dry-run quote planning for reference markets.
- Live bot controls remain disabled unless explicitly approved.

Not implemented:

- approved sportsbook/live sports provider ingestion
- official score/event-state sync
- official player-stat prop sync
- odds-provider normalization
- sports provider credential configuration
- settlement-grade result ingestion
- automatic sports market creation from a provider
- automatic market suspension based on live provider state
- authorized live odds feed watchdog

## Existing Relevant Code

Sports and event model:

- `prisma/schema.prisma`
- `src/server/services/sportsMarketTemplates.ts`
- `src/app/api/events/route.ts`
- `src/app/api/events/[slug]/route.ts`
- `src/app/api/events/[slug]/markets/route.ts`
- `src/app/api/sports/route.ts`
- `src/app/api/sports/soccer/events/route.ts`
- `src/app/api/sports/soccer/world-cup/events/route.ts`

Reference snapshot and quote planning:

- `src/server/services/referenceQuoteSnapshots.ts`
- `src/server/services/polymarketReferenceSnapshots.ts`
- `src/server/services/referenceBotReadiness.ts`
- `src/server/services/referenceLiquiditySeeding.ts`
- `scripts/refresh_reference_snapshots.ts`

Admin/reference operations:

- `src/app/api/admin/reference-markets/route.ts`
- `src/app/api/admin/reference-markets/[id]/route.ts`
- `src/app/api/admin/reference-markets/[id]/refresh-snapshot/route.ts`
- `src/app/api/admin/reference-markets/[id]/seed-bot/route.ts`
- `src/app/api/admin/reference-quote-snapshots/route.ts`

Existing scripts:

- `npm run reference:snapshot-refresh`
- `npm run reference:snapshot-watch`
- `npm run inspect:polymarket-sports-candidates`
- `npm run inspect:polymarket-reference-candidates`
- `npm run import:polymarket-reference-markets`
- `npm run polymarket:import-event`

These scripts should not be treated as an approved live sports provider integration.

## Provider Requirements

A real live sports provider should supply, under explicit license and terms:

- sport, league, season, and competition identifiers
- event schedule and event status
- home/away teams and participants
- start time, venue, period, clock, and score
- market availability and suspension state if using provider market state
- moneyline/spread/total/team/player/period prop reference prices if licensed
- player/team/stat identifiers for props
- official final scores and event results
- correction and stat-adjustment windows
- webhook or polling model
- provider rate limits
- audit trail for result changes

## Candidate Provider Categories

Approved commercial sports data provider:

- best fit for internal live market beta
- requires keys, contract terms, rate limits, and permitted product use
- should be the default path for live scores and settlement-grade results

Approved odds/reference provider:

- useful for reference prices and stale-price warnings
- must explicitly permit prediction-market/reference use
- should not be used as settlement source unless licensed for results

Manual admin feed:

- safe Stage 0/early internal fallback
- admin creates events, markets, outcomes, lines, and status changes
- resolution uses manual evidence and preview before final settlement
- slower but avoids unauthorized data usage

Polymarket-style reference sync:

- already partially present for reference markets
- not a sports data provider replacement
- should remain reference-only and review-gated
- should not be used to copy branding, UI, market text, or trade dress

Unauthorized scraping:

- not allowed
- do not use

## Required Configuration Names

Existing reference snapshot configuration:

- `REFERENCE_POLL_MS`
- `REFERENCE_STALE_MS`
- `QUOTE_OFFSET_TICKS`
- `TICK_SIZE`
- `MAX_REFERENCE_SPREAD`
- `SYSTEM_LIQUIDITY_DRY_RUN`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED`

Recommended future sports provider configuration names:

- `SPORTS_PROVIDER_NAME`
- `SPORTS_PROVIDER_BASE_URL`
- `SPORTS_PROVIDER_API_KEY`
- `SPORTS_PROVIDER_WEBHOOK_SECRET`
- `SPORTS_PROVIDER_POLL_MS`
- `SPORTS_PROVIDER_STALE_MS`
- `SPORTS_PROVIDER_ALLOWED_LEAGUES`
- `SPORTS_PROVIDER_ENABLE_LIVE_SYNC`
- `SPORTS_PROVIDER_ENABLE_RESULT_SYNC`
- `SPORTS_PROVIDER_DRY_RUN`

Do not configure or print provider secrets in docs or logs.

## Stale Data Policy

Provider-backed event/market data should expose clear stale state:

- fresh: data age within `SPORTS_PROVIDER_STALE_MS`
- stale: provider data exists but is older than allowed threshold
- missing: no provider snapshot exists
- suspended: provider says event/market is suspended
- manual: admin-managed with no live provider feed

Public UI should show stale/missing/suspended states without exposing provider credentials, raw payloads, stack traces, or internal admin notes.

## Stage Plan

Stage 0: Manual internal sports beta

- use admin-created events and grouped markets
- use manual status updates
- use settlement preview before final resolution
- keep public trading/funding disabled
- keep live bots disabled

Stage 1: Provider dry-run sync

- configure approved provider credentials on server
- ingest events/status/prices into internal snapshots only
- no automatic market creation
- no automatic settlement
- show stale/manual/provider status in admin

Stage 2: Admin-reviewed provider import

- admin previews provider event/market candidates
- admin approves event and market creation
- provider data can update display/status fields
- market suspension remains admin-reviewed or explicitly gated

Stage 3: Settlement evidence sync

- provider result snapshots can attach resolution evidence
- admin still performs final resolution
- settlement preview required before final resolve
- duplicate/correction windows documented

## What Must Remain Disabled

- unauthorized scraping
- unapproved provider polling
- live bots
- automatic market creation from provider
- automatic market resolution
- automatic settlement
- public trading
- public funding
- anonymous trading/funding
- provider-key logging

## Validation Needed After Provider Selection

- provider terms reviewed by owner
- keys configured only on server
- dry-run sync with no market/order/ledger mutation
- stale-data warning tested
- provider outage behavior tested
- admin import approval tested
- no raw provider secrets or payloads leak publicly
- no automatic settlement occurs from provider data

## Current Readiness

Manual/admin sports market beta: ready with warnings after the admin workflow and preview evidence are reviewed.

Live provider-backed sports beta: not ready.

Public live sports beta: not ready.

## Next Phase

Next recommended phase: Phase K Live Sports UX Polish.

Phase K should be display-only and must not add provider integration, order mutation, funding, settlement, or bot behavior.
