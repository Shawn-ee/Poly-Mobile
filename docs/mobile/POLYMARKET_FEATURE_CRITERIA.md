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
| Orderbook family/depth selector DU integrated | `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md`; `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Partial. DU proves backend provider-ready first-half Spread depth and visible Book settings/Spread selector/ticket carry-through, but not in the same Android UI run | Required remaining proof: render provider-backed ready depth in the Android Book UI for the same backend market id/selector key, tie backend JSON to app-visible markers, preserve non-ready state evidence distinctly, then rerun final Audit Gate | DU integrated partial; not parity-pass |
| Orderbook family/depth selector DU-C final gate | `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md`; `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Open. DU-C requires one integrated Android proof bundle tying provider-backed ready backend JSON to the visible Book UI, plus Spread/period/line carry-through, Decimalize/equivalent setting, ticket/identity preservation, and no DT regression | P1 row-to-ticket polish and P2 phone-density/visual polish remain after all P0s pass | DU-C final gate prepared; not parity-pass |
| Orderbook family/depth selector DT integrated | `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Partial. DT integrated proof exists for Yes/No tab switching, selector carry-through into a Totals ticket, side-labelled ladder markers, and backend provider-backed ready depth route; PM-GAP-075 remains open | Required remaining proof: provider-backed ready depth visible in the same UI run, Spread/period/line selector carry-through, and Decimalize/equivalent Book setting. P1 broader selector coverage, row-to-ticket carry-through polish, and P2 visual polish remain open after gate pass | DT integrated partial; not parity-pass |
| Line-market ticket target parity DR-C | `docs/mobile/audits/cycle-dr-c-line-market-ticket-target-gate.md` | Focused P0 pass after integrated Samsung tablet proof for selected market family, line, period, side/outcome, odds/probability, and ticket target identity | DQ-C production ticket amount/swipe recapture remains P1 due to location gate; Book/order/portfolio/history coupling stays under PM-GAP-074 | Pass for focused ticket-target gate |
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

## Cycle DR-C Line-Market Ticket Target Gate Criteria

The focused DR-C gate in `docs/mobile/audits/cycle-dr-c-line-market-ticket-target-gate.md` converts DQ-C line-selector behavior into pass/fail criteria for Agent B's ticket target work. Integrated Android evidence now exists in `docs/mobile/harness/cycle-DR-C-integrated-line-market-ticket-proof.json`.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| LD-DR-C-P0-01 | P0 | Selected market family must match the tapped family: Spread taps open a Spread ticket, Totals taps open a Totals ticket, and lower-period rows do not fall back to a primary moneyline/fallback target. | Android screenshot/XML for at least one Spread and one Totals ticket opened from the DQ-C-style game detail after selection changes. |
| LD-DR-C-P0-02 | P0 | Selected line must match the user-selected row/selector value. | Before/after selector proof plus ticket XML showing the same selected line in `ticket-selection-line` and selected outcome label. |
| LD-DR-C-P0-03 | P0 | Selected period must carry through from row to ticket, including at least one non-default period. | Row proof and ticket proof both showing the selected period. |
| LD-DR-C-P0-04 | P0 | Selected side/outcome must carry through, including Yes/No or Over/Under/team subject changes caused by line selection. | Ticket XML showing side and outcome in `ticket-contract-outcome-row` and `ticket-selected-outcome-choice`, with screenshot agreement. |
| LD-DR-C-P0-05 | P0 | Odds/probability must come from the selected market/line/period/outcome, not stale row state. | Row odds/probability before tap and ticket odds/probability after tap for Spread and Totals. |
| LD-DR-C-P0-06 | P0 | Ticket target identity must preserve selected market family, line, period, side/outcome, event, provider/source identity where available, and order target through amount entry/ready state. | Clean Android ticket proof after entering amount, plus XML/proof JSON showing the selection fields used by the order payload or service layer. |
| LD-DR-C-P0-07 | P0 | Android visible proof must be clean and DR-C-owned. | Passing smoke/test summary plus committed `docs/mobile/screenshots/cycle-DR-C-*` and `docs/mobile/harness/cycle-DR-C-*` artifacts. |

## Cycle DS-C Orderbook Audit Gate Criteria

The focused DS-C gate in `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` converts DQ-C Book/orderbook evidence into pass/fail criteria for PM-GAP-075. The DT re-gate in `docs/mobile/audits/cycle-dt-c-orderbook-regate.md` rechecks the same gap using DS integrated evidence. Current status is fail-until-proof after integrated Android proof in `docs/mobile/harness/cycle-DS-integrated-orderbook-ui-proof.json`; PM-GAP-075 is not passed yet.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| OB-DS-C-P0-01 | P0 | Book action opens a dedicated orderbook surface and preserves event identity. | Android screenshot/XML after tapping Book from the DS Holiwyn game detail. |
| OB-DS-C-P0-02 | P0 | Yes/No tabs are visible and interactive without losing selected market identity. | Before/after tab proof in XML or proof JSON. |
| OB-DS-C-P0-03 | P0 | Market selector is grouped by family and exposes Moneyline plus Spread choices. | Open selector screenshot/XML comparable to `pm-dq-c-13-orderbook-market-selector.*`. |
| OB-DS-C-P0-04 | P0 | Family, period, line, side/outcome, and selected market identity carry through selector, ladder, and ticket action. | Selector before/after plus ladder/ticket XML or proof JSON. |
| OB-DS-C-P0-05 | P0 | Ladder has Price, Shares, and Value/total columns with multiple rows when depth exists. | Android XML and screenshot comparable to `pm-dq-c-12-top-book-action.*`. |
| OB-DS-C-P0-06 | P0 | Ask and bid sides are visually distinct, with asks above spread and bids below spread. | Screenshot proof of red/green side styling plus row-side metadata. |
| OB-DS-C-P0-07 | P0 | Spread separator is visible and reflects the active ladder. | Android XML/screenshot with spread value. |
| OB-DS-C-P0-08 | P0 | Loading, empty, unavailable, stale, and error states are explicit and not mistaken for ready Polymarket-backed depth. | Ready plus at least one non-ready state proof, or documented unavailable-state reason. |
| OB-DS-C-P0-09 | P0 | Proof is integrated and DS-C-owned. | Committed `cycle-DS-C-*` screenshots/XML/proof JSON plus passing smoke/test summary. |
| OB-DS-C-P1-01 | P1 | Settings expose `Decimalize book` or documented display equivalent. | Settings screenshot/XML and state-preservation proof. |
| OB-DS-C-P1-02 | P1 | Selector coverage extends to every visible family/period when the event exposes them. | Additional selector proof for Totals/halves/team totals when available. |
| OB-DS-C-P1-03 | P1 | Ladder row tap carries price, side, shares/value, and selected market identity into ticket/order. | Row tap ticket/order proof JSON/XML. |
| OB-DS-C-P2-01 | P2 | Phone density, motion, row bars, and red/green styling are close to DQ-C reference. | Side-by-side visual QA after P0 pass. |

## Cycle DU-C Orderbook Final Gate Criteria

The focused DU-C gate in `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md` is the final pre-integration blocker for PM-GAP-075. It reuses DQ-C S23 Polymarket reference evidence and DS/DT Holiwyn progress evidence. No fresh DU-C S23 reference or Holiwyn Android proof was captured by Agent C.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| OB-DU-C-P0-01 | P0 | Provider-backed ready depth must be visible in the Android Book UI, not only returned by backend JSON. | Integrated Android screenshot/XML/proof JSON showing ready provider source/status, event title, selected market identity, Price/Shares/Value rows, bid/ask rows, and spread. |
| OB-DU-C-P0-02 | P0 | Backend ready JSON must be tied to the app-visible market id or selector key in the same run. | Proof JSON showing the visible UI market id/selector key matches backend `depthSource=provider-orderbook-depth` and `providerOrderbookDepth.status=ready`. |
| OB-DU-C-P0-03 | P0 | Spread selector carry-through must preserve family, period, line, side/outcome, and selected market identity through selector, ladder, and ticket. | Before/after Android selector proof plus ladder/ticket XML or proof JSON with matching Spread family, non-default line, period, side/outcome, market id or selector key, and odds/depth source. |
| OB-DU-C-P0-04 | P0 | Spread period and line fields must not collapse to `none` when claiming Spread/period/line parity. | Proof JSON with non-null/non-`none` line and period fields, or documented unavailability that prevents pass. |
| OB-DU-C-P0-05 | P0 | Settings must expose `Decimalize book` or documented Holiwyn equivalent and preserve selected state. | Settings screenshot/XML plus before/after proof that event, selected market, selected side, line, period, ready depth status, and ticket identity do not reset. |
| OB-DU-C-P0-06 | P0 | Ticket/identity preservation must cover the final integrated provider-ready Spread path. | Ticket XML/proof JSON preserving event, family, period, line, side/outcome, market id/selector key, provider/source identity, and selected row price/side where applicable. |
| OB-DU-C-P0-07 | P0 | DT-passed Yes/No switching and side-labelled ladder behavior must not regress. | Same integrated bundle includes tab switch before/after and ask/bid row-side markers above/below spread. |
| OB-DU-C-P0-08 | P0 | Non-ready states must remain honest and visually distinct from provider-ready depth. | Integrated proof includes a non-ready state or documented skip reason; fallback/idle/unavailable rows cannot be used as ready evidence. |
| OB-DU-C-P0-09 | P0 | Final evidence must be integrated, Android-visible, and committed under DU-owned proof paths. | Passing smoke/test summary plus committed screenshots/XML/proof JSON from the integrated DU build. |
