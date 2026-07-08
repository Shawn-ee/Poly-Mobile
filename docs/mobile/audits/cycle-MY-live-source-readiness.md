# Cycle MY - Live Source Readiness

## Scope

Make the Live page usable for the Local MVP live-match path and show the same provider readiness truth as Home.

This cycle stays inside the Local MVP retail flow. It does not work on order book UI, chat, live sports statistics, social features, backend schema, or unrelated backend routes.

## Problem Found

The S23 proof initially failed because Live showed `0 matches` even though Home showed the current live World Cup matches.

Route inspection showed the backend all-match route returned current events as:

- `status=active`
- `liveStatus=LIVE`

The mobile live filter only treated `status=live` as live. That made Live empty and prevented visible source-readiness proof.

## Acceptance Criteria

- P0: Live page shows current live World Cup matches when backend events use `liveStatus=LIVE`.
- P0: Live page shows `live-source-readiness` with `home-card-source-provider-winner-local-lines`.
- P0: S23 proof opens Home, opens Live, returns Home, and still completes Event Detail -> local Spread ticket -> swipe buy -> Portfolio/history.
- P0: No order book, chat, live stats, schema, or order route logic is touched.
- P1: Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events.

## Implementation Result

Pass.

- Shared `eventSourceReadiness()` between Home cards and Live.
- Added a visible Live source readiness strip.
- Updated mobile live event filtering to treat `liveStatus=LIVE` as live.
- Added fallback from an empty `status=live` route page to the all-match route, then client-filtered live events.
- Updated the S23 proof to require Live source readiness before continuing the full order flow.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MY-live-source-readiness/cycle-MY-current-mvp-s23-visible-flow.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-MY-live-source-readiness/`, `docs/mobile/harness/cycle-MY-live-source-readiness/`.
- Tests:
  - `npm --prefix mobile exec tsc -- --noEmit --pretty false`
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/homeEventFeedService.test.ts mobile/src/__tests__/homeCardStatsContract.test.ts mobile/src/__tests__/liveSourceReadinessContract.test.ts mobile/src/__tests__/marketListsHomeCardSelections.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
  - `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` parse check

## Audit Gate

Result: Pass for focused Live source-readiness and live-match fallback scope.

Remaining P1:

- Provider-backed Spread/Totals/Team Total line markets are still unavailable for inspected Polymarket match events.
- The Live page does not introduce live sports stats; that remains intentionally out of Local MVP scope.
