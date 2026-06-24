# Market Resolution and Settlement Evidence

Date: 2026-06-24

## Chosen Option

Option B: admin settlement preview only.

## Why Option B

The repo already contains a full public ORDERBOOK settlement path through `resolveOrderbookMarket`.

That existing path:

- is admin-gated at the route layer
- cancels open orderbook orders
- validates public orderbook collateral invariants
- credits winners with `WIN` ledger entries
- updates balances
- zeroes positions
- marks the market `RESOLVED`

Because that is ledger/balance mutation behavior, Phase I did not expand it. The safer useful next step is an admin-only preview endpoint that lets operators inspect expected settlement results before using any mutating resolve route.

## Implemented

Added read-only settlement preview support:

- `previewOrderbookSettlement` in `src/server/services/settlement.ts`
- `POST /api/admin/markets/[id]/settlement-preview`
- targeted tests in `src/__tests__/admin.market-settlement-preview.test.ts`

The preview returns:

- market id/status
- winning outcome id/name
- market collateral
- total shares
- total winning shares
- total payout preview
- payout conservation status
- blockers if the preview does not conserve collateral
- open order cleanup preview
- per-position payout previews
- loser position count
- mutation marker: `none`

## Admin and Access Behavior

The preview route is admin-only through `assertAdmin`.

Normal and anonymous users are blocked by the same admin guard path used by existing admin market controls.

The route uses the existing `admin_market_resolve` sensitive rate limit key.

No public mutation route was added.

## Ledger Behavior

This phase adds no ledger mutation.

The preview route does not create `LedgerEntry` rows, does not update `UserBalance`, does not update `Position`, does not update `Order`, and does not update `Market`.

## Settlement Behavior

This phase does not add final settlement.

Existing full settlement behavior remains in the repo and should remain controlled behind admin review and internal beta operating procedures.

The preview endpoint is intended for operator verification before any final resolve action.

## Tests Added

`src/__tests__/admin.market-settlement-preview.test.ts`

Coverage:

- non-admin preview access is blocked
- admin preview returns expected payout and open-order cleanup data
- preview does not create ledger entries
- preview does not change balances
- preview does not change orders
- preview does not change positions
- preview does not mark the market resolved

## Validation

- `git diff --check`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx jest --runInBand src/__tests__/admin.market-settlement-preview.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed.
- `npm run build`: passed.

## Remaining Blockers

- full settlement remains high risk because it mutates ledger, balances, positions, orders, and market state
- no void/push/refund settlement path exists for sports props
- no operator runbook evidence for when to use preview vs final resolve exists yet
- no deployed end-to-end event -> order -> portfolio -> preview -> resolve -> settlement drill exists yet

## Next Phase

Next recommended phase: Phase J Live Sports Provider / Reference Data Readiness.

If this Phase I PR remains Option B preview-only and CI passes, it may be merged after specialist review.
