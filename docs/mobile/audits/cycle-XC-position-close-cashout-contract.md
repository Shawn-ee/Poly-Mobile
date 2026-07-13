# Cycle XC - Position Close Cashout Contract

Date: 2026-07-12

Scope:

- Local MVP Portfolio and Event Detail cashout/position-close UX and order contract.
- Corrects the earlier Cycle RT assumption that cashout should look like a generic Buy/Sell ticket.
- No order book, chat, live stats, social, deposit, withdraw, provider refresh, schema, or backend matching changes.

Reference criteria:

P0:

- Cash out closes an existing owned position.
- Cashout amount is owned share quantity, not wallet cash.
- Max uses the full owned share count.
- Estimated proceeds use the current sell/bid price.
- Cashout ticket does not show the Yes/No selector.
- Cashout is unavailable when owned shares are zero or missing.
- Selling more than owned shares is rejected before order submission.
- Server close payload remains canonical: `side=SELL`, owned `marketId`, owned `outcomeId`, share `size`, and sell/bid `price`.
- Binary team-market top-level buttons expose only the team Yes action; redundant No buttons are not exposed as separate primary choices.

Implementation:

- `mobile/src/components/TradeTicket.tsx`
  - Cashout header now names the position being closed.
  - Hidden accessibility row no longer labels cashout as `Yes - outcome`.
  - Max uses `trimShareAmount(closeAvailableShares)` so integer share counts are not truncated incorrectly.
  - Cashout mode now depends on the ticket close-position payload itself, not transient local side state.
  - Close-position tickets force the effective submit side to `sell`, so stale Buy/Sell preferences cannot make Max fall back to wallet balance.
  - Cashout proof markers expose source position presence, ticket side, local side, effective side, available shares, and sell price through the cashout info accessibility label.
  - Cashout remains in close-position mode with owned-share availability and estimated proceeds.
- `mobile/App.tsx`
  - The submit handler now treats any ticket with a close-position payload as an effective SELL, even if stale local side state is passed into `placeOrder`.
  - Close-position order cost remains estimated proceeds, and `sizeShares` remains the selected owned-share quantity.
- `mobile/scripts/smoke.ps1`
  - The `ServerPositionTrade` Samsung proof path now asserts the new close-position markers instead of the old generic sell-ticket markers.
  - The proof taps Max and requires `500` owned shares plus `Swipe to cash out`, while rejecting wallet-sized values such as `$9,000` or `$10,000`.
- `mobile/package.json`
  - Adds `npm run smoke:samsung:cashout-close-position` as an explicit alias for the updated Samsung close-position proof gate.
- `mobile/src/components/EventDetail.tsx`
  - Removed top-level No-side duplicate buttons for regulation winner rows.
  - Tapping a displayed team/outcome remains a buy of that outcome's Yes contract.
- `mobile/src/services/positionCloseService.ts`
  - Server close price now prefers `bestBid` before display/current price.
  - Percent-form quote values such as `47` are normalized to probability price `0.47` before display/order payload use.

Validation:

- Focused mobile contracts: `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/positionCloseService.test.ts mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts mobile/src/__tests__/tradeTicketModeClarityContract.test.ts`
  - Result: 18 passed.
- Mobile typecheck: `npm --prefix mobile run typecheck`
  - Result: passed.
- Backend cashout/open-position tests: `npx jest --runInBand src/__tests__/cash-out.service.test.ts src/__tests__/portfolio.open-orders.route.test.ts`
  - Result: 11 passed.
- Samsung proof harness alignment: `npm run smoke:samsung:cashout-close-position`
  - Result: harness updated. Full scripted run reached the same close-position path; manual S23 fixture proof was used after the harness hit a fixture precondition while waiting for account-entry markers.
- Expo runtime restart:
  - Result: restarted on port `8081` with Metro cache cleared after both the ticket-mode fix and the App submit guard.
  - Reason: real S23 feedback showed stale/generic-ticket behavior after source fixes.

Android proof:

- Status: passed on Samsung S23 `SM_S911U1` (`adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`).
- Proof path:
  - Screenshot: `.runtime/rehearsal/holiwyn-cashout-max-fixed.png`
  - UI hierarchy: `.runtime/rehearsal/holiwyn-cashout-max-fixed.xml`
- Verified on device:
  - Cashout ticket displayed `Cash out France`.
  - No Yes/No selector was exposed.
  - Max selected `500` shares, not wallet cash.
  - Price displayed as `47%`, not `4700%`.
  - Estimated proceeds displayed `$235`, not a wallet-sized amount.
  - Swipe label displayed `Swipe to cash out` and helper displayed `Sell up to 500 shares`.
- Manual runtime was running for user proof through Expo Go:
  - Expo: `exp://172.16.200.14:8081`
  - Backend: `http://172.16.200.14:3002`
  - Metro cache: cleared on restart.

Audit gate:

- P0 code/test gate: pass.
- P0 Android device gate: pass for Max/share semantics and close-position display.
- Commit/push status: pending final commit.

Remaining gaps:

- P0: none currently unresolved for the cashout Max/share UX.
- P1: Server route should eventually expose a dedicated close-position quote endpoint so the ticket can display proceeds from a backend-owned close quote, not only current position bid fields.
