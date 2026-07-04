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
