# Cycle NE - S23 Open Order Proof Mode

## Scope

Add an explicit open-order mode to the current S23 Local MVP proof harness.

This cycle does not touch order book UI, chat, live stats, social features, backend schema, or order routes.

## Problem

Cycle ND proved the open-order source badge on S23, but the reusable proof script continued into History and expected `No history`. That made open-order proof brittle whenever the account already had activity.

## Acceptance Criteria

- P0: `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` supports `-ExpectOpenOrder`.
- P0: `-ExpectOpenOrder` asserts the Portfolio Orders/open-order surface instead of requiring an empty or filled History state.
- P0: S23 proof passes through Home -> Live -> Event Detail -> line ticket -> swipe buy -> Portfolio open order.
- P0: Proof JSON reports `openOrderVisible=true` and `openOrderSourceBadgeVisible=true`.
- P0: The harness rejects incompatible `-ExpectOpenOrder -ExpectFilledHistory` usage.

## Implementation Result

Pass.

- Added `-ExpectOpenOrder` to the current S23 MVP proof harness.
- Open-order mode asserts `open-order-row-`, `open-order-source-badge`, `open-order-source-note`, `portfolio-source-badge-local`, and `cancel-open-order-`.
- The proof summary now records open-order badge assertions separately from filled History assertions.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-NE-s23-open-order-proof-mode/cycle-NE-current-mvp-s23-visible-flow.json`
- S23 XML: `docs/mobile/harness/cycle-NE-s23-open-order-proof-mode/cycle-NE-current-mvp-after-submit.xml`
- S23 screenshot: `docs/mobile/screenshots/cycle-NE-s23-open-order-proof-mode/cycle-NE-current-mvp-after-submit.png`

## Tests

- PowerShell parser check for `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`
- S23 open-order proof command with `-ExpectOpenOrder`
- `git diff --check`

## Audit Gate

Result: Pass for focused harness/proof mode scope.

Remaining P1:

- Actual provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket match events.
