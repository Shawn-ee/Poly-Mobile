## Cycle EW - Route-Backed Server Cancel And Activity Gate

Cycle:

- EW local MVP route-backed server fake-token order cancel/history flow.

Lead Agent target:

- Extend the EV server-order Local MVP path through cancel and visible Portfolio activity/history. The user can place a route-backed spread order, cancel it from Portfolio, and see canceled activity with the same line/provider identity.

Reference Audit Agent:

- Product steering audit. Local MVP should prioritize simple retail trading, Portfolio/open orders/activity, and fake-token lifecycle. Orderbook remains hidden from default UI.

Implementation Agent:

- Tablet smoke harness cancel branch.
- Local proof wrapper that creates a disposable provider-backed event, creates a mobile dev API credential, submits a server order, taps the mobile Cancel control, and proves the canceled activity.

Audit Gate Agent:

- Same-cycle Samsung tablet proof plus route-shaped backend event proof.

Reference device:

- Product steering plus existing Polymarket mobile sports audits.

Holiwyn device:

- Samsung tablet through Expo Go, local Expo port `8264`.

Backend evidence:

- `docs/mobile/harness/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-route-backed-retail-event.json`
- Route-backed disposable event slug: `mobile-el-a-provider-breadth-35441a1a`
- Routes: `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/orders/:id`, `/api/portfolio`, `/api/portfolio/history`
- Local backend mode: `INTERNAL_TRADING_BETA_ENABLED=true`, `TRADING_KILL_SWITCH=false`, mobile dev credential with order/account scopes.

Holiwyn evidence:

- `docs/mobile/harness/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-local-mvp-route-server-cancel-flow-proof.json`
- `docs/mobile/screenshots/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-holiwyn-route-server-mvp-portfolio.png`
- `docs/mobile/screenshots/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-holiwyn-route-server-mvp-portfolio-canceled.png`

Criteria results:

| Criterion ID | Priority | Result | Evidence | Fix if failed |
| --- | --- | --- | --- | --- |
| EW-CANCEL-P0-01 | P0 | Pass | Tablet proof loads route-backed live detail and opens provider-backed spread ticket. | Keep EV route/ticket gate. |
| EW-CANCEL-P0-02 | P0 | Pass | Server order creates an open order in Portfolio with spread line/provider identity. | Keep server order mode and API key wrapper. |
| EW-CANCEL-P0-03 | P0 | Pass | Tablet taps `cancel-open-order-*`; Portfolio refresh shows `Canceled`, `latest-activity-card`, `activity-canceled`, and `status-canceled`. | Keep mobile cancel wired to `DELETE /api/orders/:id` and server history sync. |
| EW-CANCEL-P0-04 | P0 | Pass | Canceled activity preserves `portfolio-market-type-spread`, `portfolio-line-1.5`, `portfolio-period-Reg. Time`, `portfolio-provider-source-polymarket`, and provider token. | Keep order-time selection snapshots in history mapping. |
| EW-CANCEL-P0-05 | P0 | Pass | Default UI proof rejects orderbook markers. | Keep orderbook hidden by default. |
| EW-CANCEL-P1-01 | P1 | Open | This proof covers canceled activity, not filled trade history. | Add filled/server execution lifecycle later. |

Decision:

- Pass/fail: Pass for selected route-backed spread server cancel/activity flow.
- Unresolved P0 gaps: 0 for this selected feature.
- Remaining P1/P2 gaps: filled trade history, totals/team-total lifecycle breadth, production active-event provider breadth, and fresh S23 retail lifecycle recapture when gates allow it.
- Next cycle required: yes, continue Local MVP user-flow breadth.
