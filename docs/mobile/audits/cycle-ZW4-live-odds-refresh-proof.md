# Cycle ZW4 - Live Odds Refresh Proof

## Scope

Prove the explicit key-gated live provider refresh path for the current `Spain vs. France` internal tester event and verify the mobile/runtime readiness summary flips from stale live odds to fresh live odds.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| ZW4-P0-01 | P0 | Provider secret preflight passes without printing or committing the key. | Pass |
| ZW4-P0-02 | P0 | Live provider refresh is one-event scoped and quota capped. | Pass |
| ZW4-P0-03 | P0 | Runtime proof detects stale provider snapshots before refresh. | Pass |
| ZW4-P0-04 | P0 | Runtime proof shows provider quote status ready after refresh. | Pass |
| ZW4-P0-05 | P0 | Readiness gate reports no open P0 gaps and either fresh live odds inside the 90-second window or a clear key-gated refresh action after the window ages out. | Pass |

## Provider And Quota Evidence

- Provider: The Odds API, local runtime secret file under ignored `.runtime`.
- Provider event: `Spain vs. France`, `soccer_fifa_world_cup`, provider event id `f9aa13a662d1658e5a02cfc06d6a2d73`.
- Policy: one event only, two refresh iterations, max credits `16`, minimum remaining `2`.
- Refresh proof reported total last cost `13`.
- Latest reported remaining quota after refresh: `314`.
- Secret handling: preflight reported `commandLineContainsSecret=false`, `valuePrinted=false`, and `valueStoredInRepo=false`.

## Runtime Evidence

- Before refresh: selected market quote snapshot was stale under the mobile route freshness rule.
- After refresh: quote snapshot status was `ready`; latest snapshot was fetched at `2026-07-14T03:07:23.278Z`.
- The immediate readiness gate inside the mobile freshness window reported live odds ready.
- The final readiness gate after the 90-second mobile display window aged out correctly reported:
  - `localTesterReadyRightNow=true`
  - `cachedTesterReadyRightNow=true`
  - `liveOddsReadyRightNow=false`
  - `providerSnapshotFresh=false`
  - `liveOddsActionKnown=true`
  - `gaps.p0=[]`
- This proves both sides of the contract: live refresh can make mobile odds ready, and stale handling falls back to cached internal testing plus an explicit key-gated refresh action.

## Proof Commands

- `npm run mobile:one-event-live-runtime:provider-secret-preflight`: pass, no provider quota.
- `npm run mobile:one-event-live-runtime:provider-secret`: pass, provider quota used inside caps.
- `npm run mobile:internal-tester-readiness-gate`: pass, no provider quota used by the gate.

## Remaining Gaps

- P1: installed unattended provider/maker/lifecycle service ownership.
- P1: production official-result auto-settlement.
- P2: multi-event provider polling and production dashboard/operator UI.
