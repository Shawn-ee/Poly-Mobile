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
