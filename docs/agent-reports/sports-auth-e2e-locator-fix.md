# Sports Auth E2E Locator Fix

Branch: `agent/sports-auth-e2e-locator-fix`

Base: `origin/dev`

Goal: fix the authenticated sports Playwright test strict-mode failure observed during post-integration verification.

## Summary Of Changes

- Updated `tests/e2e/sports-authenticated-order.spec.ts` to assert against the first matching status message.
- Kept the test semantics unchanged: a visible order success, order failure, or auth-required message still satisfies the smoke.

## Files Changed

- `tests/e2e/sports-authenticated-order.spec.ts`
- `docs/agent-reports/sports-auth-e2e-locator-fix.md`

## Validation

Run before PR:

- PASS: `git diff --check`
- PASS: `npm ci`
- PASS: `npm exec -- prisma generate --schema=prisma/schema.prisma`
- PASS: `npm exec -- prisma validate --schema=prisma/schema.prisma`
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- PASS: focused ESLint on changed test file
- PASS: disposable PostgreSQL migration deploy on port `55441`
- PASS: `npm run seed:dev`
- PASS: `npm run e2e:auth:setup`
- PASS: `npm run e2e:sports:auth`
- PASS: changed-file secret scan

Warnings observed:

- npm audit/deprecation warnings remain.
- Prisma `package.json#prisma` deprecation warning remains.

## Known Risks

- This fixes the test locator only; it does not broaden sports trading or settlement coverage.

## Next Recommended Task

After this PR merges, add broader orderbook/ledger/settlement QA coverage for partial fills, full fills, cancel, and settlement.

## Intentionally Not Touched

- Application source code
- Deposit, withdrawal, wallet custody, payment, trading ledger, settlement, and admin permission logic
- Production deployment configuration
- Main branch
