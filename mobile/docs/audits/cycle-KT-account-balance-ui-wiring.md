# Cycle KT - Account Balance UI Wiring

Scope:

- Visible Portfolio cash balance and bottom-tab portfolio value in server mode.
- Canonical `/api/account/balance` service wiring through `loadAccountBalance()`.
- No Portfolio visual redesign, deposits, withdrawals, order book, chat, or broad account settings work.

| Requirement | Status | Evidence |
| --- | --- | --- |
| Server-mode UI calls canonical balance route service | Pass | `mobile/App.tsx` imports and calls `loadAccountBalance({ api, fallbackBalance: 0 })` when `ORDER_MODE=server` and an API key is present. |
| Successful route balance updates visible cash state | Pass | The server-route result sets `balance` from `accountBalance.availableUSDC`; Portfolio receives `balance={balance}`. |
| Bottom tab value uses the same route-backed balance state | Pass | `accountPortfolioValue` is computed from `balance + positions`; BottomTabs receives `portfolioValue={accountPortfolioValue}`. |
| Legacy wallet balance is not used for mobile UI wiring | Pass | Proof checks `mobile/App.tsx` does not call `/api/wallet/balance`. |
| Mock fallback remains isolated | Pass | `loadAccountBalance()` local fallback remains service-only and successful server responses suppress fallback. |

Validation:

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/accountBalanceService.test.ts mobile/src/__tests__/api.test.ts mobile/src/__tests__/profileSummaryService.test.ts`
- `npm run typecheck --prefix mobile`
- `npx tsc --noEmit`
- `npx tsx scripts/prove_mobile_account_balance_contract.ts`
- `npx tsx scripts/prove_mobile_account_balance_ui_wiring.ts`
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KT"`

Gate status: Pass.

Remaining:

- P1 legacy `/api/wallet/balance` cleanup after non-mobile web wallet compatibility is reviewed.
