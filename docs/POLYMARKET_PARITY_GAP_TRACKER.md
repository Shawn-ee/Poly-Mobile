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

## Cycle GT - Ticket Phone-Width Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| On the Samsung tablet proof device, the place-order keypad and amount controls stretched too wide compared with the phone-style Polymarket reference sheet. | P0 | Passed | Samsung tablet screenshot shows the ticket amount controls constrained to a centered phone-width column. |
| The swipe-up submit footer must remain full-width, dominant, and functional after the layout constraint. | P0 | Passed | Local MVP proof verified amount entry, `Swipe up to buy`, fake-token submit, and Portfolio/history. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GU - Portfolio Phone-Width Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| On the Samsung tablet proof device, Portfolio value/chart/tabs/rows stretched too wide compared with the phone-style Polymarket Portfolio reference. | P0 | Passed | Samsung tablet screenshot shows Portfolio content constrained to a centered phone-width column. |
| Portfolio Positions, Orders, History, Buy more, and Cash out must still work after the layout constraint. | P0 | Passed | Local MVP proof verified Portfolio position row, Buy more ticket, Cash out ticket, Orders empty state, and History row. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GV - Event Detail Phone-Width Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| On the Samsung tablet proof device, Event Detail chart, line cards, and market rows stretched too wide compared with the phone-style Polymarket game page reference. | P0 | Passed | Samsung tablet screenshots show Event Detail content constrained to a centered phone-width column. |
| Event Detail must still preserve chart/probability, line selector, ticket handoff, fake-token order, Portfolio, Orders, and History flow. | P0 | Passed | Local MVP proof verified selected line, ticket, fake-token submit, Portfolio, Orders, and History. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GW - Home Phone-Width Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| On the Samsung tablet proof device, Home discovery still used full-width tablet layout while Event Detail, ticket, and Portfolio now use phone-width columns. | P0 | Passed | Route-backed Home/Live discovery proof screenshot/XML show content constrained to a centered phone-width column. |
| Home must still open the Local MVP event flow through Event Detail, selected line, ticket, fake-token order, Portfolio, Orders, and History. | P0 | Passed | Samsung tablet full Local MVP proof and route-backed Home/Live discovery proof passed. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proofs passed. |

## Cycle GX - Ticket Default Simple Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The default place-order ticket still had a visible settings/advanced doorway even though the Local MVP ticket should be a simple amount-and-swipe flow. | P0 | Passed | `TradeTicket` removes the visible settings button; Samsung tablet XML fails if `ticket-settings` returns in the Local MVP ticket path. |
| Advanced trading-mode, market-depth, slippage, and estimate controls should not appear in the default retail ticket. | P0 | Passed | Local MVP proof checks initial, ready, Buy more, and Cash out ticket hierarchies do not include advanced ticket controls. |
| Simplifying the ticket must preserve event/outcome/line identity, amount entry, swipe submit, fake-token order, Portfolio, Orders, and History. | P0 | Passed | Samsung tablet Local MVP proof passed through selected line, ticket, fake-token submit, Portfolio action tickets, Orders, and History. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GY - Portfolio Tab Value And Label

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Bottom Portfolio tab showed only `$10K`, making the destination label less clear than the Polymarket-style value-plus-Portfolio tab. | P0 | Passed | `BottomTabs` now renders a two-line value plus `Portfolio` label; Samsung tablet screenshot/XML show `$10K` and `Portfolio`. |
| The Portfolio tab must remain testable as the Portfolio destination after the visible text change. | P0 | Passed | Accessibility label preserves `holiwyn-portfolio-tab`, `Portfolio`, `portfolio-tab-value-$10K`, and adds `portfolio-tab-label-visible`. |
| The nav label change must preserve ticket submit, Portfolio position, Buy more, Cash out, Orders, and History. | P0 | Passed | Samsung tablet Local MVP proof passed through the full end-to-end flow on port 8265. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle GZ - Event Detail Hide Volume Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail still showed visible volume text in the default game page, distracting from the retail prediction path. | P0 | Passed | Top body switch no longer shows `98,750 USDT Vol.`; Samsung tablet XML rejects the old visible string. |
| Team to Advance card still showed `$60.9K Vol.` instead of simple prediction context. | P0 | Passed | Card now shows `Winner market`; Samsung tablet XML rejects `$60.9K Vol.`. |
| Hiding volume must preserve line market selection, ticket, fake-token order, Portfolio, Orders, and History. | P0 | Passed | Samsung tablet Local MVP proof passed through selected spread line, ticket submit, Portfolio action tickets, Orders, and History on port 8267. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle HA - Event Detail Chart Probability Axis

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail chart axis still used money-looking labels `+$9`, `+$39`, and `+$479` on a probability chart. | P0 | Passed | Chart now renders `75%`, `50%`, and `25%`; Samsung tablet XML asserts `probability-axis` and rejects the old `+$` labels. |
| The chart-axis fix must preserve line market selection, ticket, fake-token order, Portfolio, Orders, and History. | P0 | Passed | Samsung tablet Local MVP proof passed through selected spread line, ticket submit, Portfolio action tickets, Orders, and History on port 8268. |
| The proof folder/script naming must match the active branch and actual work. | P0 | Passed | Evidence was written to `cycle-HA-event-detail-chart-probability-axis` while on `feature/event-detail-chart-probability-axis-retail-flow`. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle HB - Portfolio Value Curve Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio performance chart looked like a flat placeholder because account values were scaled against zero. | P0 | Passed | Chart now scales against the account-value range and exposes `portfolio-chart-scaled-account-range`; Samsung tablet screenshot shows visible green movement. |
| The Portfolio curve fix must preserve the Local MVP order result page, tabs, action tickets, and history. | P0 | Passed | Samsung tablet Local MVP proof passed through Portfolio, Buy more, Cash out, Orders, and History on port 8269. |
| Backend/API route should not change for this rendering correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |
| Real persisted Portfolio value-history route remains future backend work. | P1 | Tracked | Deterministic fallback still uses the backend-shaped value-history contract. |

## Cycle HC - Event Detail Card Simple Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Team to Advance card still showed non-functional `Graph / About` and `Line movement` placeholder content in the default Local MVP path. | P0 | Passed | Samsung tablet screenshot shows the simplified card with outcome buttons only; XML rejects `event-detail-line-detail-tabs`, `prediction-tabs-only`, `event-detail-inline-graph`, and `Line movement for Team to Advance`. |
| Simplifying the card must preserve outcome choices and downstream line-market/ticket/order/Portfolio flow. | P0 | Passed | Samsung tablet Local MVP proof passed through selected spread line, ticket submit, Portfolio action tickets, Orders, and History on port 8270. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |

## Cycle HD - Home Games-Only Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Home still exposed a Games/Futures switch even though the current Local MVP user path is game predictions only. | P0 | Passed | `HomeScreen` now renders a single Games header and game list; Samsung tablet XML rejects `world-cup-futures-tab`, `Futures`, and `World Cup winner`. |
| Home filters must continue to work after removing the default Futures branch. | P0 | Passed | Samsung tablet HomeFilter proof passed All, Live, and Today states on port 8273. |
| The proof folder/script naming must match the active branch and actual work. | P0 | Passed | `scripts/smoke-tablet.ps1 -HomeFilter` now forwards `OutputDir` and `HierarchyOutputDir`, writing evidence to `cycle-HD-home-games-only-retail-flow`. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, parser checks, and Android proof passed. |

