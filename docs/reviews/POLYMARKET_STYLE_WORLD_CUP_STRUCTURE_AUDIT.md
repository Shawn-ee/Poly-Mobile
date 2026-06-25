# Polymarket-Style World Cup Structure Audit

Date: 2026-06-25

## Executive Summary

The reference World Cup games page uses a match-first sports structure:

- each match is the primary unit
- moneyline, spread, and total are visible directly in the match row
- spread and total expose line selectors
- choosing a line changes the visible outcome buttons and prices
- selecting an outcome feeds a trade ticket context

POLY already had event-linked sports markets, grouped sections, structured line fields, outcomes, and a disabled/gated trade ticket path. The missing product layer was a reusable event-market read model that treats related markets as one market family with selectable lines instead of rendering one large card per binary contract.

This task implements that read-model and event-page UI structure without copying Polymarket branding, visual identity, logos, assets, colors, copy, or live odds data.

Reference reviewed:

- `https://polymarket.com/zh/sports/world-cup/games`

## Reference Product Structure Observed

The page organizes games by date. Each game row shows:

- match title
- start time
- team names and records
- market columns for winner, spread, and total
- moneyline outcomes directly visible
- spread outcomes for the selected handicap line
- total outcomes for the selected total-goals line
- line selectors such as `0.5`, `1.5`, `2.5`, `3.5`, `4.5`, `5.5`

The key product behavior is not the visual styling. It is the information architecture:

- the match is the container
- related binary contracts are collapsed into one market family
- line-based markets are selected by line first
- the visible outcome buttons update after line selection
- trade context follows event, market family, line, outcome, side, and amount

## Current POLY Support Before This Change

Implemented:

- `Event` model with sport, league, home/away team, status, score, venue, and source metadata.
- `Market` model with `eventId`, `marketGroupKey`, `marketGroupTitle`, `marketType`, `line`, `unit`, `period`, `participantName`, `participantType`, `propCategory`, and status fields.
- `Outcome` model with side, code, label, display order, status, prices, and resolved result fields.
- Event detail page that can show grouped sports markets.
- Market detail trade ticket with internal trading beta gate.
- Admin market management for grouped sports market metadata.

Missing or weak:

- no dedicated World Cup/game market read model
- spread markets were still separate binary contracts instead of one line selector with two team outcome buttons
- totals were separate cards instead of one total selector
- game props such as both-teams-to-score were mixed into generic groups
- event-page ticket was a preview panel, not a structured trade context panel
- demo fixture line ranges did not cover the expected `0.5` through `5.5` structure

## Model Gap

No schema migration is required for this phase. Existing fields can support the product model:

- `Market.marketType` identifies moneyline, spread, total, team totals, and props.
- `Market.line` identifies a selectable line.
- `Market.participantName` identifies team-side markets.
- `Outcome.side`, `Outcome.code`, and `Outcome.label` identify visible choices.

The gap is a read-model layer:

```text
Event
  MarketSection
    MarketBundle
      MarketLine
        OutcomeSelection
```

This maps existing rows into product concepts without changing persistence.

## UI Gap

The old event detail UI could show grouped market sections, but it still felt card-heavy. The desired UX needs:

- compact sections
- fewer cards
- line selectors
- outcome buttons inside selected lines
- right-side sticky ticket that updates immediately
- mobile-friendly stacking

## Trade-Ticket Gap

The event page did not previously track:

- selected line
- selected outcome
- buy/sell side
- amount
- estimated cost
- estimated shares
- potential payout

This task adds those calculations for display. Real submission remains outside the event page and remains gated by the existing internal trading beta controls.

## Implementation Plan

Completed in this task:

1. Add a reusable World Cup event-market structure helper.
2. Map moneyline, spread, total, both-teams-to-score, first-team-to-score, team totals, player props, team props, specials, and live markets into product sections.
3. Pair spread binary markets by absolute line without a schema migration.
4. Add line selectors for spread, total, and team total bundles.
5. Add right-side event trade ticket display with amount/cost/payout estimates.
6. Extend the internal World Cup demo import script with broader line ranges and first-team-to-score.
7. Add targeted tests for structure, line selection, ticket math, and no direct event-page order submission.

Not implemented:

- live provider integration
- real external odds
- public trading
- settlement
- automatic resolution
- player prop expansion
- schema normalization into first-class `MarketGroup` / `MarketLine` tables

## Safety Notes

- No funding behavior changed.
- No wallet/private-key behavior changed.
- No ledger behavior changed.
- No settlement behavior changed.
- No event-page order API call was added.
- Event-page ticket remains preview/display only.
- Existing market-detail internal trading gates remain the only intended guarded path.
