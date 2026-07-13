# Cycle LIVEPROVIDER - Single Refresh Recovery

## Scope

Strengthen the one-event live-provider proof for the Spain vs. France internal tester event.

This cycle keeps the Local MVP scope:

- one backend-owned soccer event
- Odds API as temporary provider
- fake-token trading only
- no broad provider scan
- no real-money deployment
- no mobile UI changes

## Problem Found

The live-provider proof could fail in tight quota mode when `RefreshIterations=1`.

The old proof sequence was:

1. Fetch/import the provider event.
2. Force the selected market snapshots stale.
3. Run remaining refresh iterations.

With one refresh iteration, step 3 had no recovery refresh left, so `readyAfterRefresh` failed even though the provider request itself succeeded.

## Fix

`scripts/prove_odds_api_one_event_live_runtime.ts` now uses the existing cached local event when available:

1. Load the cached Spain vs. France selected market.
2. Force its provider snapshot stale.
3. Run one bounded live provider refresh.
4. Verify the mobile live-detail lifecycle returns from stale to ready.

If the local DB is empty and no cached event exists yet, the script still creates the event first and then performs the recovery refresh required to prove stale -> ready honestly.

## Provider/Quota Proof

The refreshed proof used the process environment key only. The key was not printed, written to tracked files, or committed.

Evidence:

- `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-provider-key-preflight.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`

Latest live-provider proof result:

- event: Spain vs. France
- provider event id: `f9aa13a662d1658e5a02cfc06d6a2d73`
- refresh iterations: `1`
- max credits: `8`
- quota cost: `7`
- requests remaining: `366`
- stale before refresh: true
- ready after refresh: true
- fake-token buy/sell/history proof: true
- P0 gaps: none

## Routes And Data Dependencies

- `GET /api/health`
- `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1`
- `GET /api/mobile/events/:slug/live-detail`
- `GET /api/markets/:marketId/quote`
- `POST /api/orders`
- `GET /api/portfolio`
- `GET /api/portfolio/history`

Backend data touched by proof:

- `Event`
- `Market`
- `Outcome`
- `ReferenceQuoteSnapshot`
- `MarketOutcomeSnapshot`
- `ProviderRefreshRun`
- local fake-token orders/positions/trades created by the proof buyer/maker users

## Result

Pass.

The runtime status, phase audit, and completion audit all pass after the bounded live refresh with `0` P0 gaps.

## Remaining Gaps

- P0: none for one-event live-provider refresh, quote, buy, sell, Portfolio/history, and lifecycle stale -> ready proof.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open and remains guarded by exact confirmation plus `CLOSED` market status.
- P2: multi-event provider polling/operator UI remain future work.
