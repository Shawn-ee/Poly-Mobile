# Cycle WG - Team Totals S23 Proof

## Scope

Prove the remaining Local MVP Team Totals line-family path on Samsung S23.

## Criteria

- P0: The proof harness must support the Team Totals row selector without breaking existing Spread/Totals defaults.
- P0: S23 proof must select `Team Total Goals / Argentina Over 1.5`, open the Trade Ticket, submit a fake-token order, and verify Portfolio History preserves the selected team-total line/outcome/source identity.
- P0: No mobile UI, backend schema, order book UI, chat, live stats, social, or non-MVP feature work is allowed.

## Implementation

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` now accepts `LineTapPrefix`, allowing proof runs to target the Team Totals row id prefix `event-detail-outcome-team-total-goals-`.
- `src/server/services/__tests__/mobile.localMvpLiquidityHarness.contract.test.ts` guards the selector parameter.

## Audit Result

Pass.

- Focused harness contract passed: `npx jest src/server/services/__tests__/mobile.localMvpLiquidityHarness.contract.test.ts --runInBand`.
- PowerShell parser check passed for `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`.
- S23 proof passed on `SM-S911U1` for `Team Total Goals / Argentina Over 1.5`: Home -> Event Detail -> Team Totals line -> Trade Ticket -> fake-token order -> Portfolio History.
- Evidence: `docs/mobile/harness/cycle-WG-team-total-s23-proof/cycle-WG-current-mvp-s23-visible-flow.json` and screenshots/XML under `docs/mobile/screenshots/cycle-WG-team-total-s23-proof/` and `docs/mobile/harness/cycle-WG-team-total-s23-proof/`.

## Remaining Gaps

- P1: Real provider-backed Spread/Totals/Team Total current-match rows remain unavailable from Polymarket source data, so the Local MVP line path still uses contract-shaped fixtures.