## Cycle HE - Event Detail Hide Live Provider Copy

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Live Event Detail still rendered operational provider/source freshness copy in the default game page, outside the simple retail prediction path. | P0 | Passed | `EventDetail` now keeps provider status in hidden proof metadata and the Samsung tablet XML asserts `event-detail-live-provider-copy-hidden-local-mvp`. |
| The live page should reject visible provider/source freshness copy while preserving route/status metadata for future provider cycles. | P0 | Passed | LiveDetail proof rejects `Live provider ready`, `Refresh due`, `deterministic-status-fixture -`, and `polymarket-gamma -` on the top screen while preserving `live-data-status-*` and `live-data-source-*` labels. |
| Live outcome ticket and market-line reachability must still work after hiding the provider copy. | P0 | Passed | Samsung tablet proof opened a simple ticket from the visible AUS outcome and then verified Game Lines, Spread, Totals, and First Half Winner. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, parser checks, and Android proof passed. |

## Cycle HF - Ticket Swipe Required Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The ticket submit surface still allowed a normal tap even though the Polymarket-style retail flow requires an upward confirmation gesture. | P0 | Passed | `TradeTicket` uses a gesture-only submit surface and exposes `swipe-submit-tap-disabled`; Samsung tablet proof taps the surface and remains on the ticket. |
| The upward swipe must still place the fake-token order and land on Portfolio. | P0 | Passed | Samsung tablet Local MVP proof on port `8278` swiped from the blue footer, reached Portfolio, and verified position, Buy more, Cash out, Orders, and History. |
| The proof folder/script naming must match the active branch and actual work. | P0 | Passed | Evidence was written to `cycle-HF-ticket-swipe-required-retail-flow-final` while on `feature/ticket-swipe-required-retail-flow`. |
| Backend/API route should not change for this interaction correction. | P0 | Passed | No route/schema/request changes; typecheck, targeted tests, parser check, and Android proof passed. |
| Exact Polymarket native drag physics and blur depth are not fully matched. | P2 | Tracked | Interaction parity is gated; final pixel/native physics remain future polish. |

## Cycle HG - Event Detail Retail Market Copy

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Live Event Detail primary market card still showed demo/provider-like copy: `Live World Cup - prices moving`. | P0 | Passed | `EventDetail` now renders `Winner market`; Samsung tablet proof asserts `Winner market` and rejects the old copy. |
| Live ticket and market-line reachability must remain intact after the copy change. | P0 | Passed | Samsung tablet proof opened the live outcome ticket and verified Game Lines, Spread, Totals, and First Half Winner. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and Android proof passed. |
| Exact Polymarket live chart/touch physics remain future polish. | P2 | Tracked | Current cycle only corrected visible market copy. |

## Cycle HH - Live Discovery Games-Only Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Live discovery still showed visible operational refresh/freshness copy even though the Local MVP Live page should focus on live football games. | P0 | Passed | `LiveScreen` hides the visible status/refresh row and exposes `live-operational-controls-hidden-local-mvp` metadata instead. |
| Live discovery should reject visible `Updated just now`, `Refresh`, `5 markets`, `11 outcomes`, and `live-market-summary` strings. | P0 | Passed | Samsung tablet proof rejects the old visible strings and asserts structured `market-count-5` / `outcome-count-11` labels. |
| Live game card must still open Event Detail after hiding operational controls. | P0 | Passed | Samsung tablet proof tapped the live game and reached Event Detail with `Live Winner`, `Winner market`, and `Game Lines`. |
| Backend/API route should not change for this presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, parser checks, and Android proof passed. |

## Cycle HI - Event Detail Hide Single Market Switch

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail still showed a redundant single-tab body switch (`event-detail-body-switch` / `event-detail-body-tab-market`) even though the Local MVP game page has only the market body in scope. | P0 | Passed | `EventDetail` removes the visible body switch; Samsung tablet Local MVP XML rejects both old labels while preserving Game Lines, Spread, Totals, and ticket flow. |
| Hiding the switch must preserve the required Local MVP path through line market, simple ticket, fake-token order, Portfolio, Orders, and History. | P0 | Passed | Samsung tablet Local MVP proof passed on port `8287` through selected line, ticket-ready, tap-disabled swipe submit, Portfolio action tickets, Orders, and History. |
| Server-backed order proof must use the current swipe-submit interaction and route-backed chart/provider markers. | P0 | Passed | Server proof on port `8296` used backend health `ok`, `EXPO_PUBLIC_ORDER_MODE=server`, `EXPO_PUBLIC_MARKET_DATA_MODE=server`, swipe submit, `POST /api/orders`, Portfolio route chart data, and preserved Polymarket provider token/source identity. |
| Harness should not depend on stale prototype labels or partially clipped tablet rows. | P0 | Passed | Route proof now asserts `chart-source-polymarket-clob-prices-history` / `chart-status-ready`, uses swipe submit instead of tap submit, and adapts to the stable visible line-market target when the tablet exposes Team Total instead of Spread. |
| Backend/API route should not change for this presentation/harness correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, Local MVP Android proof, and server-backed Android proof passed. |

## Cycle HJ - Portfolio Open Order Landing

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| After a server-backed open order, Portfolio could show an empty Positions tab even though the user's new order existed under Orders. | P0 | Passed | Samsung tablet screenshot shows Orders selected with the open order row visible after swipe-submit server order. |
| Server-backed proof must require the visible open-order row, not just hidden count/metadata labels. | P0 | Passed | `scripts/smoke.ps1` now expects `portfolio-tab-orders portfolio-tab-selected` and `open-order-row-*`; proof passed on port `8297`. |
| Backend/API route should not change for this landing-state correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and Android server-backed proof passed. |

## Cycle HK - Portfolio Open Order Row Retail Flow

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The server-backed open-order row showed test/debug details and dense execution fields that made the result page feel messy for the Local MVP retail flow. | P0 | Passed | Samsung tablet screenshot shows the simplified order row with `open-order-row-retail-simple`. |
| The simplified row must still preserve order, provider, line, status, and cancel identity. | P0 | Passed | Server-backed proof on port `8298` verifies provider source/token, market type, line, period, open row, and cancel target identity. |
| Backend/API route should not change for this row presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and Android server-backed proof passed. |

## Cycle HL - Server Filled History Proof

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The server-backed filled order proof claimed History coverage but only verified the Portfolio position screen. | P0 | Passed | Primary Samsung S23 Totals filled proof now taps History and verifies `portfolio-tab-history portfolio-tab-selected` plus `activity-row-*`. |
| Filled trade History must preserve selected market, line, period, and Polymarket provider token/source identity. | P0 | Passed | Final S23 proof on port `8306` verifies totals market type, line `2.5`, period, provider source, and token through the History row. |
| Backend/API route should not change for this proof-gate correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and Android server-filled proof passed. |

## Cycle HM - Ticket Retail Order Screen Parity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The order ticket header was visually awkward compared with Polymarket's compact mobile order page. | P0 | Passed | `TradeTicket` now renders `ticket-retail-order-header` with close, flag, event/outcome text, and a right-side settings icon; S23 screenshot shows the compact header. |
| The visible settings/filter icon must not be a dead button. | P0 | Passed | S23 proof taps `ticket-settings` and verifies `ticket-settings-panel ticket-settings-state-open` with Order type, Odds, and Available details. |
| The amount-first keypad and swipe-submit flow must still work after the layout change. | P0 | Passed | S23 proof on port `8312` enters amount, shows `Swipe up to buy`, submits the server-backed fake-token order, and reaches Portfolio History. |
| Backend/API route should not change for this ticket presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and Android server-filled proof passed. |

