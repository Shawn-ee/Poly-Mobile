# Add Test CI Script

Branch: `agent/add-test-ci-script`

Date: 2026-06-18

## Goal

Add a stable `npm run test:ci` command so local and autonomous validation cycles can run the same focused Jest smoke suite used by GitHub Actions CI Phase 1.

## Scope

- Added `test:ci` to `package.json`.
- Updated `.github/workflows/ci.yml` to call `npm run test:ci`.
- Updated `docs/TESTING.md` to document CI Phase 1, the broad Jest-suite caveat, and separate Playwright coverage.

## Exact Command

```sh
jest --runInBand --detectOpenHandles src/__tests__/admin.market.invariants.route.test.ts src/__tests__/admin.withdrawals.complete.route.test.ts src/__tests__/config.validation.test.ts src/__tests__/health.route.test.ts src/__tests__/order_ticket_logic.test.ts src/__tests__/orderbook.events.bus.test.ts src/__tests__/orderbook.place-cancel.events.test.ts src/__tests__/sensitive.rate-limit.test.ts src/__tests__/sports.event-market-model.test.ts src/__tests__/sse.market.route.test.ts src/__tests__/sse.recovery.test.ts src/__tests__/sse.user.route.test.ts src/__tests__/wallet.balance.route.test.ts
```

## Intentionally Not Changed

- App functionality
- UI
- Backend matching, ledger, and orderbook logic
- Wallet, deposit, withdrawal, custody, or payment logic
- Playwright CI inclusion
- Production deployment configuration

## Validation

| Check | Result | Notes |
| --- | --- | --- |
| `git diff --check` | PASS | No whitespace errors |
| `npm ci` | PASS | Existing npm audit/deprecation warnings remain |
| `npm exec -- prisma generate --schema=prisma/schema.prisma` | PASS | Existing Prisma config deprecation warning |
| `npm exec -- prisma validate --schema=prisma/schema.prisma` | PASS | Existing Prisma config deprecation warning |
| `npx tsc --noEmit --pretty false --incremental false` | PASS | No TypeScript errors |
| `npm run test:ci` | PASS | 13 suites, 39 tests passed |
| Focused ESLint on changed files | PASS | No errors; JSON/YAML/Markdown files were ignored by the current ESLint config with warnings |
| Changed-file secret scan | PASS | Matches were existing documented CI placeholders only: `pass` and `ci-nextauth-secret` |

## Known Risks

- `test:ci` intentionally mirrors the current focused CI smoke suite. It does not make the broader `npm run test:jest` suite CI-safe.
- Playwright remains outside CI Phase 1 and must be run separately for browser validation.
