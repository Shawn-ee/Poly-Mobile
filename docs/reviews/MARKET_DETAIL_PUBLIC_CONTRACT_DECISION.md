# Market Detail Public Contract Decision

Task id: DOC-013
Assigned subagents: PlannerAgent, BackendAgent, SecurityAgent, TestingAgent
Risk level: Medium
Status: Docs-only contract decision proposal

## Purpose

This decision proposal defines the target MVP public contract for `/api/markets/[id]` so future tests and UI work do not accidentally encode internal fields as normal public product behavior.

This document does not change `/api/markets/[id]`, route behavior, auth behavior, market visibility behavior, product code, tests, Prisma, wallet, ledger, matching, settlement, bots, deployment, or production settings.

## Decision

The MVP target for `/api/markets/[id]` should be an auth-aware market detail read that returns a display-safe market contract.

It should support:

- Anonymous reads for public/listed markets.
- Auth-aware visibility for private, hidden, or internal markets.
- Display-safe market details for normal users.
- Separate admin/internal diagnostics for owner, reference, market-making, import, and operational fields.

The route may remain auth-aware, but the public response contract should not require normal users to understand owner ids, listing flags, bot/reference internals, or market-making readiness fields.

## Target Public Fields

Future public detail tests should prefer an allowlist similar to:

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
- display-safe `visibility` only if needed by frontend routing

For outcomes, target public fields should be limited to display and trading-state fields:

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

## Fields Requiring Separate Approval

Do not treat these as normal public contract fields until a future route cleanup or boundary decision explicitly approves them:

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
- raw `metadata` if it can contain internal or imported data

Some fields may remain technically present in the current route, but future tests should not bless them as desirable MVP public contract fields.

## Auth And Visibility Decision

The market detail route may keep auth-aware visibility checks.

Future tests should distinguish:

- Public listed market: display-safe success response.
- Missing market: 404.
- Hidden/private market: rejected through mocked visibility guard.
- Internal/admin diagnostics: separate route or separate contract.

Do not silently change visibility behavior in the same PR as tests.

## Future Test Strategy

Future tests should be added only after this contract is accepted or revised.

Recommended first test scope:

- Mock `@/lib/auth`.
- Mock `@/lib/marketAccess`.
- Mock `@/lib/marketGuards`.
- Mock Prisma and read-model helpers.
- Assert a public listed fixture returns display-safe fields.
- Assert forbidden sensitive keys are absent.
- Assert owner/reference/market-making fields are not treated as required public fields.

If the current route still returns fields outside the target contract, the test PR should either:

- Document the gap and stop, or
- Be paired with a human-reviewed route cleanup PR.

## Human Review Required

Human review is required before:

- Removing or changing current response fields.
- Splitting public and internal market detail routes.
- Changing auth or visibility behavior.
- Changing reference, liquidity, or market-making field exposure.
- Adding tests that assert internal fields are part of the public contract.

## Acceptance Criteria For Future Implementation

A future implementation or test PR should:

- Keep behavior changes separate from contract documentation.
- Use allowlist-style public response expectations.
- Preserve visibility guard behavior unless explicitly changed.
- Keep reference/bot/market-making diagnostics out of normal user UI.
- Run full validation if any test or code files change.

## Non-Goals

This decision does not:

- Modify `/api/markets/[id]`.
- Add tests.
- Remove fields.
- Change auth.
- Change wallet, ledger, matching, settlement, orders, fills, trades, positions, deposits, withdrawals, admin auth, bots, deployment, Prisma, migrations, or production behavior.

## Validation For This Decision

This decision is docs-only. Validation for this PR should be:

```bash
git diff --check
```
