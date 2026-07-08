# Cycle MX - Home Source Readiness

## Scope

Show current provider readiness on Home match cards before the user opens Event Detail.

This cycle stays inside the Local MVP retail flow: Home -> Event Detail -> line market -> simple ticket -> fake-token/server-backed order -> Portfolio/history. It does not work on order book UI, chat, live stats, social features, backend schema, or non-MVP polish.

## Reference/Inspection

The current service state was inspected again because provider-backed line markets were suspected missing.

- Home route: `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`
- Event detail route: `/api/mobile/events/:slug/live-detail`
- Polymarket Gamma event checks:
  - `fifwc-arg-egy-2026-07-07`
  - `fifwc-che-col-2026-07-07`

Result:

- Both current match events expose three provider-backed Regulation Winner binaries from Polymarket.
- Both current match events expose zero Polymarket Gamma line markets.
- Holiwyn route exposes Spread/Totals/Team Totals as backend-shaped `contract-fixture` rows.

## Acceptance Criteria

- P0: Home cards visibly disclose provider winner plus local line pricing when `marketSourceSummary.regulationWinner.status=provider-backed` and `marketSourceSummary.lineMarkets.status=contract-fixture`.
- P0: Android hierarchy exposes `home-card-source-provider-winner-local-lines`.
- P0: Existing Home -> Event Detail -> local line ticket -> fake-token order -> Portfolio/history flow still passes on S23.
- P0: No order book, chat, live stats, backend schema, or order route logic is touched.
- P1: Real provider-backed Spread/Totals/Team Total markets remain unavailable until Polymarket exposes attach-ready line markets or another approved provider is configured.

## Implementation Result

Pass.

- Added Home card source readiness text in `MarketLists.tsx`.
- Updated the S23 proof to require `home-card-source-provider-winner-local-lines`.
- Added a focused source-readiness assertion to the Home card contract test.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MX-home-source-readiness/cycle-MX-current-mvp-s23-visible-flow.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-MX-home-source-readiness/`, `docs/mobile/harness/cycle-MX-home-source-readiness/`.
- Route/provider inspections:
  - `docs/mobile/harness/cycle-MX-provider-line-readiness-route/cycle-MX-current-state-inspection.json`
  - `docs/mobile/harness/cycle-MX-provider-line-readiness-route/cycle-MX-provider-match-line-availability-argentina-egypt.json`
  - `docs/mobile/harness/cycle-MX-provider-line-readiness-route/cycle-MX-provider-match-line-availability-switzerland-colombia.json`
- Tests:
  - `npm --prefix mobile exec tsc -- --noEmit --pretty false`
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/homeCardStatsContract.test.ts mobile/src/__tests__/marketListsHomeCardSelections.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
  - `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` parse check

## Audit Gate

Result: Pass for focused Home source-readiness disclosure.

Remaining P1:

- Provider-backed Spread/Totals/Team Total line markets are still not available for the inspected Polymarket match events.
- Local line markets remain acceptable only for Local MVP UI/order proof and must keep visible source disclosure.
