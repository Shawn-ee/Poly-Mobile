# Cycle KI - Account Balance Route Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile visible cash/account balance values can load from canonical `/api/account/balance`.
- Route uses canonical `account:read` auth and returns available, locked, total USDC, and update time.
- Local balance remains fallback only when the route is unavailable.
- No deposit, withdraw, Portfolio visual redesign, order book, chat, or live stats work.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Mobile API calls canonical account balance route | Pass | `mobile/src/__tests__/api.test.ts` verifies `getAccountBalance()` calls `/api/account/balance` with auth. |
| Mobile maps route payload into numeric display values | Pass | `mobile/src/__tests__/accountBalanceService.test.ts` verifies string/Date payload mapping into visible balance values. |
| Backend enforces canonical account scope | Pass | `src/server/services/__tests__/canonical_route_auth.phase5.test.ts` verifies missing `account:read` is rejected and valid keys return balance. |
| Route proof suppresses local fallback after success | Pass | `scripts/prove_mobile_account_balance_contract.ts` verifies the route-backed result wins over fallback balance. |
| Cycle avoids unrelated UI/payment work | Pass | No edits to deposit, withdraw, Portfolio layout, order book, chat, or live stats flows. |

## Change Notes

- Added `PolyApi.getAccountBalance()`.
- Added `loadAccountBalance()` for route-backed numeric balance mapping.
- Added canonical account-balance route success coverage and a proof artifact.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/api.test.ts mobile/src/__tests__/accountBalanceService.test.ts mobile/src/__tests__/profileSummaryService.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/server/services/__tests__/canonical_route_auth.phase5.test.ts src/__tests__/wallet.balance.route.test.ts` - pass.
- `npx tsx scripts/prove_mobile_account_balance_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KI"` - pass.

## Remaining P1

- Wire dirty Account/Portfolio UI files to `loadAccountBalance()` where a standalone balance refresh is needed after screen churn is reconciled.
- Legacy `/api/wallet/balance` remains for current UI compatibility but should not be the canonical server-mode mobile contract.
