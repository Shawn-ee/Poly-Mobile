# Cycle ZAC - Runtime Evidence Alignment

Generated: 2026-07-14

## Scope

This cycle did not change mobile UI or trading behavior. It tightened the local runtime evidence gates after the Spain vs. France S23 cashout proof by making the selected runtime market evidence match the currently quote-visible backend outcome.

## Issue

The runtime status and phase audit could select the newest provider proof artifact even when that artifact referenced an older normalized outcome id (`Over +2.5`) that was no longer returned by the quote route. The backend quote route was correctly exposing the current tradable outcome (`Over 2.5`), but the audit selected stale evidence and falsely reported missing maker liquidity.

## Changes

- `scripts/report_odds_api_one_event_runtime_status.ts`
  - Selects the current runtime market from candidate evidence using quote-route visibility first, then source priority, then timestamp.
  - Records candidate quote readiness so stale provider proof can be rejected visibly instead of hidden.
- `scripts/report_odds_api_live_runtime_phase_audit.ts`
  - Uses the same quote-visible candidate selection.
  - Accepts the stronger continuous result-poller proof when the foreground poller artifact is a stopped continuous-loop artifact with a misleading `pass=false`.

## No-Quota Proof

Ran a short local supervisor refresh without live provider flags:

```text
npm run mobile:one-event-live-supervisor -- -MaxIterations 1 -IntervalSeconds 0 -SkipSleep -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement
```

Result:

- Backend health: pass.
- Postgres/Docker: healthy.
- S23 reachable: `172.16.200.27:44029`, model `SM_S911U1`.
- Provider quota used by this refresh: no.
- Latest maker quote evidence: `Over 2.5`, quote-visible bid/ask present.
- Runtime completion audit: pass, 0 P0 gaps.

## Evidence

- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Phase audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
- Completion audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`
- S23 proof remains: `docs/mobile/harness/cycle-ZAB-spain-france-cashout-s23/cycle-ZAB-odds-api-s23-visible-flow.json`

## Remaining Gaps

P0:

- None for local internal runtime evidence.

P1:

- Installed unattended provider/maker/lifecycle service ownership remains open.
- Production official-result auto-settlement remains open; active-event execution is still guarded by closed-market status and exact confirmation.

P2:

- Multi-event provider polling and production dashboard/operator UI remain future work.
