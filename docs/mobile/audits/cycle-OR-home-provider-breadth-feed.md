# Cycle OR - Home/Live Provider Breadth Status Guard

## Scope

Focused Local MVP provider-status guard for mobile Home/Live/Search surfaces.

This cycle fixes a real mobile state regression discovered after Provider Breadth Runtime: Polymarket-backed World Cup outright/future events can carry provider `liveStatus=LIVE`, which made broader provider surfaces look like live football if mobile relied on provider status alone.

No order book UI, chat, live stats, social features, backend schema, or order routes were changed.

## Reference / Route Audit

Backend route proof:

- `docs/mobile/harness/cycle-OR-home-provider-breadth-feed/cycle-OR-route-status-summary.json`

Findings:

- Broad provider route has 3 Polymarket-backed World Cup events:
  - `which-continent-will-win-the-world-cup` (`eventType=future`, `liveStatus=LIVE`, `marketProfile=outright`)
  - `provider-breadth-world-cup-winner` (`eventType=future`, `liveStatus=LIVE`, `marketProfile=outright`)
  - `argentina-vs-egypt` (`eventType=match`, mixed provider winner plus contract-fixture lines)
- Raw `status=live` provider route can return World Cup futures because provider data marks them live.
- Mobile Home/Live must keep the match-only MVP route strict and must classify outright/future events as future predictions.

## Acceptance Criteria

P0:

- Polymarket-backed `future` / `outright` events must normalize to mobile `future`, not mobile `live`.
- The Home/Live match feed filter must reject future/outright event types before using team-name heuristics.
- S23 Search proof must still show multiple provider-backed World Cup prediction events.
- S23 Live proof must not show World Cup outright futures as live football games.

P1:

- Import more current provider-backed match events when available.
- Replace contract-fixture Spread/Totals/Team Total markets with real provider-backed line markets when attach-ready Polymarket data exists.

## Implementation

Frontend/services touched:

- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/services/homeEventFeedService.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`
- `mobile/src/__tests__/homeEventFeedService.test.ts`

Behavior change:

- Outright/future provider events now display as future predictions even if Polymarket provider status says `LIVE`.
- Home/Live feed filtering now rejects `future`, `futures`, `outright`, and `outrights` before treating `homeTeamName` / `awayTeamName` as a match signal.

## Holiwyn Proof

S23 device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`

Evidence:

- Search provider breadth summary: `docs/mobile/harness/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-search-summary-after-clear.json`
- Search screenshot: `docs/mobile/screenshots/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-search-world-provider-futures-after-clear.png`
- Search XML: `docs/mobile/harness/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-search-world-provider-futures-after-clear.xml`
- Live summary: `docs/mobile/harness/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-live-summary-after-tap.json`
- Live screenshot: `docs/mobile/screenshots/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-live-no-outright-futures-after-tap.png`
- Live XML: `docs/mobile/harness/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-live-no-outright-futures-after-tap.xml`

S23 Search proof result:

- Shows `Which continent will win the World Cup?`
- Shows `World Cup Winner`
- Shows `Argentina vs. Egypt`
- Shows provider futures as `Starts Time TBD`, not `Starts Live - Futures - Live`

S23 Live proof result:

- Does not show `Which continent will win the World Cup?`
- Does not show `World Cup Winner`
- Does not show `Argentina vs. Egypt`
- Shows the empty live-football state instead of futures.

## Tests

- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/homeEventFeedService.test.ts`
- `npm run typecheck` from `mobile/`
- `npx jest --runInBand src/__tests__/public.events.no-leak.test.ts`

Result: pass.

## Audit Gate

Pass for focused P0 scope.

Remaining P1:

- Real provider-backed current/live match breadth is still limited.
- Real provider-backed Spread/Totals/Team Total markets remain unavailable for the current MVP match.
- Home still intentionally uses the match-only MVP route; broad provider futures are visible through Search rather than Home.
