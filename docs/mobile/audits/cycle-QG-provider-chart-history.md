# Cycle QG - Provider Chart History

Scope: provider-owned chart/probability history for the Local MVP Event Detail page.

## Reference And Criteria

Target user path:

- Home -> Event Detail -> provider-backed Regulation Winner chart/probability display -> provider-backed ticket/order/cashout regression.

P0 criteria:

- Current match has real Polymarket-backed Regulation Winner markets with token IDs.
- If CLOB `1d` history is empty, backend tries a wider Polymarket history range instead of leaving the chart empty.
- Event Detail live-detail route includes chart history for the primary provider-backed winner market.
- Standalone market chart route returns source/status/range metadata proving provider-backed history.
- Samsung S23 proof captures Event Detail with `chart-source-polymarket-clob-prices-history`.
- Existing provider-backed buy/cashout path still passes after chart changes.

P1 criteria:

- Real provider-backed Spread/Totals/Team Total line markets remain unavailable and should not be claimed as done.
- Chart status is currently `stale` because Polymarket's latest CLOB point for the current match is from `2026-07-07T18:30:09.000Z`; future provider refresh should make this `ready` when fresh history exists.

## Implementation

- `src/server/services/polymarketPriceHistorySnapshots.ts` now falls back from empty short CLOB windows to wider Polymarket windows such as `1w` and `max`.
- `src/app/api/mobile/events/[slug]/live-detail/route.ts` now loads a bounded chart-history slice per compact market instead of one global slice that could starve later markets.
- `src/app/api/markets/[id]/chart/route.ts` now falls back from empty `1D` to wider history and reports `requestedRange`, effective `range`, and `rangeFallbackApplied`.
- `scripts/prove_current_match_polymarket_chart_history.ts` was updated to prove the same per-market chart behavior and effective range metadata.
- `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1` now accepts `stale` provider chart status as valid route-backed evidence.

## Device And Route Proof

- Route proof: `docs/mobile/harness/cycle-QG-provider-chart-history/current-match-polymarket-chart-history.json`
- S23 proof: `docs/mobile/harness/cycle-QG-provider-chart-history/cycle-QG-provider-winner-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-QG-provider-chart-history/`
- XML: `docs/mobile/harness/cycle-QG-provider-chart-history/`

Result: pass for focused provider chart-history readiness and provider-backed winner buy/cashout regression.

## Audit Gate

- P0 failed: 0 for QG scope.
- Meaningful user-visible behavior closer to Polymarket: Event Detail chart is no longer an empty/static placeholder for the provider-backed winner market; it is backed by real Polymarket CLOB history points.
- Remaining P1: chart freshness and real provider-backed line markets.

