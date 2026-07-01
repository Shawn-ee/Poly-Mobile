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
