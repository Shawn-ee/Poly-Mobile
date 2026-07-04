# Polymarket Parity Gap Tracker

## Local MVP Scope

Current priority is the retail user flow:

Home -> Event Detail -> chart/probability -> line selector -> Buy/Sell ticket -> fake-token order -> Portfolio/history.

Order book, chat, live stats, deposits, withdrawals, location checks, notifications, and nonessential social features are not default MVP blockers.

## Cycle FM - Trade Ticket Clarity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Ticket review information is too hidden compared with Polymarket's bottom-sheet order confirmation flow. | P0 | Passed | `TradeTicket` now shows market type, line, period, price, shares, and payout in a visible order review card. Tablet smoke passed. |
| Ticket must preserve selected market/line/outcome identity through order submit. | P0 | Existing support preserved | `submitTicketOrder` still receives `selection`, `contractSide`, market, outcome, side, and amount. |
| Swipe-up submit needs physical-device proof after visible ticket changes. | P0 | Passed | `npm run smoke:tablet:event-detail-trade` passed on Samsung tablet. |
| Exact Polymarket animation/gesture polish. | P2 | Deferred | Swipe-style submit exists; detailed animation parity is later polish. |

## Cycle FN - Submit To Portfolio Proof

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The Local MVP flow needs one Android proof that connects selected line -> ticket review -> submit -> Portfolio/history. | P0 | Passed | `smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8218` passed on Samsung tablet. |
| Ticket review must remain visible in the same proof that submits the order. | P0 | Passed | The smoke now asserts `ticket-order-review`, line, period, shares, payout, `ticket-order-review-payout`, and `place-mock-order`. |
| Portfolio must preserve selected spread line identity after submit. | P0 | Passed | Portfolio proof asserts spread market family/type, line `2.5`, period `1st Half`, buy side, contract side `yes`, latest order, latest activity, and position card. |
| Server-backed Portfolio sync for this exact UI path. | P1 | Deferred | This cycle is mock/fake-token proof only; server-mode cycles are separate. |

## Cycle FO - Place Order Sheet Simplification

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Ticket looked cluttered compared with the Polymarket place-order sheet. | P0 | Passed | `TradeTicket` now uses a simple event/outcome header, large amount, compact Yes/No toggle, odds/balance line, +5/+10/Max presets, sparse keypad, and blue swipe area. |
| User-facing ticket showed too much internal order-review data under the event. | P0 | Passed | The bulky visible review card is removed from the visual layout; identity remains in accessibility labels for testing. |
| Swipe-up submit interaction should remain the primary submit method. | P0 | Passed | Existing `SwipeSubmitControl` remains, now presented as a large blue bottom zone. Tablet ticket smoke passed. |
| Exact Polymarket gradient/blur animation. | P2 | Deferred | Current implementation uses a flat blue submit zone and the existing slide modal. |

## Cycle FP - Full-Screen Place Order Sheet

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Place-order UI still exposed the Event Detail page behind the ticket, making it feel like a partial bottom sheet instead of the reference full-screen order flow. | P0 | Passed | `TradeTicket` now uses a full-screen opaque modal and fills the viewport. Tablet proof screenshot shows no Event Detail content behind the order surface. |
| Swipe-up submit area should feel dominant and clearly separated from amount entry. | P0 | Passed | Blue footer height increased and the swipe target is taller while preserving the existing swipe/push submit control. Tablet proof passed. |
| Exact Polymarket blur/gradient transition during swipe arm. | P2 | Deferred | The MVP uses a flat blue full-width submit zone and existing armed-state highlight. |

