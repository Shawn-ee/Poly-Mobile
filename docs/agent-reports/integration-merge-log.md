# Integration Merge Log

Branch: `audit/dev-post-integration-verification`

Target branch verified: `dev`

Integration date: 2026-06-17

## Merge Results

| PR | Branch | Result | Dev Commit | Validation |
| --- | --- | --- | --- | --- |
| #13 | `agent/sync-dev-with-main-ci-baseline` | Merged to `dev` | `1232b7d` | Passed CI-equivalent local validation |
| #11 | `agent/ledger-phase3-vitest-fix` | Merged to `dev` | `09dd33b` | Passed phase3 ledger validation |
| #12 | `audit/full-platform-verification` | Merged to `dev` | `6e4f8c4` | Passed docs-focused validation |
| #14 | `agent/playwright-dev-admin-login` | Merged to `dev` | `eced392` | Passed auth guard, lint, TypeScript, and admin Chrome smoke |
| #16 | `agent/sports-event-seed-api-alignment` | Merged to `dev` | `6046e1f` | Passed seed/API alignment validation |
| #15 | `agent/sports-ui-event-pages-clean` | Merged to `dev` | `cda413b` | Passed sports UI route smoke and static checks |
| #18 | `agent/sports-auth-e2e-locator-fix` | Merged to `dev` | `219f448` | Passed authenticated sports e2e validation |

No PRs from the requested queue remain open.

## Scope Checks

- All merged PRs targeted `dev`.
- No PR was merged to `main`.
- No production deployment was performed.
- No force push was performed.
- No real-money deposit, withdrawal, custody, or payment implementation was enabled.
- Changed-file secret scans did not find high-confidence secrets. Matches were placeholders, documentation references, or non-secret field names.

## Validation Details

### PR #13

- PASS: `git diff --check`
- PASS: `npm ci`
- PASS: `npm exec -- prisma generate --schema=prisma/schema.prisma`
- PASS: `npm exec -- prisma validate --schema=prisma/schema.prisma`
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- PASS: focused CI Jest smoke command from `.github/workflows/ci.yml`
- PASS: changed-file secret scan

### PR #11

- PASS: `git diff --check`
- PASS: `npm ci`
- PASS: Prisma generate/validate
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- PASS: `npm run test:phase3`
- PASS: changed-file secret scan

### PR #12

- PASS: `git diff --check`
- PASS: changed-file secret scan
- NOTE: docs-only merge; Node test suite was not rerun for this PR.

### PR #14

- PASS: `npm ci`
- PASS: `git diff --check`
- PASS: Prisma generate/validate
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- PASS: `npx jest --runInBand --detectOpenHandles src/__tests__/dev-login-guard.test.ts`
- PASS: focused ESLint on auth and Playwright files
- PASS: `npm run e2e:auth:setup`
- PASS: `npm run e2e:admin`
- PASS: changed-file secret scan

### PR #16

- PASS: `npm ci`
- PASS: `git diff --check`
- PASS: Prisma generate/validate
- PASS: serial `npx tsc --noEmit --pretty false --incremental false`
- PASS: focused ESLint on NBA seed/check files
- PASS: `npx jest --runInBand --detectOpenHandles src/__tests__/sports.event-market-model.test.ts`
- PASS: migration deploy on disposable PostgreSQL
- PASS: two `npm run seed:nba` runs plus `npm run check:nba-seed-events`
- PASS: changed-file secret scan

Note: an initial TypeScript run was started in parallel with `prisma generate` and failed with transient Prisma client type errors. A serial rerun after generation passed.

### PR #15

- PASS: `npm ci`
- PASS: `git diff --check`
- PASS: Prisma generate/validate
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- PASS: focused ESLint on sports UI files with one existing `TopNav` `<img>` warning
- PASS: route smoke for `/`, `/markets`, `/sports`, `/sports/soccer`, `/sports/soccer/world-cup`, and `/events/france-vs-argentina`
- PASS: changed-file secret scan

### PR #18

- PASS: scoped patch review confirmed only the sports authenticated Playwright locator and an agent report changed.
- PASS: `git diff --check`
- PASS: `npm ci`
- PASS: Prisma generate/validate
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- BLOCKED: `npm run test:ci` is not defined in `package.json`
- PASS: `npm run e2e:auth:setup`
- PASS: `npm run e2e:sports:auth`
- PASS: changed-file secret scan with only benign documentation text matched.

## Warnings

- npm continues to report existing audit/deprecation warnings.
- Prisma continues to warn that `package.json#prisma` is deprecated for Prisma 7.
- Next dev server warns about multiple lockfiles and inferred workspace root.
- `npm run test:ci` is not currently available as a package script.