## Cycle HN - Portfolio Result Content Landing

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| After a server-backed filled order, Portfolio could land at the account header/chart while the actual position or history row was below the fold. | P0 | Passed | `Portfolio` exposes `portfolio-result-content-landing` and scrolls post-order results into view; S23 screenshot shows the `position-card-*` row directly on screen. |
| The filled order History tab must also show the completed trade row without forcing the user to hunt below the header. | P0 | Passed | S23 proof taps History and the screenshot/XML show `activity-row-*` on screen. |
| The Local MVP path must still preserve the simple ticket, upward swipe, server-backed fake-token order, Portfolio, and History flow. | P0 | Passed | S23 proof on port `8313` passed through `POST /api/orders`, Portfolio position, and History activity with selected line/provider identity. |
| Backend/API route should not change for this result-landing correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and Android server-filled proof passed. |
| Exact Polymarket Portfolio header/chart spacing remains future visual polish. | P2 | Tracked | This cycle only fixes the P0 visibility issue after order completion. |

## Cycle HO - Portfolio Position Actions Phone Fit

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The filled position row's Cash out and plus action area could clip on the S23 after result landing. | P0 | Passed | `Portfolio` now renders `portfolio-position-actions-fit-phone`; S23 screenshot shows the value, Cash out, and plus button fully inside the viewport. |
| The result-scrolled proof must still verify route-backed portfolio value/chart state. | P0 | Passed | Row-level proof metadata exposes `portfolio-chart-source-portfolio-value-history-route` and `portfolio-chart-status-ready` in the same S23 hierarchy capture. |
| The Local MVP path must still preserve swipe ticket submit, server-backed fake-token fill, Portfolio position, and History activity. | P0 | Passed | S23 proof on port `8316` passed through the server-filled totals flow and verified `position-card-*` plus `activity-row-*`. |
| Backend/API route should not change for this phone-width layout correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and Android server-filled proof passed. |
| Exact Polymarket Portfolio typography remains future visual polish. | P2 | Tracked | This cycle focused on phone-width usability and action visibility. |

## Cycle HP - Event Detail Header Team Identity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Route-backed live Event Detail showed the same `BRE` code for both provider fixture teams, making side identity unclear. | P0 | Passed | `EventDetail` now derives distinct `BHO` and `BAW` codes; S23 top/line-market screenshots and XML show both codes. |
| The live header repeated raw `Live` clock text instead of showing a clean status and clock. | P0 | Passed | S23 screenshot shows `Live` and `67:00` as separate readable lines without the repeated raw `Live · 67:00` string. |
| Header identity proof must run inside the same server-backed Local MVP trade path. | P0 | Passed | S23 proof on port `8318` verifies `event-detail-header-team-identity-fit`, opens the Totals ticket, submits with swipe, and reaches Portfolio History. |
| Backend/API route should not change for this header correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and Android server-filled proof passed. |
| Exact Polymarket flags/team artwork remain future visual polish. | P2 | Tracked | This cycle focused on clear side identity and live-time readability. |

## Cycle HQ - Event Detail Prediction-Only Lower Page

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail still exposed lower-page non-MVP sections (`Market Rules`, `More Events`) while the current product path should focus on prediction and trading only. | P0 | Passed | `EventDetail` now hides those sections and exposes `event-detail-non-prediction-lower-content-hidden-local-mvp`; S23 XML rejects the old lower-page copy. |
| Removing lower-page content must not break the line-market ticket path. | P0 | Passed | S23 proof on port `8321` still reaches the Totals row, opens the simple ticket, submits by swipe, and reaches Portfolio History. |
| The proof should recover when the S23 lands on nearby Spread rows before Totals. | P0 | Passed | `scripts/smoke.ps1` now performs a fine-scroll scan before asserting the route-backed Totals row. |
| Backend/API route should not change for this Local MVP presentation correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and Android server-filled proof passed. |
| Future rules/compliance UX remains separate from the Local MVP betting path. | P2 | Tracked | The content is hidden by default, not replaced with a production rules system. |

## Cycle HS - Ticket Swipe Screen Parity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Ticket amount screen looked messy compared with Polymarket and did not clearly separate dark keypad body from the swipe submit zone. | P0 | Passed | `TradeTicket` now uses a dark rounded body panel and fixed red/pink footer; S23 screenshots show the separated sections. |
| The keypad bottom row and red swipe area could overlap on S23. | P0 | Passed | S23 ticket-ready screenshot shows amount, payout, odds, presets, and all keypad rows visible above the footer. |
| Swipe icon should visibly track upward gesture progress, not only jump after threshold. | P0 | Passed | `SwipeSubmitControl` computes `handleLift` from `swipeProgress` and exposes progress/translate markers while retaining threshold-only submit. |
| Backend/order logic should not change for this visual/interaction correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and S23 server-filled proof passed. |
| Exact native Polymarket drag physics and blur treatment remain future polish. | P2 | Tracked | This cycle implements progress-based handle movement and matched screen structure, not native app physics parity. |

## Cycle HT - Portfolio History Retail Row

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio History activity rows were visually dense and less Polymarket-like after a filled ticket. | P0 | Passed | `Portfolio` now renders `portfolio-history-retail-row-parity` with compact action, Yes/No pill, outcome, event, market/line, amount, and time. |
| Long provider fixture titles made History rows truncate important market/outcome information. | P0 | Passed | History rows now shorten event titles to team abbreviations such as `HOM vs GOA` and keep `Total Goals 2.5` as its own subtitle. |
| Backend/API route should not change for this visible row correction. | P0 | Passed | No route/schema/request changes; typecheck, parser check, and S23 server-filled proof passed. |
| Overall Portfolio header/chart spacing is still not full Polymarket parity. | P1 | Tracked | This cycle only closes the post-trade History row readability gap. |

## Cycle HU - Event Detail Retail Chart Surface

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail chart area still exposed chart outcome/point/filter controls and live-match strip clutter in the default Local MVP surface. | P0 | Passed | S23 top screenshot and XML in `cycle-HU-event-detail-retail-chart-surface-s23-proof-final-pass` show `event-detail-chart-retail-surface-fit` with the visible clutter removed. |
| Chart interaction should feel more like pressing the chart to inspect probability movement, not tapping separate debug chips. | P0 | Passed | `event-detail-chart-touch-surface` is present in the S23 hierarchy and cycles selected chart points while keeping point/filter chips hidden from the visible default surface. |
| The visible user path must remain Home/Event Detail/line market/ticket/order/Portfolio History with no order-book UI. | P0 | Passed | S23 proof passed through Totals ticket, swipe-submit, Portfolio, and History while asserting Local MVP order-book markers are absent. |
| Backend/API route should not change for this visible chart correction. | P0 | Passed | No backend file changed; `npm run typecheck`, `scripts/smoke.ps1` parser check, and S23 server-filled proof passed. |
| Exact Polymarket chart animation/time-range parity remains future work. | P1 | Tracked | This cycle removes structural clutter and adds chart-surface tap behavior, not full native charting parity. |

## Cycle HV - Portfolio Position Row Retail Density

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio Positions row still used an oversized market icon and loose row spacing after filled-ticket proof. | P0 | Passed | S23 Portfolio screenshot/XML in `cycle-HV-portfolio-position-row-retail-density-s23-proof` show `portfolio-position-retail-density-fit` with tighter row sizing. |
| Cash out and buy-more actions must remain visible and tappable after compacting the row. | P0 | Passed | S23 proof still verifies `portfolio-position-actions-fit-phone` and the action buttons are visible in the Portfolio screenshot. |
| Backend/API route should not change for this visible row correction. | P0 | Passed | No backend files changed; `npm run typecheck`, `scripts/smoke.ps1` parser check, and S23 server-filled proof passed. |
| Overall Portfolio header/chart parity remains future work. | P1 | Tracked | This cycle targets the filled position row, not the account header. |

