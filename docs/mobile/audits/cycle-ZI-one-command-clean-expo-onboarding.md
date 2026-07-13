# Cycle ZI - One-Command Clean Expo Onboarding Proof

Date: 2026-07-13

## Scope

Prove the one-event internal tester onboarding command can start the local runtime loops with a manager-owned Expo server-mode listener, replacing a stale or external Expo listener when explicitly requested.

This cycle does not add UI features, provider scans, order book UI, chat, or production runtime infrastructure.

## Command

`npm run mobile:one-event-onboarding:cached-runtime-clean-expo`

## Evidence

- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-start-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-status-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-stop-summary.redacted.json`

## Result

Pass.

The onboarding run used cached/replay data only and spent no provider quota. It started the local supervisor/result-poller loop, replaced the external Expo listener with manager-owned server-mode Expo, verified S23 ADB reverse setup, proved both loops were running, then cleaned them up after proof.

## Runtime Truth

- `replaceExternalExpoRequested`: true
- `verifiedServerModeExpoDuringRuntimeStart`: true
- `managerStartedExpoUsesServerMode`: true in the runtime-start summary
- `externalExpoServerModeUnverified`: false
- `s23AdbReverseConfiguredOnStart`: true
- `runtimeLoopsStoppedAfterProof`: true

## P0/P1/P2

P0: none.

P1:
- Installed always-on provider refresh and market-maker daemons are still not complete.
- Official-result auto-execution still requires trusted operator confirmation.

P2:
- Multi-event onboarding remains future work.

## Audit Gate Update

The phase and completion audits now require the one-command onboarding proof to include explicit clean Expo replacement and same-run server-mode verification, so stale Expo listeners cannot satisfy internal tester readiness.
