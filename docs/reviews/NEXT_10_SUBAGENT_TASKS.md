# Next 10 Subagent Tasks

These tasks are selected from `docs/reviews/EXECUTION_BACKLOG.md` for the next safe execution wave. The first real execution task should be `TST-001` because it is docs-only, low risk, and assigned to DocsAgent.

## Selection Rules Applied

- At least five tasks are low or medium risk.
- At least three tasks are testing/docs/smoke-test related.
- No wallet, deposit, withdrawal, ledger, matching, or settlement implementation task is selected for automatic execution.
- High-risk tasks are included only as planning, inventory, or review tasks.
- Every task targets `dev` through a PR and must follow `docs/AGENT_OPERATING_SYSTEM.md`.

## Task 1: TST-001 - Update Testing Docs For Dev/Main CI

- Why now: `docs/TESTING.md` is stale and this is the safest first real subagent task.
- Assigned subagent: DocsAgent.
- Exact scope: Update testing documentation to reflect CI on PR/push to `dev` and `main`, current Prisma/typecheck/Jest commands, and Playwright not yet required.
- Forbidden scope: Product code, workflow changes, tests, wallet/ledger/trading/admin/bot logic.
- Validation: `git diff --check`.
- Expected PR size: Small.
- Human review requirement: No.
- Parallel: Yes.

## Task 2: UX-001 - MVP Information Architecture Proposal

- Why now: It gates later homepage, markets, sports, portfolio, and wallet simplification.
- Assigned subagent: PlannerAgent.
- Exact scope: Write a docs-only IA proposal naming primary routes, hidden/delayed surfaces, and MVP navigation.
- Forbidden scope: UI code, route changes, API changes, wallet/trading/admin behavior.
- Validation: `git diff --check`.
- Expected PR size: Small to medium.
- Human review requirement: No.
- Parallel: Yes.

## Task 3: DOC-003 - Task Board Stale Annotations

- Why now: The existing task board still contains foundation tasks already addressed by merged PRs.
- Assigned subagent: DocsAgent.
- Exact scope: Add proposed stale/completed annotations and point contributors to execution backlog docs.
- Forbidden scope: Deleting existing tasks, product code, GitHub issue mutation.
- Validation: `git diff --check`.
- Expected PR size: Small.
- Human review requirement: No.
- Parallel: Yes.

## Task 4: TST-002 - Playwright Public Smoke Baseline

- Why now: Public smoke coverage should exist before UI simplification starts.
- Assigned subagent: TestingAgent.
- Exact scope: Add or document safe public-route smoke checks for `/`, `/markets`, `/events`, `/sports`, `/sports/soccer/world-cup`, `/login`, `/portfolio`, and `/wallet` beta state.
- Forbidden scope: Product behavior changes, secrets, live services, wallet/deposit/withdrawal/ledger/matching/settlement logic.
- Validation: Selected Playwright command if implemented, `npm run test:ci`, `git diff --check`.
- Expected PR size: Medium.
- Human review requirement: Yes.
- Parallel: Partly; should not overlap with UI redesign.

## Task 5: FE-004 - Encoding Artifact Inventory

- Why now: The review found visible mojibake; an inventory is low risk and prepares clean copy fixes.
- Assigned subagent: DocsAgent.
- Exact scope: Inspect UI strings and document exact artifacts, paths, and proposed replacements.
- Forbidden scope: Editing UI code in this task.
- Validation: `git diff --check`.
- Expected PR size: Small.
- Human review requirement: No.
- Parallel: Yes.

## Task 6: API-001 - API Route Ownership Inventory

- Why now: The API surface is large and route ownership must be known before tests or cleanup.
- Assigned subagent: RepoInspectorAgent + DocsAgent.
- Exact scope: Produce a read-only inventory of public, account, trading, wallet, admin, bot, agent, canonical, and legacy routes.
- Forbidden scope: API implementation, auth changes, route deletion, wallet/trading logic.
- Validation: `git diff --check`.
- Expected PR size: Medium.
- Human review requirement: Yes.
- Parallel: Yes.

## Task 7: DOC-001 - Script Safety Classification

- Why now: Agents need explicit safe/unsafe command boundaries before broader automation.
- Assigned subagent: DocsAgent + SecurityAgent.
- Exact scope: Classify scripts as read-only, test-only, local-mutating, repair, deployment, monitor, or production-dangerous.
- Forbidden scope: Running scripts, deleting scripts, production data, secrets.
- Validation: `git diff --check`.
- Expected PR size: Medium.
- Human review requirement: Yes.
- Parallel: Yes.

