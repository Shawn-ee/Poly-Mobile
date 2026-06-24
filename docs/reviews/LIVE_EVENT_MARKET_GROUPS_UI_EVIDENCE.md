# Live Event Market Groups UI Evidence

Date: 2026-06-24

## Summary

Phase D adds display-only grouped sports event market UI on the event detail page.

The page can now show sports markets under one event in ordered sections:

- Main
- Spread
- Total
- Player Props
- Team Props
- Period Props
- Specials
- Live

This phase does not implement real order placement, settlement, market resolution runtime, provider sync, funding, withdrawal, or bot behavior.

## Files Changed

- `src/app/events/[slug]/page.tsx`
- `src/app/api/events/[slug]/route.ts`
- `src/app/api/events/[slug]/markets/route.ts`
- `src/server/services/eventReadModel.ts`
- `src/server/services/marketReadModel.ts`
- `src/lib/liveSportsMarketGroups.ts`
- `src/__tests__/live-sports-market-groups-ui.test.ts`
- `docs/reviews/LIVE_EVENT_MARKET_GROUPS_UI_EVIDENCE.md`
- `docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md`

## UI Behavior

Event header now supports safe display of:

- sport and league
- home and away teams
- score when present
- event status and live status
- period and clock
- start time
- venue

Market sections now use the Phase C schema fields where available:

- `marketGroupKey`
- `marketGroupTitle`
- `displayOrder`
- `line`
- `unit`
- `period`
- `participantName`
- `propCategory`
- `outcome.side`
- `outcome.resolvedResult`

Fallback grouping remains available from existing `marketType` values, so older sports markets continue to render.

## Display-Only Trading Boundary

Outcome controls on the sports event detail page are preview-only.

The page:

- lets a user select an outcome visually
- shows outcome price/probability if available
- shows bid/ask if available
- links to the market detail page separately
- shows disabled/read-only trading messaging

The page does not:

- call `/api/orders`
- create orders
- mutate balances
- create ledger entries
- settle positions
- resolve markets

The legacy grouped-event sidebar was changed from an order-submitting ticket to a read-only outcome preview for this event-page flow.

## Data Shape Assumptions

Phase D assumes event market APIs can return:

- safe event live fields from `Event`
- safe grouped market display fields from `Market`
- safe outcome display fields from `Outcome`

Resolution evidence, settlement execution details, ledger fields, admin-only funding fields, private wallet data, and internal secrets are not exposed by this UI.

## Tests Added

Added:

```text
src/__tests__/live-sports-market-groups-ui.test.ts
```

Coverage:

- explicit market group keys override market-type fallbacks
- markets group into Main, Spread, Total, Player Props, Team Props, Period Props, Specials, and Live
- group ordering is stable
- line/unit/period/participant display metadata formats without internal resolution fields

## Validation Results

Passed locally:

- `git diff --check`
- `npx prisma generate --schema=prisma/schema.prisma`
- `npx prisma validate --schema=prisma/schema.prisma`
- `npx jest --runInBand src/__tests__/live-sports-market-groups-ui.test.ts src/__tests__/sports.event-market-model.test.ts`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`
- `npm run build`
- `git diff --cached --check`

## What Is Not Implemented

- real order placement from grouped event page
- full trade ticket v1
- order holds
- portfolio position updates from event page selection
- admin market creation/editing
- admin market resolution
- settlement
- void/push/refund workflow
- live provider integration
- bot activation

## Blockers

Live market beta remains blocked until later phases implement and prove:

- guarded internal trade ticket flow
- internal beta order placement gate
- ledger-backed holds
- portfolio/open order display
- admin market management
- admin resolution and settlement
- live/reference provider freshness workflow
- full end-to-end internal beta evidence

## Next Phase

Next recommended phase:

```text
Phase E: Market Detail Page and Trade Ticket v1
```

Phase E should remain display-first and disabled-state until a later reviewed trading gate explicitly enables internal beta order placement.
