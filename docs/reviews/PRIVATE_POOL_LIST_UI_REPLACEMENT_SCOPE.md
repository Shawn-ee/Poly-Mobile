# Private Pool List UI Replacement Scope

Task id: DOC-041

Phase: Phase D - UI readiness and display-only implementation

Assigned subagents: PlannerAgent, FrontendAgent, SecurityAgent

Risk level: Medium by private-pool action topic, docs-only in this task

## Purpose

This document scopes a future small replacement PR for the `/my-pools` portion of PR #25.

It does not modify UI code, product code, backend logic, private pool behavior, wallet behavior, trading behavior, admin auth, Prisma, deployment, secrets, or production settings.

## Source Context

Related documents:

- `docs/reviews/PR25_UI_REVIEW_CHECKLIST.md`
- `docs/reviews/PR25_SPLIT_MERGE_DECISION.md`
- `docs/reviews/PR25_ADMIN_FUNDING_UI_REVIEW_PACKET.md`

Current page inspected:

- `src/app/my-pools/page.tsx`

Current page behavior includes:

- client-side loading of `/api/pool-markets/mine`
- owned private market list
- joined private market list
- link to `/create`
- link to `/markets/[id]`
- owner cancel action through `POST /api/pool-markets/[id]/cancel`
- confirmation prompt before cancellation
- reload after cancellation

## Future Replacement PR Goal

Create a small display-only polish PR for `/my-pools` that makes the page clearer and more beta-safe without changing behavior.

Target improvements may include:

- clearer page heading and internal-beta copy
- cleaner owned/joined grouping
- better empty, loading, and error presentation
- more legible status, pot, participant, bet-close, and resolve-time display
- clearer separation between navigation links and owner-only actions
- mobile-safe spacing and wrapping

## Allowed Future UI Scope

A future FrontendAgent PR may touch:

- `src/app/my-pools/page.tsx`
- screenshots or local visual evidence paths only if ignored and not committed
- docs review note for the specific PR if needed

Allowed changes:

- layout, spacing, typography, color, borders, labels, and card structure
- display-only copy improvements
- grouping owned and joined sections more clearly
- loading/error/empty state presentation
- icon usage if an existing icon library is already available
- preserving all existing action handlers and fetch calls

## Forbidden Future UI Scope

Do not change:

- `/api/pool-markets/mine` endpoint path
- cancel endpoint path or HTTP method
- request payloads
- `cancelMarket` semantics
- confirmation prompt requirement
- reload-after-cancel behavior
- owner/member role semantics
- market status logic
- bet, cancel, resolve, invite, or settlement behavior
- wallet, deposit, withdrawal, ledger, matching, settlement, order, fill, trade, or position behavior
- admin auth
- bot behavior
- Prisma schema or migrations
- package scripts, workflows, or executable scripts
- deployment or production config
- secrets or environment files

Do not make copy imply public real-money readiness.

## Review Requirements For Future UI PR

Future `/my-pools` UI PR must include:

- statement that it is display-only
- changed files list
- validation results
- confirmation that fetch endpoints and handlers are unchanged
- confirmation that cancellation still requires confirmation
- confirmation that no wallet/funding/trading/admin/bot/deployment behavior changed
- screenshot or visual smoke summary when practical

## Validation Required For Future UI PR

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

Run focused visual QA for `/my-pools` when practical.

## Auto-Merge Guidance

Do not auto-merge a future `/my-pools` UI PR if it changes:

- action handlers
- API calls
- confirmation behavior
- private pool action semantics
- wallet/funding/trading/admin behavior

Autonomous auto-merge may be considered only if the PR is very small, display-only, full validation passes, and FrontendAgent, ReviewerAgent, and SecurityAgent self-review all pass.

If there is any doubt, leave the PR open for human review.

## Acceptance Criteria

A future `/my-pools` replacement PR is acceptable when:

- normal users can distinguish owned and joined private markets quickly
- empty/loading/error states are clear and beta-safe
- owner actions are visually distinct from normal navigation
- no behavior changes are introduced
- validation passes
- PR body documents display-only scope and safety checks

## Decision

Use this document as the scope for the first possible PR #25 replacement branch:

`agent/fe-001-private-pool-list-display-polish`

Do not modify PR #25 directly.
