# Chart Behavior Polymarket Audit

Status: Cycle AD P0 pass for focused match/event chart behavior.

## Scope

- Probability movement.
- Selected outcome/chart state.
- Press/tap behavior and nearest-point tooltip equivalent.
- Chart filters visible on the game page.
- Empty/loading behavior documentation.

## Reference Audit

Reference device: Samsung S23.

Polymarket app/browser: Polymarket mobile web in Chrome. Native app remained location-gated for broader surfaces, so the same-cycle chart reference used mobile web.

Route or URL if available: `https://polymarket.com`.

Reference screenshots/UI hierarchy:

- `docs/mobile/reference/screenshots/cycle-AD-polymarket-chart-default.png`
- `docs/mobile/reference/screenshots/cycle-AD-polymarket-chart-default.xml`
- `docs/mobile/reference/screenshots/cycle-AD-polymarket-chart-press.png`
- `docs/mobile/reference/screenshots/cycle-AD-polymarket-chart-press.xml`

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| View default chart | Mobile web showed an event chart with live price context, target/reference line, y-axis labels, and outcome action buttons. | Visible prices moved between captures, proving the chart surface is not static. | `cycle-AD-polymarket-chart-default.png` |
| Press/swipe chart line | No visible tooltip/crosshair was captured in this mobile web state, but the chart remained interactive enough to accept touch and continue live updates. | No route change; chart values continued updating. | `cycle-AD-polymarket-chart-press.png` |
| Switch selected outcome | Outcome buttons were visible beside the chart surface; the chart context is tied to the active market/outcome. | Selected outcome affects displayed price/probability context. | `cycle-AD-polymarket-chart-default.xml` |
| Change time range if present | No explicit time range chips were visible in this focused web chart capture. | Not applicable for P0 in this focused cycle. | Same reference evidence |
| Load empty/no-data chart if discoverable | Not discoverable in same-cycle reference. | Holiwyn must not show misleading static data if no series exists; backend contract gap is tracked. | N/A |

Reference notes:

- The captured Polymarket chart was a mobile web trading chart, not a World Cup-only native soccer chart, because the available reference state was location-gated.
- This audit therefore sets a focused P0 baseline: Holiwyn chart must be visibly live/variable, must expose selected chart state, and must have a press/tap response instead of a static placeholder.
- Backend-backed historical series, exact native visual geometry, and richer time ranges remain P1/P2 until a direct unblocked World Cup chart reference is available.

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| CH-P0-01 | P0 | Chart is not a static placeholder and exposes current probability/value context. | Tablet screenshot/XML | Pass |
| CH-P0-02 | P0 | Selected chart state is visible and tied to the selected event/outcome context. | Tablet XML and accessibility labels | Pass |
| CH-P0-03 | P0 | Pressing the chart changes the selected chart point and updates a tooltip/nearest-point equivalent. | Tablet smoke tap proof | Pass |
| CH-P0-04 | P0 | Chart retains event context and visible filters after interaction. | Tablet smoke screenshot/XML | Pass |
| CH-P0-05 | P0 | Empty/loading limitations and backend route needs are documented instead of pretending local data is server history. | Backend/data contract docs | Pass |
| CH-P1-01 | P1 | Replace deterministic local series with backend market/outcome history. | Future API/device proof | Deferred |
| CH-P1-02 | P1 | Recapture a direct Polymarket World Cup soccer chart once reference access is unblocked. | Future reference audit | Deferred |
| CH-P2-01 | P2 | Match Polymarket chart animation, touch geometry, and micro-interaction polish more closely. | Future visual audit | Deferred |

## Holiwyn Proof

Holiwyn device: Samsung tablet.

Holiwyn app mode: Expo Go.

Holiwyn evidence:

- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-chart-pressed.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-chart-pressed.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-chart-live.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-chart-live.xml`

Verification:

- `npm run typecheck`
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -EventDetailChart -Port 8211`

## Audit Gate

Result: Pass for focused chart behavior P0 baseline.

Unresolved P0 gaps: 0 for this focused chart scope.

Remaining P1/P2 gaps:

- P1: backend market/outcome history route is still missing.
- P1: direct native/World Cup-specific Polymarket soccer chart needs recapture when reference access allows it.
- P2: exact touch geometry, animation, and visual polish are not yet Polymarket-level.

Recommended next cycle: deeper market-page behavior or backend-ready market-history contract work, depending on Lead Agent priority.