## Cycle HW - Event Detail Player Props Blank MVP Gate

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Player Props was visible as a tab but not proven as a deliberate blank MVP state. | P0 | Passed | S23 proof taps Player Props and verifies `event-detail-player-props-blank-local-mvp`. |
| Tapping Player Props must not expose fake/unbuilt markets or ticket/order affordances. | P0 | Passed | Smoke proof rejects route-backed line outcome/ticket markers and order-book UI while on the Player Props blank state. |
| Returning to Game Lines must preserve the line-market ticket/order path. | P0 | Passed | S23 proof returns to Game Lines, rescans to Totals, opens the ticket, swipe-submits, and reaches Portfolio History. |
| Backend/API route should not change for this blank-state proof gate. | P0 | Passed | No backend files changed; `npm run typecheck`, `scripts/smoke.ps1` parser check, and S23 server-filled proof passed. |

## Cycle HX - Ticket Header Retail Readability

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Ticket header used provider-like/truncated event text instead of a readable event matchup when opening route-backed line tickets. | P0 | Passed | S23 ticket screenshot/XML show `ticket-header-retail-readable` and matchup-style `Breadth Home vs ...` copy instead of the provider slug. |
| Selected outcome/line text should not immediately truncate on S23. | P0 | Passed | S23 ticket screenshot shows `Yes - Over 2.5 RT` wrapped and readable. |
| Backend/API route should not change for this ticket-header correction. | P0 | Passed | No backend files changed; `npm run typecheck`, `scripts/smoke.ps1` parser check, and S23 server-filled proof passed. |

## Cycle HY - Ticket Swipe Reference Layout

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Ticket amount-entry screen needed a clearer Polymarket-like dark keypad body separated from the fixed red/pink swipe submit area. | P0 | Passed | S23 ticket-ready screenshot shows `ticket-retail-reference-layout`, `ticket-body-rounded-above-swipe`, `ticket-keypad-swipe-separated`, and `ticket-swipe-area-fixed-bottom`. |
| The S23 screen must show the full keypad, including `.`, `0`, and backspace, without overlap from the swipe area. | P0 | Passed | Final S23 screenshot `cycle-HY-ticket-swipe-reference-layout-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png` shows all keypad rows above the pink swipe band. |
| Swipe icon should move with gesture progress and submit only after a threshold. | P0 | Passed | `SwipeSubmitControl` translates the handle from `swipeProgress`, exposes `swipe-submit-handle-progress-motion`, keeps tap disabled, and the S23 proof submits only after the upward swipe command. |
| Backend/order logic should not change for this ticket layout correction. | P0 | Passed | No backend files changed; `npm run typecheck`, `scripts/smoke.ps1` parser check, and S23 server-filled proof passed. |
| Exact native Polymarket blur/physics and final flag artwork remain future polish. | P2 | Tracked | This cycle targets layout, keypad visibility, and threshold swipe interaction. |

## Cycle HZ - Portfolio Ticket Amount Integrity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| After the reference-style `$75` ticket, the server-filled Portfolio proof could show only a partial filled cost such as `27.6 USDT`. | P0 | Passed | Mobile proof wrappers now seed enough deterministic counterparty asks for the `$75` order to fully fill. |
| Portfolio Positions must show the same user-submitted ticket amount after the server-backed fake-token fill. | P0 | Passed | S23 proof requires `Cost 75 USDT`; final screenshot shows `Cost 75 USDT` and `75 USDT +0 USDT`. |
| Selected market/line/provider identity must still survive the full route-backed ticket/order/Portfolio/history path. | P0 | Passed | Final S23 proof still verifies totals `portfolio-market-type`, `portfolio-line-2.5`, `portfolio-period-Reg. Time`, and Polymarket provider token/source markers. |
| Backend/API routes should not change for this proof-data integrity correction. | P0 | Passed | No backend route/schema changed; `POST /api/orders` and `GET /api/portfolio` contracts remain the same. |

## Cycle IA - Portfolio History Fill Aggregation

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| One retail ticket that fills against multiple maker asks appeared as multiple separate Portfolio History rows. | P0 | Passed | S23 History screenshot in `cycle-IA-portfolio-history-fill-aggregation-s23-proof` shows one `Bought Yes Over 2.5 RT` row with `75 USDT`. |
| Portfolio History proof should distinguish a grouped user action from a single raw fill. | P0 | Passed | S23 XML contains `portfolio-history-fill-count-3` on the single visible activity row. |
| Selected line/provider identity must remain preserved after aggregation. | P0 | Passed | S23 XML still verifies totals market type, `line-2.5`, `Reg. Time`, Polymarket provider source, and provider token on the grouped row. |
| Backend route should eventually provide durable order/execution grouping instead of requiring a mobile time-window fallback. | P1 | Tracked | `GET /api/portfolio/history` currently has recent trade IDs but no durable `orderId`/`executionGroupId`; mobile supports optional `orderId` when the backend adds it. |

## Cycle IB - Portfolio Header Retail Density

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio top header/chart/range area consumed too much phone height and had weak S23 proof coverage. | P0 | Passed | S23 `portfolio-top` screenshot/XML in `cycle-IB-portfolio-header-retail-density-s23-proof-final` show `portfolio-header-retail-density`, value/cash line, chart, range selector, and tabs in one phone view. |
| Deposit/Withdraw must stay hidden from the Local MVP Portfolio surface. | P0 | Passed | The new S23 top proof requires `portfolio-funding-hidden-local-mvp` and rejects visible `Deposit` / `Withdraw`. |
| The full trade path must still reach Portfolio History after the header density change. | P0 | Passed | Same S23 proof completes route-backed line ticket, upward swipe buy, Portfolio, and History with selected line/provider identity. |
| Exact Polymarket Portfolio typography/watermark composition remains future visual polish. | P2 | Tracked | This cycle addresses S23 density and proof coverage, not final account-page art direction. |

## Cycle IC - Event Detail Core Lines First

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Expanded half-winner markets could dominate the Game Lines area before the user reached the core line-market ticket path. | P0 | Passed | S23 line-market proof shows `1st Half Winner` and `2nd Half Winner` as collapsed headers; smoke rejects expanded half rows such as `Breadth Home 1H` and `Tie 1H`. |
| The route-backed totals line ticket path must remain reachable after reducing half-market clutter. | P0 | Passed | Same S23 proof verifies `ticket-source-backend-line-market`, totals line `2.5`, provider source/token identity, and opens the totals ticket. |
| The full Local MVP trade path must still pass. | P0 | Passed | S23 proof completes totals ticket, upward swipe buy, Portfolio, Portfolio top, and grouped History. |
| Exact Polymarket market ordering and collapse animation remain future polish. | P2 | Tracked | This cycle changes default expansion state only; it does not implement native collapse animation. |

## Cycle IJ - Trade Ticket S23 Swipe Reference

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The ticket amount-entry screen needed a stronger Polymarket-like full-screen split between the dark amount/keypad body and fixed pink swipe area. | P0 | Passed | S23 ticket-ready screenshot in `cycle-IJ-trade-ticket-s23-swipe-reference-proof-final` shows the dark body with rounded lower corners above the pink footer. |
| The S23 screen must show amount, `to win`, odds/balance, presets, and every keypad row without overlap from the swipe area. | P0 | Passed | S23 XML verifies `ticket-s23-keypad-clearance`; screenshot `cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png` shows `.`, `0`, and backspace fully above the footer. |
| Swipe handle should visibly move with upward gesture progress and submit only past threshold. | P0 | Passed | `SwipeSubmitControl` translates the handle from gesture progress, exposes `swipe-submit-handle-progress-animated`, and S23 proof captures `cycle-EY-holiwyn-route-server-mvp-totals-ticket-swipe-progress.png` before the order lands in Portfolio History. |
| Backend/order logic should not change for this ticket layout correction. | P0 | Passed | No backend route/schema changed; `POST /api/orders`, `GET /api/portfolio`, and Portfolio History proof still pass. |
| Exact Polymarket native physics and real team flag artwork remain future polish. | P2 | Tracked | This cycle improves S23 layout, copy, spacing, and gesture feedback without implementing native physics parity. |

