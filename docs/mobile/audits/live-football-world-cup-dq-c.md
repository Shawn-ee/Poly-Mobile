# Live Football / World Cup Reference Audit - Cycle DQ-C

Status: fresh Samsung S23 Polymarket reference audit for Holiwyn Super Round DQ. This is a reference and criteria update only; it does not mark Holiwyn parity complete.

Scope:

- Full World Cup game detail structure.
- Chart press behavior.
- Line markets, including spread/totals line selectors and period pills.
- Order book/depth, including market selector and display setting.
- Ticket opening and location-gated confirmation state.
- Buttons/actions, tab behavior, share behavior, and scroll behavior.

Skipped by request:

- Deposit flow.
- Location-resolution flow beyond recording the blocking ticket state.
- Notification flow. Blank/blocked notification state is acceptable and not audited here.

## Reference Session

Reference device: Samsung S23, model `SM_S911U1`.

Reference app: official Polymarket Android app, package `com.polymarket.android`.

Reference event:

- World Cup Games tab.
- Canada vs Morocco, Today, 4 Jul, 12:00 PM.
- Share URL observed in Android share sheet: `https://polymarket.us/events/fwc-can-mar-2026-07-04`.

Reference proof folders:

- Screenshots: `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/`
- UI hierarchy: `docs/mobile/harness/cycle-DQ-C-polymarket-reference/`

## Proof Artifacts

| Step | Screenshot | UI hierarchy | Action/result |
| --- | --- | --- | --- |
| Current app state | `pm-dq-c-00-current.png` | `pm-dq-c-00-current.xml` | Started on an existing completed game detail; useful only for generic page structure. |
| Back to home | `pm-dq-c-01-after-back.png` | `pm-dq-c-01-after-back.xml` | Back returned to Polymarket Home with category rail and bottom nav. |
| World Cup tab | `pm-dq-c-02-world-cup-tab.png` | `pm-dq-c-02-world-cup-tab.xml` | Tapped World Cup; Games/Futures tabs appeared with Canada vs Morocco row. |
| Game top | `pm-dq-c-03-world-cup-game-top.png` | `pm-dq-c-03-world-cup-game-top.xml` | Opened Canada vs Morocco detail: Game/Chat segmented control, book/share, teams, date/time, chart, chat preview, primary outcome buttons, and first market group. |
| Chart press | `pm-dq-c-04-chart-press.png` | `pm-dq-c-04-chart-press.xml` | Long-pressed chart; no visible tooltip/crosshair appeared, page context was preserved, and live chat count/content updated. |
| Chat tab | `pm-dq-c-05-chat-tab.png` | `pm-dq-c-05-chat-tab.xml` | Chat tab replaced body with compact match summary, scrolling chat messages, composer/reactions, and pinned CAN/MAR outcome buttons. |
| Return Game tab | `pm-dq-c-06-back-game-tab.png` | `pm-dq-c-06-back-game-tab.xml` | Tapped Game; market page restored. |
| Market scroll 1 | `pm-dq-c-07-markets-scroll-1.png` | `pm-dq-c-07-markets-scroll-1.xml` | Scrolled into markets; compact match context stayed pinned above Regulation Time Winner and Spread. |
| Spread selector open | `pm-dq-c-08-spread-line-dropdown.png` | `pm-dq-c-08-spread-line-dropdown.xml` | Tapped spread line; inline horizontal line selector opened around selected `1.5`. |
| Spread line changed | `pm-dq-c-09-spread-line-25.png` | `pm-dq-c-09-spread-line-25.xml` | Selected `2.5`; displayed side changed to `CAN to win by over 2.5 goals`, and Yes/No prices changed to 2%/99%. |
| Ticket transition | `pm-dq-c-10-spread-ticket.png` | `pm-dq-c-10-spread-ticket.xml` | Tapped selected spread row; page dimmed and bottom sheet began to open. |
| Ticket blocked | `pm-dq-c-11-ticket-sheet-settled.png` | `pm-dq-c-11-ticket-sheet-settled.xml` | Sheet settled into `Location verification failed` with Contact support. No real order-entry or swipe confirmation was reachable in this state. |
| Order book | `pm-dq-c-12-top-book-action.png` | `pm-dq-c-12-top-book-action.xml` | Top book icon opened a dedicated Order Book page with Yes/No tabs, market selector, Price/Shares/Value columns, asks, bids, and spread separator. |
| Book market selector | `pm-dq-c-13-orderbook-market-selector.png` | `pm-dq-c-13-orderbook-market-selector.xml` | Market selector opened with grouped Moneyline choices and Spread choices, including `CAN -2.5` and `CAN -2.5 1H`. |
| Book setting | `pm-dq-c-14-orderbook-settings.png` | `pm-dq-c-14-orderbook-settings.xml` | Gear exposed a `Decimalize book` display action. |
| Book depth scroll | `pm-dq-c-15-orderbook-depth-scroll.png` | `pm-dq-c-15-orderbook-depth-scroll.xml` | Additional drag kept the same visible ladder; first viewport already showed multiple ask levels, spread, and bid levels. |
| Market scroll 2 | `pm-dq-c-16-markets-scroll-2.png` | `pm-dq-c-16-markets-scroll-2.xml` | Lower page showed Totals with line selector/period pills and a 1st Half Winner group, while compact match context stayed pinned. |
| Share action | `pm-dq-c-17-share-sheet.png` | `pm-dq-c-17-share-sheet.xml` | Share opened Android share sheet with generated Polymarket event URL; underlying scroll position was preserved under dim. |

## Reference Findings

