# Review To Issues Guide

This DOC-002 guide explains how to convert review-derived backlog rows into GitHub issues for safe agent execution. It is planning-only and does not create issues.

## Source Documents

Use these documents as the source of truth:

- `docs/reviews/EXECUTION_BACKLOG.md`
- `docs/reviews/NEXT_10_SUBAGENT_TASKS.md`
- `docs/reviews/IMPLEMENTATION_ROADMAP.md`
- `docs/SUBAGENT_TASK_ROUTING.md`
- `docs/SUBAGENT_ROLES.md`
- `docs/HIGH_RISK_AREAS.md`
- `docs/LEDGER_AND_WALLET_RULES.md`

## Issue Template Selection

Use `.github/ISSUE_TEMPLATE/agent_task.md` for:

- Low-risk docs tasks.
- Low-risk planning tasks.
- Read-only inventories.
- Test plans and smoke-test tasks that do not touch financial state.
- Display-only frontend tasks that do not alter trading, wallet, auth, admin, bot, or deployment behavior.

Use `.github/ISSUE_TEMPLATE/financial_risk_change.md` for any task touching:

- Prisma schema or migrations.
- `UserBalance`.
- `LedgerEntry` or `LedgerTransaction`.
- Matching, settlement, orders, fills, trades, or positions.
- Deposits or withdrawals.
- Wallet private keys.
- Bot live trading.

When in doubt, use the financial-risk template and require human review.

## Label Rules

Recommended labels:

- `agent-task`: every agent-executable issue.
- `codex-ready`: safe for orchestrator discovery after the issue is fully scoped.
- `human-review`: required for medium, high, critical, or ambiguous tasks.
- `high-risk`: required for wallet, ledger, matching, settlement, admin auth, production config, deployment, or bot live-trading areas.
- `blocked`: use when a prerequisite decision or human approval is missing.
- `in-progress`: use only while an agent branch is actively being worked.

Do not add `codex-ready` to tasks that are missing scope, validation, forbidden files, or review routing.

## Risk Mapping

| Backlog risk | Issue risk | Automation default |
|---|---|---|
| Low | Low | Agent may execute after issue is complete. |
| Medium | Medium | Agent may assist; human review usually required. |
| High | High | Planning/review only unless explicitly approved by a human. |
| Critical | Critical | Block implementation; human-reviewed planning only by default. |

Any task touching wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, bot live trading, production config, secrets, Prisma schema, or migrations must require human review.

## Issue Field Mapping

| Issue field | How to fill it |
|---|---|
| Goal | Copy the backlog desired outcome in one or two sentences. |
| Scope | List exact docs, tests, pages, or routes the task may touch. |
| Out of scope | List forbidden product logic, high-risk areas, and unrelated files. |
| Acceptance criteria | Convert the backlog acceptance criteria into checkboxes. |
| Suggested branch name | Use `agent/<issue-number>-<short-name>` after issue creation. |
| Risk level | Match the backlog risk unless the issue adds higher-risk scope. |
| Files likely affected | Use backlog affected files; be specific when possible. |
| Validation commands | Include `git diff --check`; add full validation if code/tests/config change. |
| Required human review | Yes for medium/high/critical or any high-risk area. |
| Agent role | Use `docs/SUBAGENT_TASK_ROUTING.md` to choose the highest-risk applicable role. |

## Branch Naming

After GitHub assigns an issue number, use:

```text
agent/<issue-number>-<short-name>
```

Examples:

- `agent/42-homepage-simplification-spec`
- `agent/43-public-smoke-baseline`
- `agent/44-canonical-deposit-decision`

Do not reuse branches across unrelated issues.

## Validation Defaults

Docs-only issues:

```sh
git diff --check
```

Code, tests, package scripts, config, CI, or executable scripts:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Add focused Playwright, Jest, or script-specific checks only when the issue scope explicitly requires them.

## Automation Eligibility Checklist

An issue can be marked `codex-ready` only when all are true:

- Goal is clear.
- Scope and out-of-scope sections are explicit.
- Files likely affected are listed.
- Forbidden high-risk areas are named.
- Validation commands are listed.
- Risk level is selected.
- Human review requirement is selected.
- Agent role is selected.
- No production secrets, deployment, real-money movement, or live trading are required.

## Human Review Triggers

Human review is required for:

- Any medium, high, or critical issue.
- Any wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, bot, deployment, production config, secret, Prisma, or migration scope.
- Any task that changes user-visible funding, balance, order, position, settlement, admin, or bot behavior.
- Any issue whose scope is ambiguous.

## Examples

### Low-Risk Docs Issue

Template: `Agent task`

- Goal: Add a docs-only homepage simplification spec.
- Scope: `docs/reviews/HOMEPAGE_SIMPLIFICATION_SPEC.md`.
- Out of scope: `src/`, `prisma/`, tests, wallet/trading/admin/bot/deployment logic.
- Validation: `git diff --check`.
- Human review: No.
- Labels: `agent-task`, `codex-ready`.

### High-Risk Planning Issue

Template: `Financial risk change`

- Goal: Decide canonical deposit architecture.
- Scope: docs-only decision record.
- Out of scope: deposit code, wallet private keys, Prisma schema, production money movement.
- Validation: `git diff --check`.
- Human review: Yes.
- Labels: `financial-risk`, `human-review`, `high-risk`.

## Non-Goals

This guide does not:

- Create GitHub issues.
- Modify issue templates.
- Change product code.
- Change tests or CI.
- Change wallet, ledger, matching, settlement, admin auth, bot, deployment, or production behavior.