## Cycle IK - Event Detail Local MVP Tab Rail

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail default market rail still advertised non-MVP tabs (`Exact Score`, `Halves`) even though the current user flow should focus on core line markets plus blank Player Props. | P0 | Passed | S23 line-market XML in `cycle-IK-event-detail-local-mvp-tab-rail-s23-proof` verifies `event-detail-market-tabs-local-mvp`, `exact-score-hidden-local-mvp`, and `half-tabs-hidden-local-mvp`. |
| Default Local MVP rail must not expose `Exact Score` or `Halves` as tappable tabs. | P0 | Passed | Smoke gate rejects `event-detail-exact-score-tab`, `event-detail-halves-tab`, visible `Exact Score`, and visible `Halves` in the route-backed line-market proof. |
| Player Props blank state and return to Game Lines must still work. | P0 | Passed | S23 proof taps Player Props, captures `cycle-EY-holiwyn-route-server-mvp-player-props-blank.png`, returns to Game Lines, and opens the totals ticket. |
| Full Local MVP trade path must still pass after the rail cleanup. | P0 | Passed | S23 proof completes totals ticket, swipe buy, Portfolio, Portfolio top, and History. |
| Legacy exact-score/half-specific component branches remain for future non-MVP work. | P2 | Tracked | This cycle hides them from the default rail rather than deleting legacy paths. |

## Cycle IL - Event Detail Core Lines Order

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Full-game line markets should appear before half-specific markets in the default Local MVP Game Lines flow. | P0 | Passed | S23 proof verifies `event-detail-core-full-game-lines-before-halves-local-mvp` and checks `Full Game Team Total Goals` appears before `1st Half Winner`. |
| Reordering market groups must not break Player Props blank state or return-to-Game-Lines behavior. | P0 | Passed | Same proof taps Player Props, verifies the blank state, returns to Game Lines, and rechecks the line hierarchy. |
| Reordering market groups must not break the route-backed ticket/order/Portfolio path. | P0 | Passed | Same S23 proof opens the totals ticket, captures swipe progress, submits the fake-token buy, and reaches Portfolio History. |
| Backend/API routes should not change for this visible ordering correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Exact Polymarket ordering for all lower-priority soccer market sections and native collapse animation remain future polish. | P2 | Tracked | This cycle specifically closes full-game-before-half hierarchy in the current MVP Game Lines surface. |

## Cycle IM - Portfolio Settings Action

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio header showed a visible settings gear that did not perform a user-visible action. | P0 | Passed | `Portfolio` now opens `portfolio-settings-sheet portfolio-settings-state-open local-mvp-account-sheet` from the gear. |
| The settings action must stay Local MVP scoped and must not expose deposit/withdraw, location, social, or notification work. | P0 | Passed | S23 proof verifies language, fake-token mode, and funding-disabled rows while absence checks still reject visible `Deposit` and `Withdraw`. |
| Closing settings must return Portfolio to the normal trade-result flow. | P0 | Passed | S23 proof closes `portfolio-settings-close`, verifies `portfolio-settings-state-closed`, then continues to Portfolio History. |
| Backend/API routes should not change for this visible action correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Full account/settings parity remains future work. | P2 | Tracked | This cycle removes the dead button while keeping the Local MVP scope focused on fake-token betting flow. |

## Cycle IN - Portfolio Header Dollar Value

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio top account value looked like an internal token ledger (`10,000 USDT`) instead of the Polymarket-style portfolio value header. | P0 | Passed | `Portfolio` now renders the top account value/cash line with `portfolio-header-dollar-value`; S23 screenshot shows `$10,000`, `+$0`, and `$9,925 cash`. |
| The fake-token/order rows must keep their existing USDT/order identity after changing only the account header. | P0 | Passed | Same S23 proof still completes route-backed ticket, `Cost 75 USDT` position/history expectations, and Portfolio History. |
| Settings action must remain functional after header formatting changes. | P0 | Passed | Same S23 proof opens and closes the Portfolio settings sheet. |
| Backend/API routes should not change for this visible formatting correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Full Portfolio typography/chart/row parity remains future work. | P2 | Tracked | This cycle narrows the account value header only. |

## Cycle IO - Portfolio First Position Visibility

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| After a trade, the Portfolio header/chart/tabs consumed too much S23 first-screen height, leaving the resulting position row mostly buried near the bottom navigation. | P0 | Passed | `Portfolio` now tightens header/chart/range/tab vertical spacing and exposes `portfolio-first-position-first-screen-fit`; S23 screenshot shows the first position row visible below tabs. |
| Density change must preserve account value, chart, range selector, settings action, position identity, and History. | P0 | Passed | Same S23 proof verifies Portfolio header, settings open/close, selected totals line/provider identity, and History. |
| Backend/API routes should not change for this visible density correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Exact native Portfolio chart curve and final pixel polish remain future work. | P2 | Tracked | This cycle specifically closes post-trade first-screen result visibility. |

## Cycle IP - Event Detail Sticky Tab Clearance

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The sticky Game Lines tab rail could visually cut into market content while the user scrolled through line markets. | P0 | Passed | `EventDetail` now adds sticky shell clearance and the S23 line-market screenshot shows the Spread group starting cleanly below the sticky rail. |
| Sticky-tab spacing change must preserve Player Props blank state, totals ticket, swipe submit, Portfolio, and History. | P0 | Passed | Same S23 proof verifies Player Props blank, route-backed totals ticket, upward swipe buy, Portfolio settings, and History. |
| Backend/API routes should not change for this visible layout correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Exact native sticky-header scroll physics remain future work. | P2 | Tracked | This cycle closes visible clearance in the line-market scroll proof. |

## Cycle IQ - Ticket Market Icon Identity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Non-team line tickets could show a large generic color block in the order header, making the ticket feel unfinished. | P0 | Passed | `TradeTicket` now uses deliberate market-type fallback icons; S23 totals ticket shows `%` and XML verifies `ticket-market-icon-totals`. |
| Team tickets should still preserve inferred team flag behavior. | P0 | Passed | The new helper only applies fallback icons when `teamCodeForTicket` does not infer a team flag; existing `ticket-outcome-flag-MEX` gates remain unchanged. |
| Header icon change must preserve amount entry, swipe submit, Portfolio, and History. | P0 | Passed | Same S23 proof completes route-backed totals ticket, upward swipe buy, Portfolio settings, and History. |
| Backend/API routes should not change for this visible header identity correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Exact production market/team artwork remains future work. | P2 | Tracked | This cycle removes the obvious generic placeholder for non-team line tickets. |

