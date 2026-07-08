# Cycle NF - Proof JSON Hygiene

## Scope

Harden the current S23 Local MVP proof harness so generated proof JSON is commit-ready and open-order mode lists only evidence it actually captured.

This cycle does not touch order book UI, chat, live stats, social features, backend schema, or order routes.

## Problem

Recent proof cycles needed manual JSON normalization because PowerShell `Set-Content -Encoding utf8` produced evidence that failed `git diff --check`. Open-order mode also duplicated the after-submit artifact and listed History artifacts it did not capture.

## Acceptance Criteria

- P0: Proof JSON is written UTF-8 without BOM and passes `git diff --check` without manual cleanup.
- P0: `-ExpectOpenOrder` proof summaries list unique artifacts only.
- P0: `-ExpectOpenOrder` proof summaries do not list Portfolio History artifacts.
- P0: S23 proof still passes Home -> Live -> Event Detail -> line ticket -> swipe buy -> Portfolio open order.

## Implementation Result

Pass.

- Added `Write-JsonNoBom` to `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`.
- Open-order proof summaries now include unique artifacts and omit History artifacts.
- S23 proof passed with `artifactCount=12`, `uniqueArtifactCount=12`, `hasHistoryArtifact=false`, `openOrderVisible=true`, and `openOrderSourceBadgeVisible=true`.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-NF-proof-json-hygiene/cycle-NF-current-mvp-s23-visible-flow.json`
- S23 XML: `docs/mobile/harness/cycle-NF-proof-json-hygiene/cycle-NF-current-mvp-after-submit.xml`
- S23 screenshot: `docs/mobile/screenshots/cycle-NF-proof-json-hygiene/cycle-NF-current-mvp-after-submit.png`

## Tests

- PowerShell parser check for `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- S23 open-order proof command with `-ExpectOpenOrder`
- `git diff --check`

## Audit Gate

Result: Pass for focused proof hygiene scope.

Remaining P1:

- Actual provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket match events.
