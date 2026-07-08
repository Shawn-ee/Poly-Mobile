# Cycle MZ - Backend Live Status Route

## Scope

Close the backend route gap found during Cycle MY: `/api/events?status=live` did not return current MVP matches that are stored as `status=active` with `liveStatus=LIVE`.

This cycle does not work on order book UI, chat, live sports statistics, social features, schema, or unrelated mobile screens.

## Problem

Cycle MY made the Live screen resilient with a mobile fallback, but the backend route itself still returned zero events for:

`/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10&status=live`

The all-match route returned the current events with:

- `status=active`
- `liveStatus=LIVE`

## Acceptance Criteria

- P0: Backend `status=live` route includes events where `status=live` or `liveStatus=LIVE`.
- P0: Existing public no-leak route test covers the new OR status filter.
- P0: Route proof shows current MVP live route returns Argentina/Egypt and Switzerland/Colombia.
- P0: S23 proof still opens Home, opens Live, returns Home, and completes Event Detail -> local Spread ticket -> swipe buy -> Portfolio/history.
- P0: No order book, chat, live stats, schema, or order route logic is touched.

## Implementation Result

Pass.

- Added `eventStatusFilter()` in `src/app/api/events/route.ts`.
- `status=live` now maps to `{ status: "live" } OR { liveStatus: "LIVE" }`.
- Non-live statuses remain exact `status` matches.
- Updated `public.events.no-leak.test.ts` to prove the live OR filter.

## Evidence

- Route proof: `docs/mobile/harness/cycle-MZ-backend-live-status-route/cycle-MZ-live-route-status.json`.
- S23 proof: `docs/mobile/harness/cycle-MZ-backend-live-status-route/cycle-MZ-current-mvp-s23-visible-flow.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-MZ-backend-live-status-route/`, `docs/mobile/harness/cycle-MZ-backend-live-status-route/`.
- Tests:
  - `npx jest src/__tests__/public.events.no-leak.test.ts --runInBand`
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/homeEventFeedService.test.ts mobile/src/__tests__/liveSourceReadinessContract.test.ts mobile/src/__tests__/homeCardStatsContract.test.ts`
  - `npm --prefix mobile exec tsc -- --noEmit --pretty false`

## Audit Gate

Result: Pass for focused backend Live route status contract.

Remaining P1:

- Provider-backed Spread/Totals/Team Total line markets remain unavailable for inspected Polymarket match events.
- The mobile Live fallback remains as defensive behavior, but the primary backend live route now works for the current event status shape.
