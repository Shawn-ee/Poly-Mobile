# Cycle WF - Line Family S23 Proof

## Scope

Extend the current Local MVP S23 proof harness so it can target line-market families beyond the default Spread path, then prove a Totals line through the visible Android flow.

## Criteria

- P0: The proof harness must keep the existing Spread defaults intact.
- P0: The harness must accept line-family parameters for market group, market type, line value, outcome side, and outcome label.
- P0: S23 proof must open Event Detail, select a Totals line, open the ticket, submit a fake-token order, and verify Portfolio History preserves the selected line/outcome/source identity.
- P0: No mobile UI, backend schema, order book UI, chat, live stats, or social feature work is allowed in this cycle.

## Implementation

- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` now supports parameterized line-family targeting while preserving existing Spread defaults.
- `src/server/services/__tests__/mobile.localMvpLiquidityHarness.contract.test.ts` guards the new line-family parameters and dynamic identity assertions.

## Audit Result

Pass.

- Focused harness contract passed: `npx jest src/server/services/__tests__/mobile.localMvpLiquidityHarness.contract.test.ts --runInBand`.
- PowerShell parser check passed for `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`.
- S23 proof passed on `SM-S911U1` for `Totals / Over 2.5`: Home -> Event Detail -> Totals line -> Trade Ticket -> fake-token order -> Portfolio History.
- Evidence: `docs/mobile/harness/cycle-WF-line-family-s23-proof/cycle-WF-current-mvp-s23-visible-flow.json` and screenshots/XML under `docs/mobile/screenshots/cycle-WF-line-family-s23-proof/` and `docs/mobile/harness/cycle-WF-line-family-s23-proof/`.

## Remaining Gaps

- P1: Team Totals still needs the same S23 end-to-end proof.
- P1: Real provider-backed Spread/Totals/Team Total current-match rows remain unavailable from Polymarket source data, so the Local MVP line path still uses contract-shaped fixtures.
