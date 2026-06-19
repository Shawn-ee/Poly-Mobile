# Public Events, Sports, And Market List Contract Decision

Task id: DOC-017
Assigned subagents: PlannerAgent, BackendAgent, TestingAgent, SecurityAgent
Risk level: Low
Status: Docs-only contract decision

## Purpose

This decision records the target public contract for the low-risk public read route groups that already have targeted no-leak tests:

- taxonomy reads
- event reads
- sports reads
- market list reads
- event market reads

This document does not change route behavior, tests, CI, package scripts, product code, Prisma, wallet, ledger, matching, settlement, admin auth, bots, deployment, or production settings.

## Decision

These route groups are appropriate for public read contracts and future low-risk no-leak test expansion when they remain:

- read-only
- public discovery oriented
- free of user-specific account state
- free of admin-only diagnostics
- free of wallet, ledger, settlement, bot live-control, and deployment behavior

## Route Groups

### Taxonomy Reads

Routes:

- `/api/categories`
- `/api/tags`

Target contract:

- active public categories and tags
- display names
- slugs
- grouping/order data where needed

Do not expose:

- admin notes
- credential ids
- operational job ids
- hidden/internal taxonomy controls

### Event Reads

Routes:

- `/api/events`
- `/api/events/[slug]`
- `/api/events/[slug]/markets`
- `/api/events/[slug]/grouped-markets`

Target contract:

- event id and slug
- title and description
- category/sport/league metadata
- start time and status
- public market counts
- display-safe market summaries
- grouped market display structure

Do not expose:

- admin-only event metadata
- hidden markets
- bot/reference diagnostics
- user-specific positions or balances
- settlement payout state beyond display status

### Sports Reads

Routes:

- `/api/sports`
- `/api/sports/soccer/events`
- `/api/sports/soccer/world-cup/events`

Target contract:

- sport key
- event count
- soccer/world-cup event summaries
- public sports-first browse metadata

Do not expose:

- admin curation state
- source import diagnostics
- credentials or external API internals

### Market List Reads

Routes:

- `/api/markets`

Target contract:

- public listed market summaries
- event metadata
- category and tags
- outcomes and display prices
- display-safe liquidity summary when available

Do not expose:

- owner ids
- bot ids
- market-making diagnostics
- raw risk limits
- ledger or balance state
- user-specific order or position state

## Existing Targeted Evidence

Current targeted tests:

- `src/__tests__/public.taxonomy.no-leak.test.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `src/__tests__/public.sports.no-leak.test.ts`
- `src/__tests__/public.market-list.no-leak.test.ts`
- `src/__tests__/public.event-markets.no-leak.test.ts`

These tests remain targeted evidence and are not promoted to required CI by this decision.

## Future Test Expansion Rules

Future tests for these route groups may remain low-risk when they:

- use mocked Prisma and service dependencies
- use local fixtures only
- avoid real DB, secrets, external APIs, chain RPC, production data, and credentials
- assert no forbidden sensitive keys
- avoid changing route behavior in the same PR

If a future test reveals a contract gap, document the finding and use a separate implementation PR.

## Review Requirements

Future docs/test PRs for these route groups require:

- TestingAgent review for fixture and mock isolation.
- SecurityAgent review for no-leak coverage.
- BackendAgent review if asserting response-shape details.
- BotAgent review if reference/liquidity fields are asserted.
- LedgerWalletReviewerAgent review if any test touches positions, orders, balances, matching, settlement, collateral, wallet, deposits, or withdrawals.

## Non-Goals

This decision does not:

- Add tests.
- Promote tests to CI.
- Change package scripts.
- Change workflows.
- Change route behavior.
- Change public response shapes.
- Change product, wallet, ledger, matching, settlement, admin auth, bots, deployment, Prisma, migrations, or production behavior.

## Validation For This Decision

This decision is docs-only. Validation for this PR should be:

```bash
git diff --check
```
