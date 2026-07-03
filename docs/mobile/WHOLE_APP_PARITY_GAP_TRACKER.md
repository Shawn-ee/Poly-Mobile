# Holiwyn Whole-App Parity Gap Tracker

Date: 2026-07-03

Reference audit: `docs/mobile/POLYMARKET_WHOLE_APP_REFERENCE_AUDIT.md`

Whole-app criteria: `docs/mobile/HOLIWYN_WHOLE_APP_PARITY_CRITERIA.md`

Line criteria: `docs/mobile/HOLIWYN_LINE_ADJUSTMENT_CRITERIA.md`

## P0 Gaps

| ID | Current Holiwyn status | State | Required next evidence | Next cycle |
| --- | --- | --- | --- | --- |
| WA-P0-01 | Bottom nav exists and tablet captures prove Home, Portfolio, Search. Live and Account need fresh tablet captures in this whole-app evidence set. | Partial | Tablet smoke visits Home, Live, Portfolio, Search, Account. | Cycle K |
| WA-P0-02 | Home/World Cup discovery exists with games, futures, live/today/saved filters, cards, stars, and probabilities. | Partial | Audit against Polymarket category density and card behavior; open-card smoke. | Cycle K |
| WA-P0-03 | Search exists with filters, sort chips, result cards. | Partial | Search query, filter, clear, and open-card tablet smoke. | Cycle K |
| WA-P0-04 | Portfolio fake-balance, seeded line open-order, filled position, latest order, and recent activity proof exists on tablet. | Verified | `cycle-current-holiwyn-line-portfolio-after-order.*`, `cycle-current-holiwyn-line-portfolio-open-order.*`. | Done |
| WA-P0-05 | Game page has previous P0 implementation and fresh tablet top-page proof. Needs full tablet scroll, chat, ticket, and lower-section recapture. | Partial | Tablet full-page game proof. | Cycle K |
| WA-P0-06 | Spread and Totals line/period controls update visible market values and selected Spread line identity persists into Portfolio surfaces. | Verified | Cycle K line adjustment proof plus Cycle L line portfolio proof. | Done |
| WA-P0-07 | Ticket now carries selected Spread and Totals line/period into `ticket-selection-line`, proven on tablet. | Verified | `cycle-current-holiwyn-line-adjustment-spread-ticket.*`, `cycle-current-holiwyn-line-adjustment-totals-ticket.*`. | Done |
| WA-P0-08 | Selected line metadata persists through ticket order creation, latest order, filled position/activity rows, backend mapping, and disposable open-order UI proof. | Verified | `npm run smoke:tablet:event-detail-line-portfolio`; focused mobile API tests. | Done |
| WA-P0-09 | Full-screen game-page order book/depth panel exists with outcome bid/ask, size bars, Buy/Sell actions, and ticket handoff proof. | Verified | `cycle-current-holiwyn-order-book.*`, `cycle-current-holiwyn-order-book-ticket.*`. | Done |
| WA-P0-10 | Whole-app loading, empty, and error states have deterministic tablet proof for Portfolio syncing, Live empty, Home saved empty, Search saved empty, Account profile sync error, and Portfolio server sync error. | Verified | `cycle-current-holiwyn-empty-error-loading-*.*`; `npm run smoke:tablet:empty-error-loading`. | Done |

## Line Adjustment P0 Gaps

| ID | Current Holiwyn status | State | Required next evidence |
| --- | --- | --- | --- |
| LA-P0-01 | Spread line value and period controls are visible and proven in the Cycle K tablet baseline. | Verified | `docs/mobile/screenshots/cycle-current-holiwyn-line-adjustment-baseline.png` and XML. |
| LA-P0-02 | Spread period changes update odds/probabilities and selected state. | Verified | `cycle-current-holiwyn-line-adjustment-spread-25-1h.png` / `.xml` show `MEX -2.5 1H`, `33.3x`, `3%`, `97%`. |
| LA-P0-03 | Spread line changes update sentence, odds/probabilities, and selected state. | Verified | `cycle-current-holiwyn-line-adjustment-spread-25.xml`, `cycle-current-holiwyn-line-adjustment-spread-25-1h.*`. |
| LA-P0-04 | Totals selected value, period controls, rows, odds, and probability buttons are visible. | Verified | `cycle-current-holiwyn-line-adjustment-baseline.*`. |
| LA-P0-05 | Totals line/period changes update visible odds/probabilities. | Verified | `cycle-current-holiwyn-line-adjustment-totals-35-2h.png` / `.xml` show `Over 3.5`, `4.5x`, `22%`, `Under 3.5`, `78%`. |
| LA-P0-06 | Ticket selected-line propagation is proven on tablet for Spread and Totals. | Verified | `cycle-current-holiwyn-line-adjustment-spread-ticket.*`, `cycle-current-holiwyn-line-adjustment-totals-ticket.*`. |
| LA-P0-07 | Order payload includes line/period selection metadata. | Verified | `npm run test:mobile-api -- mobile/src/__tests__/orderService.test.ts`. |
| LA-P0-08 | Portfolio latest order, filled position/activity, and open order preserve selected line/period labels. | Verified | `cycle-current-holiwyn-line-portfolio-after-order.*`, `cycle-current-holiwyn-line-portfolio-open-order.*`, portfolio snapshot/history tests. |

