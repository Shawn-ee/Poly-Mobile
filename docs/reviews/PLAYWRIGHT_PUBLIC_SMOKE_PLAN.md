# Playwright Public Smoke Plan

This TST-002 plan defines the public-route smoke coverage POLY should add before UI redesign. It is docs-only and does not add or run Playwright tests.

## Goal

Create a stable public smoke baseline for the sports-first MVP routes so future FrontendAgent UI changes can be validated without production credentials, real wallet actions, or live services.

## Scope

Target public and beta-safe routes:

- `/`
- `/markets`
- `/events`
- `/sports`
- `/sports/soccer`
- `/sports/soccer/world-cup`
- `/login`
- `/portfolio`
- `/wallet`

The first implementation PR should prefer read-only route rendering and empty-state checks. Authenticated flows should use test-only local auth helpers only when explicitly scoped.

## Out Of Scope

Do not include:

- Real deposits.
- Real withdrawals.
- Wallet private-key flows.
- Live bot trading.
- Production credentials.
- Production deployment smoke.
- Admin mutation flows.
- Order placement or cancel flows unless a later trading smoke task explicitly authorizes it.

## Required Test Environment

Use local/test-only settings:

```sh
NODE_ENV=test
APP_ENV=development
NEXTAUTH_URL=http://127.0.0.1:3000
NEXTAUTH_SECRET=local-test-secret
ALLOW_DEV_LOGIN=true
```

Do not use production credentials, production databases, production RPC URLs, real wallets, or live bot credentials.

## Route Assertions

| Route | Minimum assertion | Follow-up assertion |
|---|---|---|
| `/` | Page renders and exposes sports-first browse CTA. | Featured events or safe empty state appears. |
| `/markets` | Page renders market browser or safe empty state. | Filters do not overflow on mobile. |
| `/events` | Page renders event list or safe empty state. | Event card links are visible when data exists. |
| `/sports` | Page renders sports discovery surface. | Soccer/World Cup navigation is visible. |
| `/sports/soccer` | Page renders soccer event discovery or safe empty state. | No demo-only copy blocks navigation. |
| `/sports/soccer/world-cup` | Page renders World Cup route or safe empty state. | Tournament/event cards are visible when seeded. |
| `/login` | Page renders sign-in entry. | Failed/unauthenticated state does not crash. |
| `/portfolio` | Unauthenticated or empty account state is safe. | Authenticated test state can be added later. |
| `/wallet` | Beta-safe wallet state renders without enabling funding. | Deposit/withdraw actions are disabled or clearly gated. |

## Mobile Coverage

The first smoke implementation should run at least:

- Desktop viewport.
- Mobile viewport around 390px wide.

Mobile smoke should check that primary CTAs, route headings, and empty states do not overlap or require horizontal scrolling.

## Suggested Implementation Shape

Future TestingAgent PR:

- Add a public smoke spec under `tests/e2e/`.
- Reuse existing Playwright config and helpers where possible.
- Start with unauthenticated public route coverage.
- Add authenticated local-only coverage in a separate PR if needed.
- Avoid snapshot assertions until layout is more stable.

## Validation For Future Test PR

Future test implementation should run:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

And the selected Playwright command, for example:

```sh
npm run e2e
```

or a focused new public smoke command if one is added later.

## CI Promotion Criteria

Do not add Playwright to required dev/main CI until:

- Public smoke passes repeatedly on a clean local environment.
- Tests do not depend on production credentials or live services.
- Empty states are deterministic.
- Authenticated paths use test-only auth.
- Runtime is acceptable for PR feedback.
- Failures are actionable.

## Required Review Routing

- TestingAgent owns the future test implementation.
- SecurityAgent review is required if auth, wallet, admin, or environment assumptions change.
- LedgerWalletReviewerAgent review is required if wallet/funding copy or balance assertions could imply real money readiness.
- FrontendAgent should consume smoke results before UI redesign.

## Non-Goals

This plan does not:

- Add tests.
- Change Playwright config.
- Change package scripts.
- Change CI.
- Change product code.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, bot, Prisma, or deployment behavior.
