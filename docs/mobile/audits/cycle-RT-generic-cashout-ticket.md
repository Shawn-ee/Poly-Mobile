# Cycle RT - Generic Cashout Sell Ticket

Date: 2026-07-09

Scope:

- Local MVP visible cashout path.
- Consolidate Portfolio and Event Detail Cash out affordances onto the generic Buy/Sell Trade Ticket.
- No order book, chat, live stats, social, deposit, withdraw, backend schema, or order matching logic work.

Acceptance criteria:

- P0: Visible Portfolio Cash out opens the generic `TradeTicket` in Sell mode.
- P0: Visible Event Detail Cash out opens the generic `TradeTicket` in Sell mode.
- P0: The default app runtime no longer mounts or routes visible cashout actions through the dedicated `CashoutTicket` sheet.
- P0: S23 proof completes current Local MVP buy-position -> Cash out -> generic Sell ticket -> fake-token/server-backed sell -> Portfolio History.
- P0: Order book remains hidden from the default Local MVP proof path.

Implementation:

- Removed the dedicated `CashoutTicket` mount and cashout state wiring from `mobile/App.tsx`.
- Event Detail `Cash out` now calls `openPositionTrade(position, "sell")`.
- Portfolio no longer keeps a hidden `close-position-*` fallback to the dedicated cashout sheet.
- Current-MVP S23 proof harness now expects generic sell ticket markers and rejects old `cashout-ticket` markers.

Device proof:

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Flow: Home -> Live -> Event Detail -> Spread buy ticket -> swipe buy -> Portfolio position -> Cash out -> generic Sell ticket -> `$25` -> swipe sell -> Portfolio History.

Evidence:

- `docs/mobile/harness/cycle-RT-generic-cashout-ticket/cycle-RT-current-mvp-s23-visible-flow.json`
- `docs/mobile/harness/cycle-RT-generic-cashout-ticket/cycle-RT-current-mvp-line-cashout-ticket.xml`
- `docs/mobile/harness/cycle-RT-generic-cashout-ticket/cycle-RT-current-mvp-line-cashout-ticket-ready.xml`
- `docs/mobile/harness/cycle-RT-generic-cashout-ticket/cycle-RT-current-mvp-line-cashout-history.xml`
- `docs/mobile/screenshots/cycle-RT-generic-cashout-ticket/cycle-RT-current-mvp-line-cashout-ticket.png`
- `docs/mobile/screenshots/cycle-RT-generic-cashout-ticket/cycle-RT-current-mvp-line-cashout-history.png`

Audit result:

- P0 PASS: cashout ticket XML contains `trade-ticket`, `ticket-side-sell`, `swipe-to-submit-order`, and `ticket-retail-reference-layout`.
- P0 PASS: ready XML contains `Swipe to sell`, `$25`, and `swipe-submit-gesture-required`.
- P0 PASS: history XML contains `activity-sold`, `portfolio-market-type-spread`, and `portfolio-line-1.5`.
- P0 PASS: proof XML rejects `cashout-ticket` and `swipe-to-cashout`.
- Remaining P1: real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
