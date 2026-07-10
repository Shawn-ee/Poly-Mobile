# Cycle TE - Current MVP Full Flow Reproof

Branch: `cycle/te-current-mvp-full-flow-reproof`

## Scope

Cycle TE re-proves the Local MVP retail betting path on Samsung S23 after the provider-readiness and Event Detail cleanup cycles:

Home -> Live/Event Detail -> Game Lines -> contract-shaped line market -> simple Trade Ticket -> server fake-token order -> Portfolio History.

No new visible UI feature, backend route, schema, order book UI, chat, live stats, social, deposit, or withdrawal work was added.

## Acceptance Criteria

| Criterion | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Home and Live show the current World Cup match and keep provider/local-line source disclosure available for audit. | P0 | Pass | `docs/mobile/harness/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-s23-visible-flow.json` |
| Event Detail shows Game Lines and line-family readiness for expected spread, total, and team-total families. | P0 | Pass | `detailShowsGameLines`, `detailShowsLineFamilyReadiness` |
| Event Detail explicitly exposes provider-unavailable families so fixture line rows are not confused with real Polymarket line markets. | P0 | Pass | `detailShowsProviderUnavailableLineFamilies` |
| Order book remains hidden in the default Local MVP mobile UI. | P0 | Pass | `orderbookHidden` |
| Trade Ticket preserves selected line/market/outcome identity into submit. | P0 | Pass | `ticketPreservesLine` |
| Swipe submit reaches Portfolio after server fake-token order placement. | P0 | Pass | `swipeSubmitReachedPortfolio` |
| Portfolio History shows the filled order state after server-backed execution. | P0 | Pass | `filledHistoryVisible` |

## Device Proof

- Device: Samsung S23
- ADB device id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Backend base URL: `http://127.0.0.1:3002`
- Mobile API base URL: `http://172.16.200.14:3002`
- Expo port: `8294`
- Result: `pass`

Primary proof summary:

- `docs/mobile/harness/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-s23-visible-flow.json`

Screenshots:

- `docs/mobile/screenshots/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-live.png`
- `docs/mobile/screenshots/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-detail-top.png`
- `docs/mobile/screenshots/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-after-submit.png`
- `docs/mobile/screenshots/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-portfolio-history.png`

## Backend And Data Dependencies

- `/api/events`
- `/api/mobile/events/:slug/live-detail`
- `/api/markets/:marketId/quote`
- `/api/orders`
- `/api/portfolio`
- `/api/portfolio/history`
- `scripts/seed_mobile_route_spread_counterparty.ts`

The proof uses the existing backend-shaped line-market fixture contract for spread/total/team-total line rows because Polymarket Gamma currently does not expose attach-ready line markets for the current MVP match. The fixture line identity is preserved through ticket, order, fill, and Portfolio History.

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Real Polymarket-backed spread, total, and team-total line markets for the current user-facing match set. | P1 | Open |
| Full manual Google account consent proof on S23. | P1 | Open |
| Production dev build/APK proof instead of Expo Go-only runtime. | P2 | Open |
