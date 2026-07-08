## Cycle EZ - Route-Backed Server Filled Team Total Trade And Activity Gate

Cycle:

- EZ local MVP route-backed server fake-token team-total filled trade/history flow.

Lead Agent target:

- Close the remaining line-family breadth gap from EY by proving the same simple retail server-filled lifecycle on a route-backed Team Total market.

Reference Audit Agent:

- Product steering audit. Local MVP should prioritize simple retail trade flow, Portfolio positions, open orders, and activity/history. Orderbook remains hidden from the default UI.

Implementation Agent:

- Added a provider-backed Team Total market to the disposable route-backed provider breadth event.
- Added a tablet smoke variant for the route-backed Team Total market.
- Added a local proof wrapper that creates the provider-backed event, seeds matching team-total maker liquidity, creates a mobile dev API credential, and runs the tablet proof.

Audit Gate Agent:

- Same-cycle Samsung tablet proof plus backend-shaped route/counterparty evidence.

Reference device:

- Product steering plus existing Polymarket mobile sports audits. No fresh S23 recapture was needed for this server lifecycle breadth gate.

Holiwyn device:

- Samsung tablet through Expo Go, local Expo port `8267`.

Backend evidence:

- `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-route-backed-retail-event.json`
- `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-route-backed-team-total-counterparty.json`
- Route-backed disposable event slug: `mobile-el-a-provider-breadth-477e6b35`
- Routes/services: `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history`, `placeOrderAndMatch`, `mintCompleteSetForPublicOrderbook`

Holiwyn evidence:

- `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-local-mvp-route-server-filled-team-total-flow-proof.json`
- `docs/mobile/screenshots/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-holiwyn-route-server-mvp-team-total-ticket-ready.png`
- `docs/mobile/screenshots/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-holiwyn-route-server-mvp-portfolio.png`

Criteria results:

| Criterion ID | Priority | Result | Evidence | Fix if failed |
| --- | --- | --- | --- | --- |
| EZ-TEAMTOTAL-P0-01 | P0 | Pass | Provider breadth route proof creates and refreshes a Team Total market with `marketFamily=team_total`. | Keep Team Total in compact route fixture. |
| EZ-TEAMTOTAL-P0-02 | P0 | Pass | Tablet proof loads route-backed live detail and finds `event-detail-outcome-team-total-goals-team-total-over`. | Keep Team Total row route-backed. |
| EZ-TEAMTOTAL-P0-03 | P0 | Pass | Counterparty proof seeds a resting SELL order at `0.52` for the same team-total market/outcome. | Keep counterparty seed tied to route-backed market ids. |
| EZ-TEAMTOTAL-P0-04 | P0 | Pass | Android ticket opens with `ticket-market-type-team-total`, line `1.5`, provider source, and provider token. | Keep ticket carry-through from backend team-total market. |
| EZ-TEAMTOTAL-P0-05 | P0 | Pass | Android submit fills and Portfolio shows a filled position plus recent activity. | Keep matching path and server Portfolio refresh. |
| EZ-TEAMTOTAL-P0-06 | P0 | Pass | Activity and position preserve team-total line, period, provider source, and provider token. | Keep `/api/portfolio` and `/api/portfolio/history` selection mapping. |
| EZ-TEAMTOTAL-P0-07 | P0 | Pass | Default UI proof rejects orderbook markers. | Keep orderbook hidden by default. |
| EZ-TEAMTOTAL-P1-01 | P1 | Open | The proof uses disposable provider-shaped data, not production live Polymarket event mapping. | Continue production provider mapping breadth later. |

Decision:

- Pass/fail: Pass for selected route-backed team-total server filled trade/activity flow.
- Unresolved P0 gaps: 0 for this selected feature.
- Remaining P1/P2 gaps: production active-event provider breadth, fresh S23 retail lifecycle recapture, and non-disposable liquidity source.
- Next cycle required: yes, continue Local MVP user-flow breadth.
