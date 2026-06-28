# Sports Homepage Implementation Readiness Checklist

Task id: FE-005
Assigned subagents: PlannerAgent, FrontendAgent, TestingAgent
Risk level: Medium
Status: Docs-only implementation readiness checklist

## Purpose

This checklist defines what must be true before a FrontendAgent changes the sports homepage or sports discovery UI. It does not modify UI code, routes, APIs, tests, or product behavior.

## Required Inputs

Before implementation:

- MVP information architecture is accepted.
- Sports-first route hierarchy is clear.
- Public read API contract draft exists.
- Public route smoke plan exists.
- Event-first grouping decision is accepted.
- Wallet/funding CTAs are beta-safe or absent.

## UX Requirements

Future sports homepage work should:

- Prioritize `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup`.
- Show event-first browsing.
- Make market status obvious.
- Keep one primary CTA per section.
- Avoid admin, bot, funding, or internal terms.
- Include loading, empty, error, and no-market states.
- Work on mobile first.

## Data Requirements

Future implementation should use display-safe public reads only:

- Sports events.
- Event summaries.
- Market summaries.
- Display prices/probabilities.
- Status and timing fields.

It should not require:

- Account balance.
- Wallet/deposit/withdrawal data.
- Admin data.
- Bot internals.
- Order placement/cancel APIs.

## Test Requirements

Future implementation should include:

- Public smoke coverage for sports landing.
- Empty state coverage.
- Mobile screenshot or browser verification.
- No secret/admin/bot internal copy checks.
- Standard validation.

## Forbidden Scope

Future sports homepage implementation must not change:

- Trading APIs.
- Wallet/funding behavior.
- Ledger, matching, settlement, orders, fills, positions.
- Admin auth.
- Bot live trading.
- Prisma schema or migrations.
- Deployment.

## Validation For Future Implementation

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

## Validation For This Checklist

This checklist is docs-only. Validation for this PR should be:

```bash
git diff --check
```
