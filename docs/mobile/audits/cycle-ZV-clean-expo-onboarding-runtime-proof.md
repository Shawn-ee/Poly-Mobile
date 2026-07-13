# Cycle ZV - Clean Expo Onboarding Runtime Proof

Date: 2026-07-13

## Scope

Refresh the one-event local internal tester onboarding proof for the Spain vs France event from current `main`.

This cycle does not add UI features, backend routes, provider scans, order book UI, chat, live stats, or production runtime infrastructure.

## Command

`npm run mobile:one-event-onboarding:cached-runtime-clean-expo`

## Evidence

- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-start-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-status-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-stop-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`

## Result

Pass.

The onboarding run used quota-free cached/runtime proof data. It verified the Spain vs France event, selected `Total Goals 2.5`, confirmed S23 `SM_S911U1` was connected, started the local supervisor and result-poller loops, replaced external Expo with manager-owned server-mode Expo, verified both loops were running during proof, and stopped proof-owned loops afterward.

## Runtime Truth

- Provider quota used: false.
- Backend health: pass.
- Docker Postgres health: pass.
- S23 connected: true.
- Runtime loops running during proof: true.
- Runtime loops stopped after proof: true.
- Manager-owned Expo used server mode: true.
- S23 ADB reverse configured on start: true.
- Current status after cleanup: backend can remain available, but supervisor/result-poller loops are not left running by the proof.

## P0/P1/P2

P0: none for local internal tester onboarding.

P1:
- Installed always-on provider refresh and market-maker daemons are not complete.
- Official-result auto-settlement remains guarded/manual and is not production automatic.

P2:
- Multi-event onboarding remains future work.

## Audit Gate

The completion audit passed with `phaseCompleteForLocalInternalRuntime=true` and `fullProductionRuntimeComplete=false`. This means Holiwyn remains ready for local internal testing through explicit operator-started runtime commands, while production-grade unattended operation is still tracked as P1.