## Cycle IR - Trade Ticket S23 Swipe Tightening

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Ticket amount-entry screen needed to more closely match the Polymarket reference with a dark body, clear amount/keypad, and separated red/pink swipe footer. | P0 | Passed | S23 ticket-ready screenshot in `cycle-IR-trade-ticket-s23-swipe-tightening-proof-final2` shows full keypad, rounded dark body, and separated footer. |
| Swipe footer must not overlap the keypad or amount display on Samsung S23. | P0 | Passed | S23 XML verifies `ticket-s23-safe-vertical-fit`, `ticket-s23-keypad-footer-gap`, and `ticket-swipe-footer-fixed-separate`; screenshot shows `.`, `0`, and backspace above the footer. |
| Swipe handle should visibly move upward with gesture progress and submit only after threshold. | P0 | Passed | `SwipeSubmitControl` exposes `swipe-submit-handle-vertical-travel`; S23 mid-swipe screenshot captures the handle lifted before the order lands in Portfolio History. |
| Long fixture/provider event titles should not create a messy truncated ticket header. | P0 | Passed | `TradeTicket` compacts `Breadth Home vs Breadth Away` to `BHO vs BAW`; S23 XML verifies `ticket-event-title-compact-matchup`. |
| Backend/order logic should not change for this ticket layout correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, and S23 server-filled proof passed through `POST /api/orders`, Portfolio, and History. |
| Exact native Polymarket physics/blur and production artwork remain future polish. | P2 | Tracked | This cycle targets layout, spacing, header clarity, and visible gesture progress only. |

## Cycle IS - Portfolio History Market Icon Identity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio History rows for non-team line markets still used a generic action arrow, making the completed trade feel disconnected from ticket and position market identity. | P0 | Passed | `Portfolio` now renders `portfolio-history-market-icon-totals`; S23 screenshot shows `%` on the completed totals History row. |
| History icon change must preserve selected market, line, period, provider, amount, and timestamp. | P0 | Passed | S23 XML verifies totals market type, line `2.5`, `Reg. Time`, Polymarket provider source/token, `75 USDT`, and timestamp in the same row. |
| Full Local MVP trade path must still pass after the History row icon change. | P0 | Passed | S23 proof completes Event Detail, totals ticket, upward swipe buy, Portfolio, settings, and History. |
| Backend/API routes should not change for this visible history-row correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, and S23 server-filled proof passed. |
| Exact production market/team artwork remains future work. | P2 | Tracked | This cycle uses existing market-type icons until production artwork exists. |

## Cycle IT - Event Detail Line Section Clean Start

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail could show a clipped leftover market fragment directly under the sticky Game Lines/Player Props rail, making the first visible section look broken. | P0 | Passed | `EventDetail` now adds a dark clean-start separator; S23 line-market screenshot in `cycle-IT-event-detail-line-section-clean-start-s23-proof-final2` shows the first market group starting cleanly below the sticky rail. |
| The clean-start fix must remain proofable after switching to Player Props and returning to Game Lines. | P0 | Passed | S23 XML verifies `event-detail-line-section-clean-start`, `event-detail-no-clipped-market-fragment`, and `event-detail-sticky-tab-content-clearance` in both the initial and returned line-market checks. |
| Event Detail spacing change must not break the route-backed ticket/order/Portfolio path. | P0 | Passed | Same S23 proof completes route-backed totals ticket, visible swipe-progress capture, server-backed fake-token order, Portfolio, settings, and History. |
| Backend/API routes should not change for this visible layout correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Exact native sticky-header scroll physics remain future work. | P2 | Tracked | This cycle closes the obvious clipped-fragment issue in the current Local MVP Game Lines screen. |

## Cycle IU - Event Detail Line Header Density

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Team-total line-market header was too long and wrapped like an internal backend label instead of a compact Polymarket-style market title. | P0 | Passed | `EventDetail` now renders `Team Total Goals`; S23 team-total XML verifies `event-detail-line-header-compact-retail`, `visible-title-Team Total Goals`, and `BHO goals over 1.5 - Reg. Time`. |
| Compact visible title must preserve the full market identity used by ordering/proof and ticket handoff. | P0 | Passed | The same XML still includes `Full Game Team Total Goals (Reg. Time)`, selected line `1.5`, provider source, and provider market/condition IDs. |
| Header density change must not break the route-backed ticket/order/Portfolio path. | P0 | Passed | S23 full-flow totals proof completes ticket, visible swipe-progress capture, server-backed fake-token order, Portfolio, settings, and History. |
| Backend/API routes should not change for this visible naming correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 proof passed. |
| Exact market naming for every Polymarket soccer line remains future work. | P2 | Tracked | This cycle targets the most visibly bulky team-total header only. |

## Cycle IV - Portfolio Compact Event Identity

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio result rows could inherit long provider fixture titles instead of compact event identity after a route-backed fake-token trade. | P0 | Passed | `Portfolio` now renders `BHO 0 - BAW 0` in the Positions row; S23 XML verifies `portfolio-event-title-compact-provider`. |
| Portfolio History should use the same compact event identity as the position row. | P0 | Passed | S23 History XML verifies `portfolio-history-event-title-compact-provider` and visible `BHO vs BAW`. |
| Compact visible labels must preserve selected market, line, period, provider, amount, and timestamp. | P0 | Passed | Same S23 proof still verifies totals market type, line `2.5`, `Reg. Time`, Polymarket provider source/token, `75 USDT`, and History timestamp. |
| Backend/API routes should not change for this visible Portfolio identity correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Production event/team artwork and exact live score formatting remain future work. | P2 | Tracked | This cycle targets the current provider-breadth MVP event identity only. |

## Cycle IW - Trade Ticket S23 Swipe Layout

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Place-order amount screen still needed stronger S23 separation between the dark keypad body and red swipe footer. | P0 | Passed | `TradeTicket` now applies a fixed red/pink footer below a rounded dark panel; S23 ticket-ready screenshot in `cycle-IW-trade-ticket-s23-swipe-layout-final` shows the full keypad above the footer. |
| Keypad bottom row and swipe area must not overlap on Samsung S23. | P0 | Passed | S23 XML shows the dark ticket body ending at `[0,0][1080,1752]`, keypad ending at `[66,912][1014,1500]`, and swipe footer starting at `[0,1752][1080,2340]`; screenshot shows `.`, `0`, and backspace fully visible. |
| Swipe handle should visibly move upward with gesture progress while text remains centered. | P0 | Passed | `SwipeSubmitControl` uses progress-linked `translateY`; S23 swipe-progress screenshot shows the handle lifted above the centered `Swipe to buy` label before threshold completion. |
| Swipe submit should remain threshold-gated and not become a normal tap button. | P0 | Passed | Existing `swipe-submit-gesture-required` / `swipe-submit-tap-disabled` labels remain, and the same S23 proof completes only after the scripted upward swipe. |
| Backend/order logic should not change for this ticket layout correction. | P0 | Passed | No backend route/schema/order logic changed; `npm run typecheck`, `git diff --check`, and S23 server-filled proof passed through `POST /api/orders`, Portfolio, and History. |
| Exact native Polymarket blur/physics and production artwork remain future polish. | P2 | Tracked | This cycle targets visible layout, spacing, and gesture motion only. |

## Cycle IX - Portfolio Compact Outcome Label

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio position rows exposed ticket shorthand such as `Over 2.5 RT` as visible text, making the row feel more internal than Polymarket-style. | P0 | Passed | `Portfolio` now renders visible `Yes Over 2.5`; S23 position screenshot and XML verify `portfolio-position-outcome-compact-label`. |
| Portfolio History rows should use the same cleaner visible outcome title while preserving full order-time identity. | P0 | Passed | S23 History screenshot shows `Bought Yes Over 2.5`; XML verifies `portfolio-history-outcome-compact-label` plus hidden `portfolio-display-label-Over 2.5 RT` and `portfolio-period-Reg. Time`. |
| Compact visible labels must not drop selected line, period, provider, token, amount, or timestamp identity. | P0 | Passed | Same S23 proof still verifies totals market type, line `2.5`, `Reg. Time`, Polymarket provider source/token, `75 USDT`, and timestamp in Portfolio History. |
| Backend/API routes should not change for this visible Portfolio label correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Exact final Portfolio typography/pixel polish remains future work. | P2 | Tracked | This cycle targets visible outcome-title cleanup only. |

