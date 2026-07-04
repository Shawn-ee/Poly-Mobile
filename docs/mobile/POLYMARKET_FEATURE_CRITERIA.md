# Polymarket Feature Criteria

Purpose: convert same-cycle Polymarket audits into pass/fail Holiwyn criteria.

Rule: every completed Holiwyn feature must have criteria here or in a focused audit file linked from this file. Every P0 must be objectively auditable.

## Priority Definitions

P0: required for parity baseline. If any P0 fails, the feature is not complete.

P1: required for near parity. May remain open only when explicitly tracked and accepted for a later cycle.

P2: polish. May remain open when tracked and not confusing or blocking.

## Universal P0 Criteria

These apply to every page, feature, button, and interaction:

| ID | Criterion | Audit method |
| --- | --- | --- |
| U-P0-01 | Same-cycle Polymarket reference audit exists for the exact feature. | Audit file and reference screenshot/hierarchy path. |
| U-P0-02 | Holiwyn Android device proof exists for the exact feature. | Screenshot/hierarchy/proof log path. |
| U-P0-03 | Every visible button/control either performs the expected Polymarket-equivalent action, opens the correct Holiwyn equivalent, or is explicitly disabled with a clear reason. | Device smoke and UI hierarchy. |
| U-P0-04 | Selected market, line, outcome, and tab state persist through navigation/ticket/portfolio flows when Polymarket preserves them. | Device smoke, route test, or state test. |
| U-P0-05 | Holiwyn does not use copied Polymarket logos, trademarks, protected text, proprietary images, or private assets. | Review. |
| U-P0-06 | Empty, loading, disabled, and error states are not static placeholders when Polymarket has meaningful behavior. | Device smoke and screenshots. |
| U-P0-07 | Visual hierarchy is not meaningfully worse or confusing compared with the Polymarket reference for the selected feature. | Audit Gate comparison. |
| U-P0-08 | Audit Gate Agent marks the feature pass with 0 unresolved P0 gaps. | Audit Gate report. |

## Feature Criteria Register

| Feature | Criteria owner file | P0 status | P1/P2 status | Latest gate |
| --- | --- | --- | --- | --- |
| Live football / World Cup game detail DQ-C | `docs/mobile/audits/live-football-world-cup-dq-c.md` | Fresh S23 reference P0 criteria added for full page hierarchy, chart press, line-state coupling, Book/depth ladder, active buttons/actions, tab behavior, and scroll behavior; Holiwyn not marked complete | P1 ticket amount/swipe confirmation recapture remains blocked by Polymarket location gate; P1 full Book market-selector parity and P2 visual/motion polish remain open | Reference audit only |
| Live event detail | `docs/mobile/audits/live-event-detail.md`; `docs/mobile/audits/live-event-detail-super-round-dm.md` | DN super-round P0 criteria are documented for Polymarket-first match-winner provider mapping, CLOB chart history, route-backed depth, Buy/Sell ticket identity, and honest stale/closed state handling | P1 exact line-family provider markets, filled-order/history lifecycle proof, and scheduled refresh remain open; P2 visual density/motion polish remains deferred | Pass for Cycles DK-DM evidence; Agent A/B must re-run final device proof against implementation build |
| Game page | `docs/mobile/audits/game-page.md` | Verified for Cycle AJ focused logged-in game-page P0; Cycle AL sticky market-tab criterion passed; Cycle AM Player Props unavailable-state criterion passed | P1/P2 phone density and backend-backed market data remain tracked | Pass |
| Trade ticket | `docs/mobile/audits/trade-ticket.md` | Verified for Cycle AI focused logged-in/tall ticket-surface P0 | P1/P2 deferred in focused audit; production eligibility/location gates remain deferred for fake-token mode | Pass |
| Binary side ticket | `docs/mobile/audits/binary-side.md` | Verified for Cycle AH focused Buy No contract-side P0 | P1 full-page/native swipe confirmation deferred | Pass |
| Line adjustment | `docs/mobile/audits/line-adjustment.md` | Verified for Cycle Y focused Spreads/Totals P0 | P1/P2 deferred in focused audit | Pass |
| Portfolio | `docs/mobile/audits/portfolio.md` | Verified for Cycle AA focused fake-token P0 | P1/P2 deferred in focused audit | Pass |
| Search | `docs/mobile/audits/search.md` | Verified for Cycle AB focused Search/Explore P0 | P1/P2 deferred in focused audit | Pass |
| Account/settings | `docs/mobile/audits/account.md` | Verified for Cycle AC focused account/settings P0 | P1/P2 deferred in focused audit | Pass |
| Chart behavior | `docs/mobile/audits/chart-behavior.md` | Verified for Cycle AD focused chart P0 | P1/P2 deferred in focused audit | Pass |
| Market page | `docs/mobile/audits/market-page.md` | Verified for Cycle AE focused market-page P0 | P1/P2 deferred in focused audit | Pass |
| Event page top shell | `docs/mobile/audits/event-page-top-shell.md` | Verified for Cycle U focused P0 | P1/P2 deferred in focused audit | Pass |
| Futures market rows | `docs/mobile/audits/futures-market-rows.md` | Verified for Cycle AK focused logged-in catalog expansion P0 | P1/P2 backend-owned catalog/live pricing and visual density remain tracked | Pass |
| Futures chart range | `docs/mobile/audits/futures-chart-range.md` | Verified for Cycle W focused P0 | P1/P2 deferred in focused audit | Pass |
| Match market tabs/cards | `docs/mobile/audits/match-market-tabs-cards.md` | Verified for Cycle X focused P0 | P1/P2 deferred in focused audit | Pass |
| Navigation | `docs/mobile/audits/navigation.md` | Verified for Cycle T P0 | P1/P2 deferred in focused audit | Pass |

