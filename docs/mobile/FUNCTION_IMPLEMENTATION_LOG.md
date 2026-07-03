# Function Implementation Log

Purpose: document the app functions, services, API calls, state transitions, and limitations involved in each mobile feature cycle.

## Cycle T - Whole-App Navigation And Page Map

Feature/page worked on:

- Whole-app navigation and page map.
- Primary bottom tabs.
- Header account/profile access.

Frontend components touched:

- `mobile/App.tsx`
- `mobile/src/components/BottomTabs.tsx`
- `mobile/src/components/Header.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `App()` state orchestration.
- `setMainTab()` transitions between `home`, `live`, `portfolio`, `search`, and `account`.
- `Header({ openAccount })` callback now routes to the existing Account screen.
- `BottomTabs()` now renders only primary Polymarket-equivalent tabs: Home, Live, Portfolio, Search.
- `Assert-HierarchyDoesNotContain()` smoke helper verifies removed/deprecated controls are not present.
- `WholeAppNavDiscovery` smoke flow now opens Account through `header-account-action`.

User interactions supported:

- Tap Home bottom tab.
- Tap Live bottom tab.
- Tap Portfolio bottom tab.
- Tap Search bottom tab.
- Tap Account/Profile header button.
- Use Home World Cup rail and Games/Futures section through existing Home controls.

State transitions:

- `mainTab: "home" -> "live"` when tapping `holiwyn-live-tab`.
- `mainTab: "live" -> "portfolio"` when tapping `holiwyn-portfolio-tab`.
- `mainTab: "portfolio" -> "search"` when tapping `holiwyn-search-tab`.
- `mainTab: "search" -> "account"` when tapping `header-account-action`.
- `mainTab: "account" -> "home"` when tapping `holiwyn-home-tab`.
- `worldCupTab` remains controlled separately as `games` or `futures`.
- `selectedEvent` still hides the header/bottom nav when an event detail page is open.

Known limitations:

- Account/profile is reachable from the header but still uses Holiwyn's prototype account shell.
- Back-stack behavior is still simple React state, not a full native navigation stack.
- Scroll restoration across tabs is not yet Polymarket-level and remains P1.
- Deep link route restoration is smoke-oriented and remains P2.

## Cycle U - Event Page Top Shell/Action Controls

Feature/page worked on:

- Event page top shell/action controls.
- Top book/order-book action.
- Share sheet action.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `EventDetail()` top action row.
- `setOrderBookVisible(true)` now runs from `event-detail-top-order-book`.
- Existing `event-detail-order-book-close` closes the Order Book overlay.
- Existing `event-detail-share` opens the share sheet.
- Existing `event-detail-share-dismiss` closes the share sheet.
- `EventDetailActions` smoke proof now waits for Order Book visibility instead of using a brittle fixed delay.

User interactions supported:

- Tap top book icon on the event page.
- View Order Book for the selected event's primary market.
- Close the Order Book and return to the same event page.
- Tap the share icon.
- Dismiss the share sheet and preserve event context.

State transitions:

- `orderBookVisible: false -> true` from top book tap.
- `orderBookVisible: true -> false` from close tap.
- `shareSheetVisible: false -> true` from share tap.
- `shareSheetVisible: true -> false` from dismiss tap.
- `selectedEvent` and selected event detail tab remain unchanged through both overlays.

Known limitations:

- This focused pass does not complete the full Market/Event page.
- Native OS share parity is deferred.
- World Cup-specific Polymarket top-shell reference needs recapture once the reference app clears location verification.
- Order Book content is still derived from loaded event market data rather than a dedicated live depth route.

## Cycle V - Futures Market Rows

Feature/page worked on:

- World Cup futures outcome rows on the Home/Futures surface.
- Buy Yes/Buy No controls for futures outcomes.
- Futures ticket carry-through from Buy Yes.

Frontend components touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `FutureList()` renders Polymarket-style futures rows.
- `futureOutcomeVolume()` derives outcome-level display volume until backend provides it.
- `futureOutcomeFlags` adds local country visual markers.
- `openTicket(market, outcome, undefined, "buy")` is used by Buy Yes.
- `openTicket(market, outcome, undefined, "sell")` is used as the current Buy No approximation.

User interactions supported:

- View World Cup futures rows with flag, volume, probability, Buy Yes, and Buy No.
- Tap Buy Yes for France and open the trade ticket with the selected future outcome preserved.
- Use tablet wrapper flags for futures card and ticket smoke proof.

State transitions:

- Home `worldCupTab: "games" -> "futures"` when tapping `world-cup-futures-tab`.
- `ticket: null -> { market: world-cup-winner, outcome: france, side: "buy" }` when tapping the France Buy Yes row.
- `ticket: null -> { market: world-cup-winner, outcome: france, side: "sell" }` when tapping the France Buy No row.

Known limitations:

- Buy No is represented through the existing sell/no-side ticket path until the backend/mobile contract supports separate binary NO positions.
- Outcome-level volume is local deterministic display data.
- Local fallback futures list still lacks some captured reference outcomes such as England.

## Cycle W - Futures Chart Range

Feature/page worked on:

- World Cup futures chart/time-range section.

Frontend components touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `FutureList()` now stores local `selectedRange`.
- `futureChartRanges` defines `1H`, `1D`, `1W`, `1M`, and `MAX`.
- `FutureChartRange` smoke taps `1D` and `1W`.

User interactions supported:

- View futures chart legend and chart panel.
- Tap `1D` and `1W` range controls.
- Keep futures outcome rows visible after range changes.

State transitions:

- `selectedRange: "MAX" -> "1D" -> "1W"`.

Known limitations:

- Chart lines are local/deterministic and not backend-backed.
- Settings gear behavior is not implemented in this focused cycle.
- Press/hold tooltip remains P2.

## Cycle X - Match Market Tabs And Cards

Feature/page worked on:

- Match-specific market tabs and first market cards on the Event Detail game page.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `EventDetail()` now tracks `activeTab` across `game-lines`, `exact-score`, `halves`, and `player-props`.
- `EventDetail()` now tracks `activeLineDetailTab` across `order-book`, `graph`, and `about`.
- `renderMarketTabs()` renders the Polymarket-style market tab row.
- `renderTeamToAdvanceCard()` renders the first match-specific card with inline detail controls.
- `renderExactScore()` renders exact-score rows.
- `renderHalves()` renders half-market rows from existing market groups.
- `EventDetailMarketTabs` smoke proves tablet tab/card interactions.

User interactions supported:

- View `Game Lines`, `Exact Score`, `Halves`, and `Player Props` tabs.
- View a `Team to Advance` card with volume and outcome price buttons.
- Switch the Team to Advance inline detail from `Order Book` to `Graph`.
- Switch from Game Lines to Exact Score.
- Switch from Exact Score to Halves.

State transitions:

- `activeTab: "game-lines" -> "exact-score" -> "halves"`.
- `activeLineDetailTab: "order-book" -> "graph"`.

Known limitations:

- Exact Score and Halves rows are local/fallback market content rather than backend-discovered market groups.
- Team to Advance card depth and graph are local deterministic UI states.
- The match-level `Live stats` tab remains a P1 gap.

## Cycle Y - Line Adjustment

Feature/page worked on:

- Focused Spreads/Totals adjustable-line behavior on the Event Detail game page.

Frontend components touched:

- No frontend code changes in this cycle; existing EventDetail line selector behavior passed the new Polymarket audit gate.

Important functions/services touched:

- No runtime functions changed.
- `EventDetailLineAdjustment` smoke was rerun on Samsung tablet as the Audit Gate proof.

User interactions supported:

- View Spread and Totals line rails.
- Change Spread line and period.
- Open a Spread ticket that preserves the selected line/period/outcome.
- Change Totals line and period.
- Open a Totals ticket that preserves the selected line/period/outcome.

State transitions:

- Spread line/period selection changes before ticket open.
- Totals line/period selection changes before ticket open.
- Ticket state preserves `marketType`, `line`, `period`, and `displayLabel`.

Known limitations:

- This cycle verifies focused Spreads/Totals only.
- Team totals, halves-specific line cards, corners, and other discovered line markets still require separate same-cycle audits.
- Line prices/probabilities are local deterministic values until backend contracts provide market line quotes.

## Cycle Z - Trade Ticket

Feature/page worked on:

- Focused game-page trade ticket.

Frontend components touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `TradeTicket()` quick amount preset list changed to `1`, `5`, `10`, and `100`.
- `EventDetailTrade` smoke now proves amount chip parity and swipe-submit readiness.
- `smoke-tablet.ps1` now exposes `-EventDetailTrade`.

User interactions supported:

- Open ticket from a game-page outcome.
- See selected market/outcome and Buy/Sell controls.
- Use Polymarket-style quick amount chips.
- Tap `+$10` and see amount/estimate updates.
- See `Swipe up to buy` readiness after amount entry.
- Close and reopen ticket for the opposite outcome without stale selection.

State transitions:

- `ticket: null -> selected outcome ticket`.
- `amount: "0" -> "10"` after tapping `ticket-preset-10`.
- `submitLabel: "Choose an amount" -> "Swipe up to buy"`.
- `ticket: selected home outcome -> null -> selected away outcome`.

Known limitations:

- Ticket visual density remains heavier than Polymarket's first ticket view.
- The US view-only/download/login gate is documented but not implemented for fake-token mode.
- Full post-submit portfolio/open-order parity remains in the Portfolio cycle.

## Cycle AA - Portfolio

Feature/page worked on:

- Focused fake-token Portfolio positions, open orders, activity, and cancel behavior.

Frontend components touched:

- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- No runtime Portfolio component code changed.
- `EventDetailLinePortfolio` harness expectation now accepts current ticket amount copy `25 USDT`.
- Direct tablet `OpenOrderCancel` proof was rerun for cancel behavior.

User interactions supported:

- Place a mock line-market order from the game page.
- Land in Portfolio with updated fake balance, latest order, position, activity, and line identity.
- View a disposable open order with cancel control.
- Cancel an open order and see canceled state/activity.

State transitions:

- `amount: "0" -> "25"` in ticket.
- Portfolio fake balance `10000 -> 9975`.
- Portfolio counts update for positions/activity after order.
- Open-order fixture `OPEN -> canceled activity` in cancel proof.

Known limitations:

- Polymarket signed-in Portfolio could not be referenced because native and web were gated.
- Server-mode Portfolio proof should receive its own same-cycle audit gate later.
- Deeper position Buy/Sell/Close ticket transitions remain a later focused cycle.

## Cycle AB - Search/Explore

Feature/page worked on:

- Focused Search/Explore discovery, filter, sort, typed-query retention, and result navigation.

Frontend components touched:

- `mobile/src/components/SearchScreen.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `SearchScreen()` now renders an Explore-style Search page with category chips, dense result rows, a floating Filter pill, and an in-page filter panel.
- `SearchSort` smoke now proves Explore layout, Filter panel open/close, live-first sort, and result-row navigation.
- `smoke-tablet.ps1` now exposes `-SearchSort` for Samsung tablet proof.

