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
| WA-P0-04 | Portfolio empty fake-balance state exists. Need seeded position/open-order/activity proof under the whole-app tracker. | Partial | Create disposable/seeded order and prove portfolio rows. | Cycle L |
| WA-P0-05 | Game page has previous P0 implementation and fresh tablet top-page proof. Needs full tablet scroll, chat, ticket, and lower-section recapture. | Partial | Tablet full-page game proof. | Cycle K |
| WA-P0-06 | Line controls are visible for Spread/Totals, but selected line/period behavior is not proven and likely incomplete. | Open | LA-P0-01 through LA-P0-08. | Cycle K first priority |
| WA-P0-07 | Ticket UI exists from prior proof. Selected line/period propagation needs fresh tablet evidence. | Open | Ticket after changed Spread/Totals line. | Cycle K |
| WA-P0-08 | Order/trade flow exists from prior server cycles, but selected line identity is not proven end to end. | Open | Order payload and portfolio/open order with line/period. | Cycle L |
| WA-P0-09 | Polymarket order book is a full screen. Holiwyn book control does not yet prove equivalent market depth. | Open | Add or prove order book/depth screen. | Cycle M |
| WA-P0-10 | Some empty states exist; loading/API failure/error states need whole-app proof. | Open | Fixture/smoke for page error/loading states. | Cycle M |

## Line Adjustment P0 Gaps

| ID | Current Holiwyn status | State | Required next evidence |
| --- | --- | --- | --- |
| LA-P0-01 | Spread line value and period controls are visible. | Partial | Tablet before-state screenshot/XML already exists; keep as baseline. |
| LA-P0-02 | Spread period controls are visible but data-changing behavior is not proven. | Open | Tap period chips and prove odds/probability updates. |
| LA-P0-03 | Spread line value pill is visible but selector/rail behavior is not proven. | Open | Choose another line and prove sentence/odds/probability update. |
| LA-P0-04 | Totals selected value and rows are visible. | Partial | Tablet baseline exists. |
| LA-P0-05 | Totals line/period data-changing behavior is not proven. | Open | Tap/change and prove updated odds/probability. |
| LA-P0-06 | Ticket selected-line propagation is not proven on tablet. | Open | Open ticket after changed line/period. |
| LA-P0-07 | Order payload does not yet prove line/period fields. | Open | Unit/API or smoke summary. |
| LA-P0-08 | Portfolio/open order/activity do not yet preserve line/period. | Open | Tablet and backend proof. |

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
