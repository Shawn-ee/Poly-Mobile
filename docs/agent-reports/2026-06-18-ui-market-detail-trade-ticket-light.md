# UI Market Detail Trade Ticket Light

Branch: `agent/ui-market-detail-trade-ticket-light`

Date: 2026-06-18

## Goal

Polish market detail, orderbook panels, grouped trade ticket internals, outcome rows, and order form presentation using the light trading UI primitives.

## Scope

- Updated `MarketHeader` to use shared card/badge styling.
- Updated `OrderbookMarketView` panels for depth, recent trades, reference data, positions, and open orders.
- Updated `OrderTicket` shell, segmented buy/sell control, outcome selection, inputs, estimates, submit button, and feedback styles.
- Updated `GroupedTradeTicket` shell, amount input, quick amounts, estimates, submit button, and feedback styles.
- Added a negative button variant for sell/NO submit actions.

## User Experience

- Users see a clearer market title/header area.
- Users see outcome prices in a cleaner selectable grid.
- Users can enter an amount in a focused trade ticket.
- Users see estimated shares, cost, payout, and profit in grouped summary blocks.
- Success and error feedback use badge styling for stronger scanning.

## Intentionally Not Changed

- Matching logic
- Ledger logic
- Orderbook behavior
- Settlement behavior
- Wallet, deposit, withdrawal, custody, or payment logic
- Order submission payload shape
- Order cancellation behavior
- Player props, parlay, or sportsbook/casino UI
- Production deployment configuration

## Validation

| Check | Result | Notes |
| --- | --- | --- |
| `git diff --check` | PASS | No whitespace errors |
| `npm ci` | PASS | Existing npm audit/deprecation warnings remain; first attempt hit Windows `EPERM` until a repo-local Next process was stopped |
| `npm exec -- prisma generate --schema=prisma/schema.prisma` | PASS | Existing Prisma config deprecation warning |
| `npm exec -- prisma validate --schema=prisma/schema.prisma` | PASS | Existing Prisma config deprecation warning |
| `npx tsc --noEmit --pretty false --incremental false` | PASS | No TypeScript errors |
| `npm run test:ci` | PASS | 13 suites, 39 tests passed |
| `npm run e2e:auth:setup` | PASS | Ran against local app on `http://127.0.0.1:3001` |
| `npm run e2e:sports:auth` | PASS | 2 Playwright tests passed |
| Focused ESLint on changed source files | PASS | No errors |
| Changed-file secret scan | PASS | Matches were non-secret docs, field, and function terms: global tokens, polymarketTokenId, botApiKeyId, formatToken |
| Chrome smoke for market detail and event detail order ticket | PASS | Market detail and `/events/france-vs-argentina` returned 200 and displayed expected trading UI text |

## Screenshots

Generated under ignored `test-results/`:

- `test-results/ui-market-detail-trade-ticket-light/market-detail.png`
- `test-results/ui-market-detail-trade-ticket-light/event-detail-order-ticket.png`

## Known Limitations

- This pass focuses on market detail/trading surfaces. Wallet, portfolio, auth modal, pool market detail, and admin screens still retain older styling in places.
