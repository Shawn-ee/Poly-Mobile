# Market Read API Cleanup Plan

Task id: API-003
Assigned subagents: BackendAgent, RepoInspectorAgent, DocsAgent
Risk level: Medium
Status: Planning only

## Purpose

The API ownership inventory identifies stable public discovery routes as a key dependency for the sports-first MVP. This plan defines a safe cleanup direction for read-only market, event, sports, taxonomy, and public price-display APIs without changing any route implementation.

This document does not change API code, route behavior, auth, wallet, ledger, matching, settlement, admin operations, bot behavior, Prisma schema, migrations, or deployment settings.

## Cleanup Goals

Future read API cleanup should make it easy for FrontendAgent and TestingAgent work to rely on stable, documented response contracts for:

- Public market discovery.
- Sports-first event browsing.
- Event detail and grouped-market views.
- Market detail pages.
- Market chart, quote, trade tape, and orderbook display.
- Public taxonomy such as categories and tags.

The cleanup should avoid mixing public read models with account, admin, wallet, trading, settlement, or bot-control behavior.

## In-Scope Read API Groups

### Public Health And Taxonomy

Routes:

- `/api/health`
- `/api/categories`
- `/api/tags`

Target ownership:

- BackendAgent owns response shape and server behavior.
- TestingAgent owns basic smoke coverage.

Cleanup direction:

- Keep these routes stable and public.
- Ensure empty states are represented cleanly.
- Avoid coupling taxonomy reads to admin-only metadata.

### Market Discovery

Routes:

- `/api/markets`
- `/api/markets/[id]`

Target ownership:

- BackendAgent owns canonical market read shape.
- FrontendAgent consumes the shape for discovery and market detail UI.

Cleanup direction:

- Define one canonical market summary shape for cards and lists.
- Define one canonical market detail shape for detail pages.
- Keep status, event association, outcomes, pricing summary, liquidity summary, category, tags, and timestamps clearly named.
- Avoid leaking internal admin, bot, settlement, or private operational fields to public clients.

### Market Display Data

Routes:

- `/api/markets/[id]/chart`
- `/api/markets/[id]/quote`
- `/api/markets/[id]/trades`
- `/api/orderbook/[marketId]/book`
- `/api/orderbook/[marketId]/trades`

Target ownership:

- BackendAgent owns read response contracts.
- LedgerWalletReviewerAgent reviews any interpretation that could imply balances, fills, settlement, or position changes.

Cleanup direction:

- Treat these as display reads only.
- Document stale-data behavior and empty states.
- Keep trade tape and orderbook data separate from order placement/cancel behavior.
- Avoid implying that reference prices or bot liquidity guarantee execution.

### Event And Sports Discovery

Routes:

- `/api/events`
- `/api/events/[slug]`
- `/api/events/[slug]/markets`
- `/api/events/[slug]/grouped-markets`
- `/api/sports`
- `/api/sports/soccer/events`
- `/api/sports/soccer/world-cup/events`

Target ownership:

- BackendAgent owns event/sports read contracts.
- FrontendAgent owns route consumption and page hierarchy.
- TestingAgent owns public smoke coverage.

Cleanup direction:

- Prefer event-first sports grouping for MVP.
- Keep event summaries, event detail, grouped market lists, and sports navigation distinct.
- Document whether a route returns all events, active events, only sports events, or World Cup-specific events.
- Preserve clear loading, empty, and error behavior for frontend consumers.

## Explicitly Out Of Scope

The following routes and behaviors are not part of API-003 cleanup implementation:

- Order placement, cancellation, matching, fills, minting, positions, or settlement.
- `/api/orderbook/[marketId]/orders*`
- `/api/orderbook/place`
- `/api/orderbook/cancel`
- `/api/orders*`
- `/api/fills`
- `/api/markets/[id]/positions`
- `/api/markets/[id]/resolve`
- Account balances, ledger, positions, portfolio PnL, or API keys.
- Wallet, deposit, withdrawal, faucet, external balance, or funding routes.
- Admin routes.
- Bot/reference market mutation routes.
- Pool/private-pool betting, joining, cancellation, or resolution routes.
- Auth/session implementation.
- Stream behavior changes.

Any future task touching those areas must be separately scoped and reviewed under the high-risk routing rules.

## Proposed Canonical Read Model Boundaries

### Market Summary

Used by:

- `/api/markets`
- Event market lists.
- Sports market cards.

Suggested future fields:

- Market id and slug if available.
- Title/question.
- Status.
- Event id/slug/title when grouped.
- Outcome labels.
- Current displayed prices or probabilities.
- Liquidity/display volume summary.
- Category and tags.
- Start/end/resolve timing where applicable.

### Market Detail

Used by:

- `/api/markets/[id]`
- Market detail pages.

Suggested future fields:

- Market summary fields.
- Full description and rules.
- Outcomes.
- Status and resolution state.
- Related event metadata.
- Display-safe price, volume, and liquidity fields.
- Links or ids for chart, quote, trade tape, and orderbook reads.

### Event Summary

Used by:

- `/api/events`
- Sports route listings.

Suggested future fields:

- Event id and slug.
- Title.
- Sport/category.
- Start time.
- Status.
- Number of active markets.
- Featured market summary when useful.

### Event Detail

Used by:

- `/api/events/[slug]`
- `/api/events/[slug]/markets`
- `/api/events/[slug]/grouped-markets`

Suggested future fields:

- Event summary fields.
- Grouped market sections.
- Status, tournament, team, or match metadata where applicable.
- Display-safe market summaries.

## Testing Plan For Future Implementation

Before any code cleanup PR:

- Add or update docs for exact response contracts.
- Add public-route smoke tests for routes consumed by MVP pages.
- Add fixture-backed tests for empty event, no-market, and resolved-market states.
- Keep trading, wallet, account finance, admin, and bot mutation tests in separate PRs.

Suggested validation for future code PRs:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

## Acceptance Criteria For Future Cleanup

A future implementation PR should be accepted only if:

- It changes public read routes or their tests only.
- It does not alter financial, trading, wallet, admin, bot, Prisma, migration, or deployment behavior.
- It includes response-shape tests or public smoke coverage.
- It documents any response field rename or compatibility concern.
- It preserves beta-safe language around liquidity, probabilities, and reference data.

## Recommended Follow-Up Tasks

1. `API-004 - Public Read API Contract Draft`
   - Define exact response examples for market, event, and sports reads.
   - Docs-only first.
   - Risk: Medium.

2. `TST-006 - Public Read API Smoke Tests`
   - Add focused tests for public read routes after contracts are approved.
   - Test-only; no route behavior changes.
   - Risk: Medium.

3. `FE-006 - Market Card Data Dependency Map`
   - Map MVP UI cards to public read API fields.
   - Docs-only first.
   - Risk: Low.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```
