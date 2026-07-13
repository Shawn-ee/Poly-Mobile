# Cycle ZG - Internal Tester Runtime Start

## Scope

Fix and prove the no-quota internal tester runtime startup path for the current one-event Spain vs. France local runtime.

This cycle does not add UI features and does not call the Odds API provider. It closes a real operator blocker discovered while trying to start the cached runtime:

`npm run mobile:internal-tester-runtime:cached-start`

## Issue Found

The runtime manager failed while configuring S23 ADB reverse:

`You cannot call a method on a null-valued expression`

The failure happened in `scripts/manage_holiwyn_internal_tester_runtime.ps1` while collecting ADB reverse results. Empty ADB output from a successful `adb reverse` could flow into a `.Trim()` call and break startup before the supervisor/result-poller were launched.

## Implementation

Updated `Set-S23AdbReverse` in `scripts/manage_holiwyn_internal_tester_runtime.ps1` to:

- use a plain PowerShell array for the small ADB reverse result list;
- handle a null ADB result defensively;
- join non-null stdout/stderr before trimming output.

## Proof

Startup command:

`npm run mobile:internal-tester-runtime:cached-start`

Result: pass.

The runtime manager:

- configured S23 ADB reverse;
- reused backend on `3002`;
- reused Expo on `8081`;
- started the local supervisor process;
- started the local result poller process;
- observed backend health and healthy Postgres;
- observed S23 connected;
- observed warm no-quota runtime status.

Important proof fields:

- Summary: `docs/mobile/harness/odds-api-live-runtime/internal-tester-runtime-manager-summary.redacted.json`
- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Operator snapshot: `docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json`
- Completion audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`

The refreshed runtime status reports:

- supervisor running: true
- result poller running: true
- all loops running: true
- quota-spending loop running: false
- warm no-quota runtime observed: true
- mobile provider snapshot fresh for live odds route: false

This is ready for cached internal tester trading, and it keeps provider quota protected. Live mobile odds freshness still requires the explicit provider-refresh command with the Odds API key and quota caps.

## Validation

- `npm run mobile:internal-tester-runtime:cached-start` passed.
- `npm run mobile:one-event-runtime-status` passed.
- `npm run mobile:internal-tester-operator-snapshot` passed.
- `npm run mobile:local-runtime-launch-profile` passed.
- `npm run mobile:one-event-phase-audit` passed.
- `npm run mobile:live-runtime-completion-audit` passed.

## Remaining Gaps

- P0: none for cached no-quota internal tester runtime startup.
- P1: reused external Expo listener remains unverified; use `-Force -ReplaceExternalExpo` when the operator wants the runtime manager to replace Expo and own server-mode startup.
- P1: mobile live-route provider snapshot is stale in cached mode; run the explicit live-provider refresh path only when fresh live odds are needed and quota spend is approved.
- P1: this proves local foreground/background runtime loops, not an installed production service.
- P2: multi-event production process supervision remains future work.
