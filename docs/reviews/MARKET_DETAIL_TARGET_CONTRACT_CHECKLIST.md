# Market Detail Target Contract Checklist

Task id: DOC-028

Phase: Phase B - Public API safety and tests

Assigned subagents: PlannerAgent, BackendAgent, TestingAgent, SecurityAgent

Risk level: Medium by API contract topic, docs-only in this task

## Purpose

This checklist turns the market detail public contract decision into a concrete review gate for future `/api/markets/[id]` tests and implementation.

This task does not change route behavior, tests, auth, visibility, Prisma, wallet, ledger, matching, settlement, trading, admin auth, bots, deployment, package scripts, workflows, or production settings.

## Source Documents

- `docs/reviews/MARKET_DETAIL_PUBLIC_BOUNDARY_REVIEW.md`
- `docs/reviews/MARKET_DETAIL_PUBLIC_CONTRACT_DECISION.md`
- `docs/reviews/MARKET_DETAIL_CLEANUP_IMPLEMENTATION_PLAN.md`
- `docs/reviews/PUBLIC_ROUTE_STATUS_ROLLUP.md`

## Target Public Response Checklist

A future market detail public response should be considered display-safe only if it satisfies all applicable checks:

- Returns a single top-level `market` object or a clearly documented equivalent.
- Returns only display-safe market fields.
- Preserves missing-market `404` behavior.
- Preserves auth-aware visibility guard behavior.
- Separates admin/internal diagnostics from normal public display.
- Does not require anonymous users to understand owner, import, market-making, or operational fields.
- Does not expose raw internal metadata unless reviewed and allowlisted.
- Does not expose fields that imply funding, custody, balance, or settlement state.

## Preferred Public Market Fields

Future tests should prefer this allowlist for normal user display:

- `id`
- `slug` when available
- `title`
- `description`
- `status`
- `resolveTime`
- `createdAt`
- `event`
- `category`
- `tags`
- `outcomes`
- `pricesByOutcome`
- `prices`
- `type`
- `marketType`
- `kind`
- `mechanism`
- display-safe `visibility` only when needed by frontend routing

## Preferred Public Outcome Fields

Future tests should prefer this allowlist for outcome display:

- `id`
- `name`
- `label`
- `code`
- `displayOrder`
- `status`
- `isTradable`
- `price`
- `bestBid`
- `bestAsk`
- `spread`

## Fields Requiring Explicit Approval

Do not bless these as normal public contract fields without a future reviewed decision:

- `ownerId`
- `isListed`
- `isCanceled`
- `betCloseTime`
- `externalMarketId`
- `conditionId`
- `referenceSource`
- `externalSlug`
- `importStatus`
- `referenceOnly`
- `tradable`
- `mmEnabled`
- `referenceSummary`
- outcome `referenceTokenId`
- outcome `referenceOutcomeLabel`
- raw `metadata`

## Future Test Checklist

Future market detail tests should:

- Mock `@/lib/auth`.
- Mock `@/lib/marketAccess`.
- Mock `@/lib/marketGuards`.
- Mock Prisma reads.
- Mock pricing/read-model helpers.
- Assert public listed market success.
- Assert missing market `404`.
- Assert hidden/private market guard rejection.
- Assert forbidden sensitive keys are absent.
- Assert owner/reference/market-making fields are not treated as required public fields.

## Future Implementation Checklist

Future implementation should:

- Keep behavior changes separate from docs-only decisions.
- Avoid changing auth/visibility semantics unless explicitly approved.
- Prefer a display-safe serializer or route wrapper if current read model is too broad.
- Keep admin/internal diagnostics on an admin/internal route or explicitly documented path.
- Add tests before or with implementation.
- Run full validation.
- Leave the PR open for human review unless a later policy explicitly permits auto-merge.

## Non-Auto-Merge Boundary

Future PRs are not auto-mergeable by default if they:

- Change `src/app/api/markets/[id]/route.ts`.
- Change `src/server/services/marketReadModel.ts`.
- Change public market detail response shape.
- Change auth or visibility behavior.
- Change reference, liquidity, market-making, owner, listing, or import field exposure.
- Touch wallet, ledger, matching, settlement, order, fill, trade, position, admin auth, bot, Prisma, deployment, package, workflow, or script files.

## Human Review Required

Human review is required before:

- Removing current response fields.
- Renaming or relocating reference fields.
- Splitting public and admin/internal market detail routes.
- Changing UI dependencies on market detail fields.
- Adding market detail tests that intentionally assert internal fields.

## Decision

Market detail public contract stabilization should continue through docs-only checklist work first. Tests may document current gaps, but cleanup implementation must remain human-reviewed unless a later explicit policy allows otherwise.
