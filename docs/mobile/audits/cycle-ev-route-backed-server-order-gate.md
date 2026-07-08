## Cycle EV - Route-Backed Server Order Gate

Cycle:

- EV local MVP route-backed server fake-token order flow.

Lead Agent target:

- Prove the default retail mobile journey can open a Polymarket-backed live-detail event, choose a backend line market, submit through the real local server order path, and see the server portfolio sync show the open order. Orderbook remains hidden from the default UI.

Reference Audit Agent:

- Product steering audit. The current Local MVP should keep Polymarket-like retail behavior: choose market/outcome, see current probability, enter amount, submit fake-token trade, and see Portfolio/history. Full orderbook is internal/debug infrastructure for now.

Implementation Agent:

- Tablet smoke harness server-order path.
- Local proof wrapper that creates a disposable provider-backed event, creates a mobile dev API credential, launches Expo in server market-data and server order mode, and runs the tablet proof.

Audit Gate Agent:

- Same-cycle Samsung tablet proof plus route proof. Fresh S23 reference was not required because this cycle is a local MVP contract/user-flow gate under the latest steering update.

Reference device:

- Product steering plus existing Polymarket mobile sports audits.

Holiwyn device:

- Samsung tablet through Expo Go, local Expo port `8263`.

Backend evidence:

- `docs/mobile/harness/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-route-backed-retail-event.json`
- Route-backed disposable event slug: `mobile-el-a-provider-breadth-5f9e2d3f`
- Routes: `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`
- Local backend mode: `INTERNAL_TRADING_BETA_ENABLED=true`, `TRADING_KILL_SWITCH=false`, mobile dev credential with order and account scopes.
- `OPTIC_ODDS_API_KEY` remains optional and non-blocking for this Polymarket-first path.

Holiwyn evidence:

- `docs/mobile/harness/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-local-mvp-route-server-order-flow-proof.json`
- `docs/mobile/screenshots/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-holiwyn-route-server-mvp-line-markets.png`
- `docs/mobile/screenshots/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-holiwyn-route-server-mvp-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-holiwyn-route-server-mvp-portfolio.png`

Criteria results:

| Criterion ID | Priority | Result | Evidence | Fix if failed |
| --- | --- | --- | --- | --- |
| EV-SERVER-P0-01 | P0 | Pass | Tablet proof loads `/api/mobile/events/:slug/live-detail` from `forceBackendEventSlug` and shows `live-data-source-polymarket-gamma`. | Keep backend health and event slug setup in the wrapper. |
| EV-SERVER-P0-02 | P0 | Pass | Spread line row exposes `ticket-source-backend-line-market`, `selection-market-family-spread`, `selection-line-1.5`, `selection-period-Reg. Time`, and `provider-source-polymarket`. | Keep route-backed line resolver period-safe. |
| EV-SERVER-P0-03 | P0 | Pass | Ticket opens from the selected spread row with `ticket-market-type-spread`, `ticket-line-1.5`, `provider-source-polymarket`, and `provider-token-token-el-a-spread-home`. | Keep provider/outcome identity in ticket handoff. |
| EV-SERVER-P0-04 | P0 | Pass | `$25` ticket submits with `EXPO_PUBLIC_ORDER_MODE=server`; proof JSON records `orderMode=server`. | Keep server order mode and API key injected by wrapper. |
| EV-SERVER-P0-05 | P0 | Pass | Portfolio screen shows `Server portfolio synced`, `Order placed`, `SERVER - Buy`, `open-order-row-`, and spread/provider identity. | Keep `/api/portfolio` sync after submit. |
| EV-SERVER-P0-06 | P0 | Pass | Default UI proof rejects `event-detail-open-order-book`, `orderbook-source-`, and `Route depth`. | Keep orderbook hidden by default. |
| EV-SERVER-P1-01 | P1 | Open | This proof covers one provider-backed spread order only. | Add totals/team-total server order breadth after the route-backed spread flow remains stable. |

Decision:

- Pass/fail: Pass for selected route-backed spread server-order Local MVP flow.
- Unresolved P0 gaps: 0 for this selected feature.
- Remaining P1/P2 gaps: totals/team-total server-order breadth, production active-event provider breadth, fresh S23 retail ticket recapture when gates allow it, and longer history/activity proof beyond open order.
- Next cycle required: yes, continue Local MVP user journey breadth while keeping orderbook out of the default mobile path.
