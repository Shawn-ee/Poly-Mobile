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
