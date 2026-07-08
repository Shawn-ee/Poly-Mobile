# Cycle FA - Local MVP Route-Backed Retail Status Gate

## Scope

Cycle FA applies the current Local MVP steering rule: orderbook remains hidden from the default mobile UI, and route-backed provider status must be understandable inside the event detail and simple trade ticket flow.

## Reference Behavior

- Polymarket-like retail flow keeps the user on the event page, line rows, and trade ticket.
- If a market is stale, delayed, or unavailable, the user should see that status near the market/ticket before submitting.
- A full orderbook surface is not required for the Local MVP status path.

## Holiwyn Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| FA-P0-01: `/api/mobile/events/:slug/live-detail` exposes provider-backed ready, stale, and unavailable market availability for compact markets. | P0 | Pass |
| FA-P0-02: Game Lines show route-backed stale and unavailable status without visible Book/orderbook controls. | P0 | Pass |
| FA-P0-03: Simple TradeTicket shows a `ticket-market-status` pill for the selected stale provider-backed spread market. | P0 | Pass |
| FA-P0-04: Simple TradeTicket shows unavailable status and blocks submit for the selected unavailable provider-backed totals market. | P0 | Pass |
| FA-P0-05: Android proof uses Samsung tablet with backend server mode for market data and `EXPO_PUBLIC_SHOW_ORDERBOOK` unset. | P0 | Pass |
| FA-P1-01: Production active Polymarket event recapture for stale/unavailable states. | P1 | Open |

## Implementation Notes

- `src/server/services/mobileLiveEventDetail.ts` now maps provider-backed market availability from provider lifecycle when quote/depth/chart status is stale or unavailable. Non-provider markets keep timestamp-based availability.
- `mobile/src/components/EventDetail.tsx` now shows the route-backed availability pill on the custom Spread header, matching grouped markets like Totals.
- `mobile/src/components/TradeTicket.tsx` now displays `ticket-market-status` for ready/stale/unavailable provider-backed markets and disables submit for blocked unavailable/suspended states.
- `mobile/scripts/local-mvp-route-status-proof.ps1` creates a disposable provider-status event using `scripts/prove_mobile_ej_a_provider_status_breadth.ts`, then drives the tablet proof.

## Evidence

- Backend route proof: `docs/mobile/harness/cycle-FA-local-mvp-route-status-flow/cycle-FA-A-provider-status-breadth.json`
- Android proof: `docs/mobile/harness/cycle-FA-local-mvp-route-status-flow/cycle-FA-local-mvp-route-status-flow-proof.json`
- Screenshots/XML:
  - `docs/mobile/screenshots/cycle-FA-local-mvp-route-status-flow/cycle-FA-holiwyn-route-status-lines.png`
  - `docs/mobile/harness/cycle-FA-local-mvp-route-status-flow/cycle-FA-holiwyn-route-status-lines.xml`
  - `docs/mobile/screenshots/cycle-FA-local-mvp-route-status-flow/cycle-FA-holiwyn-route-status-stale-ticket.png`
  - `docs/mobile/harness/cycle-FA-local-mvp-route-status-flow/cycle-FA-holiwyn-route-status-stale-ticket.xml`
  - `docs/mobile/screenshots/cycle-FA-local-mvp-route-status-flow/cycle-FA-holiwyn-route-status-unavailable-ticket.png`
  - `docs/mobile/harness/cycle-FA-local-mvp-route-status-flow/cycle-FA-holiwyn-route-status-unavailable-ticket.xml`

## Audit Gate

Pass for the selected Local MVP route-backed retail status feature.

Unresolved P0 gaps: 0.

Remaining P1/P2: production active-event status breadth and fresh S23 reference recapture for live stale/unavailable retail states.
