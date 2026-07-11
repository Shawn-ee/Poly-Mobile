# Cycle WE - S23 Position Proof Summary

## Scope

Fix the current S23 Local MVP proof summary so the filled Portfolio position is reported accurately before the cashout/sell step.

## Reference / Criteria

- P0: In a filled-history cashout proof, the harness must assert that the post-submit Portfolio XML contains `position-card-` before tapping `portfolio-position-cash-out-*`.
- P0: The proof summary must set `assertions.filledPositionVisible=true` when that Position card exists, including the cashout branch.
- P0: No mobile UI, backend order logic, order book UI, chat, live stats, or social feature code changes are allowed in this cycle.
- P1: The full S23 cashout proof should continue to pass and produce the same MVP flow artifacts.

## Implementation

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` now reads the post-submit XML once and initializes `$fixtureOrderLandedAsPosition` from the actual `position-card-` marker before any open-order/cashout branch logic.
- `src/server/services/__tests__/mobile.localMvpLiquidityHarness.contract.test.ts` guards the reporting behavior so the summary cannot drift back to the old false value while XML proves the position exists.

## Audit Result

Pass.

- Focused harness contract passed: `npx jest src/server/services/__tests__/mobile.localMvpLiquidityHarness.contract.test.ts --runInBand`.
- PowerShell parser check passed for `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`.
- S23 proof passed on `SM-S911U1`: Home -> Event Detail -> line ticket -> filled Position -> Cash out/Sell -> Portfolio History.
- Evidence: `docs/mobile/harness/cycle-WE-s23-position-proof-summary/cycle-WE-current-mvp-s23-visible-flow.json` and screenshots/XML under `docs/mobile/screenshots/cycle-WE-s23-position-proof-summary/` and `docs/mobile/harness/cycle-WE-s23-position-proof-summary/`.
- The summary now reports `filledPositionVisible=true`, `cashoutHistoryVisible=true`, `ticketPreservesLine=true`, and `orderbookHidden=true`.

## Remaining Gaps

- P1: Real provider-backed Spread/Totals/Team Total current-match lines remain unavailable from Polymarket Gamma/CLOB for the current MVP match, so contract-shaped line fixtures remain the honest MVP path.
