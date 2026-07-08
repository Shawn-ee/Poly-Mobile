# Cycle LR Portfolio Selection Source Summary

Date: 2026-07-08

## Scope

Extend the Local MVP order lifecycle contract so Portfolio and Portfolio History expose whether the user's held/traded selections are provider-backed or Local MVP contract fixtures.

This cycle supports:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

Out of scope: order book UI, chat, live stats, social features, visual mobile changes, and schema migrations.

## Problem

Cycles LP/LQ made Home and Event Detail honest about market source readiness:

- Regulation Winner is `provider-backed`.
- Current line markets are `contract-fixture`.

After a user places an order, Portfolio/history also need to preserve and summarize that same source identity. Otherwise the end-to-end MVP flow can look provider-backed at entry but become ambiguous after the trade.

## Implementation

Added `selectionSourceSummary` to:

- `GET /api/portfolio`
- `GET /api/portfolio/history`

The summary includes section-level and combined source classification:

- `positions`
- `openOrders`
- `recentTrades`
- `canceledOrders`
- `combined`

For each section it records:

- total selection count
- source breakdown
- Polymarket selection count
- contract-fixture selection count
- Regulation Winner status
- line-market status
- line-market families
- source reason

## Acceptance Criteria

| Criterion ID | Priority | Result | Evidence |
| --- | --- | --- | --- |
| LR-PORT-P0-01 | P0 | Pass | `/api/portfolio` returns `selectionSourceSummary.positions`, `openOrders`, and `combined`. |
| LR-PORT-P0-02 | P0 | Pass | `/api/portfolio/history` returns `selectionSourceSummary.recentTrades`, `canceledOrders`, and `combined`. |
| LR-PORT-P0-03 | P0 | Pass | Contract-fixture spread BUY proof classifies Portfolio position lines as `contract-fixture`. |
| LR-PORT-P0-04 | P0 | Pass | Contract-fixture spread BUY proof classifies History recent-trade lines as `contract-fixture`. |
| LR-PORT-P0-05 | P0 | Pass | Existing provider-backed Portfolio tests classify provider line selections as `provider-backed`. |
| LR-PORT-P0-06 | P0 | Partial | Android proof not run because no ADB device is visible. |

## Evidence

- `src/server/services/portfolioSelectionSourceSummary.ts`
- `src/app/api/portfolio/route.ts`
- `src/app/api/portfolio/history/route.ts`
- `src/__tests__/portfolio.open-orders.route.test.ts`
- `src/__tests__/portfolio.history.route.test.ts`
- `docs/mobile/harness/cycle-LR-portfolio-selection-source-summary/cycle-LR-portfolio-selection-source-summary.json`

Validation:

- `npm run test:jest -- src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts src/__tests__/mobile-live-event-detail.test.ts`
- `npx tsx scripts/prove_mobile_mvp_match_line_order_lifecycle.ts --cycle=LR --eventSlug=switzerland-vs-colombia --summaryPath=docs/mobile/harness/cycle-LR-portfolio-selection-source-summary/cycle-LR-portfolio-selection-source-summary.json`

Typecheck note:

- `npx tsc --noEmit --pretty false --skipLibCheck` still fails on a pre-existing `src/server/services/eventReadModel.ts` string literal type issue, unrelated to this cycle.

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| S23 visible proof for Home -> Event Detail -> line ticket -> Portfolio/history | P0 | Open; no ADB device visible |
| Real provider-backed line markets | P1 | Open; selected Gamma event exposes none |
| Mobile UI consumption of Portfolio `selectionSourceSummary` | P1 | Open |
