## Cycle EU - Route-Backed Retail Ticket Gate

Cycle:

- EU local MVP route-backed retail ticket flow.

Lead Agent target:

- Move the Local MVP away from default orderbook UI and prove a simple retail ticket can consume backend live-detail market identity for line markets.

Reference Audit Agent:

- Product steering audit. Polymarket reference model for this milestone is retail-first: choose market/outcome, see probability, enter amount, submit fake-token trade, and see Portfolio/history. Orderbook is internal/debug only for the current MVP.

Implementation Agent:

- EventDetail spread row backend handoff.
- EventDetail line-ticket resolver period equivalence for `full-game` backend rows and `Reg. Time` retail selections.
- Samsung tablet smoke harness branch for route-backed retail line tickets.

Audit Gate Agent:

- Same-cycle device gate using Samsung tablet Holiwyn proof and backend route proof.

Reference device:

- Product steering plus previous Polymarket mobile sports page audits. No fresh S23 tap capture was required for this backend/retail MVP gate because the cycle targeted Holiwyn contract correctness and default orderbook hiding.

Holiwyn device:

- Samsung tablet through Expo Go, local Expo port `8262`.

Backend evidence:

- `docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-route-backed-retail-event.json`
- Disposable event slug: `mobile-el-a-provider-breadth-b917234c`
- Route: `/api/mobile/events/:slug/live-detail`
- Provider refresh: Polymarket Gamma/CLOB-shaped spread and totals rows refreshed to ready. `OPTIC_ODDS_API_KEY` missing remained non-blocking.

Holiwyn evidence:

- `docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-local-mvp-route-ticket-flow-proof.json`
- `docs/mobile/screenshots/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-line-markets.png`
- `docs/mobile/screenshots/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-totals-ticket.png`
- `docs/mobile/screenshots/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-spread-ticket-ready.png`
- `docs/mobile/screenshots/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-holiwyn-route-mvp-portfolio.png`

Criteria results:

| Criterion ID | Priority | Result | Evidence | Fix if failed |
| --- | --- | --- | --- | --- |
| EU-RETAIL-P0-01 | P0 | Pass | Tablet proof loads live-detail through `forceBackendEventSlug` and shows `live-data-source-polymarket-gamma`. | Keep route health and backend slug launch as required proof. |
| EU-RETAIL-P0-02 | P0 | Pass | Spread and totals rows show `ticket-source-backend-line-market` and `provider-source-polymarket`. | Keep backend line matching period-safe. |
| EU-RETAIL-P0-03 | P0 | Pass | Default UI rejects `event-detail-open-order-book`, `orderbook-source-`, and `Route depth` markers. | Keep orderbook behind debug flag only. |
| EU-RETAIL-P0-04 | P0 | Pass | Totals and spread tickets open with provider source/token identity and simple amount controls. | Keep simple ticket path as default MVP. |
| EU-RETAIL-P0-05 | P0 | Pass | Fake-token buy submits and Portfolio/latest order/activity/position preserve provider source, token, line, period, and market type. | Keep Portfolio identity markers in regression proof. |
| EU-RETAIL-P1-01 | P1 | Open | Team-total still uses deterministic contract fixture in the same screenshot because this disposable route event only covers moneyline/spread/totals. | Add provider-backed team-total route rows when real/source-approved markets exist. |

Decision:

- Pass/fail: Pass for EU route-backed retail MVP spread/totals ticket flow.
- Unresolved P0 gaps: 0 for selected spread/totals retail flow.
- Remaining P1/P2 gaps: route-backed team-total provider rows, real production Polymarket line-family source breadth, and fresh S23 retail ticket recapture when location/deposit gates allow it.
- Next cycle required: yes, continue Local MVP user journey breadth without making Book/orderbook a default UI requirement.
