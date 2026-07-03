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
| Game page | `docs/mobile/audits/game-page.md` | Pending new-rule audit | Pending | Not run |
| Trade ticket | `docs/mobile/audits/trade-ticket.md` | Verified for Cycle Z focused game-page ticket P0 | P1/P2 deferred in focused audit | Pass |
| Line adjustment | `docs/mobile/audits/line-adjustment.md` | Verified for Cycle Y focused Spreads/Totals P0 | P1/P2 deferred in focused audit | Pass |
| Portfolio | `docs/mobile/audits/portfolio.md` | Verified for Cycle AA focused fake-token P0 | P1/P2 deferred in focused audit | Pass |
| Search | `docs/mobile/audits/search.md` | Verified for Cycle AB focused Search/Explore P0 | P1/P2 deferred in focused audit | Pass |
| Account/settings | `docs/mobile/audits/account.md` | Verified for Cycle AC focused account/settings P0 | P1/P2 deferred in focused audit | Pass |
| Chart behavior | `docs/mobile/audits/chart-behavior.md` | Verified for Cycle AD focused chart P0 | P1/P2 deferred in focused audit | Pass |
| Market page | `docs/mobile/audits/market-page.md` | Verified for Cycle AE focused market-page P0 | P1/P2 deferred in focused audit | Pass |
| Event page top shell | `docs/mobile/audits/event-page-top-shell.md` | Verified for Cycle U focused P0 | P1/P2 deferred in focused audit | Pass |
| Futures market rows | `docs/mobile/audits/futures-market-rows.md` | Verified for Cycle V focused P0 | P1/P2 deferred in focused audit | Pass |
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
