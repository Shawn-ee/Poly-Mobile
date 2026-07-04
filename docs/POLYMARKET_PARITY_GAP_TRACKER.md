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

## Cycle FW - Data-Driven Portfolio Sparkline

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio chart still looked like a static placeholder after backend wiring. | P1 | Passed | `PortfolioSparkline` now plots returned value-history points and exposes `portfolio-chart-data-driven`. |
| Server-backed range change needs visible Android proof. | P1 | Passed | Samsung tablet proof taps `1W` and verifies `portfolio-performance-chart-range-1W`, `portfolio-chart-source-portfolio-value-history-route`, `portfolio-chart-status-ready`, and `portfolio-chart-point-count-7`. |
| Press tooltip / exact Polymarket chart interaction. | P2 | Open | This cycle improves the visible line and data source. Tooltip/touch readout remains future chart polish. |

## Cycle FX - Portfolio Chart Touch Readout

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio chart had no user inspection behavior after becoming data-driven. | P1 | Passed | Tapping the chart selects a point and displays `portfolio-chart-readout` with selected index/value. |
| Server-backed chart touch needs Android proof. | P1 | Passed | Samsung tablet proof taps `1W`, then taps the chart and verifies `portfolio-chart-touchable`, `portfolio-chart-selected-index-3`, `portfolio-chart-selected-value-10000`, and backend route source. |
| Continuous drag tooltip and exact Polymarket chart gesture physics. | P2 | Open | Current MVP supports tap-to-select; drag gesture polish remains future work. |

## Cycle FY - Portfolio Visual Density Parity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio still looked busier than the Polymarket screenshots because proof/status details were visible in position and history rows. | P0 | Passed | Internal order-time snapshot/status/execution details are now kept in accessibility labels or hidden proof nodes instead of visible row content. Tablet buy-flow proof passed. |
| Portfolio avatar and position leading icon looked too flat compared with reference. | P0 | Passed | Added gradient-style profile avatar and flag-style position/history leading visuals. Tablet proof verifies `portfolio-gradient-avatar` and `portfolio-position-flag`. |
| Portfolio chart readout was visible by default instead of appearing after touch. | P0 | Passed | `PortfolioSparkline` now renders `portfolio-chart-readout` only after the user taps the chart. Existing chart touch proof remains supported. |
| Range selector row lacked the faint brand watermark structure from reference. | P0 | Passed | Added `portfolio-brand-watermark` with Holiwyn branding, not Polymarket branding. Tablet proof verifies the marker. |
| Exact native gradient/chart physics and final pixel parity. | P2 | Open | Deferred until after core MVP user-flow parity stabilizes. |

## Cycle FZ - Trade Ticket Swipe Confirmation

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Local MVP proof still submitted by tapping the order node even though the reference uses swipe-up confirmation. | P0 | Passed | `LocalMvpTradeFlow` now submits with an upward footer-local `adb input swipe`; tablet proof passed on port 8239. |
| Ticket submit control did not expose proof-friendly swipe state. | P0 | Passed | `SwipeSubmitControl` now exposes `swipe-submit-gesture-required`, state, progress, and handle labels; tablet XML proof includes the labels. |
| Blue submit footer looked flatter than the reference swipe zone. | P1 | Passed | Added layered blue footer bands and an armed handle state; tablet screenshot proof passed. |
| Exact native blur/continuous gesture physics and removing tap fallback entirely. | P2 | Open | Tap fallback remains for accessibility and legacy smoke flows. |

## Cycle GA - Bottom Navigation Portfolio Value

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Bottom Portfolio tab still showed a generic `Portfolio` label instead of Polymarket's account-value style label. | P0 | Passed | `BottomTabs` now renders compact `accountPortfolioValue` such as `$10K`; tablet XML proof passed. |
| Tests still need a stable Portfolio destination label after visible text changes. | P0 | Passed | Accessibility label preserves `Portfolio`, `holiwyn-portfolio-tab`, and adds `portfolio-tab-value-*`; tablet proof verifies `portfolio-tab-value-$10K`. |
| Exact Polymarket tab icon, badge, and animation polish. | P2 | Open | Deferred. |

## Cycle GB - Event Detail Chart Ticket Handoff

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail chart interaction was not part of the main Local MVP proof before opening a ticket. | P0 | Passed | `LocalMvpStatusFlow` taps Target, verifies selected chart point/readout, and opens the chart Trade ticket on Samsung tablet. |
| Chart point selection needed a visible state near the selected contract, not only a tooltip. | P0 | Passed | `EventDetail` renders `event-detail-chart-contract-point` with selected point/value; tablet XML proof passed. |
| Chart Trade handoff should preserve selected point/contract identity while keeping orderbook hidden by default. | P0 | Passed | Chart Trade accessibility includes `chart-selected-point-*`; smoke asserts ticket opens and hidden orderbook labels stay absent. |
| Exact Polymarket continuous chart press/drag tooltip physics. | P2 | Open | Deferred. |

## Cycle GC - Event Detail Prediction-Only MVP

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Default Event Detail still exposed non-MVP social controls despite Local MVP being prediction-only. | P0 | Passed | `EventDetail` now hides Chat, Share, Live stats, and chat preview entry points; Samsung tablet proof passed. |
| Local MVP proof should fail if social/live-stats/orderbook controls reappear in the default prediction path. | P0 | Passed | `LocalMvpStatusFlow` asserts those labels are absent while chart, ticket, and market lines still work. |
| Future full social/chat/share parity. | P2 | Open | Out of current Local MVP scope. |
