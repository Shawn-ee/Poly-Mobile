# Portfolio Polymarket Audit

Status: Cycle AA P0 pass for focused fake-token Portfolio positions, open orders, activity, and cancel behavior.

## Scope

- Positions.
- Open orders.
- Cancel behavior.
- Activity/history.
- Sell, close, cash out, or retrade behavior where Polymarket exposes it.
- Balance/fake-token display in Holiwyn, while real-money wallet actions remain out of scope.

## Reference Audit

Reference device:

- Samsung S23.

Polymarket app/browser:

- Polymarket Android app and Polymarket mobile web.

Route or URL if available:

- Native package: `com.polymarket.android`
- Mobile web: `https://polymarket.com/portfolio`

Screenshots/UI hierarchy:

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open native app | App opens to `Location Verification Failed` and cannot reach Portfolio. | Native reference is blocked by availability/location gate. | `docs/mobile/reference/screenshots/cycle-AA-polymarket-app-entry.png` |
| Open web Portfolio | Web route opens the US view-only/download/login gate instead of a portfolio account surface. | Portfolio is gated until app/login/restriction state is resolved. | `docs/mobile/reference/screenshots/cycle-AA-polymarket-web-portfolio.png` |
| Continue in view-only mode | The web gate remains visible in the captured state. | No position/order/activity data can be audited safely from this state. | `docs/mobile/reference/screenshots/cycle-AA-polymarket-web-portfolio-viewonly.png` |
| Open a position | Blocked by reference state. | Track as P1/P2 recapture once a usable reference portfolio exists. | Pending |
| Open an order | Blocked by reference state. | Track as P1/P2 recapture once a usable reference portfolio exists. | Pending |
| Cancel an order if safe/non-real | Blocked by reference state. | Holiwyn fake-token cancel is still P0 because Holiwyn shows a cancel control. | Pending |
| Open activity/history | Blocked by reference state. | Holiwyn fake-token activity is still P0 because the app supports mock trading. | Pending |
| Tap sell/close/retrade without submitting real trade | Blocked by reference state. | Holiwyn exposes Buy/Sell/Close entry points for fake-token positions. | Pending |

Reference evidence:

- `docs/mobile/reference/screenshots/cycle-AA-polymarket-app-entry.png`
- `docs/mobile/reference/screenshots/cycle-AA-polymarket-app-entry.xml`
- `docs/mobile/reference/screenshots/cycle-AA-polymarket-web-portfolio.png`
- `docs/mobile/reference/screenshots/cycle-AA-polymarket-web-portfolio.xml`
- `docs/mobile/reference/screenshots/cycle-AA-polymarket-web-portfolio-viewonly.png`
- `docs/mobile/reference/screenshots/cycle-AA-polymarket-web-portfolio-viewonly.xml`

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| PF-P0-01 | P0 | Holiwyn fake-token Portfolio shows balance, positions, open orders, activity/history, and counts after order flow. | Tablet screenshot/XML | Pass |
| PF-P0-02 | P0 | Open order cancel is functional when Holiwyn shows a cancel control. | Tablet smoke | Pass |
| PF-P0-03 | P0 | Position sell/close/retrade entry points either work or are explicitly disabled with clear state. | Device smoke | Pass for visible Buy/Sell/Close entry points; deeper ticket cycle remains P1 |
| PF-P0-04 | P0 | Ticket/order/portfolio/history data remain consistent after a Holiwyn order. | Tablet smoke/API test | Pass |
| PF-P1-01 | P1 | Portfolio visual density and activity detail approach Polymarket. | Screenshot/manual audit | Deferred |
| PF-P1-02 | P1 | Polymarket signed-in Portfolio positions/orders/activity are recaptured from an unblocked reference state. | Reference audit | Deferred |

Holiwyn proof:

- `docs/mobile/screenshots/cycle-current-holiwyn-line-portfolio-after-order.png`
- `docs/mobile/harness/cycle-current-holiwyn-line-portfolio-after-order.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-line-portfolio-open-order.png`
- `docs/mobile/harness/cycle-current-holiwyn-line-portfolio-open-order.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-open-order.png`
- `docs/mobile/harness/cycle-current-holiwyn-open-order.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-open-order-canceled.png`
- `docs/mobile/harness/cycle-current-holiwyn-open-order-canceled.xml`

Verification:

- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -EventDetailLinePortfolio -Port 8200`
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke.ps1 -Deep -OpenOrderCancel -Port 8201 -Device adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp -ExpoHost 172.16.200.14`

## Audit Gate

Result: Pass for focused Holiwyn fake-token Portfolio scope.

Unresolved P0 gaps: 0 for focused fake-token scope.

Remaining P1/P2 gaps:

- Polymarket signed-in Portfolio positions/orders/activity could not be audited because native app location verification and web view-only gate blocked Portfolio.
- Holiwyn visual density is still more dashboard-like than a Polymarket account surface.
- Deeper Portfolio Buy/Sell/Close ticket transitions should remain covered in a later focused re-trade cycle.
- Server-mode Portfolio/open-order cancellation has older proof and should get a new same-cycle Polymarket-reference gate when backend parity is prioritized.

Recommended next cycle:

- Continue Search/discovery parity or run a deeper Portfolio re-trade visual cycle if Portfolio remains the priority.
