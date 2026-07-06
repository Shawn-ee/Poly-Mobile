# Cycle JZ - Open Order Cancel Route Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile server-mode open-order cancel service.
- `DELETE /api/orders/:id` canonical cancel route.
- Portfolio refresh through `/api/portfolio`.
- Canceled activity/history through `/api/portfolio/history`.
- No Portfolio visual redesign and no edits to dirty Portfolio UI files.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Mobile server-mode cancel calls the backend route | Pass | `mobile/src/__tests__/openOrderService.test.ts` and `docs/mobile/harness/cycle-JZ-open-order-cancel-route-contract/cycle-JZ-open-order-cancel-route-contract.json`. |
| Backend cancel is actor-scoped and mobile-safe | Pass | `src/__tests__/orders.cancel.route.test.ts` covers actor ownership, `orders:write`, response metadata, and no cancel on missing actor order. |
| Canceled order leaves open orders | Pass | JZ proof verifies `/api/portfolio` contains the order before cancel and removes it after route cancel. |
| Canceled order appears in history/activity | Pass | JZ proof verifies `/api/portfolio/history` canceled order and mobile activity mapping. |
| Selection identity survives cancel | Pass | JZ proof verifies spread market/outcome/line/period/provider token identity on open order, canceled history, and canceled mobile activity. |

## Change Notes

- Added focused proof for the Portfolio open-order cancel route contract.
- Added mobile service test coverage that local canceled activity rows retain backend selection identity.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/openOrderService.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/orders.cancel.route.test.ts` - pass.
- `npx tsx scripts/prove_mobile_open_order_cancel_route_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle JZ"` - pass.

## Remaining P1

- Android proof of the visible Portfolio Orders tab cancel button after dirty Portfolio UI churn is reconciled.
- Broader cancel proof across totals/team-total/advance markets if future provider breadth gates require it.
