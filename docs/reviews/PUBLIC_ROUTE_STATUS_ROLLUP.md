# Public Route Status Rollup

Date: 2026-06-18

Purpose: summarize the current public/read-only route contract, no-leak, and response-shape evidence after the recent public API test wave.

This is a planning document only. It does not promote tests to CI, change route behavior, or approve high-risk implementation.

## Current Evidence

| Route group | Current evidence | Status | Notes |
| --- | --- | --- | --- |
| Taxonomy | `src/__tests__/public.taxonomy.no-leak.test.ts` | Partial test coverage | Covers `/api/categories` and `/api/tags` no-leak and response-shape checks with mocked Prisma. |
| Events | `src/__tests__/public.events.no-leak.test.ts` | Partial test coverage | Covers `/api/events` and `/api/events/[slug]` no-leak and response-shape checks with mocked Prisma. |
| Sports | `src/__tests__/public.sports.no-leak.test.ts` | Partial test coverage | Covers sports summary and soccer/world-cup event routes with mocked Prisma. |
| Event markets | `src/__tests__/public.event-markets.no-leak.test.ts` | Partial test coverage | Covers event market list and grouped event markets with mocked services. |
| Market chart | `src/__tests__/public.market-chart.no-leak.test.ts` | Partial test coverage | Covers success, empty-series, and hidden-market guard paths with mocks. |
| Market list | `src/__tests__/public.market-list.no-leak.test.ts` | Initial test coverage | Covers public filter/query shape and response-shape no-leak for `/api/markets`. |
| Market detail | `docs/reviews/MARKET_DETAIL_CLEANUP_IMPLEMENTATION_PLAN.md` | Planned | Needs implementation and tests later; not auto-mergeable by default. |
| Reference/liquidity routes | `docs/reviews/REFERENCE_LIQUIDITY_PUBLIC_ADMIN_SPLIT_DECISION.md` and `docs/reviews/REFERENCE_LIQUIDITY_SPLIT_IMPLEMENTATION_PLAN.md` | Planned | Public/admin split remains docs-only. Implementation requires specialist review. |

## Coverage Strengths

- Recent tests are local and mocked.
- Tests do not require production data, real databases, secrets, credentials, chain RPC, or external services.
- Tests focus on public/read-only route envelopes, key allowlists, and no-leak checks.
- No route implementation, Prisma schema, workflow, package script, or production behavior changed.

## Remaining Gaps

- Public no-leak tests are not yet part of `npm run test:ci`.
- Market detail remains a known cleanup and contract-stabilization area.
- Reference/liquidity public/admin separation remains planning-only.
- Some tests use representative mocked payloads and do not prove production database contents.
- Response-shape allowlists should be revisited after route contracts are frozen.
- CI lane promotion still needs a separate package/workflow decision and must not happen implicitly.

## Recommended Next Steps

1. Add a docs-only public no-leak CI promotion readiness note.
2. Add a docs-only market detail target-contract checklist.
3. Add market detail tests only after the target contract is confirmed.
4. Keep reference/liquidity implementation blocked until public/admin split is approved.
5. Avoid adding admin, wallet, ledger, trading, bot, or deployment tests to auto-merge lanes without explicit human review.

## Auto-Merge Guidance

Safe candidates:

- Docs-only route status, contract, checklist, and planning updates.
- Low-risk mocked public/read-only tests under `src/__tests__/`.

Not auto-mergeable:

- Route implementation changes.
- `package.json`, GitHub workflow, or script changes.
- Admin auth tests or implementation.
- Wallet, ledger, deposit, withdrawal, matching, settlement, order, fill, trade, or position tests.
- Bot runtime, liquidity, deployment, Prisma, migration, or production config changes.

## Decision

Continue public route stabilization through docs-only plans and low-risk mocked tests. Do not promote the public no-leak tests into required CI until a separate CI-lane decision PR is reviewed.
