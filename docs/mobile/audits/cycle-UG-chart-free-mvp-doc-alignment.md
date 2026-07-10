# Cycle UG - Chart-Free MVP Doc Alignment

Status: source/contract cleanup pass; no visible UI change.

## Scope

Keep the current Local MVP Event Detail market page aligned with product steering: the default mobile page should focus on outcome probabilities, Game Lines, line selection, Trade Ticket, fake-token orders, and Portfolio/history. The Polymarket-style market-page chart is intentionally removed from the tester-facing Event Detail UI because it is too complex for the current MVP.

Out of scope: order book UI, chat, live stats, social/watchlist, backend schema changes, order route changes, and new chart route work.

## Current Evidence

| Item | Result | Evidence |
| --- | --- | --- |
| Event Detail source does not render the chart | Pass | `mobile/src/__tests__/eventDetailChartInteractionContract.test.ts`; `mobile/src/__tests__/eventDetailChartStatusCopy.test.ts` |
| S23 proof harness rejects chart markers | Pass by source contract | `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` rejects `event-detail-price-chart`, `event-detail-chart-route-state`, and `Chart selection` |
| Current feature criteria no longer require chart proof | Pass after UG | `docs/mobile/POLYMARKET_FEATURE_CRITERIA.md` now requires probability/outcome display and explicit chart absence |
| Backend chart routes remain internal/future | Pass | No route/schema changes. Existing chart-history routes are not Local MVP UI dependencies. |

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UG-P0-01 | P0 | Current criteria must not require `event-detail-price-chart` for FD/FE Local MVP Event Detail proof. | Pass |
| UG-P0-02 | P0 | Current criteria must require visible Game Lines and probability/outcome display instead of a chart. | Pass |
| UG-P0-03 | P0 | Route/server proof wording must describe chart as hidden/absent, not preserved. | Pass |
| UG-P0-04 | P0 | No backend, order, Portfolio, order book, chat, or live-stat logic may change. | Pass |

## Audit Gate

This is not a new Android-visible UI cycle. The app behavior was already chart-free before UG; this cycle prevents documentation and future agents from reintroducing the removed chart as a P0 target.

Android proof remains inherited from the prior chart-removal S23 cycles and should be rerun when a device is attached for any future Event Detail visual cycle.

