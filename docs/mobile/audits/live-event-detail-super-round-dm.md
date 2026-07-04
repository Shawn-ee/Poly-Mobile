# Live Event Detail Super-Round Reference Audit

Status: Cycle DM evidence audit and DN super-round acceptance criteria.

Scope: visible live event detail parity after Cycle DM, with emphasis on chart, line selectors, orderbook/depth, trade ticket Buy/Sell, stale/unavailable states, and provider identity carry-through.

Evidence limitation: this audit uses existing checked-in screenshots, XML, and backend harness artifacts. Agent C did not run fresh device control in this worktree. Polymarket native reference evidence is limited to the Cycle CW Samsung S23 XML plus exact Gamma/CLOB artifacts; no new live Polymarket app screenshots were captured in this pass.

## Reference Evidence

Reference device: Samsung S23.

Reference app/browser: official Polymarket Android app plus public Polymarket Gamma/CLOB provider data.

Reference route/URL:

- `https://polymarket.com/sports/world-cup/fifwc-col-gha-2026-07-03`
- `https://gamma-api.polymarket.com/events?slug=fifwc-col-gha-2026-07-03`
- Polymarket CLOB `/book?token_id=...`
- Polymarket CLOB `/prices-history?market=<tokenId>`

Reference evidence paths:

- `docs/mobile/reference/screenshots/cycle-CW-polymarket-s23-window.xml`
- `docs/mobile/harness/cycle-current-mobile-polymarket-first-provider-path.json`
- `docs/mobile/harness/cycle-current-mobile-polymarket-chart-history.json`
- `docs/mobile/harness/cycle-current-mobile-provider-token-lifecycle.json`

Key reference findings:

- Exact event `fifwc-col-gha-2026-07-03` exposes tokenized match-winner markets for Colombia, draw, and Ghana.
- The current Gamma/CLOB discovery path found 3 `match_winner` candidates and 0 spread, total-goals, team-total-goals, corners, first-half, second-half, or correct-score candidates for this event.
- The provider event is now closed/resolved, so current-live readiness should not be fabricated; historical chart and token identity remain valid reference data.
- Polymarket market identity is tokenized and must carry market slug/ID, condition ID, outcome token ID, and outcome label into ticket and downstream order metadata.

## Holiwyn Evidence

Holiwyn device: Samsung tablet.

Holiwyn app mode: Expo Go with local backend mobile live-detail, chart, orderbook, and ticket routes.

Holiwyn evidence paths:

- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book-ticket.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book-ticket.png`

## Super-Round Criteria

These criteria are the DN super-round checks Agent A/B and Lead should use before marking visible live-detail parity complete.

| ID | Priority | Criterion | Required evidence | Current status |
| --- | --- | --- | --- | --- |
| LD-DN-P0-01 | P0 | Live-detail provider source is Polymarket-first for markets that exist on Polymarket; optional external enrichment cannot be required for the baseline. | `cycle-current-mobile-polymarket-first-provider-path.json` with `OPTIC_ODDS_API_KEY` unset and `pass=true`; tablet XML showing `live-data-source-polymarket-gamma`. | Pass from Cycle DK evidence |
| LD-DN-P0-02 | P0 | Match-winner market mapping preserves the exact Colombia, draw, and Ghana provider identities and rejects wrong-family line mappings. | Provider path proof showing 3 attach-ready match-winner candidates, 0 line-family candidates, and `provider_family_mismatch` for totals targets. | Pass for match-winner; line-family provider parity remains P1 unavailable |
| LD-DN-P0-03 | P0 | Chart is provider/history backed when token history exists, not fallback/static. | `cycle-current-mobile-polymarket-chart-history.json`; tablet XML marker `chart-source-polymarket-clob-prices-history chart-status-ready chart-range-1D`. | Pass from Cycle DL evidence |
| LD-DN-P0-04 | P0 | Orderbook/depth renders route-backed provider depth with price, shares, total, best bid, best ask, spread, and Book action. | `cycle-current-holiwyn-server-live-order-book.xml`; screenshot `cycle-current-holiwyn-server-live-order-book.png`. | Pass from Cycle DK-DM evidence |
| LD-DN-P0-05 | P0 | Buy/Sell ticket opens from provider-backed outcome rows and carries provider market, condition, outcome token, and outcome label into the ticket surface. | `cycle-current-mobile-provider-token-lifecycle.json`; `cycle-current-holiwyn-server-live-order-book-ticket.xml`. | Pass from Cycle DM evidence |
| LD-DN-P0-06 | P0 | Stale/closed/unavailable provider state is represented honestly and does not fall back to fabricated live data. | `cycle-current-mobile-polymarket-chart-history.json` showing `providerEventClosed=true`, `providerEventEnded=true`, and live data `stale`. | Pass from Cycle DL evidence |
| LD-DN-P0-07 | P0 | Any visible line selector or line-market control must either be provider-backed for the selected line/outcome or show an explicit unavailable/stale/unsupported state. | Provider family summary and tablet XML for line/market rows. | No current evidence P0 failure; Agent A/B must verify the final UI because exact Polymarket line-family markets are not available in current reference |
| LD-DN-P1-01 | P1 | Filled order, portfolio position, and history entry preserve provider market/condition/token identity for an active provider-backed market. | End-to-end filled-order proof on an active provider market. | Open |
| LD-DN-P1-02 | P1 | Exact line-family provider markets are mapped only when Polymarket exposes them or an approved enrichment source is explicitly in scope. | New reference/provider proof for spreads, totals, team totals, halves, corners, correct score, or props. | Open; current evidence says unavailable through Gamma/CLOB |
| LD-DN-P1-03 | P1 | Background/scheduled provider refresh keeps chart, depth, and quote state current without manual proof execution. | Scheduler/refresh proof and tablet state after refresh. | Open |
| LD-DN-P2-01 | P2 | Visual density, native motion, and chart touch geometry are polished to Polymarket-level feel after structural provider parity passes. | Side-by-side visual QA. | Deferred |

## Gap Calls For Implementation Agents

- Do not mark line selector parity complete by showing local/demo line prices. Current checked reference evidence found no attach-ready Polymarket line-family markets for this event.
- Do not treat `optic_odds` as required for P0 Polymarket parity. It is optional enrichment unless Lead explicitly scopes it as a product provider.
- Do not claim current-live readiness for the Colombia vs Ghana reference event. It is closed/resolved in the Cycle DL provider proof; stale/ended state is expected.
- Do preserve provider identity through every visible interaction: chart selection, Book, Buy/Sell row, ticket, order request, portfolio, and history.

## Acceptance Summary

Pass for current docs/audit baseline:

- Polymarket-first provider path for match-winner markets.
- Provider-backed CLOB chart history.
- Route-backed orderbook/depth.
- Page-to-ticket provider identity carry-through.
- Honest stale/closed state documentation.

Still open before full live-detail parity:

- Active-market filled order and history lifecycle proof.
- Exact line-family provider mapping when real Polymarket line markets exist.
- Final Agent A/B device proof that every visible line selector/unavailable state on the implementation build matches these criteria.
