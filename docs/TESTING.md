# Testing

## CI Phase 1

The current GitHub Actions workflow is `.github/workflows/ci.yml`.

It runs on:

- pull requests targeting `main`
- pushes to `main`

Commands:

```sh
npm ci
npm exec -- prisma generate --schema=prisma/schema.prisma
npm exec -- prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

`npm run test:ci` is the stable CI Phase 1 Jest smoke command. It runs the same focused file list used by GitHub Actions:

```sh
jest --runInBand --detectOpenHandles src/__tests__/admin.market.invariants.route.test.ts src/__tests__/admin.withdrawals.complete.route.test.ts src/__tests__/config.validation.test.ts src/__tests__/health.route.test.ts src/__tests__/order_ticket_logic.test.ts src/__tests__/orderbook.events.bus.test.ts src/__tests__/orderbook.place-cancel.events.test.ts src/__tests__/sensitive.rate-limit.test.ts src/__tests__/sports.event-market-model.test.ts src/__tests__/sse.market.route.test.ts src/__tests__/sse.recovery.test.ts src/__tests__/sse.user.route.test.ts src/__tests__/wallet.balance.route.test.ts
```

## Known Non-CI-Safe Suites

Do not treat broad `npm run test:jest` as a green baseline yet. It currently mixes:

- Jest smoke tests
- DB-backed integration tests
- Vitest-authored tests collected by Jest

Known broad-suite failures include:

- Vitest imports inside Jest
- order rate-limit expectation drift
- admin market simulation auth expectation
- phase 8.5 simulation failure
- DB test isolation requirements

`npm run test:phase3` currently runs Vitest but one test calls `jest.resetModules`; that test needs a runner-compatible rewrite.

`npm run test:jest` should not replace `npm run test:ci` until the broad suite is isolated, runner-compatible, and repeatable in CI.

## Browser Testing

Playwright is intentionally not part of CI Phase 1.

Run Playwright checks separately with the `e2e:*` scripts after starting the app with the required local environment, including `ALLOW_DEV_LOGIN=true` for authenticated local-only flows.

Current Chrome smoke coverage from the audit:

- public pages load
- market detail hydrates
- order amount input accepts values
- sports pages 404 and need implementation
- authenticated admin/user order flows are not verified

## Safe Local Test Environment

Use test-only values:

```sh
DATABASE_URL=postgresql://user:pass@localhost:55432/poly_test
NEXTAUTH_SECRET=ci-nextauth-secret
NEXTAUTH_URL=http://127.0.0.1:3001
NODE_ENV=test
APP_ENV=development
```

Do not use production credentials for local tests.