### Full Page Structure

P0 reference structure:

- Top header has back, Game/Chat segmented control, book, and share.
- Game top has flags/team codes, date/time, Polymarket source label, two-line probability chart, chat preview card, primary outcome buttons, and grouped market content.
- On scroll, the chart leaves view and a compact match header pins to the top with team codes, percentages, and match time.
- Market groups are stacked full-width with separators, group headers, chevrons, rows, odds, and probability buttons.

### Chart Behavior

P0 reference behavior:

- Native World Cup chart is live-looking and context-bound to CAN/MAR probabilities.
- A long press on the chart did not expose a visible tooltip or crosshair in the captured state.
- The chart did not navigate away or open a ticket.

P1/P2 reference behavior:

- Exact chart touch geometry remains visual-polish debt; Holiwyn should not overfit to a tooltip if native reference does not show one in this state.

### Line Markets

P0 reference behavior:

- Spread and Totals are first-class grouped markets.
- Spread exposes period pills: `Reg. Time`, `1st Half`, `2nd Half`.
- Spread line selection opens inline as a horizontal selector, not a modal.
- Changing spread from `1.5` to `2.5` changes the subject from MAR to CAN and changes Yes/No odds.
- Totals expose `Over 2.5 goals`, the same period pills, and Yes/No rows.
- Lower page includes additional period market groups such as `1st Half Winner`.

P0 Holiwyn criteria:

- Selected line, subject/team, period, Yes/No side, odds, and probability must update together.
- Ticket/order/book identity must use the selected line/period, not the initially rendered row.

### Order Book / Depth

P0 reference behavior:

- Book is a dedicated page, not just a small inline popover.
- Header shows `Order Book`, event title, back, settings, Yes/No tabs, and a market selector.
- Ladder columns are `Price`, `Shares`, and `Value`.
- Asks are red horizontal bars; bids are green horizontal bars; the visible spread separator reads `Spread 0.5c`.
- The market selector is grouped by family and includes Moneyline plus Spreads entries.
- Settings expose a `Decimalize book` action.

P0 Holiwyn criteria:

- Book/depth must support market/outcome/line/period switching where Polymarket does.
- Depth must show price, shares, value/total, bid/ask sides, and spread. A single top-of-book quote is not sufficient for parity when ladder rows are available.

### Ticket / Confirmation

P0 reference behavior:

- Tapping a selected spread outcome dims the page and opens a bottom sheet.
- The S23 logged-in reference resolved to a production gate: `Location verification failed` with Contact support.
- No real order-entry amount field or swipe confirmation rail was reachable in this session.

P1 criteria:

- Swipe-like or rail confirmation remains a required near-parity target from earlier ticket audits, but this DQ-C reference cannot verify it because the production location gate blocks order entry.
- Holiwyn may keep fake-token trading, but must not claim real Polymarket production trading parity while this gate is unimplemented or intentionally out of scope.

### Tabs, Buttons, Actions, And Scroll

P0 reference behavior:

- Game/Chat segmented control is active. Chat replaces the body and keeps compact match context plus pinned outcome buttons.
- Share opens the Android share sheet with the event URL.
- Book opens the dedicated order book page.
- Group chevrons are visible for market sections.
- Scroll preserves compact match context and keeps the top segmented controls/actions reachable.

## Criteria

| ID | Priority | Criterion | DQ-C status |
| --- | --- | --- | --- |
| LD-DQ-C-P0-01 | P0 | Same-cycle S23 Polymarket reference exists for the World Cup game detail and core interactions. | Pass |
| LD-DQ-C-P0-02 | P0 | Holiwyn must preserve full page hierarchy: header actions, Game/Chat, teams/time, chart, chat preview, primary outcomes, grouped markets, rules/lower content. | Criteria added; Holiwyn not marked complete |
| LD-DQ-C-P0-03 | P0 | Chart interaction must be context-preserving and not static; no visible tooltip is required unless a later unblocked reference shows one. | Criteria added |
| LD-DQ-C-P0-04 | P0 | Line markets must update selected team/subject, line, period, Yes/No side, odds, and probabilities as one state. | Criteria added |
| LD-DQ-C-P0-05 | P0 | Book/depth must render a real ladder with bid/ask sides, price, shares, value/total, spread, Yes/No tabs, and market selector. | Criteria added |
| LD-DQ-C-P0-06 | P0 | Game/Chat, Book, Share, group chevrons, line selectors, period pills, and outcome buttons must be functional or explicitly gated. | Criteria added |
| LD-DQ-C-P0-07 | P0 | Scroll must retain compact match context and not lose selected market/line state. | Criteria added |
| LD-DQ-C-P1-01 | P1 | Ticket amount entry and swipe-like confirmation should be recaptured when reference location gate is unblocked; current DQ-C evidence only proves the gated bottom sheet. | Open |
| LD-DQ-C-P1-02 | P1 | Book market selector should support every visible family/period exposed in reference, including Moneyline and Spreads. | Open until Holiwyn proof exists |
| LD-DQ-C-P2-01 | P2 | Match native motion, density, red/green depth visualization, and chart touch feel after structural parity. | Open |

## Gap Calls

- Do not mark Holiwyn parity complete from this audit. This audit adds same-cycle reference proof and criteria only.
- Treat missing order-entry/swipe confirmation reference as location-gated, not as absent Polymarket behavior.
- Treat line selectors as P0 state machinery, not P2 polish: subject, line, period, odds, book, and ticket identity must move together.
- Treat Book as P0 for game-detail parity because it is a top-level action with real market/depth data and family selection.
