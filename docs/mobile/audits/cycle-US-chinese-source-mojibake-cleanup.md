# Cycle US - Chinese Source Copy Mojibake Cleanup

Date: 2026-07-10

## Scope

Chinese source/status copy in Event Detail and Trade Ticket for the Local MVP market and ticket path.

## Reference Audit

The product direction requires Holiwyn to support English/Chinese switching while preserving Polymarket-like retail clarity. Source/status labels may remain hidden or audit-only, but when Chinese text is visible it must be readable and not corrupted by mojibake.

## Acceptance Criteria

| Priority | Criterion | Evidence |
| --- | --- | --- |
| P0 | Event Detail source/status branches use clean Chinese strings for source, winner/line source, unavailable lines, and checking-source states. | Source contract test |
| P0 | Trade Ticket source note uses clean Chinese strings for Holiwyn line and Polymarket market states. | Source contract test |
| P0 | Hidden provider/source/audit labels remain intact for the harness. | Source contract test |
| P0 | No backend route, schema, order, Portfolio, or auth behavior changes. | Git diff and route dependency map |
| P1 | S23 proof should capture Chinese Event Detail/Ticket once ADB is available. | Device proof log |

## Implementation

- Replaced remaining corrupted Chinese literals in Event Detail source-copy branches with escaped Chinese strings.
- Replaced remaining corrupted Chinese literals in Trade Ticket source note branches with escaped Chinese strings.
- Tightened source contracts so the source-copy helper and ticket source note reject mojibake while preserving hidden audit markers.

## Audit Gate

Result: PASS for source/contract scope.

Android proof: pending because `adb devices -l` returned no attached devices during the cycle.

## Remaining Gaps

- P1: S23 Chinese visible proof for Event Detail and Trade Ticket.
- P1: Real provider-backed current-match Spread/Totals/Team Total line rows remain unavailable.
