# World Cup Event Market Structure Evidence

Date: 2026-06-25

## Summary

POLY now has a World Cup-style event market read model and event-detail display for match-level sports markets.

The implementation follows the product logic of match-first World Cup games:

- one event contains many related markets
- match markets are compacted into market bundles
- spread and total bundles support line selectors
- selecting a line changes the visible outcomes
- selecting an outcome updates the right-side ticket context
- the ticket recalculates estimated cost, shares, and payout from amount and price

This does not copy Polymarket branding, assets, copy, colors, icons, or exact styling.

## Routes Changed

- `/events/[slug]`

## Files Changed

- `src/lib/worldCupMarketStructure.ts`
- `src/lib/liveSportsMarketGroups.ts`
- `src/app/events/[slug]/page.tsx`
- `src/__tests__/world-cup-market-structure.test.ts`
- `src/__tests__/live-sports-market-groups-ui.test.ts`
- `scripts/import_worldcup_today_markets.ts`
- `docs/reviews/POLYMARKET_STYLE_WORLD_CUP_STRUCTURE_AUDIT.md`
- `docs/reviews/WORLD_CUP_EVENT_MARKET_STRUCTURE_EVIDENCE.md`

## Implemented Structure

The new helper builds:

```text
Event
  Section: Match / Qualify / 1st Half / Corners / Goals / Assists / Shots / Player Props / Team Props / Specials / Live
    Bundle: Match result / Spread / Total / Team total / Both teams to score / First team to score
      Line: 0.5 / 1.5 / 2.5 / 3.5 / 4.5 / 5.5
        Outcome selections
```

## Spread Behavior

Existing POLY spread data is stored as binary team-cover markets. The read model pairs spread markets by absolute line.

Example:

```text
Line: 1.5
Selections:
  ECU +1.5
  GER -1.5
```

This avoids a schema migration while providing the expected game-market interaction.

## Total Behavior

Total markets are grouped into one bundle.

Example:

```text
Line selector: 0.5 / 1.5 / 2.5 / 3.5 / 4.5 / 5.5
Selected line: 2.5
Selections:
  Over
  Under
```

## Trade Ticket Behavior

The event page ticket updates when the user selects:

- event
- market bundle
- line
- outcome
- buy/sell
- amount

It displays:

- selected event
- selected market bundle
- selected outcome
- selected line
- price
- bid/ask
- amount input
- estimated cost
- estimated shares
- potential payout
- disabled/gated trade button

The event page does not submit orders. It links to the market detail page for the existing guarded internal beta ticket.

## Demo Event

The internal World Cup import script includes:

- Ecuador vs Germany
- match winner
- draw no bet
- both teams to score
- first team to score
- clean sheet
- total goals lines `0.5` through `5.5`
- team total lines `0.5` through `5.5`
- spread lines `0.5` through `5.5`

Expected local demo URL after running the internal import script:

```text
/events/world-cup-2026-ecuador-vs-germany-2026-06-25
```

The script is not automatically run by this PR.

## Tests Added

- `src/__tests__/world-cup-market-structure.test.ts`

Coverage:

- grouped market rows are mapped into World Cup-style sections
- spread markets pair into one absolute-line selector
- total line selection changes selected line
- outcome selection can be resolved for ticket context
- ticket math recalculates amount, shares, payout, and profit
- event page source does not call `/api/orders`
- event-page ticket copy remains preview-only/gated

## Validation

Passed in this branch:

- `git diff --check`
- `npx jest --runInBand src/__tests__/world-cup-market-structure.test.ts src/__tests__/live-sports-market-groups-ui.test.ts`
- `npx tsc --noEmit --pretty false --incremental false`
- `npx prisma generate --schema=prisma/schema.prisma`
- `npx prisma validate --schema=prisma/schema.prisma`
- `npm run test:ci`
- `npm run build`

`git diff --cached --check` is run before commit.

## What Remains Missing

- real live sports provider integration
- real odds/price feed for these demo lines
- player prop expansion
- first-class schema tables for `MarketGroup` and `MarketLine`
- public trading readiness
- settlement and automatic resolution
- end-to-end smoke with imported demo markets in browser

## Safety Classification

Display/read-model/demo-script/docs/tests only.

No schema migration.
No runtime trading behavior change.
No ledger behavior change.
No funding behavior change.
No settlement behavior change.
No live bot behavior change.
