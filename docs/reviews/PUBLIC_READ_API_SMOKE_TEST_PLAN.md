# Public Read API Smoke Test Plan

Task id: TST-006
Assigned subagents: TestingAgent, BackendAgent, SecurityAgent
Risk level: Medium
Status: Test planning only

## Purpose

The sports-first MVP depends on stable public read APIs for markets, events, sports discovery, quotes, orderbook display, and trade tape. This plan defines a future smoke-test suite for those read APIs without adding tests or changing route behavior now.

This document does not modify source code, tests, Prisma, auth, wallet, ledger, matching, settlement, admin routes, bot behavior, deployment, or production settings.

## Source Documents

This plan follows:

- `docs/reviews/API_ROUTE_OWNERSHIP_INVENTORY.md`
- `docs/reviews/MARKET_READ_API_CLEANUP_PLAN.md`
- `docs/reviews/PUBLIC_READ_API_CONTRACT_DRAFT.md`
- `docs/reviews/PUBLIC_API_NO_LEAK_TEST_PLAN.md`
- `docs/reviews/MVP_INFORMATION_ARCHITECTURE.md`

## Test Goal

Future smoke tests should prove that public read routes:

- Return successful responses for seeded public data.
- Return safe empty states when no data exists.
- Do not require admin or production credentials.
- Do not mutate database state.
- Do not expose admin, bot, wallet, ledger, credential, or user-specific financial internals.
- Support the frontend routes required for MVP market and sports discovery.

## Route Groups

### Health And Taxonomy

Routes:

- `/api/health`
- `/api/categories`
- `/api/tags`

Future assertions:

- Route responds successfully.
- Response shape is parseable JSON where applicable.
- No secret/config internals are exposed.

### Market Discovery

Routes:

- `/api/markets`
- `/api/markets/[id]`

Future assertions:

- Market list returns an array or documented empty shape.
- Market detail returns a documented market detail shape for seeded data.
- Missing market returns a safe 404 or documented unavailable response.
- No user-specific balances, orders, positions, or ledger fields appear.

### Event And Sports Discovery

Routes:

- `/api/events`
- `/api/events/[slug]`
- `/api/events/[slug]/markets`
- `/api/events/[slug]/grouped-markets`
- `/api/sports`
- `/api/sports/soccer/events`
- `/api/sports/soccer/world-cup/events`

Future assertions:

- Event list and detail routes support the sports-first IA.
- World Cup route returns seeded events or documented empty state.
- Grouped market responses are stable enough for UI sections.
- No admin-only event metadata leaks.

### Market Display Reads

Routes:

- `/api/markets/[id]/chart`
- `/api/markets/[id]/quote`
- `/api/markets/[id]/trades`
- `/api/orderbook/[marketId]/book`
- `/api/orderbook/[marketId]/trades`

Future assertions:

- Empty chart, trade tape, and orderbook states are valid.
- Quote response is display-only and does not promise execution.
- Orderbook read response does not expose order owners.
- Trade tape does not expose user identity or ledger internals.

### Reference Boundary

Route:

- `/api/markets/[id]/reference`

Future assertions:

- Public response includes display-safe reference context only.
- Bot ids, credential ids, import job ids, readiness internals, and risk-limit internals are absent.
- Stale/unavailable states are represented safely.

## Fixture Requirements

Future smoke tests should use safe seeded or mocked data:

- One public sports event.
- One public market attached to that event.
- One market with no trades.
- One market with an empty orderbook.
- One missing market id.
- One missing event slug.
- Optional reference-associated market with internal fields excluded.

The suite must not require:

- Production database access.
- Production credentials.
- External chain calls.
- Live bot trading.
- Real deposits or withdrawals.
- Admin mutation privileges.

## Test Style Recommendation

Preferred first implementation:

- Focused Jest route tests if route handlers can be exercised safely with mocked or seeded test DB state.
- Small allowlist assertions for response shape.
- Negative assertions from `PUBLIC_API_NO_LEAK_TEST_PLAN.md`.

Defer:

- Playwright browser coverage for these APIs unless paired with user-facing page smoke.
- Live external reference API calls.
- Broad seed/reset commands unless explicitly classified safe.

## Validation For Future Test PR

Future test-only implementation should run:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

If a focused test command is added, document it in the PR body. Do not add unstable Playwright or broad suites to required CI without a separate CI decision.

## Auto-Merge Guidance

This planning document may be auto-merged if docs-only checks pass.

Future test implementation should not be auto-merged unless:

- It changes tests only.
- It does not alter product/runtime behavior.
- It does not require production credentials or live services.
- Standard validation passes.
- SecurityAgent review confirms no sensitive data exposure.

## Non-Goals

This plan does not:

- Add tests.
- Change API contracts.
- Change route behavior.
- Change auth, wallet, ledger, matching, settlement, admin, bot, deployment, Prisma, migration, or production behavior.
- Run live services or external APIs.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```