## Cycle IY - Portfolio Dollar Row Amounts

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio position rows still showed fake-token `USDT` notation in the row body, which looked less like the Polymarket mobile Portfolio reference. | P0 | Passed | `Portfolio` now renders visible row cost/current value/PnL/to-win amounts with `$` notation; S23 XML verifies `portfolio-row-dollar-amounts` and visible `Cost $75`. |
| Portfolio History amount should use the same simple dollar notation while preserving full order identity. | P0 | Passed | S23 History XML verifies `portfolio-history-dollar-amounts`, visible `$75`, hidden `portfolio-display-label-Over 2.5 RT`, `portfolio-period-Reg. Time`, and provider source/token metadata. |
| Dollar formatting must not change order amount, selected line, period, provider token, or fake-token backend contracts. | P0 | Passed | The same S23 server-filled proof completes the `$75` ticket, server-backed order, Portfolio position, settings, and History while preserving hidden line/provider identity. |
| Backend/API routes should not change for this visible Portfolio amount correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Exact final Portfolio typography/pixel polish remains future work. | P2 | Tracked | This cycle targets visible amount notation only. |

## Cycle IZ - Portfolio Range Watermark S23 Fit

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio chart range selector plus Holiwyn watermark was too wide on Samsung S23, leaving the watermark clipped at the right edge. | P0 | Passed | `Portfolio` now uses a phone-fit range/watermark row; S23 `portfolio-top` screenshot shows the cube and `Holiwyn` watermark inside the viewport. |
| The range selector must remain visible and tappable after the row is tightened. | P0 | Passed | S23 XML verifies `portfolio-range-tabs-first-screen-fit`, `portfolio-range-watermark-s23-fit`, and `portfolio-section-tabs` in the same top Portfolio proof. |
| Range/watermark layout must not break the route-backed ticket/order/Portfolio path. | P0 | Passed | Same S23 server-filled proof completes Event Detail, totals ticket, swipe submit, Portfolio, settings, and History. |
| Backend/API routes should not change for this visible Portfolio layout correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Exact watermark opacity and final chart physics remain future work. | P2 | Tracked | This cycle targets S23 clipping only. |

## Cycle JA - Portfolio Position Gap S23 Fit

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Post-trade Portfolio landing had a large blank gap between the Positions tab rail and the first position row. | P0 | Passed | Hidden proof nodes now render after visible content; S23 XML shows `portfolio-section-tabs` ending at y=624 and `position-card` beginning at y=627. |
| Harness-only sync/count/latest-order metadata must remain available after removing the visible gap. | P0 | Passed | S23 XML still includes `latest-order-card`, `portfolio-position-count`, and `portfolio-open-order-count` lower in the hierarchy. |
| The full route-backed ticket/order/Portfolio/History path must still pass after proof-node relocation. | P0 | Passed | S23 proof completes Event Detail, totals ticket, swipe submit, Portfolio, settings, and History. |
| Backend/API routes should not change for this visible Portfolio layout correction. | P0 | Passed | No backend route/schema changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed. |
| Exact Polymarket row spacing and typography remain future work. | P2 | Tracked | This cycle closes the obvious blank area only. |

## Cycle JC - Trade Ticket Swipe Reference Tightening

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Place-order screen needed closer Polymarket-style separation between the dark amount/keypad body and bottom red/pink swipe area. | P0 | Passed | `TradeTicket` keeps the body and footer as separate panels with rounded lower dark corners; S23 ticket-ready screenshot in `cycle-JC-trade-ticket-swipe-s23-proof-final` shows full keypad and fixed red footer without overlap. |
| Swipe handle movement needed to feel gesture-progress-linked, not like a static button state. | P0 | Passed | `SwipeSubmitControl` uses explicit threshold/progress constants and progress-linked `translateY`; S23 swipe-progress screenshot shows the arrow lifted upward while the label stays centered. |
| Swipe-to-buy should submit only after a clear upward gesture threshold. | P0 | Passed | S23 proof completes the fake-token order only after the scripted upward swipe; XML verifies `swipe-submit-gesture-required`, `swipe-submit-tap-disabled`, and `swipe-submit-threshold-clear`. |
| S23 amount/keypad and swipe footer must not overlap. | P0 | Passed | S23 ticket-ready screenshot shows `.`, `0`, and backspace fully visible above the rounded dark panel edge and fixed red footer. |
| Backend/order logic should not change for this visible ticket correction. | P0 | Passed | No backend route/schema/order service changed; `npm run typecheck`, `git diff --check`, and S23 server-filled proof passed through `POST /api/orders`, Portfolio, and History. |
| Exact native Polymarket blur/physics and production team artwork remain future polish. | P2 | Tracked | This cycle targets amount-entry layout, spacing, and swipe-progress behavior only. |

## Cycle JD - Portfolio History Relative Time

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio History rows showed absolute timestamp text instead of compact Polymarket-style relative time. | P0 | Passed | `Portfolio` now renders recent history row time as `Just now` / `min. ago` / `hr. ago`; S23 History screenshot in `cycle-JD-portfolio-history-relative-time-s23-proof` shows `Just now`. |
| Raw timestamp identity should remain available for proof/debugging. | P0 | Passed | S23 XML verifies `activity-time-raw-...` metadata next to the visible relative time. |
| Android proof should not depend on an exact minute string during a long proof run. | P0 | Passed | `scripts/smoke.ps1` now checks `portfolio-history-relative-time-format` instead of exact `Just now`; the visible screenshot still captured `Just now`. |
| Backend/API routes should not change for this visible Portfolio History correction. | P0 | Passed | No backend route/schema/order service changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 server-filled proof passed through `POST /api/orders`, Portfolio, and History. |
| Exact Polymarket Portfolio typography and older-history grouping remain future polish. | P2 | Tracked | This cycle targets visible timestamp formatting only. |

## Cycle JE - Event Detail Compact Chart Trade Rail

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Event Detail chart selected-market handoff used a large framed card, making the game page feel more like a dashboard than Polymarket's compact mobile game page. | P0 | Passed | `EventDetail` now renders a compact transparent chart trade strip; S23 top screenshot in `cycle-JE-event-detail-compact-chart-trade-rail-s23-proof` shows the card frame and `Selected market` eyebrow removed. |
| Compact rail must still preserve selected market/outcome identity and ticket handoff. | P0 | Passed | S23 XML verifies `event-detail-chart-contract-compact-strip`, selected chart contract/market/outcome labels, and `event-detail-chart-open-ticket`. |
| The chart rail change must not break the Local MVP trade path. | P0 | Passed | Same S23 server-filled proof completes Event Detail, line market, ticket, swipe submit, Portfolio, settings, and History. |
| Backend/API routes should not change for this visible Event Detail correction. | P0 | Passed | No backend route/schema/order service changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 proof passed. |
| Exact Polymarket chart physics and tooltip behavior remain future polish. | P2 | Tracked | This cycle targets the visible chart handoff density only. |

