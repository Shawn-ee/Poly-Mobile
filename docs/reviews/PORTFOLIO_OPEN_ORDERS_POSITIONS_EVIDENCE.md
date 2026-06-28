# Portfolio Open Orders and Positions Evidence

Date: 2026-06-24

## Summary

Phase G adds read-only portfolio evidence for guarded internal beta trading.

The portfolio page now displays:

- available USDC balance
- locked/reserved USDC balance
- open internal beta orders
- reserved notional for open orders
- open positions from existing position records
- resolved market history from the existing history route
- internal beta warning that settlement and resolution are separate workflows

No order placement, settlement, market resolution, ledger mutation, funding, withdrawal, wallet, or bot behavior was added.

## Files Changed

- `src/app/api/portfolio/route.ts`
- `src/app/portfolio/page.tsx`
- `src/__tests__/portfolio.open-orders.route.test.ts`
- `docs/reviews/PORTFOLIO_OPEN_ORDERS_POSITIONS_EVIDENCE.md`
- `docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md`

## Current Capability Classification

Available balance: implemented.

Locked balance: implemented.

Open orders: implemented for read-only display from the current user's `OPEN` and `PARTIAL` order rows.

Filled orders: partially available through existing position/history behavior, but not added as a separate filled-order table in this phase.

Positions: implemented from existing `Position` records.

PnL: existing portfolio estimates remain visible. They should be treated as internal beta estimates until resolution and settlement evidence is complete.

Settlement status: not ready and not implemented in this phase.

## API Behavior

`GET /api/portfolio` remains authenticated-only through `getUserId`.

The route now adds a sanitized `openOrders` array:

- order id
- market id/title/status
- outcome id/name
- side
- order status
- limit price
- size
- remaining quantity
- reserved notional
- created/updated timestamps

The query is scoped to the authenticated user and filters to `OPEN` and `PARTIAL` orders. It does not return API credential ids or private/admin fields for portfolio display.

## UI Behavior

`/portfolio` now includes an Open orders section before the existing activity table.

The section shows:

- market link
- outcome
- buy/sell side
- limit price
- size
- remaining quantity
- reserved notional
- order status
- market status

Empty state: "No open orders."

The section is read-only. It does not call any order mutation endpoint.

## Ledger Hold Display

Locked funds are displayed through the existing `UserBalance.lockedUSDC` value.

Open-order reserved funds are displayed through existing `Order.reservedNotional`.

No new ledger math was added.

## Not Implemented

- settlement
- market resolution
- automatic payout
- position closeout
- separate filled-order table
- cancel button on the portfolio page
- new balance calculation
- public trading
- anonymous trading
- live bot matching

## Tests Added

`src/__tests__/portfolio.open-orders.route.test.ts`

Coverage:

- anonymous users are blocked from portfolio data
- portfolio open-order query is scoped to the current user
- locked balance values are returned
- open-order display fields are returned
- API credential/private order metadata is not included in the portfolio `openOrders` payload

## Validation

- `git diff --check`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx jest --runInBand src/__tests__/portfolio.open-orders.route.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed.
- `npm run build`: passed.

## Remaining Blockers

- portfolio positions depend on existing fills/position updates from the matched order path
- PnL remains an estimate and is not final settlement accounting
- no full event -> order -> portfolio -> resolution -> settlement drill exists yet
- market resolution and settlement remain disabled for this phase

## Next Phase

Next recommended phase: Phase H Admin Event Market Management.

Do not start settlement or market resolution implementation until admin market management and operator review are complete.
