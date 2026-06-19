# Public API Test Implementation Queue

Task id: DOC-023
Assigned subagents: TestingAgent, SecurityAgent, BackendAgent
Risk level: Low
Status: Docs-only implementation queue

## Purpose

This queue orders future public API test tasks after the recent no-leak and contract decision work.

It does not add tests, change package scripts, change CI, change routes, or alter production behavior.

## Current Test Evidence

Current targeted no-leak tests:

- `src/__tests__/public.taxonomy.no-leak.test.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `src/__tests__/public.sports.no-leak.test.ts`
- `src/__tests__/public.market-list.no-leak.test.ts`
- `src/__tests__/public.event-markets.no-leak.test.ts`
- `src/__tests__/public.market-chart.no-leak.test.ts`

## Recommended Next Test Tasks

| Priority | Task | Risk | Auto-merge candidate | Notes |
|---:|---|---:|---|---|
| 1 | Add allowlist response-shape tests for taxonomy reads. | Low | Yes | Mocked/local only. |
| 2 | Add allowlist response-shape tests for sports event reads. | Low | Yes | Based on existing sports no-leak fixtures. |
| 3 | Add allowlist response-shape tests for event market reads. | Low/Medium | Yes if mocked and read-only | Avoid grouped service internals. |
| 4 | Add empty-state chart route tests. | Low | Yes | Extend mocked chart test only. |
| 5 | Add market detail current-gap test. | Medium | No by default | Should document current extra-field gap before cleanup. |
| 6 | Add market detail target-contract tests. | Medium | No by default | Pair with reviewed implementation cleanup. |
| 7 | Add public liquidity summary tests. | High by topic | No | Wait for implementation and specialist review. |
| 8 | Add quote/orderbook/trade-tape allowlist tests. | Medium/High | No by default | Trading-adjacent; use scope doc first. |

## Auto-Merge Eligible Test Pattern

A future test-only PR can be auto-merged only when:

- It changes only `src/__tests__/`, `tests/`, or safe test docs.
- It uses mocks and local fixtures.
- It covers public/read-only/no-leak or response-shape behavior.
- It does not require real DB, secrets, external services, production data, credentials, chain RPC, payment/custody, or wallet keys.
- Full validation passes.
- ReviewerAgent and SecurityAgent self-review pass.
- Specialist reviewers pass if needed.

## Not Auto-Mergeable By Default

Do not auto-merge tests involving:

- market detail behavior cleanup
- public/admin reference route split
- quote/orderbook/trade-tape semantics
- admin auth
- wallet/deposit/withdrawal
- ledger/balance/reconciliation
- matching/settlement/orders/fills/trades/positions
- bot live/dry-run runtime behavior
- deployment or production config

## Validation For Future Test PRs

Use:

```bash
git diff --check
npx jest --runInBand --detectOpenHandles <new-or-updated-test-file>
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

## Non-Goals

This queue does not:

- Add tests.
- Change CI.
- Change package scripts.
- Change route behavior.
- Change product/runtime code.
- Change wallet, ledger, trading, admin auth, bots, deployment, Prisma, migrations, or production settings.

## Validation For This Queue

This queue is docs-only. Validation for this PR should be:

```bash
git diff --check
```
