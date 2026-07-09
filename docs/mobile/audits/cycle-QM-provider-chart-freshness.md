# Cycle QM - Provider Chart Freshness Copy

## Scope

Focused Local MVP chart/probability display cleanup for the current provider-backed match page.

This cycle does not change backend routes, provider refresh logic, order logic, orderbook UI, chat, live stats, social features, deposits, or withdrawals.

## Reference Finding

Polymarket presents chart/probability history as useful event context even when the market is not currently receiving fresh live movement. Holiwyn had real Polymarket CLOB history for `argentina-vs-egypt`, but the visible Event Detail chart label still said `Stale`, which read like broken data to testers.

The backend route state is still correct: the current event history ends at `2026-07-07T18:30:09.000Z`, so the machine-readable status remains `stale`.

## Acceptance Criteria

P0:

- Event Detail must show provider-backed chart history with visible tester copy that does not look broken.
- Internal audit markers must still preserve the route truth: `chart-status-stale` and `chart-source-polymarket-clob-prices-history`.
- Samsung S23 proof must show the visible chart copy and internal markers in the same run.
- No orderbook, chat, live stats, social, deposit, withdrawal, backend schema, or order route work may be touched.

P1:

- A future live/current provider event should show genuinely fresh `Live` or `Refresh due` status from the backend route.
- Provider-backed Spread/Totals/Team Total line markets remain unavailable for the current match.

P2:

- Continue reducing debug-like source labels in final tester UI while keeping hidden/internal proof markers.

## Implementation

- `mobile/src/components/EventDetail.tsx` now maps `stale` + `polymarket-clob-prices-history` to visible `History`.
- The same component still renders hidden/internal markers for `chart-status-stale`, `chart-source-polymarket-clob-prices-history`, and `chart-provider-status-visible`.
- `mobile/src/__tests__/eventDetailChartStatusCopy.test.ts` guards the copy/marker contract.

## Evidence

- Provider proof before UI copy: `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-match-polymarket-chart-history.json`
- Provider proof after UI copy: `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-match-polymarket-chart-history-after-copy.json`
- S23 proof summary: `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-mvp-s23-visible-flow.json`
- S23 Event Detail screenshot: `docs/mobile/screenshots/cycle-QM-provider-chart-freshness/cycle-QM-current-mvp-detail-stale-top.png`
- S23 Event Detail XML: `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-mvp-detail-stale-top.xml`

## Audit Gate

Pass for the focused QM scope.

The S23 Event Detail XML contains:

- `Polymarket chart - History`
- `chart-status-stale`
- `chart-source-polymarket-clob-prices-history`
- `chart-provider-status-visible`

Remaining gaps are P1, not closed by this cycle:

- Real-time/fresh live chart status for an active provider event.
- Real provider-backed line markets for Spread/Totals/Team Total.
