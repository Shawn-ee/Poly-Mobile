# Polymarket Game Page Reference Audit

Date: 2026-07-02

Reference source: real Polymarket Android app on Samsung S23, package `com.polymarket.android`.

Reference event captured: live Portugal vs Croatia soccer game. The screen was already open in the real app after reconnecting the S23 with wireless debugging.

Evidence folder:

`docs/mobile/reference/screenshots/polymarket-s23-game-page-audit-2026-07-02/`

## Captured States

- `01-top-live-game.png` / `.xml`: top of live game page.
- `02-scroll-game-lines-open.png` / `.xml`: first market rows after scrolling.
- `03-scroll-more-markets.png` / `.xml`: deeper Game Lines markets.
- `04-scroll-deeper-markets.png` / `.xml`: first-half, second-half, and team-total area.
- `05-return-near-top.png` / `.xml`: near-top game page with expanded Regulation Time Winner and Spread visible.
- `06-primary-por-ticket.png` / `.xml`: ticket overlay after opening a primary POR action.
- `08-chat-tab.png` / `.xml`: Chat tab view.
- `13-player-props-tab.png` / `.xml`: Player Props tab selected.
- `14-spread-first-half.png` / `.xml`: attempted first-half spread interaction capture.
- `15-spread-second-half.png` / `.xml`: attempted second-half spread interaction capture.

## Page Header

- Top-left back control.
- Center segmented control with `Game` and `Chat`.
- Chat segment includes a live badge count, observed changing from about `1.0K` to smaller live values during capture.
- Top-right book/rules icon.
- Top-right share icon.
- Header remains visible while scrolling.

## Match Header And Scoreboard

- Live soccer scoreboard appears under the top controls.
- Team flags are large rounded squares.
- Team abbreviations shown: `POR` and `CRO`.
- Score shown as `0 - 0`.
- Live state shown in red with clock, observed around `15'`, `16'`, `17'`, `18'`.
- Polymarket logo appears between teams on the larger top chart state.
- On scrolled states, the scoreboard compresses: team flag, abbreviation, probability, score, clock, opposing score, abbreviation, probability, flag.

## Chart Behavior

- Real app does not use a static placeholder chart.
- The chart shows separate green and red price/probability traces for the two primary outcomes.
- The selected outcome label and percent are large on the right side, e.g. `Portugal 76%`, `Croatia 25%`.
- The chart updates over time; captured percentages changed from `POR 76% / CRO 25%` to `POR 74% / CRO 27%`.
- Trade-size markers appear along the left side of the chart, e.g. `+$9`, `+$39`, `+$1`, later `+$4`, `+$479`.
- Chart area includes an `All / Game / Live` segmented filter. `Game` was selected in the observed state.

## Social Preview And Chat

### Game Tab Preview

- A chat preview card appears between chart and primary action buttons.
- It shows a large live count, e.g. `117761 chatting`, later `118859 chatting`.
- It shows a user avatar, username, trade badge, optional extra count, and message.
- Example badges/messages observed:
  - `POR 1H $178`, `LFG`
  - `BTTS $200`, `Prayyyyy btts`
  - `CRISTIANO RONALDO 1+ G ...`
  - `POR TO ADVANCE $35`

### Chat Tab

- Chat tab replaces the market list with a live chat feed.
- The scoreboard remains visible at the top.
- Chat messages include usernames, trade badges, and text.
- Some messages include media or large ASCII/art content.
- A typing indicator appears: `Multiple people are typing`.
- Bottom input placeholder: `Say something...`.
- Quick reaction buttons visible: heart, celebration, trophy.
- Emoji picker control is visible.
- Primary POR/CRO action buttons remain sticky at bottom in the Chat tab.

## Primary Outcome Buttons

- Large side-by-side buttons sit above the market tabs.
- Observed labels: `POR 76%` and `CRO 25%`, later `POR 74%` and `CRO 27%`.
- Colors match outcome direction: green for Portugal, red for Croatia.
- Tapping POR opened a ticket overlay.

## Ticket Overlay

Observed ticket state: `06-primary-por-ticket.png`.

- Full-screen/bottom-sheet style overlay dims the game page behind it.
- Top-left close `X`.
- Top area shows team flag and event title `Portugal vs Croatia`.
- Selection line: `Yes · POR to advance`.
- Right-side filter/settings icon.
- Large central amount display starts at `$0`.
- Yes/No segmented toggle appears under the amount.
- Odds and balance/available line appears: `Odds 76% | $0 available`.
- Quick amount buttons: `+$5`, `+$10`, `+$25`.
- Numeric keypad: `1` through `9`, `.`, `0`, delete.
- Bottom action is green but disabled until amount is chosen: `Choose an amount`.
- Amount-entered submit state was not captured to avoid accidental real-money action.

