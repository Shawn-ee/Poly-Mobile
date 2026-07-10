# Cycle UR - Account Trading Copy Cleanup

Date: 2026-07-10

## Scope

Local MVP visible account copy in the Portfolio -> Account path.

## Reference Audit

Polymarket's mobile account/portfolio surfaces use customer-facing status language and do not expose implementation labels such as local runtime mode, mock mode, or server mode. Holiwyn should keep backend/proof mode details in source/audit markers and present simple retail labels in the default tester UI.

## Acceptance Criteria

| Priority | Criterion | Evidence |
| --- | --- | --- |
| P0 | Account trading row must not show `Trading mode`, `Local mode`, or `Server mode` in English visible copy. | Source contract test |
| P0 | Account trading row should still communicate whether trading is local-device or synced without changing behavior. | `appCopy.ts` source |
| P0 | No backend route, schema, order, Portfolio, or auth behavior changes. | Git diff and route dependency map |
| P1 | S23 proof should capture the Account screen once ADB is available. | Device proof log |

## Implementation

- Changed English account copy to `Trading`, `On this device`, and `Synced`.
- Changed Chinese account copy to matching concise labels.
- Updated the copy contract to reject the old technical labels.

## Audit Gate

Result: PASS for source/contract scope.

Android proof: pending because `adb devices -l` returned no attached devices during the cycle.

## Remaining Gaps

- P1: S23 Account visible proof.
- P1: Full S23 Local MVP journey proof remains open from earlier cycles.
