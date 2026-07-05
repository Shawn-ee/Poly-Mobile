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

## Cycle GD - Home And Live World Cup Games Focus

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Home first screen still exposed non-World-Cup sport navigation and a futures promo before game discovery. | P0 | Passed | `HomeScreen` now renders `home-world-cup-games-focus` and removes the default `SportNav`/`FeaturedFuture` surfaces. |
| Route-backed Live discovery needed the same World Cup games focus because this proof path lands on Live. | P0 | Passed | `LiveScreen` now renders `live-world-cup-games-focus`; Samsung tablet proof passed. |
| Discovery proof should fail if non-MVP sport/futures promo surfaces reappear before game discovery. | P0 | Passed | `LocalMvpHomeRouteTicketFlow` asserts `MLB`, `Tennis`, `featured-future-*`, and `future-market-chart` are absent. |
| Route-backed discovery card must still open Event Detail and a simple spread ticket. | P0 | Passed | Samsung tablet proof opened Event Detail and a provider-backed spread ticket from the route-backed card. |

## Cycle GE - Portfolio Retail MVP Tightening

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio still exposed Deposit/Withdraw controls even though funding is out of scope for the Local MVP. | P0 | Passed | Funding controls are hidden in `Portfolio`; Android absence proof passed on Samsung tablet. |
| Position rows used a hard-coded `PAR 0 - FRA 0` score line regardless of the traded event. | P0 | Passed | Score line now derives from the event title; Android proof verified `MEX 0 - ECU 0`. |
| Portfolio needed another audit pass against the user-provided July 4 Portfolio screenshots. | P0 | Passed | Audit doc updated and tablet proof passed for Positions, Orders, and History. |

## Cycle GF - Ticket Retail Amount Sheet Tightening

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The Local MVP ticket proof still normalized old `Order review / LINE / PERIOD / SHARES / TO WIN` wording despite the Polymarket reference being a simple amount sheet. | P0 | Passed | Ticket hierarchy text and smoke gate updated; Samsung tablet proof passed with absence checks. |
| Ticket outcome separator could render poorly on Android paths because the source used a bullet separator. | P0 | Passed | Separator changed to ASCII hyphen; Android proof captured the updated ticket. |
| Ticket must keep selected market/line/outcome identity after removing review wording. | P0 | Passed | Machine-readable identity labels were preserved and submit-to-Portfolio proof passed. |

## Cycle GG - Discovery Card Retail Outcome Rail

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Home/Live discovery cards still looked like generic data cards instead of simple retail prediction cards. | P0 | Passed | Added a two-button outcome rail; route-backed Android proof passed. |
| Visible Volume/Liquidity stats distracted from the Local MVP retail path. | P0 | Passed | Stats moved to hidden proof metadata; Android proof no longer requires visible `Volume:` or `Liquidity:`. |
| Route-backed card must still open Event Detail and the simple ticket path after the visual card change. | P0 | Passed | Samsung tablet proof opened Event Detail and a simple spread ticket from the updated discovery card. |

## Cycle GH - Discovery Rail Direct Ticket Proof

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Outcome rail needed proof that it opens the ticket directly, not only that it renders on the card. | P0 | Passed | Smoke taps `event-outcome-retail-*`; Samsung tablet proof passed. |
| Old hidden row-style outcome layout should not remain in the rendered MVP card hierarchy. | P0 | Passed | Old row style changed to `display: none`; tablet proof used the rail path. |
| Card tap still needs to open Event Detail after direct rail ticket close. | P0 | Passed | Smoke closes the rail ticket and continues through card-to-detail; Android proof passed. |

## Cycle GI - Live Discovery Games First

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Live page still showed operational market/outcome summary pills above the game cards. | P0 | Passed | Summary moved to hidden proof metadata; Samsung tablet proof passed. |
| Live page must keep route-backed game cards and ticket path after summary removal. | P0 | Passed | Smoke gate passed through rail ticket, card-to-detail, and spread ticket. |
| Backend/data contract should not change for this presentation-only cycle. | P0 | Passed | No API or backend route changed. |

## Cycle GJ - Home Discovery No Watchlist

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Home discovery still exposed Saved/watchlist controls even though watchlists are outside the Local MVP betting flow. | P0 | Passed | `HomeScreen` removes Saved filter and stops passing save props to Home cards; Samsung tablet proof passed. |
| Route-backed discovery proof should fail if watchlist controls reappear. | P0 | Passed | `LocalMvpHomeRouteTicketFlow` checks absence of `home-filter-saved`, `save-event-`, and `home-saved-empty`; proof `cycle-GJ-local-mvp-home-route-ticket-flow-proof.json` passed. |
| Backend/API contracts should not change for this presentation-only cleanup. | P0 | Passed | No backend route, request body, response field, or storage contract changed. |

## Cycle GK - Portfolio Action Ticket Proof

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio plus/buy-more action needed Android proof that it opens the simple Buy ticket from an existing position. | P0 | Passed | Samsung tablet proof taps `position-trade-buy-*` and verifies the Buy ticket with preserved line identity. |
| Visible Portfolio Cash out closed the position directly instead of routing through the Sell ticket. | P0 | Passed | Cash out now calls `openPositionTrade(position, "sell")`; Samsung tablet proof verifies the Sell ticket opens. |
| Sell ticket handoff could lose No-side contract identity when the caller passed only `side="sell"`. | P0 | Passed | `openTicket` resolves missing `contractSide` from explicit side, and `openPositionTrade` forwards stored position selection; proof verifies `ticket-contract-side-no`. |
| Backend/API route should not change for this handoff cycle. | P0 | Passed | Existing order route/data contract remains unchanged. |

