# Cycle NY - MVP Source Label Cleanup

## Scope

Visible source-label cleanup for the Local MVP retail flow. No backend route, order, schema, orderbook, chat, live stats, or social feature work.

## Reference Basis

Cycle NX confirmed the current service state:

- Regulation Winner: provider-backed by Polymarket.
- Spread/Totals/Team Total: backend-shaped local contract fixtures.

The acceptance target for this cycle is honest, compact copy that does not clutter the betting flow or imply fake provider-backed line markets.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NY-P0-01 | P0 | Home source label must say the mixed state plainly: Polymarket winner plus local test lines. | Pass |
| NY-P0-02 | P0 | Event Detail source copy must be concise and still expose provider/fixture markers for audit. | Pass |
| NY-P0-03 | P0 | Trade Ticket and Portfolio source chips must use `Polymarket` / `Local test`, not vague `Provider` / `Local`. | Pass |
| NY-P0-04 | P0 | No backend/order/schema logic changes. | Pass |
| NY-P0-05 | P0 | S23 proof must pass for current Home -> Event Detail sanity. | Pass |

## Implementation Summary

- Home event card source copy now shows `Winner: Polymarket / Lines: local test`.
- Event Detail source banner and market-row notes use concise Polymarket/local-test wording.
- Trade Ticket source badge/note uses `Polymarket` or `Local test`.
- Portfolio source badges and summaries use the same wording.

## Evidence

- `docs/mobile/harness/cycle-NY-mvp-source-label-cleanup/cycle-NY-current-mvp-s23-visible-flow.json`
- `docs/mobile/screenshots/cycle-NY-mvp-source-label-cleanup/cycle-NY-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-NY-mvp-source-label-cleanup/cycle-NY-current-mvp-detail-stale-top.png`
- `docs/mobile/harness/cycle-NY-mvp-source-label-cleanup/cycle-NY-current-mvp-home.xml`
- `docs/mobile/harness/cycle-NY-mvp-source-label-cleanup/cycle-NY-current-mvp-detail-stale-top.xml`

## Validation

- `vitest --config vitest.mobile.config.mts` focused source/order tests passed.
- Mobile `tsc --noEmit` passed.
- S23 proof passed on `SM-S911U1`.

## Remaining Gaps

- P1: Real provider-backed Spread/Totals/Team Total line markets remain unavailable for the checked Polymarket events.
