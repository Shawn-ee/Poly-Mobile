# Navigation Polymarket Audit

Status: Cycle T P0 pass under the mandatory Polymarket audit gate.

## Scope

- Bottom tabs.
- Back behavior.
- Tab persistence.
- Scroll position.
- Deep links if applicable.
- App resume and route restoration if relevant.
- Search/result/event/ticket navigation.

## Reference Audit

Reference device:

Samsung S23, `SM_S911U1`, package `com.polymarket.android`.

Polymarket app/browser:

Real Polymarket Android app.

Route or URL if available:

Native app route not exposed through ADB hierarchy.

Screenshots/UI hierarchy:

- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-home.png`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-home.xml`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-live.png`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-live.xml`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-portfolio.png`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-portfolio.xml`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-search.png`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-search.xml`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-home-return.png`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-home-return.xml`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-world-cup-rail.png`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-world-cup-rail.xml`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-futures.png`
- `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-futures.xml`

Holiwyn proof device:

Samsung tablet `SM_X526C`, Expo Go, device id `adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp`.

Holiwyn screenshots/UI hierarchy:

- `docs/mobile/screenshots/cycle-current-holiwyn-whole-app-nav-home.png`
- `docs/mobile/harness/cycle-current-holiwyn-whole-app-nav-home.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-whole-app-nav-live.png`
- `docs/mobile/harness/cycle-current-holiwyn-whole-app-nav-live.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-whole-app-nav-portfolio.png`
- `docs/mobile/harness/cycle-current-holiwyn-whole-app-nav-portfolio.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-whole-app-nav-search.png`
- `docs/mobile/harness/cycle-current-holiwyn-whole-app-nav-search.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-whole-app-nav-account.png`
- `docs/mobile/harness/cycle-current-holiwyn-whole-app-nav-account.xml`

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open Home | Header shows Polymarket brand, referral CTA, notifications; top horizontal sports/category rail includes Home, World Cup, MLB, Wimbledon, Tennis; World Cup content has Games/Futures segmented tabs; bottom tabs show Home, Live, Portfolio, Search. | Home tab selected; Games selected; scrollable World Cup game list visible. | `cycle-T-polymarket-nav-home.png` |
| Tap Live bottom tab | Live page opens with category chips, live/final market list, same top header, and the same four-tab bottom nav. | Live tab selected; no account/profile tab appears in bottom nav. | `cycle-T-polymarket-nav-live.png` |
| Tap Portfolio bottom tab | Portfolio route opens. When signed out, page shows login/signup panel; header shows logo/settings; same four-tab bottom nav remains. | Portfolio tab selected; auth-required portfolio state visible. | `cycle-T-polymarket-nav-portfolio.png` |
| Tap Search bottom tab | Search/discovery route opens with Categories, World Cup, MLB, Wimbledon, live/final items, futures section, and four-tab bottom nav. | Search tab selected; content changes to discovery/search. | `cycle-T-polymarket-nav-search.png` |
| Tap Home bottom tab | Returns to Home/World Cup list. | Home tab selected; World Cup Games state visible. | `cycle-T-polymarket-nav-home-return.png` |
| Tap World Cup top rail | When auth/referral state overlays, screen can show referral/login panel and Settings icon; still not a fifth bottom tab. | Route/category state changes or overlay appears; Settings exists outside bottom nav. | `cycle-T-polymarket-nav-world-cup-rail.png` |
| Tap Futures segmented tab | Futures area may be auth/referral-gated in current reference state; bottom nav remains Home/Live/Portfolio/Search. | Games/Futures segment state changes or auth/referral state appears. | `cycle-T-polymarket-nav-futures.png` |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| NV-P0-01 | P0 | Primary bottom navigation has exactly the Polymarket-equivalent tabs Home, Live, Portfolio, Search. Account/settings must not appear as a fifth bottom tab. | Tablet smoke/UI hierarchy | Pass |
| NV-P0-02 | P0 | Account remains reachable from a top/header control, matching Polymarket's account/settings access outside the primary bottom nav. | Tablet smoke/UI hierarchy | Pass |
| NV-P0-03 | P0 | Home preserves World Cup sports rail and Games/Futures segmented navigation. | Tablet smoke/UI hierarchy | Pass |
| NV-P0-04 | P0 | Bottom-tab switching reaches Home, Live, Portfolio, and Search without dead controls or crashes. | Tablet smoke | Pass |
| NV-P0-05 | P0 | Returning Home from another tab restores the Home/World Cup route with market list visible. | Tablet smoke | Pass |
| NV-P1-01 | P1 | Back behavior, scroll position restoration, and route transitions feel close to Polymarket across long-scroll pages. | Manual/device audit | Deferred |
| NV-P1-02 | P1 | Account/settings top control visual treatment should be refined against the Polymarket Settings/profile affordance. | Screenshot comparison | Deferred |
| NV-P2-01 | P2 | Deep link route restoration should be broadened beyond current forced smoke URLs. | Route test/device smoke | Deferred |

## Audit Gate

Result:

Pass for Cycle T P0 navigation/page-map criteria.

Unresolved P0 gaps:

0.

Remaining P1/P2 gaps:

- P1: Back behavior, scroll position restoration, and route transitions still need a deeper Polymarket comparison across long-scroll pages.
- P1: Account/settings header affordance should receive a later phone-density visual polish pass.
- P2: Production deep-link/route restoration is not fully audited beyond existing smoke deep links.

Recommended next cycle:

Proceed to Priority 2: Market/event page, beginning with a same-cycle Polymarket reference audit.
