# Dev Post Integration Verification

Branch: `audit/dev-post-integration-verification`

Verified dev commit: `cda413bdae6664034d39d8ebfbbe24529b0ebd6a`

Date: 2026-06-16

## Goal

Verify `dev` after integrating PRs #13, #11, #12, #14, #16, and #15.

## Environment

- Local app: `http://127.0.0.1:3017`
- Database: disposable PostgreSQL 16 container on port `55440`
- Safe env values only:
  - `DATABASE_URL=postgresql://user:pass@localhost:55440/poly_post_integration`
  - `NEXTAUTH_SECRET=ci-nextauth-secret`
  - `ALLOW_DEV_LOGIN=true`
  - local Playwright admin placeholders

## Data Verification

Seed commands:

- PASS: `npm exec -- prisma migrate deploy --schema=prisma/schema.prisma`
- PASS: `npm run seed:dev`
- PASS: `npm run seed:nba`
- PASS: `npm run check:nba-seed-events`

Seeded data counts:

- sports events: `26`
- soccer World Cup events: `5`
- NBA events: `21`
- public listed markets: `75`
- sample event: `france-vs-argentina`
- sample market: `Will BTC be above $80k by Dec 31, 2026?`

## Static And Test Validation

| Check | Result | Notes |
| --- | --- | --- |
| `git diff --check` | PASS | No whitespace errors |
| `npm ci` | PASS | Existing npm audit/deprecation warnings remain |
| Prisma generate | PASS | Existing Prisma config deprecation warning |
| Prisma validate | PASS | Existing Prisma config deprecation warning |
| TypeScript | PASS | `npx tsc --noEmit --pretty false --incremental false` |
| `test:ci` | SKIPPED | No `test:ci` script exists |
| CI focused Jest smoke | PASS | 14 suites, 41 tests passed |
| `npm run e2e:auth:setup` | PASS | Local dev admin auth state generated then removed |
| `npm run e2e:admin` | PASS | Headed Chrome admin page smoke passed |
| `npm run e2e:sports:auth` | FAIL | Order placed, but assertion matches two visible success messages |
| changed-file secret scan | PASS | No high-confidence secrets |

## Chrome/UI Verification

Manual scripted Chrome smoke used `chromium.launch({ channel: "chrome", headless: false })`.

| Flow | Result | Notes |
| --- | --- | --- |
| `/` loads | PASS | HTTP 200 |
| `/markets` loads | PASS | HTTP 200 |
| `/sports` loads | PASS | HTTP 200 |
| `/sports/soccer` loads | PASS | HTTP 200 |
| `/sports/soccer/world-cup` loads | PASS | HTTP 200 and displays `France vs Argentina` |
| `/events/france-vs-argentina` loads | PASS | HTTP 200 and displays event title |
| `/markets/[id]` loads | PASS | HTTP 200 and displays seeded market title |
| Market detail/order ticket content | PASS | Order/buy/amount/price content visible after hydration |
| Local Playwright admin login | PASS | `ALLOW_DEV_LOGIN=true` only |
| Authenticated admin page | PASS | Headed Chrome smoke passed |
| Sports event data non-empty after seed | PASS | DB counts and sports UI verified |
| Sports UI displays seeded events | PASS | World Cup page displayed `France vs Argentina` |

The first custom Chrome run used `networkidle` and timed out on market detail because the live market page keeps network activity open. The rerun used `domcontentloaded` and passed.

## Screenshots And Artifacts

Playwright generated failure artifacts for the known `npm run e2e:sports:auth` assertion issue:

- `test-results/sports-authenticated-order-70585-en-sports-market-trading-UI-authenticated/test-failed-1.png`
- `test-results/sports-authenticated-order-70585-en-sports-market-trading-UI-authenticated/video.webm`
- `test-results/sports-authenticated-order-70585-en-sports-market-trading-UI-authenticated/trace.zip`

These artifacts are ignored and were not committed.

## Blocking Issues

- `npm run e2e:sports:auth` needs a focused test fix. The product behavior observed was successful order placement, but the locator assertion is too broad and fails strict mode because two success messages match.

## Non-Blocking Issues

- `TopNav` focused ESLint reports an existing `<img>` warning.
- npm audit warnings remain.
- Prisma config deprecation warning remains.
- Next dev server warns about multiple lockfiles and inferred workspace root.

## Security Notes

- Dev login remains guarded by `ALLOW_DEV_LOGIN=true`.
- Unit guard confirms dev login is disabled when `NODE_ENV=production`.
- No production deployment was performed.
- No real-money deposit, withdrawal, wallet custody, or payment logic was enabled.
- Generated Playwright storage state was removed and remains gitignored.

## Recommended Next Task

Create a focused branch to fix the authenticated sports e2e locator assertion, then rerun `npm run e2e:sports:auth`.
