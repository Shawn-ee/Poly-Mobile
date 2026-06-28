# Subagent Operating Model

This document defines how a LeadAgent coordinates specialized Codex subagents for POLY development. It extends `docs/AGENT_OPERATING_SYSTEM.md`; it does not replace the branch, PR, CI, or human-review rules already defined there.

## Control Model

The LeadAgent owns coordination. Subagents own scoped execution only. A subagent may inspect, implement, validate, and report within the assignment it receives, but it must not expand scope, merge branches, deploy, bypass CI, or approve its own work.

The LeadAgent must:

- Read `docs/AGENT_TASK_BOARD.md`, open GitHub issues, and existing PR state before assigning work.
- Select tasks that are safe for the requested role and current risk setting.
- Assign one issue to one subagent at a time.
- Provide explicit allowed files, forbidden files, validation commands, target branch, and risk level.
- Confirm high-risk routing before any work starts.
- Track open branches and PRs to avoid duplicate work.
- Stop assignment when the repo has unresolved conflicts, failed required checks, or unclear ownership.

Subagents must:

- Read the assignment and required safety docs before changing files.
- Work only on the assigned branch and issue.
- Keep changes limited to the stated scope.
- Run the assigned validation commands.
- Write a report with files changed, validation results, risk impact, and remaining concerns.
- Stop when they encounter high-risk files, secrets, production credentials, product logic outside scope, or unclear instructions.

## Task Assignment

The LeadAgent routes work by issue content and affected files using `docs/SUBAGENT_TASK_ROUTING.md`. Each assignment must include:

- GitHub issue number, title, and body.
- Subagent role.
- Branch name.
- Target branch, normally `dev`.
- Allowed files and forbidden files.
- Required validation commands.
- Risk level.
- Whether human review is required.

Assignments should use `agent-orchestrator/templates/subagent-task-prompt.md`.

## Branch Rules

Subagent branches use:

```text
agent/<issue-number>-<short-name>
```

One branch maps to one issue and one PR. Subagents must not commit directly to `dev` or `main`. If a branch already exists for the issue, the LeadAgent must inspect the branch and PR state before assigning more work.

## Pull Request Rules

Subagents open PRs into `dev` only. PRs must include the standard PR template fields plus the subagent report. A PR must clearly state:

- What issue it addresses.
- What files changed.
- What validation ran.
- Whether wallet, ledger, auth, bot, deployment, or production risk exists.
- Whether human review is required.

Subagents must not merge their own PRs. Subagents must not auto-merge any PR.

## Reports

Every subagent assignment ends with a report based on `agent-orchestrator/templates/subagent-report-template.md`. Reports must be committed in the PR body, PR comment, or run directory as appropriate. Reports are not a substitute for CI.

## Validation

The default validation set is:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

The LeadAgent may add focused tests for the affected area. Subagents must document exact failures and must not hide or relabel failing validation as success.

## Conflict Handling

If a subagent hits a merge conflict, overlapping branch, failing base branch, or unclear ownership, it must stop and report. The LeadAgent decides whether to rebase, merge from `dev`, split the task, or close duplicate work. Subagents must not force push shared branches unless explicitly instructed by the LeadAgent and never to `main`.

## High-Risk Escalation

Any task touching high-risk areas listed in `docs/HIGH_RISK_AREAS.md` must be escalated before implementation. High-risk areas include wallet, deposit, withdrawal, ledger, matching, settlement, `UserBalance`, Prisma migrations, admin auth, production config, and bot live trading.

High-risk tasks require SecurityAgent review and human review. Ledger, wallet, deposit, withdrawal, matching, settlement, and balance changes also require LedgerWalletReviewerAgent review.

## Human Review

Human review is required for:

- High-risk tasks.
- Medium-risk tasks that affect auth, admin capabilities, financial state, bot behavior, or deployment.
- Any task where validation fails.
- Any task where a subagent cannot prove the change is limited to the assignment.

## Why Subagents Do Not Merge

Subagents are execution workers, not release authorities. Direct merge rights would let a worker bypass independent review, CI gating, and human approval for high-risk areas. POLY uses PR-based review so the LeadAgent, reviewer roles, CI, and humans can inspect the result before integration.

## Lifecycle

1. LeadAgent reads `docs/AGENT_TASK_BOARD.md` and GitHub issues.
2. LeadAgent selects safe tasks.
3. LeadAgent assigns one task to one subagent.
4. Subagent creates branch `agent/<issue-number>-<short-name>`.
5. Subagent implements only the assigned scope.
6. Subagent runs validation.
7. Subagent opens PR into `dev`.
8. ReviewerAgent or SecurityAgent reviews.
9. Human approves high-risk or medium-risk tasks.
10. LeadAgent updates the task board and selects next tasks.