## Required Special Coverage

Adjustable line markets:

- Spreads.
- Totals.
- Team totals.
- Corners.
- Halves.
- Other discovered line-based markets.

Chart behavior:

- Probability movement.
- Selected outcome state.
- Time range if present.
- Tooltip or press behavior if present.
- Empty/loading behavior.

Trade ticket:

- Buy/Sell switching.
- Amount entry.
- Odds/probability updates.
- Payout/cost calculation.
- Line selection carry-through.
- Confirmation/error state.

Live event detail DN super-round required checks:

- Chart source must be `polymarket-clob-prices-history` or an explicitly documented unavailable/stale state for provider-backed markets.
- Line selectors must be provider-backed for the selected line/outcome, or explicitly unavailable/stale/unsupported when current Polymarket reference exposes no line-family market.
- Orderbook/depth must use route-backed provider data and expose best bid, best ask, spread, price, shares, and total.
- Buy/Sell ticket must preserve selected provider source, external market, condition, outcome token, outcome label, market type, group, period, line, and side.
- Closed/resolved events must not be shown as current-live ready; stale/ended state is acceptable and required when the provider says so.

Market page:

- Tabs.
- Grouped markets.
- Expanded/collapsed rows.
- Nested market options.
- Line selectors.
- Liquidity/depth display.

Portfolio:

- Positions.
- Open orders.
- Cancel behavior.
- Activity/history.
- Sell/close/retrade behavior.

Navigation:

- Back behavior.
- Tab persistence.
- Scroll position.
- Deep links if applicable.

## Cycle DQ-C Live Football / World Cup Detail Criteria

The focused DQ-C S23 reference audit adds these criteria from `docs/mobile/audits/live-football-world-cup-dq-c.md`:

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| LD-DQ-C-P0-01 | P0 | Same-cycle S23 Polymarket reference exists for the World Cup game detail and core interactions. | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/` |
| LD-DQ-C-P0-02 | P0 | Holiwyn must preserve full page hierarchy: header actions, Game/Chat, teams/time, chart, chat preview, primary outcomes, grouped markets, rules/lower content. | Android screenshot/XML compared with `pm-dq-c-03-world-cup-game-top.*` and lower-page captures. |
| LD-DQ-C-P0-03 | P0 | Chart interaction must be context-preserving and not static; no visible tooltip is required unless a later unblocked reference shows one. | Chart press proof compared with `pm-dq-c-04-chart-press.*`. |
| LD-DQ-C-P0-04 | P0 | Line markets must update selected team/subject, line, period, Yes/No side, odds, and probabilities as one state. | Line selector proof compared with `pm-dq-c-08-spread-line-dropdown.*`, `pm-dq-c-09-spread-line-25.*`, and `pm-dq-c-16-markets-scroll-2.*`. |
| LD-DQ-C-P0-05 | P0 | Book/depth must render a ladder with bid/ask sides, price, shares, value/total, spread, Yes/No tabs, and market selector. | Book proof compared with `pm-dq-c-12-top-book-action.*` and `pm-dq-c-13-orderbook-market-selector.*`. |
| LD-DQ-C-P0-06 | P0 | Game/Chat, Book, Share, group chevrons, line selectors, period pills, and outcome buttons must be functional or explicitly gated. | Button/action smoke plus reference `pm-dq-c-05-chat-tab.*`, `pm-dq-c-12-top-book-action.*`, and `pm-dq-c-17-share-sheet.*`. |
| LD-DQ-C-P0-07 | P0 | Scroll must retain compact match context and not lose selected market/line state. | Scroll proof compared with `pm-dq-c-07-markets-scroll-1.*` and `pm-dq-c-16-markets-scroll-2.*`. |
| LD-DQ-C-P1-01 | P1 | Ticket amount entry and swipe-like confirmation should be recaptured when the Polymarket location gate is unblocked. | Current DQ-C proof only reaches `pm-dq-c-11-ticket-sheet-settled.*`. |
| LD-DQ-C-P1-02 | P1 | Book market selector should support every visible family/period exposed in reference, including Moneyline and Spreads. | Holiwyn Book selector proof against `pm-dq-c-13-orderbook-market-selector.*`. |
| LD-DQ-C-P2-01 | P2 | Match native motion, density, red/green depth visualization, and chart touch feel after structural parity. | Side-by-side visual QA. |
