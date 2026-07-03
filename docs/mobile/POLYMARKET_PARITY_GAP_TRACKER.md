# Polymarket Parity Gap Tracker

Purpose: track every Polymarket parity gap discovered by the new mandatory audit workflow.

Rule: a feature cannot be marked complete while it has unresolved P0 gaps. P1/P2 gaps may remain only when explicit and tracked.

## Status Values

- Open: not implemented or not proven.
- In progress: implementation underway.
- Audit failed: implementation exists but Audit Gate failed it.
- Verified: Audit Gate passed with evidence.
- Deferred: accepted P1/P2 gap for later.

## Current Gate Summary

| Feature | P0 open | P1 open | P2 open | Latest status | Evidence |
| --- | ---: | ---: | ---: | --- | --- |
| Game page | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/game-page.md` |
| Trade ticket | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/trade-ticket.md` |
| Line adjustment | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/line-adjustment.md` |
| Portfolio | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/portfolio.md` |
| Search | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/search.md` |
| Account/settings | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/account.md` |
| Chart behavior | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/chart-behavior.md` |
| Market page | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/market-page.md` |
| Event page top shell | 0 | 2 | 1 | Cycle U focused P0 pass | `docs/mobile/audits/event-page-top-shell.md`; `docs/mobile/reference/screenshots/cycle-U-polymarket-event-*`; `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-top-order-book.png`; `docs/mobile/harness/cycle-current-holiwyn-event-detail-top-order-book.xml`; `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-share-sheet.png`; `docs/mobile/harness/cycle-current-holiwyn-event-detail-share-sheet.xml` |
| Futures market rows | 0 | 2 | 1 | Cycle V focused P0 pass | `docs/mobile/audits/futures-market-rows.md`; `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-markets-*`; `docs/mobile/screenshots/cycle-current-holiwyn-future-card-stats.png`; `docs/mobile/harness/cycle-current-holiwyn-future-card-stats.xml`; `docs/mobile/screenshots/cycle-current-holiwyn-future-list-ticket.png`; `docs/mobile/harness/cycle-current-holiwyn-future-list-ticket.xml` |
| Futures chart range | 0 | 2 | 1 | Cycle W focused P0 pass | `docs/mobile/audits/futures-chart-range.md`; `docs/mobile/reference/screenshots/cycle-W-polymarket-world-cup-winner-chart-*`; `docs/mobile/screenshots/cycle-current-holiwyn-future-chart-1w.png`; `docs/mobile/harness/cycle-current-holiwyn-future-chart-*.xml` |
| Match market tabs/cards | 0 | 3 | 1 | Cycle X focused P0 pass | `docs/mobile/audits/match-market-tabs-cards.md`; `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-*`; `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-*.png`; `docs/mobile/harness/cycle-current-holiwyn-market-tabs-*.xml` |
| Navigation | 0 | 2 | 1 | Cycle T P0 pass | `docs/mobile/audits/navigation.md`; `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-*`; `docs/mobile/screenshots/cycle-current-holiwyn-whole-app-nav-*`; `docs/mobile/harness/cycle-current-holiwyn-whole-app-nav-*` |

## Gap Table

| Gap ID | Feature | Priority | Status | Polymarket behavior | Holiwyn behavior | Recommended fix | Evidence | Cycle introduced | Cycle resolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PM-GAP-000 | Workflow | P0 | Verified | Features require same-cycle reference audit before completion. | Loop docs now require reference audit, criteria, device proof, and Audit Gate pass. | Use this tracker for all future parity cycles. | `docs/mobile/MOBILE_APP_AUTONOMOUS_DEVELOPMENT_LOOP.md`; `docs/mobile/MOBILE_HARNESS_SPEC.md` | Cycle S | Cycle S |
| PM-GAP-001 | Navigation | P0 | Verified | Polymarket primary bottom nav has four tabs: Home, Live, Portfolio, Search; account/settings access is outside bottom nav. | Holiwyn now has four primary bottom tabs and Account opens through `header-account-action`. | Keep Account out of bottom tabs; continue deeper back/scroll polish as P1. | `docs/mobile/audits/navigation.md`; `docs/mobile/reference/screenshots/cycle-T-polymarket-nav-home.xml`; `docs/mobile/harness/cycle-current-holiwyn-whole-app-nav-home.xml`; `docs/mobile/harness/cycle-current-holiwyn-whole-app-nav-account.xml`; `npm run smoke:tablet:whole-app-nav-discovery` | Cycle T | Cycle T |
| PM-GAP-002 | Navigation | P1 | Deferred | Polymarket preserves tab/scroll behavior with native-feeling transitions. | Holiwyn still uses simple local tab state and needs a later deeper scroll/back-stack pass. | Add native navigation/back-stack and scroll restoration audit in a later navigation cycle. | `docs/mobile/audits/navigation.md` | Cycle T | Deferred |
| PM-GAP-003 | Navigation | P2 | Deferred | Polymarket has production app route restoration and native route behavior. | Holiwyn uses Expo smoke deep links and local state for proof flows. | Create production-style deep-link/route restoration contract after dev-build/APK lane matures. | `docs/mobile/audits/navigation.md` | Cycle T | Deferred |
| PM-GAP-004 | Event page top shell | P0 | Verified | Polymarket's top book action opens an Order Book for the current market. | Holiwyn top book action now opens the event Order Book instead of a watchlist notice. | Keep top book mapped to Order Book; handle watchlist/saved elsewhere. | `docs/mobile/audits/event-page-top-shell.md`; `docs/mobile/reference/screenshots/cycle-U-polymarket-event-book.png`; `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-top-order-book.png`; `docs/mobile/harness/cycle-current-holiwyn-event-detail-top-order-book.xml`; `npm run smoke:tablet:event-detail-actions` | Cycle U | Cycle U |
| PM-GAP-005 | Event page top shell | P0 | Verified | Polymarket preserves event context when leaving and returning from top-shell overlays/tabs. | Holiwyn closes Order Book and share sheet back to the same event page with Game Lines still visible. | Keep overlay dismiss checks in event-detail actions smoke. | `docs/mobile/harness/cycle-current-holiwyn-event-detail-top-order-book-dismissed.xml`; `docs/mobile/harness/cycle-current-holiwyn-event-detail-share-dismissed.xml` | Cycle U | Cycle U |
| PM-GAP-006 | Event page top shell | P1 | Deferred | Polymarket native share behavior should be verified from the top share action. | Holiwyn opens a branded in-app share panel; exact native share parity is not yet proven. | Run a future safe native-share reference pass and decide whether Holiwyn should use native share or retain a branded pre-share panel. | `docs/mobile/audits/event-page-top-shell.md` | Cycle U | Deferred |
| PM-GAP-007 | Event page top shell | P1 | Deferred | World Cup-specific Polymarket event top-shell should be referenced directly. | The generic event top-shell was captured; World Cup-specific retry was blocked by Polymarket location verification. | Recapture a World Cup event once the reference app is location-verified. | `docs/mobile/reference/screenshots/cycle-U-polymarket-recovered-home.png`; `docs/mobile/audits/event-page-top-shell.md` | Cycle U | Deferred |
| PM-GAP-008 | Event page top shell | P2 | Deferred | Polymarket top-shell spacing and transitions feel native and dense. | Holiwyn is functional and auditable but still needs side-by-side density/animation polish. | Add a later visual polish pass after market groups and ticket behavior are deeper. | `docs/mobile/audits/event-page-top-shell.md` | Cycle U | Deferred |
| PM-GAP-009 | Futures market rows | P0 | Verified | Polymarket World Cup Winner rows show flag, outcome name, outcome volume, large probability, Buy Yes, and Buy No. | Holiwyn futures rows now show the same core structure with branded styling. | Keep row structure; continue data-contract parity next. | `docs/mobile/audits/futures-market-rows.md`; `docs/mobile/screenshots/cycle-current-holiwyn-future-card-stats.png` | Cycle V | Cycle V |
| PM-GAP-010 | Futures market rows | P0 | Verified | Tapping a Buy Yes-style control opens a trading flow for that selected future outcome, or a trading gate in view-only web. | Holiwyn Buy Yes opens the selected future ticket for World Cup winner / France. | Keep ticket carry-through proof in futures smoke. | `docs/mobile/screenshots/cycle-current-holiwyn-future-list-ticket.png`; `docs/mobile/harness/cycle-current-holiwyn-future-list-ticket.xml` | Cycle V | Cycle V |
| PM-GAP-011 | Futures market rows | P1 | Deferred | Polymarket Buy No represents a true NO position for the selected binary outcome. | Holiwyn maps Buy No to the existing sell/no-side approximation because the mobile/backend contract lacks separate binary NO shares. | Add explicit binary outcome side to ticket/order contracts and backend routes. | `docs/mobile/audits/futures-market-rows.md`; `docs/mobile/MOBILE_DATA_CONTRACT_GAPS.md` | Cycle V | Deferred |
| PM-GAP-012 | Futures market rows | P1 | Deferred | Reference shows at least France, Argentina, Spain, and England in the captured World Cup Winner top rows. | Holiwyn currently renders France, Argentina, and Spain from local fallback data. | Expand backend/fallback futures outcome catalog from server data. | `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-markets-2.png` | Cycle V | Deferred |
| PM-GAP-013 | Futures chart range | P0 | Verified | Polymarket World Cup Winner chart shows top outcome legend, chart area, volume row, and `1H/1D/1W/1M/MAX` ranges. | Holiwyn futures card now shows a branded chart section with legend, volume, and the same baseline range controls. | Replace local chart visuals with backend history when available. | `docs/mobile/audits/futures-chart-range.md`; `docs/mobile/harness/cycle-current-holiwyn-future-chart-ready.xml` | Cycle W | Cycle W |
| PM-GAP-014 | Futures chart range | P0 | Verified | Tapping ranges changes chart range state without leaving the event context. | Holiwyn proves `1D` then `1W` range state changes while futures rows remain visible. | Keep range smoke as regression coverage. | `docs/mobile/harness/cycle-current-holiwyn-future-chart-1d.xml`; `docs/mobile/harness/cycle-current-holiwyn-future-chart-1w.xml` | Cycle W | Cycle W |
| PM-GAP-015 | Futures chart range | P1 | Deferred | Polymarket chart ranges reflect real historical price/probability data. | Holiwyn uses local deterministic chart lines and local range state. | Add backend market-history route and adapter. | `docs/mobile/audits/futures-chart-range.md`; `docs/mobile/MOBILE_DATA_CONTRACT_GAPS.md` | Cycle W | Deferred |
| PM-GAP-016 | Match market tabs/cards | P0 | Verified | Polymarket match page exposes market tabs such as `Game Lines`, `Exact Score`, and `Halves`. | Holiwyn event detail now exposes `Game Lines`, `Exact Score`, `Halves`, and the existing `Player Props` placeholder. | Keep tab-switch smoke coverage and continue deeper market tabs in later cycles. | `docs/mobile/audits/match-market-tabs-cards.md`; `docs/mobile/harness/cycle-current-holiwyn-market-tabs-game-lines.xml` | Cycle X | Cycle X |
| PM-GAP-017 | Match market tabs/cards | P0 | Verified | Polymarket Game Lines begins with match-specific cards such as `Team to Advance` and card outcome buttons. | Holiwyn now renders a `Team to Advance` card with volume and two price buttons before the existing Moneyline rows. | Replace local card data with backend market groups when available. | `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-game-lines.png`; `docs/mobile/harness/cycle-current-holiwyn-market-tabs-game-lines.xml` | Cycle X | Cycle X |
| PM-GAP-018 | Match market tabs/cards | P0 | Verified | Polymarket card details expose `Order Book`, `Graph`, and `About`, with Order Book showing price/shares/total depth. | Holiwyn Team to Advance card now exposes those inline controls and proves `Graph` state switching. | Add backend-backed graph/depth data in later cycles. | `docs/mobile/harness/cycle-current-holiwyn-market-tabs-game-lines.xml`; `docs/mobile/harness/cycle-current-holiwyn-market-tabs-graph.xml` | Cycle X | Cycle X |
| PM-GAP-019 | Match market tabs/cards | P0 | Verified | Polymarket `Exact Score` and `Halves` tabs switch to distinct market groups. | Holiwyn `Exact Score` and `Halves` tabs switch to distinct sections with auditable rows. | Replace placeholder/local row set with backend market group payloads. | `docs/mobile/harness/cycle-current-holiwyn-market-tabs-exact-score.xml`; `docs/mobile/harness/cycle-current-holiwyn-market-tabs-halves.xml` | Cycle X | Cycle X |
| PM-GAP-020 | Match market tabs/cards | P1 | Deferred | Polymarket match page has a `Live stats` tab beside `Market`. | Holiwyn still has top `Game/Chat` controls and no full `Live stats` tab. | Add a dedicated match `Market/Live stats` section audit and implementation. | `docs/mobile/audits/match-market-tabs-cards.md` | Cycle X | Deferred |
| PM-GAP-021 | Match market tabs/cards | P1 | Deferred | Polymarket card graph/order-book data is live market data. | Holiwyn card detail data is local/deterministic in this cycle. | Add backend market depth/history contracts and adapters. | `docs/mobile/MOBILE_DATA_CONTRACT_GAPS.md` | Cycle X | Deferred |
| PM-GAP-022 | Match market tabs/cards | P1 | Deferred | Polymarket Exact Score/Halves markets are discovered from real market groups. | Holiwyn uses local/fallback rows for this focused P0 pass. | Add backend market group schema for exact score, halves, and nested cards. | `docs/mobile/MOBILE_BACKEND_ROUTE_DEPENDENCY_MAP.md` | Cycle X | Deferred |

## Audit Questions For Every Gap

For every UI element or interaction, answer:

1. What does Polymarket show?
2. What happens when the user taps, swipes, or changes it?
3. What state changes?
4. What data changes?
5. What does the ticket, portfolio, or history show afterward?
6. Does Holiwyn match?
7. If not, what exactly is missing?
8. Is the gap P0, P1, or P2?
9. What implementation change is recommended?
