# Holiwyn UI Regression And Source-Change Report

Last updated: 2026-07-08

## Scope

This report covers the visible mobile UI state after the provider readiness and provider breadth proof work, with special attention to source labels that became too dominant in tester screens.

Latest cleanup status:

- Cycle OT refreshed/imported `World Cup Winner` with 8 real Polymarket markets, proved the broad provider route, and proved S23 Search visibility with 3 provider-backed World Cup results.
- Cycle OQ imported/refreshed broader Polymarket-backed World Cup provider data and proved multiple provider-backed events through the mobile Search surface.
- Cycle OR guarded the mobile Live match feed so provider `future` / `outright` events do not appear as live football matches even when upstream provider metadata reports `LIVE`.
- No new visual source-label micro-proof should be opened unless source labeling blocks tester verification or creates a real user-flow regression.

## What Changed Visually Since Yesterday

- Home event cards now show provider/source readiness for the MVP match.
  - Before cleanup: `Winner: Polymarket / Lines: local test fake-token`.
  - After cleanup: `Winner: Polymarket / test lines`.
- Event Detail shows a market source banner for mixed provider/fixture coverage.
  - Regulation winner is identified as Polymarket-backed.
  - spread, total, and team-total lines are still identified as test-line coverage.
- Line-market rows now use a compact `Test` pill plus `Test line - fake USDT`.
- Trade Ticket keeps the source note near the selected market.
  - Polymarket-backed winner tickets show `Polymarket market`.
  - fixture-backed line tickets show `Test line - fake USDT`.
- The source labels are slightly smaller/lighter on Home so they do not dominate the tester UI.
- Search now exposes the broader provider-backed World Cup runtime:
  - `Which continent will win the World Cup?`
  - `World Cup Winner`
  - `Argentina vs. Egypt`
- Latest S23 Search proof shows `World Cup Winner` as `Polymarket 8 markets`, `Which continent...` as `Polymarket 3 markets`, and `Argentina vs. Egypt` as `Polymarket 3 / test lines 4`.
- Provider-backed futures/outrights in Search now display as future predictions with `Starts Time TBD` instead of looking like active live matches.
- Live now intentionally shows the empty live-football state when only provider futures/outrights are available.

## What Was Intentionally Removed

- No new order book UI was added or exposed.
- No chat, live stats, social, watchlist, or non-MVP surfaces were added in this cleanup.
- No backend/schema/order logic changed in this cleanup.
- No source/proof markers were removed from accessibility labels or test hooks.
- No source-label micro-proof behavior was added after Cycle OR.

## What Was Hidden Because It Was Mock, Proof, Or Stale Data

- The old visible wording `local test fake-token` was softened because it read like debug copy in the tester UI.
- Internal source labels remain available in accessibility/proof strings:
  - `home-card-source-local-test-fake-token`
  - `line-source-local-test-fake-token`
  - `line-market-local-test-fake-token`
  - `ticket-source-badge-local`
  - `portfolio-source-badge-local`
- Fixture-backed line markets remain visibly disclosed as `Test` or `Test line - fake USDT`; they are not presented as Polymarket-backed.
- Provider-backed future/outright events were hidden from the Live match feed because they are not live football games for the Local MVP path.
- Broad provider futures remain out of the Home match feed because Home is currently scoped to the Local MVP match journey, not a full provider discovery wall.
- Cycle OT kept useful internal source labels but did not add any new tester-facing debug/source wording.

## What Is Still Available In Another Runtime Mode

- Broader Polymarket provider breadth is available through backend routes and Search/provider runtime proof, but Home intentionally remains MVP-focused on the single match route.
- Order book routes/tests remain as internal infrastructure, but order book is hidden from default mobile MVP UI.
- Provider breadth proof imported/refreshed the World Cup winner event and confirmed multiple provider-backed backend surfaces; Home still filters to match events for the current retail MVP path.
- The backend/API route can still return broad provider-backed World Cup surfaces when called without the Home `mobileMvpMatches=1` filter.
- Internal source/status proof markers remain available in XML/accessibility labels for harness checks, but they should not dominate final tester-facing copy.

## Real Regressions

- No new real regression was found in this cleanup cycle.
- Workflow regression: the completed mobile branch was pushed to `poly-mobile`, but a normal local merge into the standalone `mobile-development` branch failed because that branch has an unrelated history and root-level mobile layout while this repo keeps the app under `mobile/`. Do not force-merge that branch without first deciding the canonical mobile repo layout.
- Existing product gap remains: spread/total/team-total line markets are contract-shaped test fixtures, not real Polymarket-backed line markets for the selected MVP match.
- Existing provider breadth gap remains: multiple real provider-backed events are proven in backend/search surfaces, but not yet visible as multiple Home match cards because Home deliberately uses the local MVP match filter.
- Existing tester-flow gap remains: full end-to-end fake-token order proof was not rerun in this source-label cleanup cycle because backend/order behavior was intentionally untouched.
- Current cycle result: no new visual regression found; the only failed proof attempt was environmental, because the S23 was sitting on a Samsung system update screen before Expo was relaunched.

## S23 Proof

- Home cleaned source label:
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-home-reopened.png`
- Event Detail cleaned banner and line rows:
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-event-detail.png`
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-event-detail-line.png`
- Trade Ticket provider-backed winner:
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-ticket.png`
- Trade Ticket fixture-backed line:
  - `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-line-ticket.png`
- Provider breadth Search proof:
  - `docs/mobile/screenshots/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-s23-provider-breadth-search.png`
  - `docs/mobile/harness/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-s23-provider-breadth-search.xml`
  - `docs/mobile/screenshots/cycle-OQ-provider-breadth-runtime/cycle-OQ-search-provider-breadth.png`
  - `docs/mobile/screenshots/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-search-world-provider-futures-after-clear.png`
- Live feed guard proof:
  - `docs/mobile/screenshots/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-live-no-outright-futures-after-tap.png`

## Next Milestone

Provider Breadth Runtime Loop should continue, but only for material user-flow gaps:

- Import and normalize more real Polymarket-backed markets/events.
- Refresh reference prices and prove source/status fields through mobile-visible routes.
- Prove multiple provider-backed events in mobile without misclassifying futures as live matches.
- Run bot dry-run/live-local only with a tiny allowlist.
- Avoid more source-label-only passes unless the label directly blocks testing or hides a real source mismatch.
