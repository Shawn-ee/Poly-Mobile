# Cycle ZY - Live Odds Freshness Pulse

## Scope

Refresh the current one-event Odds API provider proof for the internal tester runtime and fix the no-quota preflight command check so it validates the safer secret-wrapper refresh path.

No mobile UI, schema, order route, settlement route, chat, social, or order book UI work was done.

## Why This Cycle Ran

The current runtime was healthy in cached internal tester mode, but mobile-visible provider snapshots were stale under the route freshness window:

- cached tester trading: ready
- supervisor/result-poller loops: running
- provider quota-spending loop: not running
- mobile route freshness before refresh: stale

The live-refresh preflight also failed because it still expected the older raw provider command alias instead of the current secret-wrapper command.

## Fix

- Updated `scripts/report_holiwyn_live_odds_refresh_preflight.ts` so `liveOddsRefreshCommandKnown` checks `npm run mobile:one-event-live-runtime:provider-secret`.
- This keeps provider credentials in the process environment or ignored `.runtime/secrets/the-odds-api-key.txt`.
- The preflight remains no-quota and never prints the provider key.

## Provider Refresh Proof

Command:

```powershell
npm run mobile:one-event-live-runtime:provider-secret
```

Result:

- Event: `Spain vs. France`
- Provider source: The Odds API
- Provider key source: ignored local secret file
- Provider key printed: no
- One-event scope: yes
- Refresh iterations: `2`
- Max credits: `16`
- Min remaining: `2`
- Actual provider cost: `13`
- Requests remaining after refresh: `301`
- Before refresh selected market quote status: `stale`
- After refresh selected market quote status: `ready`
- P0 gaps: none

## Current Runtime After Refresh

Ordered readiness gate:

- `localTesterReadyRightNow=true`
- `cachedTesterReadyRightNow=true`
- `liveOddsReadyRightNow=true`
- `providerSnapshotFresh=true`
- `quotaSpendingLoopRunning=false`
- next action: `manual_s23_testing`

The supervisor and result poller remained running in no-quota mode. The refresh was an explicit bounded pulse, not a background quota-spending loop.

## Mobile/Internal Tester Meaning

S23/internal testers can open the current app and test the Spain vs. France flow with fresh mobile-visible provider snapshots immediately after this pulse. If the route passes the 90-second mobile stale window later, cached trading remains ready, and live odds freshness requires another explicit provider-refresh command.

## Remaining Gaps

- P0: none for one-event local internal tester trading after the refresh pulse.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open; active-event execution is still guarded by `CLOSED` market status and exact confirmation.
- P2: multi-event provider polling remains future work.
