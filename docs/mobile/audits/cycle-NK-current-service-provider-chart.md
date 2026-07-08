# Cycle NK - Current Service Inspection And Provider Chart

## Scope

Inspect the current Local MVP service state before continuing broad development, then close the most meaningful provider/data gap found for the visible Event Detail chart/probability path.

## Findings

- Current Home route returns active World Cup match rows including `argentina-vs-egypt`.
- Regulation Winner is provider-backed by Polymarket for the inspected match.
- Spread/Totals/Team Total rows are present, but all are `contract-fixture`; provider-backed line market count is 0.
- Before this cycle, live-detail chart history could be empty or visually ambiguous.
- Polymarket CLOB `/prices-history` successfully returns chart history for the current provider-backed Regulation Winner token ids.

## Acceptance Criteria

- P0: current match inspection must identify which market families are provider-backed and which are fixtures.
- P0: provider-backed Regulation Winner chart history must refresh from Polymarket CLOB and be visible through Holiwyn backend routes.
- P0: mobile Event Detail must preserve chart source/status in a device-auditable label.
- P0: S23 proof must show the Event Detail chart source and complete the provider winner ticket/order/history path.
- P1: line markets should become provider-backed when real attach-ready provider rows exist.
- P1: chart freshness should be handled by provider lifecycle refresh, not only proof scripts.

## Proof

- Backend proof: `docs/mobile/harness/cycle-NK-current-match-chart-history/current-match-polymarket-chart-history.json`
- S23 proof: `docs/mobile/harness/cycle-NK-current-match-chart-history-s23/cycle-NK-provider-winner-s23-visible-flow.json`
- S23 Event Detail XML includes `chart-source-polymarket-clob-prices-history` and `chart-status-stale`.

## Audit Result

Pass for provider-backed Regulation Winner chart/probability source clarity.

Partial for full game-page parity because line markets remain contract fixtures and provider chart freshness is stale for this inspected match.