## Task 8: TRD-001 - Retail Trade Ticket Design Plan

- Why now: Trading UX simplification is central to the Robinhood-like goal but must not touch matching.
- Assigned subagent: PlannerAgent + FrontendAgent.
- Exact scope: Docs-only design plan for simple Yes/No default trade review and advanced controls.
- Forbidden scope: Order APIs, matching, ledger, order ticket implementation.
- Validation: `git diff --check`.
- Expected PR size: Small to medium.
- Human review requirement: Yes.
- Parallel: Yes, after UX-001 is underway.

## Task 9: WDW-001 - Canonical Deposit Architecture Decision

- Why now: Funding confusion is a launch blocker, but this must stay planning-only.
- Assigned subagent: LedgerWalletReviewerAgent + SecurityAgent.
- Exact scope: Human-reviewed decision doc for Polygon per-user address vs legacy Base verification and legacy marking.
- Forbidden scope: Deposit code, private keys, wallet routes, Prisma schema, money movement.
- Validation: `git diff --check`.
- Expected PR size: Medium.
- Human review requirement: Yes.
- Parallel: No; serialize before funding-gate work.

## Task 10: ADM-001 - Admin Auth Route Inventory

- Why now: Admin route coverage is a high-risk public beta blocker.
- Assigned subagent: SecurityAgent + TestingAgent.
- Exact scope: Inventory admin routes and map required 401/403/admin-positive tests.
- Forbidden scope: Admin auth implementation, admin mutation code, financial operations.
- Validation: `git diff --check`; focused Jest only if explicitly included in a later implementation issue.
- Expected PR size: Medium.
- Human review requirement: Yes.
- Parallel: Yes, after API-001 or alongside it with coordination.

## Safe For First Real Subagent Execution

1. `TST-001 - Update Testing Docs For Dev/Main CI`
2. `UX-001 - MVP Information Architecture Proposal`
3. `DOC-003 - Task Board Stale Annotations`
4. `FE-004 - Encoding Artifact Inventory`

## Human-Review-Required Tasks

- `TST-002 - Playwright Public Smoke Baseline`
- `API-001 - API Route Ownership Inventory`
- `DOC-001 - Script Safety Classification`
- `TRD-001 - Retail Trade Ticket Design Plan`
- `WDW-001 - Canonical Deposit Architecture Decision`
- `ADM-001 - Admin Auth Route Inventory`

## Manual Assignment Plan

Parallel-capable tasks:

- `TST-001`, `UX-001`, `DOC-003`, and `FE-004` can run at the same time because they are docs/planning only and affect separate docs.
- `API-001` and `DOC-001` can run in parallel after LeadAgent confirms there is no overlap in route/script inventory docs.
- `TRD-001` can run in parallel with inventories but should consume `UX-001` before finalizing.

Serialized tasks:

- `WDW-001` must run before any funding exposure gates, wallet funding UI, deposit monitor hardening, or withdrawal hardening work.
- Admin auth test implementation must wait for `ADM-001`.
- Sports UI implementation should wait for `UX-001` and public smoke baseline.

SecurityAgent review required:

- `DOC-001`, `WDW-001`, `ADM-001`, and any task touching auth, secrets, config, deployment readiness, wallet, funding, or bot risk.

LedgerWalletReviewerAgent review required:

- `WDW-001`, any funding-gate follow-up, reconciliation smoke design, trade cancel/fill/settlement tests, and any task touching `UserBalance`, `LedgerEntry`, `LedgerTransaction`, matching, settlement, deposits, withdrawals, positions, or balances.

Recommended first 3 subagent execution prompts:

1. DocsAgent: execute `TST-001` only; update testing docs for dev/main CI; do not edit workflows or product code.
2. PlannerAgent: execute `UX-001` only; create MVP IA proposal; do not edit UI code.
3. DocsAgent: execute `FE-004` only; inventory encoding artifacts; do not edit UI code.

LeadAgent stop conditions:

- Stop if an issue requests product implementation but only planning was authorized.
- Stop if task scope touches wallet, deposits, withdrawals, ledger, matching, settlement, admin auth, bot live trading, production config, Prisma schema, migrations, private keys, or secrets without human approval.
- Stop if validation fails and the failure is not documented.
- Stop if a subagent attempts to deploy, merge, push to `main`, enable autonomous execution, print secrets, or run destructive commands.
