# Market Page Polymarket Audit

Status: Cycle AE P0 pass for focused market-page body switch, tabs, grouped cards, line rails, and row ticket behavior.

## Scope

- Body-level `Market` / `Live stats` switch.
- Chart/time range context around market tabs.
- Grouped markets.
- Market tabs: Game Lines, Exact Score, Halves.
- Nested market options.
- Line selectors.
- Liquidity/depth display.
- Ticket opening from rows and nested options.

## Reference Audit

Reference device: Samsung S23.

Polymarket app/browser: Polymarket mobile web in Chrome.

Route or URL if available: `https://polymarket.com/event/fifwc-usa-bel-2026-07-06-first-to-score`.

Reference screenshots/UI hierarchy:

- `docs/mobile/reference/screenshots/cycle-AE-polymarket-market-top.png`
- `docs/mobile/reference/screenshots/cycle-AE-polymarket-market-sections-1.png`
- `docs/mobile/reference/screenshots/cycle-AE-polymarket-market-game-lines.png`
- `docs/mobile/reference/screenshots/cycle-AE-polymarket-market-spreads.png`
- `docs/mobile/reference/screenshots/cycle-AE-polymarket-market-spread-line-25.png`
- `docs/mobile/reference/screenshots/cycle-AE-polymarket-market-exact-score.png`
- `docs/mobile/reference/screenshots/cycle-AE-polymarket-market-exact-score-rows.png`
- `docs/mobile/reference/screenshots/cycle-AE-polymarket-market-halves.png`
- `docs/mobile/reference/screenshots/cycle-AE-polymarket-market-row-ticket.png`
- Matching `.xml` hierarchy files for each screenshot.

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open World Cup event market page | Shows event header, save/link controls, match teams, event volume, `Market` / `Live stats` body switch, chart, chart ranges, and tabs. | Market page context is selected; no ticket open. | `cycle-AE-polymarket-market-top.png` |
| Scroll into market tabs | Shows `Game Lines`, `Exact Score`, and `Halves` tabs below the chart/range controls. | Scroll position changes; selected tab remains visible. | `cycle-AE-polymarket-market-sections-1.png` |
| Inspect Game Lines | Shows card-style groups such as `Team to Advance`, `Moneyline REG TIME`, `Spreads REG TIME`, and `Totals REG TIME`, each with volume and outcome buttons. | No route change; grouped market list remains on page. | `cycle-AE-polymarket-market-game-lines.png`; `cycle-AE-polymarket-market-spreads.png` |
| Change spread line | Tapping another line rail value updates the selected spread line and outcome labels/prices in place. | Selected line moves from `1.5` toward another rail value. | `cycle-AE-polymarket-market-spread-line-25.png` |
| Switch to Exact Score | Exact Score tab becomes active. | Market tab state changes to exact score. | `cycle-AE-polymarket-market-exact-score.png` |
| Inspect Exact Score rows | Shows repeated exact-score cards such as `United States 0 - 0 Belgium REG TIME`, each with volume, info icon, and YES/NO buttons. | Exact-score row identity is visible. | `cycle-AE-polymarket-market-exact-score-rows.png` |
| Switch to Halves | Halves tab becomes active and shows `1st Half` section. | Market tab state changes to halves. | `cycle-AE-polymarket-market-halves.png` |
| Open ticket from a row | Bottom sheet opens from the selected row and preserves market identity: `Halftime Result`, `United States 1H`, `Yes`, Buy side, quick chips, and Trade button. | Ticket state carries selected market/outcome. | `cycle-AE-polymarket-market-row-ticket.png` |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| MP-P0-01 | P0 | Market page exposes a body-level `Market` / `Live stats` switch near the chart/header area. | Tablet screenshot/XML | Pass |
| MP-P0-02 | P0 | Tapping `Live stats` changes state and shows meaningful match stats instead of a dead tab. | Tablet screenshot/XML | Pass |
| MP-P0-03 | P0 | Tapping back to `Market` restores chart and market tabs. | Tablet XML | Pass |
| MP-P0-04 | P0 | Game Lines, Exact Score, and Halves grouped market tabs remain reachable after the new body switch. | Tablet XML | Pass |
| MP-P0-05 | P0 | Existing line rails and row-ticket identity remain documented and auditable. | Existing tablet proof plus Cycle AE reference | Pass |
| MP-P1-01 | P1 | Live stats should be backend/live-data driven. | Future API/device proof | Deferred |
| MP-P1-02 | P1 | Player Props tab needs direct current-reference recapture or product-scope decision. | Future reference audit | Deferred |
| MP-P2-01 | P2 | Exact Polymarket sticky header, chart range layout, and visual density need polish. | Future visual audit | Deferred |

## Holiwyn Proof

Holiwyn device: Samsung tablet.

Holiwyn app mode: Expo Go.

Holiwyn evidence:

- `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-game-lines.png`
- `docs/mobile/harness/cycle-current-holiwyn-market-tabs-game-lines.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-live-stats.png`
- `docs/mobile/harness/cycle-current-holiwyn-market-tabs-live-stats.xml`
- `docs/mobile/harness/cycle-current-holiwyn-market-tabs-market-return.xml`
- Existing carried proof for tab/card behavior:
  - `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-exact-score.png`
  - `docs/mobile/harness/cycle-current-holiwyn-market-tabs-exact-score.xml`
  - `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-halves.png`
  - `docs/mobile/harness/cycle-current-holiwyn-market-tabs-halves.xml`

Verification:

- `npm run typecheck` passed.
- `smoke-tablet.ps1 -EventDetailMarketTabs -Port 8213` captured focused tablet evidence for body switch, live stats, and return-to-market before the wireless ADB tablet transport reset. The transport failure is not treated as a product P0 failure because the relevant screenshot/XML evidence exists, but it remains a harness reliability note.

## Audit Gate

Result: Pass for focused market-page P0 baseline in Cycle AE.

Unresolved P0 gaps: 0 for this focused scope.

Remaining P1/P2 gaps:

- P1: Live stats are local deterministic values, not backend/live-data driven.
- P1: Player Props needs a fresh direct reference or explicit product-scope classification.
- P2: Sticky header, visual density, and exact chart/tab layout still need polish.

Recommended next cycle: watchlist/saved/share/chat/notification parity or market-page visual-density polish, depending on Lead Agent priority.
