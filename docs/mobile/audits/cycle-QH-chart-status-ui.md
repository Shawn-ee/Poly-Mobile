# Cycle QH - Chart Status UI

Scope: visible Event Detail chart status copy for the Local MVP provider-backed winner page.

## Reference And Criteria

P0 criteria:

- Event Detail must not show debug-like `chart route state` copy to testers.
- Event Detail must show a compact human-readable chart status line when provider chart data is present.
- The same element must preserve machine-readable Audit Gate markers for source, status, range, and last updated timestamp.
- Samsung S23 proof must show the visible status text and continue through provider-backed buy/cashout regression.

P1 criteria:

- Chart freshness remains stale until Polymarket exposes fresher CLOB history for this match.
- Future UI can expose requested/effective fallback range if testers need it.

## Implementation

- Replaced hidden/debug chart copy in `mobile/src/components/EventDetail.tsx` with a visible compact label such as `Polymarket chart - Stale - Jul 7`.
- Kept accessibility/test markers: `chart-provider-status-visible`, `chart-source-polymarket-clob-prices-history`, `chart-status-stale`, `chart-range-*`, and `chart-last-updated-*`.
- No backend, order, schema, orderbook UI, chat, live stats, social, deposit, or withdrawal code changed.

## Device Proof

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Proof summary: `docs/mobile/harness/cycle-QH-chart-status-ui/cycle-QH-provider-winner-s23-visible-flow.json`
- Event Detail XML: `docs/mobile/harness/cycle-QH-chart-status-ui/cycle-QH-current-mvp-detail-top.xml`
- Screenshot: `docs/mobile/screenshots/cycle-QH-chart-status-ui/cycle-QH-current-mvp-detail-top.png`

Result: pass for focused chart status UI clarity and provider-backed buy/cashout regression.

## Audit Gate

- P0 failed: 0 for focused QH scope.
- Meaningful user-visible behavior closer to Polymarket: the chart area now communicates the provider-backed chart state without tester-facing debug text.
- Remaining P1: chart freshness and real provider-backed line markets.

