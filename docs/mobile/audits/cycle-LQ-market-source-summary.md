# Cycle LQ Market Source Summary Contract

Date: 2026-07-08

## Scope

Add a backend route contract that tells Holiwyn mobile whether visible match markets are real Polymarket-backed markets or Local MVP contract fixtures.

This cycle follows the Local MVP retail path:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

Out of scope: order book UI, chat, live stats, social features, schema migrations, and visual mobile changes.

## Problem

Cycle LP proved that the selected Polymarket event exposes real Regulation Winner markets but no Spread, Totals, or Team Totals through Gamma. The existing route exposed `referenceSource` per market, but the mobile app and future audits had to infer route readiness by scanning every row.

## Implementation

Added `marketSourceSummary` to:

- `GET /api/mobile/events/:slug/live-detail`
- `GET /api/events?includeMobileMarkets=1`

The summary includes:

- total market count
- source breakdown
- Polymarket market count
- contract-fixture market count
- Regulation Winner status
- line-market status
- line-market families
- a backend reason when line markets are fixture-backed

For `switzerland-vs-colombia`, both routes now report:

| Surface | Regulation Winner | Line Markets |
| --- | --- | --- |
| Home event list | `provider-backed` | `contract-fixture` |
| Event Detail | `provider-backed` | `contract-fixture` |

## Acceptance Criteria

| Criterion ID | Priority | Result | Evidence |
| --- | --- | --- | --- |
| LQ-SOURCE-P0-01 | P0 | Pass | Event Detail route exposes `event.marketSourceSummary`. |
| LQ-SOURCE-P0-02 | P0 | Pass | Home route exposes `marketSourceSummary` for included mobile events. |
| LQ-SOURCE-P0-03 | P0 | Pass | Summary classifies Regulation Winner as `provider-backed` for current Polymarket rows. |
| LQ-SOURCE-P0-04 | P0 | Pass | Summary classifies Spread/Totals/Team Totals as `contract-fixture` when provider line markets are absent. |
| LQ-SOURCE-P0-05 | P0 | Pass | Unit test covers provider-backed winner plus fixture line classification. |
| LQ-SOURCE-P0-06 | P0 | Partial | Android proof not run because no ADB device is visible. |

## Evidence

- `src/server/services/mobileLiveEventDetail.ts`
- `src/app/api/events/route.ts`
- `src/__tests__/mobile-live-event-detail.test.ts`
- `docs/mobile/harness/cycle-LQ-market-source-summary/cycle-LQ-market-source-summary.json`

Validation:

- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts`
- `npx tsx scripts/prove_mobile_provider_match_line_availability.ts --cycle=LQ --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LQ-market-source-summary/cycle-LQ-market-source-summary.json`
- HTTP check:
  - Event Detail summary: `provider-backed` winner, `contract-fixture` lines
  - Home first event summary: `provider-backed` winner, `contract-fixture` lines

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| S23 visible proof for Home -> Event Detail -> line ticket -> Portfolio/history | P0 | Open; no ADB device visible |
| Real provider-backed line markets | P1 | Open; selected Gamma event exposes none |
| Mobile UI consumption of `marketSourceSummary` for messaging/debug/audit surfaces | P1 | Open |
