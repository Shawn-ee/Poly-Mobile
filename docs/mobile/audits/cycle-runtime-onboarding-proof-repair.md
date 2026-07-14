# Cycle Runtime Onboarding Proof Repair

Date: 2026-07-14

## Scope

Repair the local internal tester runtime proof path without starting new feature work or spending Odds API quota.

## Problem

The cached one-event onboarding proof could start the local supervisor and result-poller, prove both running, and stop both afterward, but the runtime status and completion gates still treated an older failed supervisor artifact as the only valid proof. The default onboarding loop also requested approved-settlement mode, which made a cached/no-quota tester run depend on approval evidence that belongs to an explicit operator proof path.

## Changes

- Default cached onboarding runtime loops no longer request approved settlement execution.
- Runtime status now accepts fresh onboarding start/status proof when both local loops were observed running and no approved settlement execution was requested.
- Phase and completion audits separate the one-command local loop proof from the separate managed S23 server-mode Expo proof.
- Durable provider refresh and runtime run rows were refreshed from existing passing local proof summaries, without provider network calls.

## Evidence

- `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`

## Result

P0 runtime gate is green for local internal tester use. Remaining P1/P2 truth is unchanged: no installed unattended production daemon, no production auto-settlement, and live provider refresh remains explicit/key-gated/quota-protected.
