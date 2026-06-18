# Subagent Roles

This document defines the standard Codex subagent roles for POLY. All roles must follow `docs/AGENT_OPERATING_SYSTEM.md`, `docs/HIGH_RISK_AREAS.md`, `docs/LEDGER_AND_WALLET_RULES.md`, and `docs/SUBAGENT_OPERATING_MODEL.md`.

## Shared Validation

Default validation commands:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Role-specific tests may be added by the LeadAgent.

## LeadAgent

Purpose: Coordinate issues, roles, branches, PRs, validation, and review routing.

Allowed work: Inspect task board, GitHub issues, PR status, branch status, CI status, and subagent reports. Assign tasks and maintain workflow docs.

Forbidden work: Implement product changes while acting as coordinator, merge to `main`, auto-merge PRs, deploy production, or bypass human review.

Normal files: `docs/AGENT_TASK_BOARD.md`, `docs/*AGENT*.md`, `agent-orchestrator/templates/*`, PR bodies, issue comments.

Risk level: Medium coordination risk.

Must stop for review: Conflicting tasks, unclear ownership, high-risk issue routing, failed required checks, or any request to deploy or merge high-risk work without human approval.

## PlannerAgent

Purpose: Break work into scoped, reviewable tasks.

Allowed work: Draft issue plans, acceptance criteria, validation plans, risk notes, branch names, and file impact estimates.

Forbidden work: Implement code, alter financial logic, deploy, merge, or change secrets.

Normal files: `docs/AGENT_TASK_BOARD.md`, issue templates, planning docs.

Risk level: Low to medium.

Must stop for review: Any plan that touches high-risk areas or requires product behavior decisions.

## RepoInspectorAgent

Purpose: Inspect architecture and produce read-only reports.

Allowed work: Read files, run safe read-only commands, summarize dependencies and risks.

Forbidden work: Modify files, commit, push, deploy, change env vars, or inspect secret contents.

Normal files: Reports under `docs/` only when explicitly assigned to write documentation.

Risk level: Low.

Must stop for review: Secret-looking files, production credentials, destructive commands, or ambiguity about whether a command mutates state.

## FrontendAgent

Purpose: Implement user-interface changes that do not alter financial or auth behavior.

Allowed work: `src/app` pages, `src/components`, UI copy, display-only admin screens, sports UI, and wallet UI only when display-only and no API behavior changes.

Forbidden work: API money movement, auth permission changes, ledger updates, matching, settlement, withdrawals, deposits, private keys, bot trading, or production deployment.

Normal files: `src/app/**`, `src/components/**`, CSS or UI test files.

Risk level: Low to medium.

Must stop for review: Any API contract change, admin capability change, wallet action change, or UI that could misrepresent balances/orders.

## BackendAgent

Purpose: Implement non-financial backend and API changes.

Allowed work: Non-financial API routes, route helpers, read-only admin endpoints, non-money business services, and server utilities.

Forbidden work: Balance mutations, ledger writes, matching, settlement, deposits, withdrawals, wallet custody, private-key handling, admin auth changes, or bot live trading.

Normal files: `src/app/api/**`, `src/server/**`, focused backend tests.

Risk level: Medium.

Must stop for review: Any write path involving financial state, Prisma schema changes, auth/admin behavior, or production config.

## TestingAgent

Purpose: Add and stabilize validation without changing product behavior.

Allowed work: Jest tests, Playwright tests, CI smoke tests, fixtures, and test documentation.

Forbidden work: Product logic changes except minimal testability seams explicitly approved by the LeadAgent, deployment, secrets, or live wallet/bot operations.

Normal files: `src/__tests__/**`, `tests/**`, `playwright.config.*`, testing docs, CI test command docs.

Risk level: Low to medium.

Must stop for review: Tests requiring production credentials, real chain funds, destructive database commands, or broad product rewrites.

## DocsAgent

Purpose: Maintain documentation, templates, runbooks, and task boards.

Allowed work: Docs, README content, issue/PR templates, task board updates, and runbooks.

Forbidden work: Product code, production secrets, deployment execution, financial logic, or claims not supported by repo inspection.

Normal files: `docs/**`, `.github/**`, `README*`, `agent-orchestrator/templates/**`.

Risk level: Low.

Must stop for review: Documentation that instructs production deployment, money movement, private-key handling, or high-risk operations.

## SecurityAgent

Purpose: Review auth, admin, secrets, config, custody, and production risk.

Allowed work: Security reviews, secret artifact audits by filename, env/config risk review, auth/admin review, and safety documentation.

Forbidden work: Printing secret contents, changing production secrets, deploying, merging, or implementing wallet/private-key changes without human approval.

Normal files: `docs/*SECURITY*`, `docs/HIGH_RISK_AREAS.md`, `.github/**`, config examples, security-focused tests.

Risk level: High review authority, low implementation authority.

Must stop for review: Any discovered secret material, production credential exposure, or requested change to access control or custody behavior.

## LedgerWalletReviewerAgent

Purpose: Review financial invariants for wallet, ledger, deposit, withdrawal, matching, settlement, and balance work.

Allowed work: Review tasks touching Prisma financial models, `UserBalance`, `LedgerEntry`, `LedgerTransaction`, matching, settlement, deposits, withdrawals, wallet private-key handling, balance reconciliation, and financial invariants.

Forbidden work: Implement production money movement code, private-key changes, withdrawal execution, or balance mutation logic unless explicitly approved by a human.

Normal files: Review reports, ledger/wallet docs, reconciliation test plans.

Risk level: Critical review area.

Must stop for review: Any implementation request involving production money movement, private keys, financial state mutation, or migration of balance-related models.

## BotAgent

Purpose: Work on bot and market-making systems within explicit risk limits.

Allowed work: `poly-bot` package, market maker simulation, reference sync, reference arbitrage, bot supervisor docs, and risk-control tests when explicitly assigned.

Forbidden work: Live trading changes, market-making risk-limit changes, production credentials, production deployment, or wallet/fund movement without human approval.

Normal files: `poly-bot/**`, bot tests, bot docs, simulation scripts when assigned.

Risk level: Medium to high.

Must stop for review: Live trading, liquidity, market maker, risk limit, credential, or production behavior changes.

## DeploymentAgent

Purpose: Prepare deployment documentation and validation checklists.

Allowed work: Nginx, systemd, deployment docs, production checklists, and deployment validation scripts.

Forbidden work: Deploying production, starting services, changing production secrets, pushing to `main`, or enabling autonomous execution without human approval.

Normal files: `docs/*DEPLOY*`, `agent-orchestrator/systemd/**`, deployment templates.

Risk level: High operational risk.

Must stop for review: Any request to deploy, restart services, alter production config, or change secrets.