## Cycle FQ - Portfolio Reference Layout

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio looked like a generic internal dashboard instead of the Polymarket account/value page. | P0 | Passed | `Portfolio` now has profile, large portfolio value, P/L/cash line, chart, range selector, action buttons, and tabs. Tablet proof passed. |
| Positions/Orders/History were not presented as the primary page structure. | P0 | Passed | Added local tab state and Polymarket-like tab row. Tablet proof tapped Orders and History. |
| Position rows were too dense and card-like compared with Polymarket. | P0 | Passed | Position rows now show event/outcome/cost/to-win/entry/value/chance with Cash out and plus actions. |
| Real portfolio performance chart history route. | P1 | Deferred | Current chart is deterministic UI proof only; backend history contract is still future work. |
| App shell header/promo controls still appear above the Portfolio surface on tablet proof, unlike the cleaner Polymarket screenshot. | P1 | Deferred | Needs a broader app-shell/navigation cycle, not only Portfolio internals. |
| Exact Polymarket chart curve, avatar gradient, watermark, and animation polish. | P2 | Deferred | Current cycle focuses on layout and tab behavior. |

## Cycle FR - Portfolio Shell Parity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| App shell header/promo controls appeared above the Portfolio surface, unlike Polymarket's full-screen Portfolio page. | P0 | Passed | `App.tsx` no longer renders the shared `Header` when `mainTab === "portfolio"`. Tablet proof asserts header controls are absent. |
| Bottom tab navigation must remain available from Portfolio. | P0 | Passed | Header condition changed only the shared top header; tablet proof shows bottom tab navigation remains available. |
| Exact native status bar/top spacing match. | P2 | Deferred | Needs final device polish after more page parity cycles. |

## Cycle FS - Portfolio Range Selector Interaction

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio chart range selector was static text instead of an interactive control. | P0 | Passed | `Portfolio` now tracks `activeRange` and each range is a tappable `Pressable`. Tablet proof taps `1W`. |
| Chart needs a selected range identity that future backend data can target. | P0 | Passed | Chart accessibility label includes `portfolio-performance-chart-range-{range}` and tablet proof verifies `portfolio-performance-chart-range-1W`. |
| Real portfolio history time series per range. | P1 | Deferred | Requires a future backend route for account value history. |

## Cycle FT - Portfolio Value History Contract

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio chart used local UI-only range state with no backend-shaped data contract. | P0 | Passed | Added `PortfolioValueHistory` types, `PolyApi.getPortfolioValueHistory`, and deterministic fallback service. Typecheck and targeted unit tests passed. |
| Chart proof should expose source/status/point count for future backend replacement. | P0 | Passed | `PortfolioSparkline` accessibility label includes `portfolio-chart-source-*`, `portfolio-chart-status-*`, and `portfolio-chart-point-count-*`; Android proof verifies the `1W` fallback state. |
| Real persisted backend account value history route. | P1 | Deferred | Mobile contract exists; backend route/schema still needed. |

## Cycle FU - Portfolio Value History Backend Route

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Backend route for Portfolio chart range data. | P1 | Narrowed | Main backend now has `GET /api/portfolio/value-history?range=1D|1W|1M|All` and focused Jest coverage. |
| Mobile server-mode wiring to consume backend value history. | P1 | Open | `Portfolio` still renders deterministic fallback data; next mobile cycle should fetch the route and prove `portfolio-chart-source-portfolio-value-history-route` on Android. |
| Persisted exact account-value snapshots. | P2 | Open | Current backend route reconstructs history from market outcome snapshots and current balances/positions. |

## Cycle FV - Portfolio Value History Server Wiring

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Mobile server-mode wiring to consume backend value history. | P1 | Passed | Samsung tablet server-filled proof passed and captured `portfolio-chart-source-portfolio-value-history-route`, `portfolio-chart-status-ready`, filled position, and provider/line identity in Portfolio. |
| Local/mock fallback should remain stable when backend history is unavailable. | P0 | Passed | `Portfolio` clears server history on request failure and continues rendering deterministic fallback. Existing local smoke still expects `portfolio-chart-source-deterministic-mobile-fallback`; targeted tests/typecheck passed. |
| Persisted exact account-value snapshots. | P2 | Open | Backend route still reconstructs history from existing data rather than a dedicated account performance table. |
