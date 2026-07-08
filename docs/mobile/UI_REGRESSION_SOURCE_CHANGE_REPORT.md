# Holiwyn UI Regression And Source Change Report

Date: 2026-07-08

## Summary

The recent mobile cycles intentionally shifted Holiwyn from broad prototype parity toward the Local MVP retail flow:

Home -> Event Detail -> market/outcome -> Trade Ticket -> fake-token server order -> Portfolio/history.

The biggest visible change is that Holiwyn now exposes source status more honestly:

- Regulation Winner is shown as Polymarket-backed.
- Spread/Totals/Team Total are shown as local-test fake-token lines.
- Orderbook, chat, live stats, social/watchlist, and broad discovery surfaces are hidden from the default MVP path.

This is directionally correct for testing, but the UI now risks feeling too much like a proof harness in a few places. The internal source markers should remain in accessibility/test labels, while the final tester UI should use lighter visible copy.

## What Changed Visually Since The Last Manual Review

Home:

- Search was removed from Home.
- Trending was removed.
- The old "Games" heading, separator line, and "game predictions" copy were removed.
- Home now focuses on World Cup, Matches, and Live.
- The top-right account button was removed from Home.
- Home event cards now show provider/source status, for example: `Winner: Polymarket / Lines: local test fake-token`.
- Home uses a compact feed and pagination/load-more behavior instead of dumping every game at once.

Event Detail:

- The page moved closer to the compact Polymarket-style game layout.
- Chat UI and chat entry points were hidden from the MVP path.
- Orderbook entry points were hidden from the default user flow.
- Live stats were hidden when they were stale/mock/unavailable.
- Game Lines and Player Props tabs remain visible, but Player Props is not deeply implemented.
- Market rows now carry visible source wording for provider-backed winner versus local test line markets.

Trade Ticket:

- Ticket was rebuilt toward the Polymarket amount-entry interaction:
  - dark full-screen ticket body
  - large centered amount
  - keypad
  - separated fixed swipe area
  - vertical swipe-to-buy/sell interaction
  - haptic threshold behavior
- Ticket now shows source badges/notes:
  - Polymarket for provider-backed winner markets
  - Local test line / fake-token for fixture lines

Portfolio:

- Account/settings entry moved into Portfolio top-left.
- Portfolio now has Positions, Orders, and History tabs closer to the Polymarket reference.
- Portfolio shows source badges/notes on positions, orders, and history rows.
- Portfolio has a value chart and range controls, but value history is still partly deterministic/fallback depending on route availability.

Search:

- Search remains in the bottom tab as a separate page.
- The useless filter button was removed earlier.
- Search is no longer a Home-page focus.

## What Was Intentionally Removed

- Home search area.
- Trending section.
- "Games" title/separator and "game predictions" copy.
- Home top-right account entry.
- Chat UI and chat counters from the default Event Detail path.
- Line chat.
- Orderbook UI from the default user path.
- Live stats from the default MVP path.
- Notification/bell page content beyond blank/placeholder behavior.
- Deposit/withdraw/location verification flows from MVP implementation scope.
- World Cup detail/ads/match-arrangement marketing blocks not tied to prediction/trading.

These removals match the current product direction: Local MVP retail betting flow only.

## What Was Hidden Because It Was Mock, Proof, Or Stale Data

- Orderbook/depth surface: hidden because Holiwyn has no real user liquidity yet and orderbook is not primary MVP UX.
- Chat/social surfaces: hidden because they were not MVP and not Polymarket-parity-ready.
- Live sports stats: hidden because current route state does not provide real live stats reliably.
- Broad live/source/debug proof content: kept in harness/accessibility artifacts, not meant to dominate tester UI.
- Spread/Totals/Team Total source status: shown as local-test fake-token because those markets are backend-shaped fixtures, not real Polymarket-backed line markets.
- Some Portfolio value chart data: can use deterministic fallback when backend value-history route is not fully authoritative.

## What Is Still Available In Another Runtime Mode

- Orderbook/depth infrastructure still exists internally and in old proof paths, but should stay hidden/debug-only by default.
- Provider discovery/relevance guard scripts still exist for backend/provider work.
- Bulk provider review/import scripts still exist for provider ingestion work.
- Search remains available as a bottom tab.
- Account/settings remains available through Portfolio top-left entry.
- Source/proof identity markers remain available through accessibility labels and XML proof, even when visible tester copy is simplified later.
- Expo proof/dev-server mode remains available, but a later dev build/APK is still the better path for realistic QA.

## Real Regressions Or UX Debt

1. Visible source labels are too prominent in some tester-facing areas.
   - Keep source labels, but reduce visual dominance.
   - Recommended visible copy:
     - Provider-backed winner: `Polymarket`
     - Fixture line: `Test line`
     - Details can move to tooltip/help/account debug or small secondary text.

2. Internal proof text leaks into tester UX in a few places.
   - Example class/accessibility markers are useful, but visible labels like `Local test fake-token` can make the app feel like a harness.
   - Keep proof markers in `accessibilityLabel`/`testID`; keep visible text short.

3. Event Detail still has too much structural mismatch versus Polymarket.
   - The page is closer than before, but chart/market-group density and row behavior are still not full parity.
   - Player Props is visible but shallow.

4. Provider breadth is too narrow.
   - Current Home route has one match.
   - Regulation Winner is provider-backed.
   - Line markets are not provider-backed.
   - This is a backend/provider breadth gap, not a mobile-only UI bug.

5. Broad server Vitest is unsafe against the live dev database right now.
   - The configured suite caused table-reset deadlocks and temporarily emptied the MVP event route.
   - The current MVP match and line fixtures were restored in Cycle OL cleanup evidence.
   - Future validation should use targeted provider/mobile proof scripts unless the test DB is isolated.

6. Some Chinese text appears garbled in source strings.
   - The UI has multilingual support, but source files show mojibake in a few Chinese literals.
   - This should be fixed before Chinese tester review.

## Current Provider Readiness State

Authoritative current proof:

- `docs/mobile/harness/cycle-OL-provider-readiness-cleanup/cycle-OL-current-state-inspection.json`
- `docs/mobile/harness/cycle-OL-provider-readiness-cleanup/cycle-OL-provider-match-line-availability.json`
- `docs/mobile/harness/cycle-OL-provider-readiness-cleanup/cycle-OL-provider-discovery-guard.json`

Current state:

- Home returns one World Cup match: `Argentina vs. Egypt`.
- Regulation Winner has 3 Polymarket-backed markets.
- Polymarket Gamma for `fifwc-arg-egy-2026-07-07` exposes 0 line markets.
- Spread/Totals/Team Total are contract fixtures and must remain visibly honest.
- Discovery guard rejects wrong-family winner/draw markets for line targets.

## Recommendation

Stop doing more source-label micro-proof unless it blocks testing.

Next milestone should be Provider Breadth Runtime Loop:

- Import and normalize more Polymarket-backed World Cup events/markets.
- Refresh reference prices from Polymarket Gamma/CLOB.
- Prove multiple provider-backed events appear in mobile Home/Event Detail.
- Keep line fixtures only where provider line markets are unavailable.
- Run bot dry-run/live-local with a tiny allowlist after provider breadth is route-visible and documented.

