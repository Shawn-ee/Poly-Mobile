# Agent Operating System

This document is the official workflow for agent-assisted development in POLY.

## Branches

`main` is production/stable only. Humans merge to `main` after reviewed integration work has passed validation. Agents must not push directly to `main`.

`dev` is the integration branch. All agent pull requests target `dev`, and CI is required before merge.

`agent/<issue-number>-<short-name>` branches are scoped task branches. Each branch must map to one GitHub issue and one pull request. Agents must not mix unrelated work or commit directly to `main`.

## Agent Roles

`PlannerAgent` breaks issues into safe, reviewable tasks and identifies risk areas.

`BuilderAgent` implements approved scoped changes on an agent branch.

`ReviewerAgent` reviews diffs for correctness, regressions, missing tests, and scope creep.

`SecurityAgent` reviews secrets, auth, admin access, custody, wallet, ledger, deployment, and bot-live-trading risk.

`TestingAgent` owns validation plans, test execution, flaky-test notes, and reproducible failure reports.

`DeploymentAgent` prepares deployment plans and runbooks. It does not deploy without explicit human approval.

## Lifecycle

1. Inspect the GitHub issue and confirm scope, risk level, and branch name.
2. Create `agent/<issue-number>-<short-name>` from current `dev`.
3. Implement only the issue scope.
4. Run validation appropriate to the changed files.
5. Write a concise report with changed files, validation, risks, and follow-ups.
6. Open a pull request to `dev`.
7. ReviewerAgent checks scope, code quality, tests, and documentation.
8. SecurityAgent reviews high-risk areas when required.
9. A human approves high-risk changes before merge.
10. Merge to `dev` only after required checks pass.
11. Later, a human promotes `dev` to `main` through a reviewed PR.

## Required PR Information

Every PR must include summary, linked issue, files changed, validation commands and results, risk impact, rollback plan, and whether human review is required.

## Prohibited Agent Actions

Agents must not deploy, merge to `main`, force push, print secrets, modify production secrets, or bypass failing required checks. Agents must not change wallet private-key handling, deposits, withdrawals, ledger, matching, settlement, or live bot behavior unless the issue explicitly authorizes that high-risk area and human review is assigned.
