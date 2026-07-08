# Holiwyn Whole-App Polymarket Mobile Parity Criteria

Date: 2026-07-03

Source reference: `docs/mobile/POLYMARKET_WHOLE_APP_REFERENCE_AUDIT.md`

Scope: Holiwyn Android mobile app, World Cup first, fake-token trading enabled, no deposit/withdraw implementation.

## Gate Rule

A page or function cannot be marked complete unless the cycle includes:

- Real Polymarket reference evidence from the S23.
- Written Holiwyn acceptance criteria.
- Implementation against the criteria.
- Audit gate after implementation.
- Tablet proof for Holiwyn.
- Updated gap tracker with remaining P0/P1/P2 gaps.

## P0 Criteria

| ID | Requirement | Objective evidence |
| --- | --- | --- |
| WA-P0-01 | Bottom navigation supports Home, Live, Portfolio, Search, and Account without broken states. | Tablet smoke visits every tab and captures screenshot/XML. |
| WA-P0-02 | Home and World Cup discovery expose World Cup games, futures, live/today filters, save controls, and probability buttons. | Tablet screenshot/XML shows each item and at least one card opens the correct game. |
| WA-P0-03 | Search supports category/filter discovery and market result cards that open the correct event. | Tablet smoke enters search, filters results, opens a card, and captures evidence. |
| WA-P0-04 | Portfolio supports fake balance, open positions, open orders, recent activity, closed trades, and empty states. | Tablet proof after seeded mock trade/order shows counts/details; empty proof shows no-position state. |
| WA-P0-05 | Game page meets the existing game-page P0 baseline and is re-proven on the tablet, not only older S23 evidence. | Tablet full-page scroll proof from top through lower sections. |
| WA-P0-06 | Adjustable soccer line markets work for Spread and Totals. | See `HOLIWYN_LINE_ADJUSTMENT_CRITERIA.md`. |
| WA-P0-07 | Ticket preserves selected market identity: event, outcome, line, period, side, amount, odds, payout estimate. | Tablet ticket screenshot/XML after line selection and route/unit proof of order payload. |
| WA-P0-08 | Creating an order/trade from the game page updates portfolio/open orders/activity using the same selected market identity. | Backend/mobile smoke creates disposable or seeded order and verifies portfolio row. |
| WA-P0-09 | Order book or market-depth screen exists for game-page book control. | Tablet screenshot/XML shows Yes/No tabs or equivalent depth rows for selected market. |
| WA-P0-10 | Core error/loading/empty states are visible and non-blocking for Home, Search, Portfolio, Game, Ticket, and API failure. | Fixture or smoke proof for each page state. |

## P1 Criteria

| ID | Requirement | Objective evidence |
| --- | --- | --- |
| WA-P1-01 | Visual density and phone-first layout more closely match Polymarket on S23 dimensions. | Side-by-side screenshots with audit notes. |
| WA-P1-02 | World Cup category page has a closer hero/stage carousel and Games/Futures treatment. | Tablet and phone-size screenshots. |
| WA-P1-03 | Saved/watchlist persistence works from home cards, search results, and game page. | Save, filter saved, relaunch, unsave smoke. |
| WA-P1-04 | Notifications, share, settings/account, language switch, and login/account entry states are tappable and audited. | Tablet screenshot/XML for each state. |
| WA-P1-05 | Chat input/reactions, chart press tooltip, and ticket amount-entered submit affordance are safely testable without real-money actions. | Tablet smoke screenshots/XML. |

## P2 Criteria

| ID | Requirement | Objective evidence |
| --- | --- | --- |
| WA-P2-01 | Animation, micro-interactions, and spacing approach Polymarket quality. | Video or screenshot sequence with visual audit. |
| WA-P2-02 | Comprehensive long-tail World Cup props beyond the minimum soccer lines. | Fixture and scroll proof across many groups. |
| WA-P2-03 | Real-time chat, odds, and chart updates are proven over time. | Timed proof or harnessed websocket/API update. |

## Completion Rule

Whole-app parity cannot be claimed until `docs/mobile/WHOLE_APP_PARITY_GAP_TRACKER.md` shows zero unresolved P0 gaps and includes an audit map from every P0 criterion to current tablet evidence.
