# Holiwyn UI Regression And Source-Change Report

Last updated: 2026-07-08

## Scope

This report covers the visible mobile UI state after the provider readiness and provider breadth proof work, with special attention to source labels that became too dominant in tester screens.

## What Changed Visually Since Yesterday

- Home event cards now show provider/source readiness for the MVP match.
  - Before cleanup: `Winner: Polymarket / Lines: local test fake-token`.
  - After cleanup: `Winner: Polymarket / test lines`.
- Event Detail shows a market source banner for mixed provider/fixture coverage.
  - Regulation winner is identified as Polymarket-backed.
  - spread, total, and team-total lines are still identified as test-line coverage.
- Line-market rows now use a compact `Test` pill plus `Test line - fake USDT`.
- Trade Ticket keeps the source note near the selected market.
  - Polymarket-backed winner tickets show `Polymarket market`.
  - fixture-backed line tickets show `Test line - fake USDT`.
- The source labels are slightly smaller/lighter on Home so they do not dominate the tester UI.

## What Was Intentionally Removed

- No new order book UI was added or exposed.
- No chat, live stats, social, watchlist, or non-MVP surfaces were added in this cleanup.
- No backend/schema/order logic changed in this cleanup.
- No source/proof markers were removed from accessibility labels or test hooks.

## What Was Hidden Because It Was Mock, Proof, Or Stale Data

- The old visible wording `local test fake-token` was softened because it read like debug copy in the tester UI.
- Internal source labels remain available in accessibility/proof strings:
  - `home-card-source-local-test-fake-token`
  - `line-source-local-test-fake-token`
  - `line-market-local-test-fake-token`
  - `ticket-source-badge-local`
  - `portfolio-source-badge-local`
- Fixture-backed line markets remain visibly disclosed as `Test` or `Test line - fake USDT`; they are not presented as Polymarket-backed.

## What Is Still Available In Another Runtime Mode

- Broader Polymarket provider breadth is available through backend routes and Search/provider runtime proof, but Home intentionally remains MVP-focused on the single match route.
- Order book routes/tests remain as internal infrastructure, but order book is hidden from default mobile MVP UI.
- Provider breadth proof imported/refreshed the World Cup winner event and confirmed multiple provider-backed backend surfaces; Home still filters to match events for the current retail MVP path.

## Real Regressions

- No new real regression was found in this cleanup cycle.
- Existing product gap remains: spread/total/team-total line markets are contract-shaped test fixtures, not real Polymarket-backed line markets for the selected MVP match.
- Existing provider breadth gap remains: multiple real provider-backed events are proven in backend/search surfaces, but not yet visible as multiple Home match cards because Home deliberately uses the local MVP match filter.
- Existing tester-flow gap remains: full end-to-end fake-token order proof was not rerun in this source-label cleanup cycle because backend/order behavior was intentionally untouched.

## S23 Proof

- Home cleaned source label:
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-home-reopened.png`
- Event Detail cleaned banner and line rows:
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-event-detail.png`
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-event-detail-line.png`
- Trade Ticket provider-backed winner:
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-ticket.png`
- Trade Ticket fixture-backed line:
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-line-ticket.png`