## Game Lines Tab

Game Lines is the default selected tab.

### Regulation Time Winner

- Title: `Regulation Time Winner`.
- Subtitle: `90 Minutes Plus Stoppage Time`.
- Expanded by default near the top.
- Three outcome rows:
  - `POR (Reg. Time)` with flag icon, green mini bar, odds around `1.6x`, probability around `61%`.
  - `Tie` with neutral icon, blue mini bar, odds around `3.9x`, probability around `26%`.
  - `CRO (Reg. Time)` with flag icon, red mini bar, odds around `6.7x`, probability around `15%`.
- Row structure is compact: icon, label, small colored depth/probability line, odds multiplier, probability pill/button.
- Section has a chevron for collapse/expand.

### Spread

- Title: `Spread`.
- Dynamic sentence style: `POR to win by over 1.5 goals`.
- The spread value `1.5` appears as a green pill with a dropdown arrow.
- Segmented sub-tabs:
  - `Reg. Time`
  - `1st Half`
  - `2nd Half`
- Rows shown as Yes/No outcomes with odds and probability buttons.
- Observed Reg. Time Yes probability around `34%` to `36%`; No around `65%`.
- Section has a chevron for collapse/expand.

### Totals

- Title: `Totals`.
- Observed after scrolling deeper.
- The visible rows show probabilities around `52%` and `49%`.
- Exact line value was partially obscured by XML text splitting; screenshot evidence should be used for visual reconstruction.

### 1st Half Winner

- Title: `1st Half Winner`.
- Question text visible in XML as split letters, corresponding to "Who wins the first half?"
- Rows observed:
  - `Croatia`, around `15%`.
  - `Tie 1H`, around `45%`.
  - `Portugal`, around `44%`.

### 2nd Half Winner

- Title: `2nd Half Winner`.
- Rows observed after deeper scroll:
  - Croatia-like row around `19%`.
  - `Tie 2H`, around `33%`.
  - Portugal-like row around `54%`.

### Full Game Team Total Goals

- Title observed: `Full Game Team Total Goals (Reg. Time)`.
- Contains Over-style rows after deeper scroll.
- Exact line values require additional deeper screenshots if this group becomes P0.

## Player Props Tab

Player Props is not blank in the real app.

Observed state: `13-player-props-tab.png`.

- `Player Props` tab can be selected.
- The same scoreboard/chart/primary buttons remain visible above.
- First visible Player Props group: `Goals (Reg. Time)`.
- Group appears collapsed with a chevron.
- This contradicts the earlier Holiwyn prototype decision to leave Player Props blank.

## Interactions Observed

- Vertical scroll: header stays fixed; scoreboard compresses; market groups continue down the page.
- Game/Chat segmented switch changes the page body between market list and live chat.
- Primary outcome button opens ticket overlay.
- Ticket overlay can be dismissed with back/close.
- Market groups use chevrons and expandable rows.
- Spread includes nested segmented controls and a dropdown line-value pill.
- Player Props tab reveals prop groups, not an empty placeholder.

## Empty And Error States

- No empty state observed on the reference game page.
- No error state observed.
- No no-liquidity/closed-market state observed in this capture.
- No logged-out restriction was observed on the captured screen, but ticket showed `$0 available`.

## Audit Conclusions For Holiwyn

- Holiwyn's current chart is not sufficient if it remains a static placeholder. P0 parity requires a real-looking probability movement chart with changing data points per outcome and trade/value markers or a documented data-backed approximation.
- Holiwyn's Game Lines are too shallow. P0 parity requires at least Regulation Time Winner, Spread, Totals, 1st Half Winner, 2nd Half Winner, and Team Total Goals structures.
- Holiwyn's Player Props blank tab is not real Polymarket parity. The blank-tab behavior should become a gap unless deliberately downgraded by criteria.
- Holiwyn's market rows must be richer: icon, label, mini probability/depth line, odds multiplier, probability button, and expandable groups.
- Holiwyn's ticket should move closer to Polymarket's full-screen numeric-entry sheet with quick amounts, Yes/No toggle, odds/available line, and disabled/enabled submit state.
- Holiwyn's Chat tab needs a real tab view with live feed/input/reactions if it is considered P0.