User interactions supported:

- Tap bottom Search tab.
- View dense World Cup market rows with sport/category, title, volume/today/liquidity, chat/end metadata, right-side probability/outcome, save control, and chevron.
- Open a floating Filter panel and change status/sort criteria.
- Sort live markets first.
- Tap a result row and open the correct game page.
- Use existing typed query and clear behavior.

State transitions:

- `mainTab: home -> search`.
- `isFilterSheetOpen: false -> true -> false`.
- `sort: popular -> live`.
- `selectedEvent: null -> france-argentina-final` after tapping a result row.

Known limitations:

- Polymarket native Search could not be referenced because the S23 native app is location-gated.
- Polymarket global categories are broader than Holiwyn's World Cup-only scope.
- Holiwyn filter facets are baseline Status/Sort controls; richer discovered facets remain later P1 work.

## Cycle AC - Account/settings

Feature/page worked on:

- Focused signed-out Account/settings shell, More-style menu rows, language/theme rows, safe fake-token balance, and mock login/logout.

Frontend components touched:

- `mobile/src/components/AccountScreen.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `AccountScreen()` now renders a Polymarket-like More menu section with Leaderboard, Rewards, APIs, Accuracy, Status, Documentation, Help Center, Terms of Use, Language, and Theme rows.
- Signed-out actions now use `Log In` and `Sign Up` buttons while still using local mock sign-in only.
- `AccountLogin` smoke now resets local state, scrolls to the auth actions, proves mock login, and proves logout.

User interactions supported:

- Open Account from the header.
- Inspect More/settings menu rows.
- See fake-token balance and disabled real-money helper copy.
- Scroll to Log In / Sign Up actions.
- Mock sign in and sign out without touching real auth or wallet actions.

State transitions:

- `signedIn: false -> true -> false`.
- Account session storage is cleared before the focused proof.

Known limitations:

- Native Polymarket account/settings remains location-gated.
- Holiwyn menu rows are visible affordances; deeper destination pages remain later P1 work.

## Cycle AD - Chart Behavior

Feature/page worked on:

- Focused event-detail chart behavior.
- Chart selected point and tooltip equivalent.
- Tablet smoke proof for chart tap/filter behavior.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `EventDetail()` now tracks `selectedChartPoint` across `latest`, `mid`, and `target`.
- `selectedChartProbability` and `chartPointMeta` derive the visible chart tooltip state from the current selected event/outcome context.
- `event-detail-price-chart` is now pressable and cycles the selected chart point.
- `EventDetailChart` smoke launches the forced Mexico/Ecuador detail route, taps the chart, verifies the selected-point marker, switches to the Live chart filter, and records tablet proof.

User interactions supported:

- View the event chart with current probability context.
- Tap the chart to change selected point state.
- See a tooltip/nearest-point equivalent after chart interaction.
- Switch chart filter state while retaining event context.

State transitions:

- `selectedChartPoint: "latest" -> "mid" -> "target" -> "latest"` on chart taps.
- Chart tooltip label/value/time updates from `Current` to `2H`/`Mid chart` and `Target` states.
- Existing chart filter state remains available through the `event-detail-chart-filter-live` control.

Known limitations:

- Chart points still use deterministic local math instead of backend timestamped history.
- Same-cycle Polymarket reference was mobile web chart behavior because direct native/World Cup chart access was location-gated.
- Exact Polymarket chart animation and touch geometry remain P2 polish.

## Cycle AE - Market Page

Feature/page worked on:

- Focused market-page body `Market` / `Live stats` switch.
- Live Stats panel.
- Market-page tablet proof harness.

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `EventDetail()` now tracks `activeBodyTab` across `market` and `live-stats`.
- `event-detail-body-tab-market` restores chart and grouped market tabs.
- `event-detail-body-tab-live-stats` opens the new Live Stats panel.
- `EventDetailMarketTabs` smoke now asserts body switch, Live Stats panel, and return-to-market behavior before continuing existing tab/card proof.

User interactions supported:

- View event volume and Holiwyn source label near the body switch.
- Tap `Live stats` from the market page.
- Inspect possession, shots, shots on target, corners, expected goals, and match-flow rows.
- Tap `Market` to return to the chart and grouped market tabs.

State transitions:

- `activeBodyTab: "market" -> "live-stats" -> "market"`.
- Market content remains unchanged when returning from Live Stats.

Known limitations:

- Live Stats values are local deterministic values until backend live-match stats exist.
- Current Polymarket reference event showed Game Lines, Exact Score, and Halves; Holiwyn still retains Player Props from product direction and earlier parity work.
- Tablet smoke captured the focused evidence before wireless ADB reset; the transport issue remains harness reliability risk, not a product behavior gap.

## Cycle AF - Reference Device Preflight Harness

Feature/page worked on:

- Autonomous loop device preflight and recovery guard.

Frontend components touched:

- None.

Important functions/services touched:

- Added `mobile/scripts/polymarket-reference-device-preflight.ps1`.
- Added `preflight:polymarket-reference-device` and `preflight:polymarket-reference-device:expect-blocked` npm scripts.
- Updated `MOBILE_HARNESS_SPEC.md` with the new preflight harness.

User interactions supported:

- None; this is a harness/infrastructure cycle.

State transitions:

- Preflight status can be `pass`, `blocked`, or `expected_blocked`.
- Current proof records `expected_blocked` because the S23 reference model is missing while the Samsung tablet remains connected.

Known limitations:

- This does not complete a product feature.
- It intentionally prevents new UI feature completion claims while same-cycle Polymarket reference access is missing.

## Cycle AG - Trade Ticket

Feature/page worked on:

- Focused trade-ticket first-view density and advanced-details behavior.
- Ticket amount-to-win state.
- Tablet trade-ticket proof harness.

Frontend components touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/package.json`

