# Admin Operations IA Plan

Task id: ADM-002
Assigned subagents: PlannerAgent, SecurityAgent, DeploymentAgent, LedgerWalletReviewerAgent, BotAgent
Risk level: High
Status: Docs-only information architecture plan

## Purpose

Admin tools currently span routine content work, financial operations, bot/reference controls, system readiness, and agent monitoring. This plan defines a safer admin information architecture so future UI work can separate routine operations from high-risk actions.

This document does not change admin UI code, admin auth, API routes, financial operations, bot behavior, deployment, Prisma schema, migrations, or production settings.

## Admin IA Principle

Admin should make risk obvious before action.

Routine content operations should not sit visually beside financial completion, deposit rescan, bot seeding, production readiness, or agent operational controls without clear separation and warnings.

## Proposed Admin Sections

### Content Operations

Purpose:

- Manage market and event content.

Routes:

- `/admin`
- Admin market create/edit routes and controls.
- Admin event/template operations.

Risk:

- Medium to high.

Rules:

- Keep content creation separate from settlement/resolution.
- Mutations need confirmation and audit copy.

### Market Risk And Resolution

Purpose:

- Pause, close, cancel, resolve, and inspect market invariants.

Routes:

- `/admin/markets/[marketId]/invariants`
- Admin resolve/pause/close/cancel controls.

Risk:

- Critical.

Rules:

- Separate from routine content editing.
- Show confirmation, current state, expected effect, and rollback limits.
- Require LedgerWalletReviewerAgent review for implementation.

### Finance Operations

Purpose:

- Review deposits and withdrawals.

Routes:

- `/admin/deposits`
- `/admin/withdrawals`

Risk:

- Critical.

Rules:

- Clearly label financial operations.
- Separate read/review from mutate/complete/rescan actions.
- Completion/rescan actions require human approval and focused tests.
- Never expose private keys.

### Bot And Reference Operations

Purpose:

- Monitor bots, reference markets, snapshots, imports, and seed actions.

Routes:

- `/admin/bots`
- `/admin/reference-markets`

Risk:

- High.

Rules:

- Separate monitor-only views from mutating controls.
- Display dry-run/live mode, kill switch, stale-data status, and blocked reasons.
- Require BotAgent and SecurityAgent review for implementation.

### System Readiness

Purpose:

- Show launch-blocking status for health, config, reconciliation, funding, bots, and deployment readiness.

Routes:

- `/admin/system`

Risk:

- High.

Rules:

- Use pass/warn/block statuses.
- Do not expose secrets or raw production config.
- DeploymentAgent review required for implementation.

### Agent Operations

Purpose:

- Monitor local/orchestrated agent activity, reports, logs, memory review, and run status.

Routes:

- `/admin/agents`

Risk:

- High.

Rules:

- Monitor-only by default.
- No autonomous production execution from admin UI unless explicitly approved in future.
- Logs/files/memory views must not expose secrets.

## Navigation Recommendation

Future admin navigation should group sections as:

1. Content
2. Market Risk
3. Finance
4. Bots
5. System
6. Agents

High-risk sections should use visible risk labels:

- `Financial`
- `Resolution`
- `Bot/Live Risk`
- `Production Readiness`
- `Agent Operations`

## Action Classification

| Action type | Examples | Default treatment |
|---|---|---|
| Read-only monitor | bot status, system status, agent run list | Admin-only, no confirmation |
| Content mutation | create/edit market, event templates | Admin-only, confirmation recommended |
| Financial mutation | withdrawal complete/reject, deposit rescan | Admin-only, confirmation and human review required |
| Resolution mutation | resolve/cancel market | Admin-only, confirmation and LedgerWalletReviewerAgent review required |
| Bot mutation | seed bot, import reference, refresh snapshot | Admin-only, confirmation and BotAgent/SecurityAgent review required |
| Production operation | deployment/runbook actions | Human-only; no deploy from normal admin UI |

## Future UI Requirements

Future admin UI changes should:

- Use section labels that match risk.
- Keep routine content separate from finance/bot/system/agent operations.
- Show empty/loading/error states.
- Show clear disabled states for unapproved actions.
- Include confirmation for high-risk mutations.
- Avoid exposing secrets in logs, config, files, or memory review.
- Keep user-facing product navigation separate from admin navigation.

## Required Future Tests

Future implementation should include:

- Admin route 401/403 tests from `ADMIN_AUTH_ROUTE_INVENTORY.md`.
- Admin-positive read-only smoke tests.
- No-secret leakage tests for system/agent/log/config surfaces.
- Confirmation-state tests for high-risk actions if UI controls are changed.

## Forbidden Automatic Implementation

Agents must not automatically:

- Change admin auth.
- Change financial admin behavior.
- Change market resolution behavior.
- Change bot live/reference mutation behavior.
- Change production deployment behavior.
- Add high-risk admin mutations.
- Touch Prisma schema or migrations.

## Non-Goals

This plan does not:

- Change admin UI.
- Change auth or permissions.
- Change routes or API behavior.
- Change wallet, ledger, matching, settlement, bot, deployment, Prisma, migration, or production behavior.
- Approve public beta launch.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```
