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