## P1 Gaps

| ID | Gap | State |
| --- | --- | --- |
| WA-P1-01 | Phone-first visual density and spacing still differ from Polymarket, especially on tablet landscape. | Open |
| WA-P1-02 | World Cup hero/stage carousel and category page are not close enough. | Open |
| WA-P1-03 | Saved/watchlist cross-page persistence needs whole-app proof. | Open |
| WA-P1-04 | Notifications, share, settings/account, language switch, and login/account entry need tapped-state proof. | Open |
| WA-P1-05 | Chat input/reactions, chart press tooltip, and amount-entered ticket affordance need safe interaction proof. | Open |

## P2 Gaps

| ID | Gap | State |
| --- | --- | --- |
| WA-P2-01 | Micro-animation, chart animation, and gesture polish are not audited. | Open |
| WA-P2-02 | Long-tail props are not comprehensive. | Open |
| WA-P2-03 | Timed real-time updates are not proven. | Open |

## Cycle Plan

Cycle K should implement and verify the line-adjustment P0 path first:

1. Spread period/line changes update visible market values.
2. Totals period/line changes update visible market values.
3. Ticket carries selected line/period.
4. Tablet smoke proves before, after, and ticket states.

Cycle L should connect the selected line identity through order creation, open orders, portfolio, and activity.

Cycle M should add or prove order book/depth and whole-app empty/error/loading states.

## Cycle K Notes

Cycle K implemented and verified the first line-adjustment parity slice:

- Spread line rail supports `0.5`, `1.5`, `2.5`.
- Spread period chips update probabilities and odds.
- Totals line rail supports `1.5`, `2.5`, `3.5`.
- Totals period chips update probabilities and odds.
- Tickets display selected line and period, for example `Yes - MEX -2.5 1H` and `Yes - Over 3.5 2H`.
- Server order payloads can carry `selection` metadata with `marketType`, `line`, `period`, and `displayLabel`.

Verified by:

- `npm run typecheck`
- `npm run smoke:tablet:event-detail-line-adjustment`
- `npm run test:mobile-api -- mobile/src/__tests__/orderService.test.ts`

Cycle L P0 is now verified: selected line/period survives ticket amount entry, order creation, Portfolio latest order, filled position/activity rows, backend snapshot/history mapping, and disposable open-order rendering.

## Cycle L Notes

Cycle L implemented and verified line identity persistence:

- Portfolio models now accept `selection` metadata and render `selection.displayLabel` in latest order, positions, activities, and open orders.
- Mock order creation carries `selection` into local Portfolio state.
- Backend portfolio snapshot/history mapping preserves backend selection labels when present.
- Ticket amount entry no longer resets event tickets back to `$0` after keypad/default changes.
- Tablet proof enters `25` through the ticket keypad, submits `MEX -2.5 1H`, verifies Portfolio rows, then opens a disposable line open-order fixture.

Verification:

- `npm run typecheck`
- `npm run test:mobile-api -- mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts`
- `npm run smoke:tablet:event-detail-line-portfolio`

## Cycle M Notes

Cycle M implemented and verified the game-page order book/depth baseline:

- Regulation Time Winner now exposes a `Book` control beside the compact bid/ask/spread row.
- The order-book screen shows per-outcome bid/ask prices, share sizes, relative depth bars, odds, and Buy/Sell actions.
- Buy from the book opens the existing ticket for the selected outcome, then returns to the order book after closing.

Verification:

- `npm run typecheck`
- `npm run smoke:tablet:event-detail-order-book`

## Cycle N Notes

Cycle N implemented and verified deterministic whole-app empty/error/loading proof:

- Portfolio can be launched into a server-sync loading state.
- Portfolio can be launched into a server-sync error state.
- Account can be launched into a profile-preferences sync error state.
- Live, Home saved, and Search saved empty states are proven on the tablet.
- The tablet harness captures each state as separate XML and screenshot evidence.

Verification:

- `npm run typecheck`
- `npm run smoke:tablet:empty-error-loading`
