# Cycle OT - World Cup Winner Provider Breadth Refresh

Date: 2026-07-08

## Scope

Refresh and prove one provider-readiness path for the Local MVP provider breadth runtime:

- Import/normalize real Polymarket `world-cup-winner` markets.
- Refresh provider-owned reference prices/depth through Gamma/CLOB-backed runtime.
- Prove mobile routes expose multiple provider-backed World Cup events.
- Prove the provider breadth is visible on Samsung S23 Search.

This cycle intentionally does not add more source-label micro-proof, order book UI, chat, live stats, social surfaces, or schema changes.

## Reference / Provider Audit

Provider source:

- Polymarket Gamma `/events?slug=world-cup-winner` for event/market discovery.
- Polymarket CLOB public market data for token-backed bid/ask/depth refresh.
- `OPTIC_ODDS_API_KEY` remains optional/unconfigured and is not a blocker.

Observed route-visible state:

- `World Cup Winner`: 8 real Polymarket markets, all source `polymarket`.
- `Which continent will win the World Cup?`: 3 real Polymarket markets, all source `polymarket`.
- `Argentina vs. Egypt`: 3 Polymarket winner markets plus 4 Local MVP contract-fixture line markets.

## Acceptance Criteria

P0:

- Missing Optic Odds key must not fail provider readiness.
- `world-cup-winner` import must produce real provider-owned markets with external slugs/ids and token-backed price fields.
- Backend route proof must show at least two provider-backed World Cup events.
- Search route proof must show provider source/status fields consumed by mobile.
- Samsung S23 proof must show the provider-backed World Cup results in Holiwyn.
- Expo/Metro must be stopped after proof.

P1:

- More current provider-backed World Cup match events.
- Real provider-backed Spread/Totals/Team Total markets for match detail pages.
- Scheduled refresh so snapshot freshness does not depend on manual proof timing.

P2:

- Broader Search visual refinement only after the Local MVP betting path stays stable.

## Implementation Notes

Changed:

- `scripts/prove_mobile_real_provider_world_cup_winner.ts`

The proof script now accepts `--cycle` and writes the passed cycle into the summary and imported metadata. This avoids stale `FJ` labels in provider proof artifacts while preserving the same import/filter/relevance behavior.

No mobile UI source, backend route source, schema, order logic, or order book code changed.

## Proof

Route/provider proof:

- `docs/mobile/harness/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-real-provider-world-cup-winner.json`
- `docs/mobile/harness/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-provider-breadth-runtime-route.json`
- `docs/mobile/harness/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-search-provider-breadth-route.json`

Samsung S23 proof:

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Screenshot: `docs/mobile/screenshots/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-s23-provider-breadth-search.png`
- XML: `docs/mobile/harness/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-s23-provider-breadth-search.xml`

Validation:

- `npm run typecheck` in `mobile/`: passed.
- Backend health `http://127.0.0.1:3002/api/health`: passed.
- Expo/Metro stopped after proof; only backend Next server process family intentionally remains.

## Audit Gate

Result: Pass for focused provider readiness/provider breadth refresh scope.

P0 unresolved: 0.

Remaining gaps:

- P1: Polymarket-backed line markets for current match detail remain unavailable.
- P1: Local MVP Home remains match-only; broad provider futures are visible in Search, not Home.
- P1: Scheduled refresh/bot breadth remains next milestone work.
