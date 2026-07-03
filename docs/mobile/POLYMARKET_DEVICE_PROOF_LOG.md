# Polymarket Device Proof Log

Purpose: record the physical-device evidence used by the new Polymarket parity workflow.

## Device Roles

Reference device:

- Samsung S23 or another Android device running Polymarket.
- Used for same-cycle reference audits.

Holiwyn device:

- Android device running Holiwyn through Expo Go, development build, or APK.
- Used for cycle acceptance and Audit Gate proof.

Emulator:

- Fallback only.
- Supplemental evidence must be labeled as emulator fallback and cannot replace real-device parity proof when a Holiwyn Android device is available.

## Proof Log

| Date | Cycle | Feature | Reference device/app | Holiwyn device/app | Evidence paths | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-07-03 | Cycle S | Workflow update | User-provided Polymarket audit rule | Documentation-only | `docs/mobile/MOBILE_APP_AUTONOMOUS_DEVELOPMENT_LOOP.md`; `docs/mobile/MOBILE_HARNESS_SPEC.md` | Pass | Added mandatory audit workflow. No app UI proof required because this cycle changed documentation only. |
| 2026-07-03 | Cycle T | Whole-app navigation and page map | Samsung S23 / Polymarket Android app | Samsung tablet / Holiwyn Expo Go | Reference: `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-*`; Holiwyn: `docs/mobile/screenshots/cycle-current-holiwyn-whole-app-nav-*`, `docs/mobile/harness/cycle-current-holiwyn-whole-app-nav-*` | Pass | `npm run typecheck` and `npm run smoke:tablet:whole-app-nav-discovery` passed. Holiwyn bottom nav now matches Polymarket's four primary tabs and Account opens from header. |
| 2026-07-03 | Cycle U | Event page top shell/action controls | Samsung S23 / Polymarket Android app | Samsung tablet / Holiwyn Expo Go | Reference: `docs/mobile/reference/screenshots/cycle-U-polymarket-event-*`; Holiwyn: `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-top-order-book.png`, `docs/mobile/harness/cycle-current-holiwyn-event-detail-top-order-book.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-share-sheet.png`, `docs/mobile/harness/cycle-current-holiwyn-event-detail-share-sheet.xml` | Pass | `npm run typecheck` and `npm run smoke:tablet:event-detail-actions` passed. The World Cup-specific reference retry was blocked by Polymarket location verification and remains P1 recapture work. |
| 2026-07-03 | Cycle V | Futures market rows | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Reference: `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-*`; Holiwyn: `docs/mobile/screenshots/cycle-current-holiwyn-future-card-stats.png`, `docs/mobile/harness/cycle-current-holiwyn-future-card-stats.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-future-list-ticket.png`, `docs/mobile/harness/cycle-current-holiwyn-future-list-ticket.xml` | Pass | `npm run typecheck`, direct tablet `FutureCardStats`, and direct tablet `FutureListTrade` passed. |
| 2026-07-03 | Cycle W | Futures chart range | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Reference: `docs/mobile/reference/screenshots/cycle-W-polymarket-world-cup-winner-chart-*`; Holiwyn: `docs/mobile/screenshots/cycle-current-holiwyn-future-chart-1w.png`, `docs/mobile/harness/cycle-current-holiwyn-future-chart-ready.xml`, `docs/mobile/harness/cycle-current-holiwyn-future-chart-1d.xml`, `docs/mobile/harness/cycle-current-holiwyn-future-chart-1w.xml` | Pass | `npm run typecheck` and `npm run smoke:tablet:FutureChartRange` equivalent passed via `smoke-tablet.ps1 -FutureChartRange`. |
| 2026-07-03 | Cycle X | Match market tabs/cards | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Reference: `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-*`; Holiwyn: `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-game-lines.png`, `docs/mobile/harness/cycle-current-holiwyn-market-tabs-game-lines.xml`, `docs/mobile/harness/cycle-current-holiwyn-market-tabs-graph.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-exact-score.png`, `docs/mobile/harness/cycle-current-holiwyn-market-tabs-exact-score.xml`, `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-halves.png`, `docs/mobile/harness/cycle-current-holiwyn-market-tabs-halves.xml` | Pass | `npm run typecheck` and `smoke-tablet.ps1 -EventDetailMarketTabs -Port 8195` passed. |
| 2026-07-03 | Cycle Y | Line adjustment | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Reference: `docs/mobile/reference/screenshots/cycle-Y-polymarket-*`; Holiwyn: `docs/mobile/screenshots/cycle-current-holiwyn-line-adjustment-*`, `docs/mobile/harness/cycle-current-holiwyn-line-adjustment-*` | Pass | `smoke-tablet.ps1 -EventDetailLineAdjustment -Port 8196` passed. |

## Proof Entry Template

```md
### <date> - <cycle> - <feature>

Reference device:
Reference app/browser:
Reference route/URL:
Reference actions:
Reference evidence:

Holiwyn device:
Holiwyn app mode:
Holiwyn actions:
Holiwyn evidence:

Smoke/tests:
Result:
Remaining gaps:
```
