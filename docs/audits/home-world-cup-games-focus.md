# Home And Live World Cup Games Focus Audit

## Reference And Product Direction

The current Local MVP path is prediction-first and World-Cup-game-first: Home -> Event Detail -> chart/probability -> line selector -> Buy/Sell ticket -> fake-token order -> Portfolio/history.

Holiwyn should not push users into non-World-Cup sports, nonessential promo surfaces, or futures before they can enter the live/game prediction path. The route-backed provider proof currently lands on the Live discovery surface, so this audit covers both default Home cleanup and the Live route-backed discovery header.

## Holiwyn Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Home first screen presents a World Cup games/prediction focus header. | P0 | Android XML includes `home-world-cup-games-focus` and `prediction-only-home`. |
| Live route-backed discovery presents a World Cup live games/prediction focus header. | P0 | Android XML includes `live-world-cup-games-focus` and `prediction-only-live`. |
| Home first screen does not show non-MVP sport navigation or futures promo cards before game discovery. | P0 | Android XML lacks `MLB`, `Tennis`, `featured-future-*`, and `future-market-chart`. |
| Route-backed World Cup event cards remain tappable from Home. | P0 | Android proof opens route-backed Event Detail from `event-card-*`. |
| The Home-opened event still reaches Event Detail game lines and simple ticket. | P0 | Android proof opens spread line ticket with provider/line identity. |
| Futures catalog can still exist behind the explicit Futures tab. | P1 | Existing FutureList remains mounted only when the user selects the tab. |

## Cycle GD Result

- Implementation: `HomeScreen` now removes the non-World-Cup `SportNav` strip and the default `FeaturedFuture` promo from the first Home screen, replacing them with a compact World Cup games focus header. `LiveScreen` now exposes a World Cup live games focus header for route-backed discovery.
- Backend/API impact: none. Existing event discovery data and route-backed event cards are unchanged.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8243 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-GD-home-world-cup-games-focus -HierarchyOutputDir docs/mobile/harness/cycle-GD-home-world-cup-games-focus`.
- Audit status: P0 pass.
