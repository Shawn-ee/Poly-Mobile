# Search Polymarket Audit

Status: Cycle AB P0 pass for focused Search/Explore discovery, filtering, sorting, and result navigation.

## Scope

- Search/Explore entry point.
- Default result page layout.
- Category/filter/sort controls.
- Search query and clear state remain supported in Holiwyn.
- Market/event row navigation.
- Empty state for unmatched queries.
- Reference limitation: Polymarket native Android app is location-gated on the S23, so the same-cycle reference used Polymarket mobile web on the S23.

## Reference Audit

Reference device: Samsung S23.

Polymarket app/browser: Polymarket Android app and Polymarket mobile web in Chrome.

Route or URL if available:

- Native package: `com.polymarket.android`
- Mobile web: `https://polymarket.com`
- Mobile web Search/Explore route: `https://polymarket.com/search` / redirected UI route `https://polymarket.com/predictions`

Screenshots/UI hierarchy:

- `docs/mobile/reference/screenshots/cycle-AB-polymarket-search-home.png`
- `docs/mobile/reference/screenshots/cycle-AB-polymarket-search-home.xml`
- `docs/mobile/reference/screenshots/cycle-AB-polymarket-web-home.png`
- `docs/mobile/reference/screenshots/cycle-AB-polymarket-web-home.xml`
- `docs/mobile/reference/screenshots/cycle-AB-polymarket-web-search-route.png`
- `docs/mobile/reference/screenshots/cycle-AB-polymarket-web-search-route.xml`
- `docs/mobile/reference/screenshots/cycle-AB-polymarket-web-search-secondtap.png`
- `docs/mobile/reference/screenshots/cycle-AB-polymarket-web-search-secondtap.xml`
- `docs/mobile/reference/screenshots/cycle-AB-polymarket-web-search-filter.png`
- `docs/mobile/reference/screenshots/cycle-AB-polymarket-web-search-filter.xml`

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open native app | Native app shows `Location Verification Failed` and cannot expose Search. | Native reference blocked; use mobile web on same S23 for this cycle. | `cycle-AB-polymarket-search-home.png` |
| Open mobile web Home | Home shows Polymarket header, Sign Up, top topic rail, large Search field, category chips, cards, bottom nav, and app/download/how-it-works overlays. | Web session remains signed out/view-only. | `cycle-AB-polymarket-web-home.png` |
| Open Search bottom tab/direct Search route | Search route shows Explore-style page: headline, horizontal category chips (`All`, `Sports`, `Politics`, `Crypto`, more offscreen), dense result rows, right-side probability/outcome, floating `Filter`, download banner, and bottom nav. | URL/UI route becomes `/predictions`; no text query is focused by default. | `cycle-AB-polymarket-web-search-route.png`; `cycle-AB-polymarket-web-search-secondtap.png` |
| Tap result row | Row opens market detail for the selected market. | Page transitions from Search/Explore to the selected prediction/game detail. | `cycle-AB-polymarket-web-search-filter.png` |
| Search query/clear | Polymarket mobile web did not expose a visible typed query field on the focused Search route in this gated view; Home still has a search input. | Treat typed query/clear as Holiwyn-specific P0 because Holiwyn World Cup-only discovery already depends on it. | `cycle-AB-polymarket-web-home.png` |
| Empty result | Not directly reachable in the visible Search route during this cycle. | Holiwyn empty query state remains required and harnessed from existing search proofs. | Existing Holiwyn query smoke |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| SE-P0-01 | P0 | Search bottom tab opens a dedicated Search/Explore surface with an Explore-style headline and horizontal category chips. | Tablet screenshot/XML | Pass |
| SE-P0-02 | P0 | Search results use dense rows with sport/category, title, volume/today/liquidity metadata, chat/end metadata, right-side probability/outcome, save control, and chevron. | Tablet screenshot/XML | Pass |
| SE-P0-03 | P0 | Search Filter control is visible as a floating pill and opens a real filter panel with status and sort controls. | Tablet smoke | Pass |
| SE-P0-04 | P0 | Sort/filter controls mutate result ordering/state without leaving Search. | Tablet smoke | Pass |
| SE-P0-05 | P0 | Tapping a result row opens the correct Holiwyn game page. | Tablet smoke | Pass |
| SE-P0-06 | P0 | Typed query and clear behavior remain functional, and unmatched query has an empty state. | Existing device smoke | Pass |
| SE-P1-01 | P1 | Polymarket signed-in/native Search should be recaptured when reference app is no longer location-gated. | Reference audit | Deferred |
| SE-P1-02 | P1 | Filter panel should eventually expose richer Polymarket-equivalent facets discovered from an unblocked reference session. | Screenshot/manual audit | Deferred |
| SE-P1-03 | P1 | Mobile phone portrait density should get an additional Holiwyn proof after dev-build/APK lane matures. | Device proof | Deferred |

## Holiwyn Proof

Holiwyn device: Samsung tablet.

Holiwyn app mode: Expo Go.

Commands:

- `npm run typecheck`
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -SearchSort -Port 8203`

Evidence:

- `docs/mobile/screenshots/cycle-current-holiwyn-search-filter-panel.png`
- `docs/mobile/harness/cycle-current-holiwyn-search-filter-panel.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-search-sort-live.png`
- `docs/mobile/harness/cycle-current-holiwyn-search-sort-live.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-search-open-result.png`
- `docs/mobile/harness/cycle-current-holiwyn-search-open-result.xml`

## Audit Gate

Result: Pass for focused Search/Explore P0 parity baseline.

Unresolved P0 gaps: 0 for focused Search/Explore scope.

Remaining P1/P2 gaps:

- Native Polymarket Search remains blocked by S23 location verification.
- Polymarket web's richer global categories are broader than Holiwyn's World Cup-only scope.
- Typed Search on Polymarket mobile web needs a later reference pass from an unblocked state; Holiwyn keeps typed World Cup search as a product requirement.

Recommended next cycle:

- Continue Account/settings/profile parity or return to chart/market-page depth depending on the Lead Agent priority order.
