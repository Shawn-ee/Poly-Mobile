# Mobile Feature Gap Tracker

Purpose: Track gaps between Polymarket's World Cup/sports experience and Holiwyn.

Priority:

- P0: Required for first working World Cup prototype.
- P1: Required for near parity.
- P2: Important polish or later expansion.

Status:

- Not started
- Observed
- Designed
- In progress
- Implemented
- Verified
- Deferred

| ID | Area | Feature | Priority | Reference Observed | Holiwyn Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GAP-001 | App shell | Bottom navigation | P0 | Yes | Verified | Cycle 002 added Home, Live, Portfolio, Search and dark-first shell. |
| GAP-002 | World Cup | Games tab | P0 | Yes | Verified | Cycle 002 added mock Games list with live and scheduled World Cup rows. |
| GAP-003 | World Cup | Futures tab | P0 | No | Verified | Cycle 002 added World Cup winner and Golden Boot futures. More futures needed for parity. |
| GAP-004 | Event detail | Market groups | P0 | No | Verified | Cycle 002 added event detail with match winner and prop markets. |
| GAP-005 | Trading | Buy/Sell ticket | P0 | No | Verified | Cycle 002 added mock Buy/Sell ticket with cost/payout estimates. |
| GAP-006 | Portfolio | Positions | P0 | No | Verified | Cycle 002 displays a position after placing a mock order. P/L still needed. |
| GAP-007 | Wallet | Fake USDT balance | P0 | No | Verified | Cycle 002 starts at 10,000 USDT and deducts mock order cost. No deposit/withdraw. |
| GAP-008 | Localization | English/Simplified Chinese switch | P0 | No | Verified | Cycle 002 toggles major app copy between English and Simplified Chinese. |
| GAP-009 | Search | Market search | P1 | No | Implemented | Search input and filtering exist; deeper search UX still needed. |
| GAP-010 | Live | Live market list | P1 | No | Implemented | Live tab filters mock live events; live odds updates are not implemented. |
| GAP-011 | Bootstrap | Repo-local mobile app | P0 | Yes | Verified | `Poly/mobile` exists and launches on emulator. |
| GAP-012 | Backend adapter | World Cup event/detail normalization | P0 | No | Verified | Cycle 003 added a typed mobile adapter for backend event/detail responses with mock fallback. |
| GAP-013 | Harness | Repeatable emulator smoke | P0 | No | Verified | Cycle 003 added `npm run smoke` for typecheck, backend health probe, emulator launch, and screenshot capture. |
| GAP-014 | Trading | Order service boundary | P0 | No | Verified | Cycle 004 routes ticket submissions through a mock/server service boundary; default remains safe mock mode. |
| GAP-015 | Architecture | Presentation helper extraction | P2 | No | Verified | Cycle 005 moved money and label helpers into `mobile/src/presentation/formatters.ts`. |
| GAP-016 | Architecture | Bottom navigation component | P2 | Yes | Verified | Cycle 006 extracted bottom tabs into `mobile/src/components/BottomTabs.tsx`. |
| GAP-017 | Architecture | Trade Ticket component | P1 | Yes | Verified | Cycle 007 extracted Trade Ticket into `mobile/src/components/TradeTicket.tsx` and verified mock order flow. |
| GAP-018 | Architecture | Portfolio component | P1 | Yes | Verified | Cycle 008 extracted Portfolio into `mobile/src/components/Portfolio.tsx` and verified fake balance/positions. |
| GAP-019 | Harness | Reset app state before smoke | P1 | No | Verified | Cycle 009 force-stops Expo Go before smoke launch so screenshots start from Home state. |
| GAP-020 | Architecture | Market list components | P1 | Yes | Verified | Cycle 010 extracted Games/Futures list rendering into `mobile/src/components/MarketLists.tsx`. |
| GAP-021 | Architecture | Event Detail component | P1 | Yes | Verified | Cycle 011 extracted Event Detail into `mobile/src/components/EventDetail.tsx`. |
| GAP-022 | Event detail | Grouped market sections | P1 | No | Verified | Cycle 012 added Live/Game lines/Props/Futures grouping on Event Detail. |
| GAP-023 | Harness | Deep trade smoke | P1 | No | Verified | Cycle 013 added `npm run smoke:deep` for Home, Ticket, mock order, and Portfolio screenshots. |
| GAP-024 | Backend adapter | Generic futures title normalization | P1 | No | Verified | Cycle 014 normalizes generic backend futures fixtures to `World Cup futures` in mobile display. |
| GAP-025 | Harness | Stable automation labels | P1 | No | Verified | Cycle 015 added labels/test IDs for featured futures, tabs, ticket, order button, Portfolio, and balance card. |
| GAP-026 | Live | Live tab empty/count state | P1 | No | Verified | Cycle 016 added a focused Live tab heading, count badge, and live-specific empty state. |
| GAP-027 | Harness | Android UI hierarchy assertions | P1 | No | Verified | Cycle 017 saves uiautomator XML and asserts visible Home, Ticket, and Portfolio text during deep smoke. |
| GAP-028 | Harness | Live/Search deep smoke coverage | P1 | No | Verified | Cycle 018 extends deep smoke to verify Live and Search tabs with screenshots and hierarchy assertions. |
| GAP-029 | Search | Search result header/count | P1 | No | Verified | Cycle 019 adds Search result heading, count, clear affordance, and removes disruptive auto-focus. |
| GAP-030 | Harness | Resilient Expo launch/live assertions | P1 | No | Verified | Cycle 019 waits for Holiwyn Home, retries the Expo URL, and accepts both empty and populated Live states. |
| GAP-031 | Search | Quick market filters | P1 | No | Verified | Cycle 020 adds All/Live/Upcoming filters and asserts them in deep smoke. |
| GAP-032 | Architecture | Search screen component | P2 | Yes | Verified | Cycle 021 extracts Search tab UI and filter behavior into `mobile/src/components/SearchScreen.tsx`. |
| GAP-033 | Architecture | Live screen component | P2 | Yes | Verified | Cycle 022 extracts Live tab UI into `mobile/src/components/LiveScreen.tsx`. |
| GAP-034 | Harness | Typed-query Search smoke | P1 | No | Verified | Cycle 023 types a zero-result query and asserts Results, Clear, and no-results Search state. |
| GAP-035 | Live | Freshness and refresh affordance | P1 | No | Verified | Cycle 024 adds Live freshness copy, Refresh control, and refreshed-state smoke coverage. |
| GAP-036 | Live | Refresh reload path | P1 | No | Verified | Cycle 025 wires Live refresh to the shared backend/mock World Cup event reload path and verifies fallback completion. |
| GAP-037 | Architecture | Featured futures component | P2 | Yes | Verified | Cycle 026 renders the Home featured futures card through `mobile/src/components/FeaturedFuture.tsx`. |
| GAP-038 | Architecture | Featured futures cleanup | P2 | No | Verified | Cycle 027 removes the stale inline featured-card implementation from `App.tsx`. |
| GAP-039 | Architecture | Sports navigation component | P2 | Yes | Verified | Cycle 028 extracts the Home sports navigation row into `mobile/src/components/SportNav.tsx`. |
| GAP-040 | Architecture | World Cup segmented control component | P2 | Yes | Verified | Cycle 029 extracts the Home Games/Futures segmented control into `mobile/src/components/WorldCupSegmented.tsx`. |
| GAP-041 | Architecture | Home screen component | P2 | Yes | Verified | Cycle 030 extracts Home screen composition into `mobile/src/components/HomeScreen.tsx`. |
| GAP-042 | Portfolio | Position value and P/L detail | P1 | No | Verified | Cycle 031 adds Entry, Current value, and Est. P/L to fake-token Portfolio positions. |
| GAP-043 | Architecture | Header component | P2 | Yes | Verified | Cycle 032 extracts brand/language/promo/notification header into `mobile/src/components/Header.tsx`. |
| GAP-044 | Portfolio | Aggregate position summary | P1 | No | Verified | Cycle 033 adds Invested, Current value, and Est. P/L summary cards above fake-token positions. |
| GAP-045 | Portfolio | Close-position affordance | P1 | No | Verified | Cycle 034 adds a fake-token `Close position` action to Portfolio position cards. |
| GAP-046 | Harness | Close-position behavior smoke | P1 | No | Verified | Cycle 035 taps Close position and verifies credited balance plus empty Portfolio state. |
| GAP-047 | Localization | App copy module | P2 | No | Verified | Cycle 036 extracts English/Simplified Chinese app copy into `mobile/src/localization/appCopy.ts`. |
| GAP-048 | Portfolio | Recent trading activity | P1 | No | Verified | Cycle 037 adds fake-token Bought/Closed activity rows and verifies them after close-position smoke. |
| GAP-049 | Event detail | Expanded World Cup prop markets | P1 | No | Verified | Cycle 038 adds both-teams-to-score, first-goal-team, and live next-goal markets with event-detail smoke coverage. |
| GAP-050 | Navigation | Android Event Detail back behavior | P1 | No | Verified | Cycle 039 intercepts Android hardware Back on Event Detail and verifies return-to-Home smoke. |
| GAP-051 | Backend adapter | Portfolio history activity seam | P1 | No | Verified | Cycle 040 adds a server-mode `/api/portfolio/history` adapter that maps resolved backend history into Portfolio activity rows. |
| GAP-052 | Backend adapter | Portfolio snapshot position seam | P1 | No | Verified | Cycle 041 adds a server-mode `/api/portfolio` adapter that maps backend wallet and open positions into mobile Portfolio state. |
| GAP-053 | Portfolio | Server open orders display seam | P1 | No | Verified | Cycle 042 maps backend open orders into a Portfolio `Open orders` section for server mode while preserving mock smoke. |
| GAP-054 | Trading | Order confirmation on Portfolio | P1 | No | Verified | Cycle 043 adds a visible `Order placed` confirmation after a mock trade and verifies it in deep smoke. |
| GAP-055 | Trading ticket | Available balance display | P1 | No | Verified | Cycle 044 shows fake balance inside the trade ticket before submission and verifies it in deep smoke. |
| GAP-056 | Trading ticket | Max amount control | P1 | No | Verified | Cycle 045 adds a Max control that fills the ticket amount with available fake balance and verifies the updated estimate. |
| GAP-057 | Trading ticket | Amount preset controls | P1 | No | Verified | Cycle 046 adds 100/500/1,000 USDT preset controls to Trade Ticket and verifies them in deep smoke. |
| GAP-058 | Harness | Selector-driven ticket taps | P1 | No | Verified | Cycle 047 replaces fragile Max/order coordinates with Android hierarchy taps by stable control id. |
| GAP-059 | Harness | Selector-driven navigation and close taps | P1 | No | Verified | Cycle 048 extends hierarchy taps to close-position, Live/Search tabs, Live refresh, and Search input. |
| GAP-060 | Portfolio | Server sync status state | P1 | No | Verified | Cycle 049 adds server-mode syncing/synced/unavailable Portfolio status copy while keeping mock smoke hidden. |
| GAP-061 | Harness | Selector-driven event opening | P1 | No | Verified | Cycle 050 adds stable event/outcome ids and verifies event detail plus event-market ticket opening by selector. |
| GAP-062 | Trading ticket | Order failure feedback | P1 | No | Verified | Cycle 051 catches failed ticket submissions and keeps the ticket open with localized retry copy. |
| GAP-063 | Harness | Forced order-failure smoke | P1 | No | Verified | Cycle 052 adds a dedicated forced-failure smoke that verifies `ticket-order-error` on emulator. |
| GAP-064 | Portfolio | Open order cancel affordance | P1 | No | Verified | Cycle 053 adds cancel controls for server open orders, calls canonical `DELETE /api/orders/:id` in server mode, and records local canceled activity feedback. |
| GAP-065 | Harness | Open-order cancel smoke | P1 | No | Verified | Cycle 054 adds a harness-only open-order fixture and emulator smoke that taps Cancel and verifies canceled activity feedback. |
| GAP-066 | Harness | Selector-driven Event Detail back | P1 | No | Verified | Cycle 055 adds a stable Event Detail back id and replaces the Android Back keyevent with a selector tap in deep smoke. |
| GAP-067 | Event detail | Market group jump controls | P1 | No | Verified | Cycle 056 adds Event Detail group chips and uses the Props selector in deep smoke instead of a fixed prop-section swipe. |
| GAP-068 | Harness | Featured futures trade smoke | P1 | No | Verified | Cycle 057 opens the ticket from the visible featured future selector and removes the post-back Home list swipe from deep smoke. |
| GAP-069 | Harness | Focused Event Detail trade smoke | P1 | No | Verified | Cycle 058 adds Event Detail outcome selectors and a focused smoke that opens a Mexico match-winner ticket directly from Event Detail. |
| GAP-070 | Harness | Focused Search query smoke | P1 | No | Verified | Cycle 059 adds a launch-query Search smoke that verifies zero-result Search without device keyboard entry. |
| GAP-071 | Backend adapter | Mobile API key server-mode auth | P0 | No | Verified | Cycle 060 passes `EXPO_PUBLIC_API_KEY` into `PolyApi`, updates emulator env defaults, and adds a server-auth config harness. |
| GAP-072 | Backend adapter | Mobile canonical request tests | P0 | No | Verified | Cycle 061 adds a Vitest mobile API client harness covering Bearer auth, canonical limit order payload/idempotency, and cancel requests. |
| GAP-073 | Harness | Server-mode preflight | P0 | No | Verified | Cycle 062 adds a server-mode preflight that checks mobile auth wiring, backend health when available, API key shape, and emulator launch vars. |
| GAP-074 | Harness | Strict server-mode launch gate | P0 | No | Verified | Cycle 063 lets server preflight honor env overrides and adds `preflight:server-mode:strict`, which refuses launch without backend/API key proof. |
| GAP-075 | Backend adapter | Mobile dev credential helper | P0 | No | Verified | Cycle 064 adds `mobile:dev-credential` plus dry-run proof to create a fake-token mobile API key when local Postgres is running. |
| GAP-076 | Harness | Mobile backend readiness check | P0 | No | Verified | Cycle 065 adds `mobile:backend-readiness` with Docker daemon, compose, DB URL, and TCP-port checks plus an optional DB start command. |
| GAP-077 | Harness | Server-unavailable emulator smoke | P0 | No | Verified | Cycle 066 adds `smoke:server-unavailable`, proving server mode shows Portfolio fallback when backend APIs are unreachable. |
| GAP-078 | Harness | Server order failure emulator smoke | P0 | No | Verified | Cycle 067 adds `smoke:server-order-failure`, proving unreachable server order submission keeps the ticket open with retry feedback. |
| GAP-079 | Event detail | Trading stats strip | P1 | Yes | Verified | Cycle 068 adds localized Volume/Liquidity/Traders stats to Event Detail and verifies them in focused emulator smoke. |
| GAP-080 | Trade ticket | Shares and average price estimates | P1 | Yes | Verified | Cycle 069 adds localized estimated shares and average price rows to the ticket and verifies them in focused emulator smoke. |
| GAP-081 | Event detail | Market depth preview | P1 | Yes | Verified | Cycle 070 adds localized Best bid/Best ask/Spread depth rows to Event Detail market cards and verifies them in focused emulator smoke. |
| GAP-082 | Trade ticket | Side-specific buy/sell copy | P1 | Yes | Verified | Cycle 071 adds side-aware ticket CTA/proceeds copy and a focused sell-ticket emulator smoke. |
| GAP-083 | Account/Login | User account entry point | P1 | Yes | Verified | Cycle 072 adds a localized Account tab with mock login methods, demo balance context, and focused emulator smoke coverage. |
| GAP-084 | Account/Login | Mock sign-in state | P1 | Yes | Verified | Cycle 073 adds local Account sign-in/sign-out behavior with demo profile proof and focused emulator smoke coverage. |
| GAP-085 | Discovery | Home market filters | P1 | Yes | Verified | Cycle 074 adds All/Live/Today filters to Home market discovery and verifies Live/Today filtering in focused emulator smoke. |
| GAP-086 | Discovery | Saved markets watchlist | P1 | Yes | Verified | Cycle 075 adds local saved-event stars plus a Saved Home filter and verifies the flow in focused emulator smoke. |
| GAP-087 | Discovery | Home market card stats | P1 | Yes | Verified | Cycle 076 adds Volume/Liquidity context to Home market cards and verifies the row in focused emulator smoke. |
| GAP-088 | Discovery | Saved Search integration | P1 | Yes | Verified | Cycle 077 lifts saved-event state into the app shell and verifies Home-saved markets appear in Search's Saved filter. |
| GAP-089 | Search | Search card market stats | P1 | Yes | Verified | Cycle 078 adds Volume/Liquidity context to Search result cards and verifies it in focused emulator smoke. |
| GAP-090 | Search | Saved empty state | P1 | Yes | Verified | Cycle 079 adds localized empty copy for Search's Saved filter and verifies the zero-saved state in focused emulator smoke. |
| GAP-091 | Event detail | Save from detail | P1 | Yes | Verified | Cycle 080 adds an Event Detail save/star control and verifies saved state appears in Search Saved. |
| GAP-092 | Search | Search sort controls | P1 | Yes | Verified | Cycle 081 adds Popular/Live first sorting controls to Search and verifies Live first promotes live World Cup markets in focused emulator smoke. |
| GAP-093 | Discovery | Home Saved empty state | P1 | Yes | Verified | Cycle 082 adds a first-viewport saved-empty message on Home and verifies it in focused emulator smoke. |
| GAP-094 | Discovery | Market/outcome query matching | P1 | Yes | Verified | Cycle 083 extends Home/Search discovery matching to market and outcome labels and verifies a clean-sheet query on Home. |
| GAP-095 | Discovery | Home search clear action | P1 | Yes | Verified | Cycle 084 adds a Home search Clear action and verifies it restores the full market list in focused emulator smoke. |
| GAP-096 | Search | Search clear icon action | P1 | Yes | Verified | Cycle 085 aligns Search with Home's close-icon Clear action and verifies clearing a zero-result query restores Top results. |
| GAP-097 | Harness | Expo launch recovery hardening | P1 | No | Verified | Cycle 086 increases launch wait attempts and restarts Expo Go when the temporary generic error screen appears, then verifies Search clear-query smoke. |
| GAP-098 | Discovery | Futures card market stats | P1 | Yes | Verified | Cycle 087 adds Volume/Liquidity context to Home Futures cards and verifies it in focused emulator smoke. |
| GAP-099 | Trading | Futures list ticket opening | P1 | Yes | Verified | Cycle 088 adds focused smoke coverage proving a Futures list outcome opens the buy ticket with balance and estimates. |
| GAP-100 | Trading | Futures list mock order | P1 | Yes | Verified | Cycle 089 adds focused smoke coverage proving a Futures list ticket can place a mock order and create a Portfolio position. |
| GAP-101 | Trading | Futures list sell ticket | P1 | Yes | Verified | Cycle 090 adds focused smoke coverage proving a Futures list ticket can switch to Sell and show proceeds/CTA copy. |
| GAP-102 | Portfolio | Futures list close position | P1 | Yes | Verified | Cycle 091 adds focused smoke coverage proving a Futures list mock order can be closed and recorded in activity. |
| GAP-103 | Portfolio | Open positions count | P1 | Yes | Verified | Cycle 092 adds a localized Open positions count to Portfolio and verifies it changes from 0 to 1 after a Futures mock order. |
| GAP-104 | Portfolio | Recent activity count | P1 | Yes | Verified | Cycle 093 adds a localized Recent activity count to Portfolio and verifies it changes from 0 to 1 after a Futures mock order. |
| GAP-105 | Portfolio | Closed trades count | P1 | Yes | Verified | Cycle 094 adds a localized Closed trades count to Portfolio and verifies it changes from 0 to 1 after a Futures mock order is closed. |
| GAP-106 | Portfolio | Compact count grid | P1 | Yes | Verified | Cycle 095 compacts Open positions, Recent activity, and Closed trades into a three-tile grid and verifies the closed-state counts on emulator. |
| GAP-107 | Saved markets | Local saved-market persistence | P1 | Yes | Verified | Cycle 096 persists saved market ids with AsyncStorage and verifies a seeded saved market restores after app restart on emulator. |
| GAP-108 | Account/Login | Local mock session persistence | P1 | Yes | Verified | Cycle 097 persists mock account sign-in state with AsyncStorage and verifies the signed-in Account screen restores after app restart. |
| GAP-109 | Localization | Local language preference persistence | P1 | Yes | Verified | Cycle 098 persists the selected language with AsyncStorage and verifies Chinese Home restores after app restart on emulator. |
| GAP-110 | Portfolio | Local mock portfolio persistence | P1 | Yes | Verified | Cycle 099 persists fake-token balance, positions, latest order, open orders, and activity locally, then verifies a placed World Cup winner position restores after app restart. |
| GAP-111 | Backend adapter | Fresh backend readiness retry | P0 | No | Verified | Cycle 100 reruns the backend readiness harness and confirms Docker CLI/config are present, while Docker daemon and local Postgres remain unavailable for live backend proof. |
| GAP-112 | Trade ticket | Local ticket default persistence | P1 | Yes | Verified | Cycle 101 persists the user's ticket amount and buy/sell side locally, then verifies a 500 USDT sell ticket restores after app restart. |
| GAP-113 | Account/Profile | Account preference summary | P1 | Yes | Verified | Cycle 102 surfaces saved ticket defaults in Account preferences and verifies the Account screen shows Sell 500 USDT on emulator. |
