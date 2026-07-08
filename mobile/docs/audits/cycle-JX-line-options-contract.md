# Cycle JX - Line Options Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile service contract for backend-backed Game Lines period/line availability.
- Prevents frontend-invented Spread/Totals/Team Total line choices when backend markets do not provide them.
- Treats provider aliases such as `total_goals` as totals markets.
- No Event Detail UI wiring in this cycle because the screen file is dirty from unrelated work.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Line options come only from backend markets | Pass | `mobile/src/__tests__/marketLineOptionsService.test.ts` and `docs/mobile/harness/cycle-JX-line-options-contract/cycle-JX-line-options-contract.json`. |
| Period options come only from backend markets | Pass | Tests/proof show one spread market does not invent first-half or second-half choices. |
| Wrong-period backend markets are rejected | Pass | Tests/proof reject `spread 1.5` first-half when only regulation `1.5` exists. |
| Provider totals aliases map to totals | Pass | Tests/proof map `total_goals` into totals options. |
| The cycle does not edit dirty Event Detail UI | Pass | Scoped commit is service/tests/proof/docs only. |

## Change Notes

- Added `marketLineOptionsService` to centralize backend-backed line/period selection.
- The service exposes period options, line options, market type aliasing, and exact backend market matching.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/marketLineOptionsService.test.ts` - pass.
- `npx tsx scripts/prove_mobile_line_options_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle JX"` - pass.

## Remaining P1

- Wire Event Detail/Game Lines UI to this service after unrelated dirty Event Detail churn is reconciled.
- Add Android/UI proof that visible line chips follow backend availability.
