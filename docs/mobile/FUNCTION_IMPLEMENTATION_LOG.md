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
