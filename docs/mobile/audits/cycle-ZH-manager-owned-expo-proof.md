# Cycle ZH - Manager-Owned Expo Server-Mode Proof

## Scope

Strengthen the internal tester runtime launch gate so stale Expo/Metro listeners can be replaced and proven server-backed for S23 testing.

This cycle does not call the Odds API and does not change trading behavior. It improves the operator/runtime proof path for:

`npm run mobile:internal-tester-runtime -- -Action start -Force -ReplaceExternalExpo -WaitForReady`

## Issue Found

The runtime manager could stop an existing Expo listener and start a new server-mode Expo process, but the verification logic still reported `serverModeVerified=false`.

Reason: the manager launches Expo through a PowerShell parent process, while the actual port listener on `8081` is Expo's child Node process. The old check compared the manager parent pid directly to the port owner pid, so child-process ownership was misclassified as external/unverified.

## Implementation

Updated `scripts/manage_holiwyn_internal_tester_runtime.ps1`:

- added `Test-ProcessDescendant`;
- treats the Expo port owner as manager-owned when it is a descendant of the manager-launched process;
- keeps the existing server-mode env checks:
  - `EXPO_PUBLIC_API_BASE_URL`
  - `EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL`
  - `EXPO_PUBLIC_ORDER_MODE=server`
  - `EXPO_PUBLIC_MARKET_DATA_MODE=server`
  - `EXPO_PUBLIC_SHOW_ORDERBOOK=0`

Updated live-runtime audits:

- `scripts/report_odds_api_live_runtime_phase_audit.ts`
- `scripts/report_holiwyn_live_runtime_completion_audit.ts`

The audits now require proof from:

`docs/mobile/harness/odds-api-live-runtime/manager-owned-expo-start-summary.redacted.json`

## Proof

Start proof command:

`npm run mobile:internal-tester-runtime -- -Action start -Force -ReplaceExternalExpo -WaitForReady -SummaryPath docs\mobile\harness\odds-api-live-runtime\manager-owned-expo-start-summary.redacted.json`

Result: pass.

The proof shows:

- old Expo listener stopped;
- new Expo process started by the runtime manager;
- S23 ADB reverse configured;
- backend reused on `3002`;
- Expo ready on `8081`;
- Postgres healthy;
- S23 connected;
- `serverModeVerified=true`;
- `serverModeSource=manager_owned_server_env`;
- `managerStartedExpoUsesServerMode=true`;
- `externalExpoServerModeUnverified=false`;
- no provider quota spent.

## Audit Gates

- `npm run mobile:one-event-phase-audit` passed.
- `npm run mobile:live-runtime-completion-audit` passed.

Both audits now include the manager-owned Expo proof artifact in the managed S23 server-mode startup requirement.

## Remaining Gaps

- P0: none for manager-owned server-mode Expo startup.
- P1: this is a local process control plane, not an installed production service.
- P1: official-result auto-execution still requires trusted operator confirmation.
- P2: multi-event production process supervision remains future work.