Important functions/services touched:

- `TradeTicket()` now tracks `showDetails` and resets it whenever the selected ticket changes.
- `ticket-settings` now toggles advanced details instead of being a dead icon.
- `compactCash()` formats first-view ticket amount and payout as Polymarket-like dollar values.
- `smoke:tablet:event-detail-trade` runs the focused tablet proof through npm.

User interactions supported:

- Open a sparse ticket bottom sheet from a game-page outcome.
- See drag handle, Buy/Sell pill, market/outcome identity, large amount, quick amount chips, and one primary Trade control.
- Tap `+$10` to update amount, `To win`, price, and submit readiness.
- Tap settings to reveal trading mode, depth, keypad, slippage, and detailed estimates.
- Close and reopen ticket for another outcome without stale selected outcome data.

State transitions:

- `ticket -> showDetails=false` whenever market/outcome/side changes.
- `showDetails: false -> true` when `ticket-settings` is tapped.
- `amount: "0" -> "10"` when `ticket-preset-10` is tapped.
- Selected outcome changes from Mexico to Ecuador after close/reopen proof.

Known limitations:

- True binary NO-share semantics remain approximate until the mobile/backend contract supports explicit binary side ownership.
- Production auth/location/trading eligibility gates remain out of scope for fake-token trading.
- Ticket prices and payout math still use current local outcome probability unless backend quote data is available.

