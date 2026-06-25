# World Cup Real Combo Order Evidence

Date: 2026-06-25

## Summary

POLY now has a real guarded backend path for World Cup-style combo orders across different markets in the same event experience.

The implementation is intentionally internal-beta only. Public trading remains disabled by default and server-side trading gates still control whether a combo can be submitted.

Follow-up update:

- `POST /api/combo-orders/quote` calculates combo price and payout on the backend.
- `POST /api/combo-orders` now ignores client-supplied leg prices and persists server-calculated leg prices.
- The event combo slip refreshes from the server quote when internal trading UI is enabled, while retaining local estimates as the disabled/public fallback.

## Implemented Model

New Prisma models:

- `ComboOrder`
- `ComboOrderLeg`

New enum:

- `ComboOrderStatus`

Migration:

- `prisma/migrations/20260625203500_world_cup_combo_orders/migration.sql`

The migration is additive-only:

- creates one enum
- creates combo order tables
- creates indexes
- adds foreign keys
- does not drop, rename, delete, truncate, or alter existing columns destructively

## Runtime Behavior

Users can submit a combo only through:

- `POST /api/combo-orders`

The route requires:

- canonical authenticated actor
- server-side internal trading beta approval
- idempotency key or client order id
- two to eight legs
- one leg per market
- valid active/tradable outcomes
- public listed orderbook markets
- market status `LIVE` or `UPCOMING`
- sufficient available USDC

The event page can call `/api/combo-orders` only when the client internal trading UI flag is explicitly enabled. The server guard remains authoritative, so the client flag cannot bypass auth, allowlist, or kill-switch behavior.

Quote route:

- `POST /api/combo-orders/quote`
- read-only canonical route
- calculates leg prices from POLY orderbook quotes
- calculates `comboPrice = legPrice1 * legPrice2 * ...`
- calculates `potentialPayout = stakeUSDC / comboPrice`
- does not create orders, ledger entries, balance changes, or settlement records

Submission route:

- calculates the same prices server-side before persisting
- ignores client-supplied `leg.price`
- stores the server-calculated leg prices on `ComboOrderLeg`

## Ledger Behavior

Successful combo submission:

- creates a `ComboOrder`
- creates `ComboOrderLeg` rows
- creates one `LOCK` ledger entry with `referenceType = ComboOrder`
- decrements `UserBalance.availableUSDC`
- increments `UserBalance.lockedUSDC`

Combo cancellation:

- marks an open combo order as `CANCELED`
- creates one `UNLOCK` ledger entry
- releases locked USDC back to available USDC

Cancel is scoped to the current user. Cancel does not require opening new trading risk, so it can release an existing hold even if new trading is disabled later.

## Portfolio Display

`GET /api/portfolio` now includes sanitized open combo orders for the current user.

The portfolio UI displays:

- combo legs
- combo price
- stake
- potential payout
- status

Private fields such as idempotency keys and request fingerprints are not returned.

## Safety Boundaries

Still not implemented:

- combo settlement
- combo market resolution
- combo winning/losing leg evaluation
- void/push/refund rules
- public trading
- anonymous trading
- live bot combo placement
- funding, wallet, withdrawal, private-key behavior changes

Public trading remains off by default.

## Tests

Added targeted coverage:

- `src/__tests__/combo-orders.route.test.ts`
- `src/__tests__/combo-orders.service.test.ts`

Updated coverage:

- `src/__tests__/portfolio.open-orders.route.test.ts`
- `src/__tests__/world-cup-market-structure.test.ts`

Coverage includes:

- server-side trading gate blocks combo submission before service call
- server-side gate allows service call only after approval
- read-only quote route calculates without opening the trading write gate
- combo order creation stores legs and creates a ledger lock
- combo order creation stores server-calculated leg prices
- insufficient balance blocks before combo/ledger creation
- duplicate market legs are rejected
- client-supplied leg prices are ignored
- idempotent retry returns the existing combo
- idempotency conflict is rejected
- combo cancel creates an unlock ledger entry
- portfolio returns sanitized combo orders only for the current user
- event page calls `/api/combo-orders`, not `/api/orders` or legacy `/api/combos`

## Validation

Validation run locally:

- `npx jest --runInBand src/__tests__/combo-orders.route.test.ts src/__tests__/combo-orders.service.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/world-cup-market-structure.test.ts`
- `npx tsc --noEmit --pretty false --incremental false`
- `git diff --check`
- `npx prisma generate --schema=prisma/schema.prisma`
- `npx prisma validate --schema=prisma/schema.prisma`
- `npx prisma migrate status --schema=prisma/schema.prisma`
- `npx prisma migrate deploy --schema=prisma/schema.prisma`
- `npm run test:ci`
- `npm run build`

Local Docker Postgres result:

- `npx prisma migrate deploy --schema=prisma/schema.prisma` applied `20260625203500_world_cup_combo_orders`
- `npx prisma migrate status --schema=prisma/schema.prisma` reported the database schema is up to date

Final staged validation still required before commit:

- `git diff --cached --check`

## Review Rule

This PR includes schema, order, and ledger-hold behavior.

It must remain open for specialist/human review. Do not auto-merge it.
