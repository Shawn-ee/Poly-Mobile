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