## Cycle JF - Event Detail Primary Outcome Colors

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Primary match-winner outcomes used two blue buttons/traces, while the Polymarket reference uses clear green/red trading colors for the opposing sides. | P0 | Passed | `EventDetail` now applies a green/red presentation pair for the first two primary outcomes; S23 top screenshot in `cycle-JF-event-detail-primary-outcome-colors-s23-proof` shows green BHO and red BAW across the header, chart, Trade button, and primary outcome buttons. |
| Color presentation must not mutate selected market/outcome identity or ticket handoff. | P0 | Passed | S23 XML verifies `event-detail-primary-outcome-retail-green-red`, selected chart contract/market/outcome labels, and `event-detail-chart-open-ticket`; full ticket/order proof still preserves provider/line identity. |
| The color change must not affect line-market row behavior. | P0 | Passed | Same S23 proof completes line-market navigation, totals ticket amount entry, server-backed fake-token order, Portfolio, settings, and History. |
| Backend/API routes should not change for this visible Event Detail correction. | P0 | Passed | No backend route/schema/order service changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 proof passed. |
| Exact team color sourcing and production artwork remain future polish. | P2 | Tracked | This cycle targets primary binary winner color semantics only. |

## Cycle JG - Portfolio Position To-Win Payout

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio position row repeated current/cost value for `To win`, making a $75 buy at 46% show `To win $75` instead of payout-style economics. | P0 | Passed | `Portfolio` now derives `To win` from filled shares or entry cost/probability; S23 screenshot in `cycle-JG-portfolio-position-to-win-payout-s23-proof` shows `To win $163.04`. |
| Payout display must preserve selected line, period, provider, and order identity. | P0 | Passed | S23 XML verifies `portfolio-position-to-win-payout`, market type, line `2.5`, `Reg. Time`, Polymarket provider source/token, and the position card. |
| The payout display change must not break the Local MVP trade path. | P0 | Passed | Same S23 proof completes Event Detail, line market, ticket, swipe submit, Portfolio, settings, and History. |
| Backend/API routes should not change for this visible Portfolio correction. | P0 | Passed | No backend route/schema/order service changed; `npm run typecheck`, PowerShell parser check, `git diff --check`, and S23 proof passed. |
| Exact Polymarket Portfolio typography remains future polish. | P2 | Tracked | This cycle targets payout semantics only. |

## Cycle JH - Trade Ticket S23 Red Swipe Footer

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Ticket amount/keypad panel and swipe submit area can visually compete on S23 when the footer is too close to the keypad. | P0 | Passed | S23 ticket-ready screenshot shows the keypad fully visible above the fixed red/pink footer with rounded dark-panel lower corners. XML verifies `ticket-dark-keypad-panel-fixed-clearance` and `ticket-red-footer-s23-reference-tightened`. |
| Swipe handle needs clearly visible upward motion during the gesture. | P0 | Passed | S23 swipe-progress screenshot shows the handle lifted above the centered `Swipe to buy` text. XML verifies `swipe-submit-handle-long-travel` and `swipe-submit-handle-s23-visible-travel`. |
| Swipe-to-buy must submit only after an upward threshold gesture. | P0 | Passed | S23 proof checks tap-disabled state, captures swipe progress, then completes the upward swipe to Portfolio/history. |
| Backend/order logic should not change for this visual ticket tightening. | P0 | Passed | No backend route/schema/order service changed; the same S23 proof completes `POST /api/orders`, Portfolio, and History through the existing server-backed fake-token flow. |
| Exact native Polymarket blur/armed transition remains future polish. | P2 | Tracked | This cycle targets layout separation and visible gesture travel, not native blur parity. |

## Cycle JI - Portfolio Result Landing Header

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| After a successful trade, Portfolio jumped to a deep scroll offset and the S23 screenshot cut off the account avatar/value header, unlike the Polymarket Portfolio reference. | P0 | Passed | S23 screenshot in `cycle-JI-portfolio-result-landing-header-s23-proof` starts at avatar, username, large value, cash line, chart, range tabs, and tabs. XML verifies `portfolio-result-lands-at-account-header`. |
| The result landing still needs to show the position row and preserve Portfolio/history flow. | P0 | Passed | Same S23 screenshot shows the created position row below the tabs, and the proof reaches Portfolio History. |
| Backend/order logic should not change for this Portfolio landing correction. | P0 | Passed | No backend route/schema/order service changed; the same proof completes existing `POST /api/orders`, `GET /api/portfolio`, and Portfolio History flow. |
| Exact Portfolio pixel polish remains future work. | P2 | Tracked | This cycle targets the result landing position only. |

## Cycle JJ - Portfolio Position Market Context

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio totals position title was too terse after previous shorthand cleanup: `Yes Over 2.5` lacked the simple market context Polymarket shows in position rows. | P0 | Passed | S23 screenshot in `cycle-JJ-portfolio-position-market-context-s23-proof` shows `Yes Over 2.5 total goals`; XML verifies `portfolio-position-market-context-readable`. |
| The clearer visible label must preserve hidden order-time identity and provider mapping. | P0 | Passed | S23 XML still includes `portfolio-display-label-Over 2.5 RT`, `portfolio-line-2.5`, `portfolio-period-Reg. Time`, provider source, and provider token. |
| Backend/order logic should not change for this visible Portfolio row correction. | P0 | Passed | No backend route/schema/order service changed; the same proof completes existing `POST /api/orders`, `GET /api/portfolio`, and Portfolio History flow. |
| Exact Portfolio row typography remains future work. | P2 | Tracked | This cycle targets row wording only. |

## Cycle JK - Portfolio History Market Context

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| Portfolio History totals row still used terse shorthand `Bought Yes Over 2.5` after the Positions row had been corrected. | P0 | Passed | S23 History screenshot in `cycle-JK-portfolio-history-market-context-s23-proof` shows `Bought Yes Over 2.5 total goals`; XML verifies `portfolio-history-market-context-readable`. |
| The clearer History title must preserve hidden order-time identity, amount, timestamp, and provider mapping. | P0 | Passed | S23 XML still includes amount `$75`, `Just now`, `portfolio-display-label-Over 2.5 RT`, `portfolio-line-2.5`, `portfolio-period-Reg. Time`, provider source, and provider token. |
| Backend/order logic should not change for this visible History row correction. | P0 | Passed | No backend route/schema/order service changed; the same proof completes existing `POST /api/orders`, `GET /api/portfolio`, and Portfolio History flow. |
| Exact History row typography remains future work. | P2 | Tracked | This cycle targets row wording only. |

## Cycle JL - Trade Ticket S23 Reference Tightening

| Gap | Priority | Status | Evidence |
| --- | --- | --- | --- |
| The ticket amount/keypad section needs more S23-safe vertical room above the fixed red/pink submit area. | P0 | Passed | Final S23 screenshot in `cycle-JL-trade-ticket-s23-reference-tightening-proof-final2` shows the full keypad above the fixed red footer; XML verifies `ticket-s23-reference-no-overlap` and `ticket-red-footer-s23-reference-compact`. |
| The swipe chevron should rest above the red footer label and visibly travel upward with the gesture. | P0 | Passed | `SwipeSubmitControl` exposes `swipe-submit-handle-starts-near-footer-top` and transform-linked gesture labels; final S23 proof captures the corrected footer layout and threshold swipe. |
| Swipe-to-buy must remain threshold-gated and cannot become a tap submit. | P0 | Passed | S23 route proof checks tap-disabled state, then completes the upward swipe to server-backed fake-token order, Portfolio, and History. |
| Backend/order logic should not change for this visible ticket correction. | P0 | Passed | No backend route/schema/order service changed; `npm run typecheck`, parser check, `git diff --check`, and S23 route proof passed. |
| Exact native Polymarket blur/physics remains future work. | P2 | Tracked | This cycle targets S23 layout separation and moving-handle affordance only. |