## Cycle AH - Binary Side Ticket

Feature/page worked on:

- Futures `Buy No` ticket/order contract identity.
- S23 native World Cup match ticket-surface reference follow-up.

Frontend components touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/components/Portfolio.tsx`
- `mobile/App.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`
- `mobile/package.json`

Important functions/services touched:

- `openTicket()` now carries `selection.contractSide` into the active ticket.
- `TradeTicket()` now prices and labels explicit `No` contracts separately from Buy/Sell transaction action.
- `submitTicketOrder()` now derives contract probability and sends `contractSide` to the API payload.
- `Portfolio` display helpers now render explicit `No - <outcome>` identity for latest order, positions, activity, and open orders.

User interactions supported:

- Tap futures `Buy No` for France.
- See a Buy ticket with visible `No - France` contract identity and `66c` inverse price.
- Submit a fake-token order and see `MOCK - Buy - No - France` in Portfolio.

State transitions:

- Futures row `Buy No`: `ticket=null -> ticket(side=buy, contractSide=no)`.
- Ticket amount defaults to `$10` in this focused proof and renders inverse payout from 66%.
- Submit: ticket closes, Portfolio opens, latest order/activity retain `contractSide=no`.

Known limitations:

- The S23 native Polymarket outcome tap is location-gated, so the live production order body was not visible in this cycle.
- The S23 reference still proves the native app uses a taller sheet/page surface over the game page; Holiwyn's compact ticket sheet remains a P1 surface-parity gap.

## Cycle AI - Trade Ticket Surface

Feature/page worked on:

- Logged-in Polymarket World Cup ticket-surface parity.
- Holiwyn tall fake-token ticket surface and swipe-ready submit rail.

Frontend components touched:

- `mobile/src/components/TradeTicket.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `TradeTicket()` now keeps the submit label aligned with the swipe interaction after amount entry.
- `TradeTicket()` now renders a taller sheet surface with a larger amount area and larger fixed swipe rail.
- `smoke.ps1` now asserts `Swipe up to buy` in ticket amount and futures Buy No proofs.

User interactions supported:

- Open ticket from a game-page outcome over a dimmed game page.
- Tap quick amount chip and keep a swipe-up submit affordance visible.
- Open futures `Buy No` and keep `No - France` plus inverse price visible with the same swipe-ready surface.

State transitions:

- `amount: "0" -> "10"` changes primary copy from `Choose an amount` to `Swipe up to buy`.
- Existing `buy/sell` and `yes/no` contract-side state is preserved through the taller surface.

Known limitations:

- Logged-in Polymarket on the S23 still shows a location verification gate before production order entry.
- Holiwyn fake-token mode intentionally does not implement the production location/login/trading eligibility gate yet.
- Native drag physics and transition animation remain future polish.
