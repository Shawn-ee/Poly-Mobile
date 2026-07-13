# Cycle ZU - Runtime S23 Detection Hardening

Date: 2026-07-13

Scope: backend/live-runtime operator scripts for the one-event Spain vs. France internal tester pipeline. This cycle did not change mobile UI, provider contracts, order logic, or schema.

## Problem

Cycle ZT fixed S23 detection in `scripts/manage_holiwyn_internal_tester_runtime.ps1`, but related one-event runtime scripts still used the older direct `adb devices -l` call and hardcoded the wireless DNS device id when any S23-like line was found. That left the one-command onboarding/readiness path vulnerable to the same false phone-readiness behavior.

## Implementation

Updated these scripts to use bounded ADB calls, parse the actual connected device serial, and report timeout/error details:

- `scripts/onboard_holiwyn_one_event_live_runtime.ps1`
- `scripts/prove_holiwyn_one_event_live_readiness.ps1`
- `scripts/start_holiwyn_one_event_live_runtime.ps1`
- `scripts/run_holiwyn_one_event_live_supervisor.ps1`

The scripts now:

- call `adb devices -l` through `Invoke-AdbWithTimeout`;
- treat a Windows `Start-Process` no-exit-code/no-stderr result as successful;
- select lines matching the S23 model/serial markers;
- extract the real serial from the first column, such as `172.16.200.27:44029`;
- include `adbTimedOut` when reporting S23 status.

## Proof

No provider quota was spent.

Commands:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start_holiwyn_one_event_live_runtime.ps1 -BackendPort 3002 -SeedMaker -SummaryPath docs\mobile\harness\odds-api-live-runtime\zu-start-runtime-s23-detect-summary.redacted.json
powershell -ExecutionPolicy Bypass -File scripts/prove_holiwyn_one_event_live_readiness.ps1 -BackendPort 3002 -SkipDataHygiene -SkipLifecycleProof -SkipLifecycleSchedulerProof -SummaryPath docs\mobile\harness\odds-api-live-runtime\zu-readiness-s23-detect-summary.redacted.json
powershell -ExecutionPolicy Bypass -File scripts/onboard_holiwyn_one_event_live_runtime.ps1 -BackendPort 3002 -SkipReadiness -SkipSettlementDryRun -SummaryPath docs\mobile\harness\odds-api-live-runtime\zu-onboarding-s23-detect-summary.redacted.json
```

Evidence:

- `docs/mobile/harness/odds-api-live-runtime/zu-start-runtime-s23-detect-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/zu-readiness-s23-detect-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/zu-onboarding-s23-detect-summary.redacted.json`

All three summaries passed and reported:

- S23 connected: `true`
- S23 device id: `172.16.200.27:44029`
- S23 model: `SM_S911U1`
- ADB timeout: `false`
- Backend health: ok
- Postgres: healthy

## Gaps

- P0: none for S23 detection in the one-event runtime operator scripts.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open and guarded.
- P2: multi-event runtime onboarding remains future work.
