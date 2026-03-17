# Operations Runbook (Phase 9)

## 1) Process Withdrawals
1. Open `/admin/withdrawals`
2. For each pending request:
   - send funds manually from ops wallet (MetaMask/manual flow)
   - click **Complete** with `txHash`, or **Reject** with note
3. Verify:
   - request status updates
   - user balances update (`lockedUSDC` consumed on complete, unlocked on reject)

## 2) Resolve Public Market
1. Open admin market tools (`/admin`) or use market resolve endpoint flow
2. Set winning outcome
3. Confirm:
   - market status = `RESOLVED`
   - winner payouts booked
   - collateral consumed to zero for resolved public market

## 3) Check Invariants
1. Open `/admin/markets/<marketId>/invariants`
2. Ensure:
   - bid/ask binary invariants pass
   - outstanding shares equal
   - collateral matches outstanding

## 4) If Reconciliation Fails
1. Run:
   - `npm run reconcile:balances`
   - `npm run reconcile:markets`
   - `npm run reconcile:withdrawals`
2. Inspect mismatch output (userId/marketId/requestId)
3. Freeze sensitive actions if needed:
   - pause market operations / admin actions
4. Investigate recent ledger/order/withdrawal mutations
5. Re-run reconciliation after remediation

## 5) If Withdrawal Is Stuck
1. Locate request in `/admin/withdrawals`
2. If funds were sent on-chain: complete with txHash
3. If not sent: reject to unlock user funds
4. Re-run `npm run reconcile:withdrawals`

## 6) If Market Invariant Fails
1. Inspect `/admin/markets/<marketId>/invariants`
2. Stop further trading on affected market (admin action)
3. Run `npm run reconcile:markets`
4. Review recent order placements/cancellations for that market
5. Resume only when invariants pass

