# UI Replacement Readiness Rollup

Task id: DOC-045

Phase: Phase D - UI readiness and display-only implementation

Assigned subagents: PlannerAgent, FrontendAgent, SecurityAgent

Risk level: Medium by UI replacement topic, docs-only in this task

## Purpose

This rollup summarizes which PR #25 replacement UI work is ready for future scoped PRs and which surfaces remain blocked or human-reviewed.

It does not modify PR #25, UI code, product code, backend logic, wallet/deposit/withdrawal behavior, admin behavior, private pool behavior, trading behavior, Prisma, deployment, secrets, or production settings.

## Source Documents

- `docs/reviews/PR25_UI_REVIEW_CHECKLIST.md`
- `docs/reviews/PR25_SPLIT_MERGE_DECISION.md`
- `docs/reviews/PR25_ADMIN_FUNDING_UI_REVIEW_PACKET.md`
- `docs/reviews/PRIVATE_POOL_LIST_UI_REPLACEMENT_SCOPE.md`
- `docs/reviews/ADMIN_FUNDING_UI_SCREENSHOT_EVIDENCE_REQUIREMENTS.md`
- `docs/reviews/MVP_INFORMATION_ARCHITECTURE.md`

## Current Decision

PR #25 itself remains not auto-mergeable.

Future UI work should use smaller replacement PRs, each with one route or surface group, explicit validation, screenshots or visual QA when practical, and a PR body that proves display-only scope.

## Replacement Readiness Matrix

| Surface | Readiness | Future branch | Auto-merge default | Reason |
|---|---|---|---|---|
| `/my-pools` private pool list | Ready for a small scoped UI PR | `agent/fe-001-private-pool-list-display-polish` | No if action semantics touched | Scope exists and page is less funding-adjacent, but includes cancel action and private market state. |
| Pool detail shell | Needs docs-only scope first | `agent/fe-002-pool-detail-shell-display-polish` | No by default | Shared component includes bet/cancel/resolve/invite surfaces. |
| `/admin/deposits` | Needs human-reviewed scope and screenshot evidence | `agent/fe-003-admin-deposits-display-polish` | No | Funding-adjacent admin operation surface. |
| `/admin/withdrawals` | Needs human-reviewed scope and screenshot evidence | `agent/fe-004-admin-withdrawals-display-polish` | No | Critical custody/withdrawal operation surface. |
| `/wallet` | Needs human-reviewed scope and screenshot evidence | `agent/fe-005-wallet-display-polish` | No | Funding/account balance surface; copy must stay beta-safe. |

## First UI PR Recommendation

The safest first replacement UI PR is `/my-pools` private pool list display polish.

Required limits:

- Touch only `src/app/my-pools/page.tsx`.
- Preserve `/api/pool-markets/mine`.
- Preserve `POST /api/pool-markets/[id]/cancel`.
- Preserve confirmation before cancellation.
- Preserve reload-after-cancel.
- Preserve owner/member and status semantics.
- Make only layout, typography, spacing, labels, and empty/loading/error presentation changes.
- Run full validation.
- Include visual QA or screenshot summary when practical.

If the implementation changes handlers, API calls, request payloads, action availability, or confirmation behavior, leave the PR open for human review.

## Surfaces Requiring More Docs Before UI Code

Before UI implementation, create scoped docs for:

- pool detail shell
- admin deposits
- admin withdrawals
- wallet

Those docs should list current handlers, API calls, mutation actions, required validation, screenshot requirements, and non-auto-merge boundaries.

## Human-Review Rules

Human review remains required for:

- wallet or funding copy changes
- admin deposit or withdrawal UI changes
- pool bet, cancel, resolve, or invite action presentation changes that could alter user interpretation
- any changed API call, event handler, payload, route, auth assumption, or disabled/busy state
- any screenshot evidence involving sensitive values or redaction

## Validation Required For Future UI PRs

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

Run focused visual QA for the changed route when practical and safe.

## Non-Goals

This rollup does not:

- implement UI changes
- close or merge PR #25
- change API behavior
- change wallet, deposit, withdrawal, ledger, matching, settlement, trading, admin auth, bot, deployment, Prisma, migration, or production behavior
- authorize public beta

## Decision

Proceed with `/my-pools` only if the next UI task stays small and display-only. Otherwise continue docs-only scope work and leave implementation PRs open for human review.