## Cycle GL - Portfolio Cash-Out Sell Submit

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio Cash out could open a Sell ticket, but submit behavior was not proven from that visible path. | P0 | Passed | Samsung tablet proof submits the Portfolio Cash out ticket with swipe. |
| Local mock cash-out sell would otherwise behave like a new sell position instead of removing the source position. | P0 | Passed | `sourcePositionId + sell` removes the original local position; Android proof verifies `No positions yet` and no `position-card-`. |
| Latest order and History need to preserve Sell/No line-market identity after cash-out submit. | P0 | Passed | Smoke checks latest order/history `portfolio-side-sell`, `portfolio-contract-side-no`, line `2.5`, period `1st Half`, and display label `MEX -2.5 1H`. |
| Backend/API route should not change for this local fake-token cycle. | P0 | Passed | No backend route, request body, response field, or schema changed. |

## Cycle GM - Portfolio Action Ticket Amount Reset

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio action tickets could inherit a stale nonzero amount from a prior ticket. | P0 | Passed | `TradeTicket` reset dependencies now include `sourcePositionId` and selected line identity; Samsung tablet proof passed. |
| Buy more and Cash out tickets should show `Choose an amount` until the user enters a fresh amount. | P0 | Passed | Smoke proof verifies both Portfolio action tickets show `$0`/`Choose an amount` and fail if either immediately shows `Swipe up to buy/sell`. |
| Backend/API route should not change for this mobile-only state reset. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GN - Portfolio Team Flag Identity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio position row used a hard-coded France-style flag even when the selected position was `MEX -2.5 1H`. | P0 | Passed | `Portfolio` now derives `MEX` from the selected line/title and renders `portfolio-position-flag-MEX`; Samsung tablet proof passed. |
| Position icon fix must not break Cash out, Buy more, Orders, or History proof. | P0 | Passed | Local MVP trade-flow smoke passed through Portfolio action tickets, Orders, and History. |
| Backend/API route should not change for this visual identity correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GO - Ticket Team Flag Identity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Ticket header still used a generic color square while Polymarket's order page shows the selected team flag/icon. | P0 | Passed | `TradeTicket` now derives `MEX` from existing ticket identity fields and renders `ticket-outcome-flag-MEX`; Samsung tablet proof passed. |
| Ticket flag fix must preserve amount entry, swipe-submit, Portfolio, Orders, and History behavior. | P0 | Passed | Local MVP trade-flow smoke passed through initial ticket, amount entry, submit, Portfolio action tickets, Orders, and History. |
| Backend/API route should not change for this visual identity correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GP - Portfolio History Time Meta

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| History row showed amount but did not present the activity timestamp in the right-side meta stack like the Polymarket reference. | P0 | Passed | `Portfolio` renders `PortfolioActivity.timestamp` beside the amount; Samsung tablet proof shows `portfolio-history-time Just now`. |
| History timestamp fix must preserve the full local MVP order-to-history path. | P0 | Passed | Local MVP trade-flow smoke passed through Home/Event Detail, selected line, ticket, fake-token order, Portfolio, Orders, and History. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GQ - Event Detail Simple Chart Trade Rail

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail chart area still showed operational provider/fallback status as prominent visible text instead of simple retail trading information. | P0 | Passed | Samsung tablet screenshot shows simplified `Selected / Mexico / Current 64% / Trade`; chart route state remains hidden proof metadata. |
| Chart selected team/probability label could overlap outcome chips on the Event Detail screenshot. | P0 | Passed | Chart label moved lower/right with constrained width; tablet screenshot no longer shows the previous fallback warning pill and keeps the selected label separated from the rail. |
| Simplifying the chart rail must preserve ticket open and Portfolio/history flow. | P0 | Passed | Local MVP trade-flow smoke asserted `event-detail-simple-chart-trade-rail`, then passed through ticket, fake-token order, Portfolio, Orders, and History. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GR - Event Detail Market Status Hidden

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail line-market headers still showed backend/provider availability text such as `Market live` in the default retail betting UI. | P0 | Passed | Samsung tablet screenshot shows Spread and Totals headers without the visible `Market live` pill; availability remains hidden proof metadata. |
| Hiding availability status must preserve line selectors, outcome rows, and ticket flow. | P0 | Passed | Full Local MVP trade-flow proof passed through selected line, ticket, fake-token order, Portfolio, Orders, and History. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GS - Event Detail Line Card Actions

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Team to Advance line card still showed extra icon-only actions after Graph/About that are not part of the Local MVP betting path. | P0 | Passed | Samsung tablet screenshot shows only `Graph` and `About`; extra icon strip removed. |
| The line card must still expose Graph/About context and downstream ticket flow. | P0 | Passed | Smoke asserted `prediction-tabs-only`; full Local MVP trade-flow proof passed through ticket, order, Portfolio, Orders, and History. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |
