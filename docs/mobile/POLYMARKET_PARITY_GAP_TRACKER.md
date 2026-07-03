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
