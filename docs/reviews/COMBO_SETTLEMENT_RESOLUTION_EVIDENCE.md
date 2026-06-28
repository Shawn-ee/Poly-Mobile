# Combo Settlement and Sports Resolution Evidence

Date: 2026-06-26

## Summary

This phase adds the first real internal-beta combo settlement path for World Cup-style combo orders.

Implemented:

- Admin-only sports market result metadata route for combo/demo markets.
- Admin-only combo settlement preview route.
- Admin-only combo settlement route.
- Ledger-backed settlement entries for combo winners, losers, and void/push refunds.
- Portfolio read model now keeps settled and voided combo orders visible.

Not implemented:

- Public resolution.
- Automatic resolution.
- Settlement from bots.
- Public trading enablement.
- Funding, withdrawal, wallet, private-key, or auto-credit behavior.
- Provider live score integration.

## Settlement Model

Combo settlement uses the stake locked when the combo order was placed.

Rules:

- All legs win: combo status becomes `SETTLED`, locked stake is released, and available USDC is credited by the stored `potentialPayout`.
- Any leg loses: combo status becomes `SETTLED`, locked stake is consumed, and no payout is credited.
- Any leg is void or push: combo status becomes `VOIDED`, locked stake is refunded to available USDC.
- Any unresolved leg: settlement is blocked.
- Duplicate settlement is idempotently blocked by `combo-settle:<comboOrderId>`.

Ledger entry:

- `referenceType`: `ComboOrder`
- `referenceId`: combo order id
- `reason`: `MARKET_SETTLEMENT`
- `operation`: `OTHER`

`operation: OTHER` is intentional because current balance reconciliation includes `OTHER` custody operations.

## Admin Sports Resolution

New route:

- `POST /api/admin/markets/[id]/sports-resolution`

Supported actions:

- `resolve` with `winningOutcomeId`
- `push` with `pushOutcomeId`
- `void` with `voidReason`

Safety guard:

- The metadata-only sports resolution route refuses markets with ordinary open orderbook orders or positions.
- Markets with normal orderbook exposure must use the existing orderbook settlement workflow.

This prevents an admin metadata update from bypassing the existing single-market orderbook settlement path.

## Combo Admin Routes

New routes:

- `POST /api/admin/combo-orders/[id]/settlement-preview`
- `POST /api/admin/combo-orders/[id]/settle`

Both routes require admin auth and use the existing sensitive admin market resolve rate limit.

## Internal Drill

The targeted integration test runs a full local test-balance drill:

1. Create admin and internal test user.
2. Create two sports orderbook markets.
3. Create an open combo order with locked stake.
4. Resolve both legs as winners.
5. Preview settlement.
6. Settle combo.
7. Verify combo status, ledger entry, available balance, and locked balance.

Additional drills cover:

- Losing combo settlement.
- Push/void combo refund.
- Pending leg blocks settlement.
- Duplicate settlement does not create a second ledger entry.
- Metadata-only market resolution is blocked when normal orderbook positions exist.

## UX / Portfolio

Portfolio now returns and displays combo orders with status:

- `OPEN`
- `SETTLED`
- `VOIDED`

Canceled combo orders remain hidden from the main portfolio table.

## Validation

Targeted validation already run locally against Docker Postgres `poly_test`:

- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed with local Docker database URL.
- `npx prisma migrate deploy --schema=prisma/schema.prisma`: passed and applied existing migrations to local Docker database.
- `npx jest --runInBand src/server/services/__tests__/comboSettlement.test.ts`: passed.
- `npx jest --runInBand src/__tests__/admin.combo-settlement.routes.test.ts`: passed.

Full validation still required before merge:

- `git diff --check`
- `git diff --cached --check`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`
- `npm run build`

## Harness Loop Follow-Up

The clean `dev` branch used for this product settlement work does not contain the newer harness-loop scripts that exist as dirty worktree files in the separate harness branch.

Required harness tightening should be done in a separate branch:

- Add max recursive fix depth.
- Quarantine `FIX-FIX-*` task chains.
- Require task quality gates before task creation.
- Do not create new fix tasks when failure cause is unchanged.
- Require explicit success criteria and changed-file scope.
- Stop loop when only recursive failed-task churn remains.

## Readiness Impact

This moves POLY closer to limited internal World Cup combo beta because combo orders can now be resolved and settled in a controlled admin-only path.

Still not ready for public beta.

Still not approved:

- Public trading.
- Public funding.
- Anonymous trading.
- Auto-withdrawal.
- Live bots.
- Automatic sports provider resolution.
