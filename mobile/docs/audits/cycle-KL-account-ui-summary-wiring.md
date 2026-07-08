# Cycle KL - Account UI Summary Wiring

Gate status: Pass

Scope: Backend/data-contract gate for the visible Account screen consuming `/api/profile/summary` in server mode. This does not add deposits, withdrawals, broad account settings, or visual redesign work.

## P0 Checklist

- Account screen server mode loads `/api/profile/summary` through `loadProfileSummary()`.
- Successful backend summary values drive visible Account props for cash balance, portfolio value, open positions, open orders, open order value, total exposure, trading mode, saved markets, and ticket defaults.
- Failed server summary loads clear stale route summary state and show the existing Account sync error state instead of continuing to display stale backend values.
- Mock/offline mode keeps existing local/demo Account props.
- No order book, chat, live stats, deposit, withdraw, or Portfolio redesign work is included.

## Evidence

- Proof: `docs/mobile/harness/cycle-KL-account-ui-summary-wiring/cycle-KL-account-ui-summary-wiring.json`.
- Proof script: `scripts/prove_mobile_account_ui_summary_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/profileSummaryService.test.ts`
- Focused backend tests:
  - `src/__tests__/profile.summary.route.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Account UI backend route wiring.
- Remaining P1: broader account/security/session/funding settings only if they become visible MVP scope.
