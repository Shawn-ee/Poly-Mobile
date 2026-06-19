# Admin Funding UI Screenshot Evidence Requirements

Task id: DOC-043

Phase: Phase D/G - UI readiness and beta evidence

Assigned subagents: FrontendAgent, TestingAgent, SecurityAgent, LedgerWalletReviewerAgent

Risk level: High by topic, docs-only in this task

## Purpose

This document defines screenshot and visual evidence requirements for future UI PRs that touch wallet, deposit, withdrawal, or admin funding-adjacent pages.

It does not capture screenshots, modify UI code, change wallet/deposit/withdrawal behavior, change admin behavior, alter ledger/trading logic, deploy, or approve real-money readiness.

## Pages Covered

High-risk evidence requirements apply to:

- `/wallet`
- `/admin/deposits`
- `/admin/withdrawals`
- any future page that displays deposit, withdrawal, balance, ledger, custody, wallet address, chain transaction, or admin finance operation state

Private pool pages are covered separately by `docs/reviews/PRIVATE_POOL_LIST_UI_REPLACEMENT_SCOPE.md` and PR #25 review docs, but the same evidence principles apply when private pool actions can affect funds or refunds.

## Required Evidence For Future UI PRs

Any future PR touching covered pages should include:

- changed file list
- statement of whether the PR is display-only
- validation command results
- route screenshots or visual QA summary
- confirmation that no API paths, methods, request payloads, or event handler semantics changed
- confirmation that no wallet, deposit, withdrawal, ledger, matching, settlement, order, fill, trade, position, auth, admin operation, bot, deployment, Prisma, package, workflow, or script behavior changed
- confirmation that copy does not imply public real-money readiness
- confirmation that screenshots do not expose secrets, private keys, credentials, private notes, raw wallet signer material, production data, or sensitive customer data

## Screenshot Matrix

Future evidence should cover the affected route at practical viewport sizes:

| Route | Minimum screenshots or visual summary | Required states |
|---|---|---|
| `/wallet` | Desktop and mobile | Loading, beta-safe account state, disabled/gated deposit or withdrawal state, transaction/history empty state if present |
| `/admin/deposits` | Desktop and mobile if layout changes | Loading, empty list, pending/review state if locally available, rescan controls visibly separated from normal user flows |
| `/admin/withdrawals` | Desktop and mobile if layout changes | Loading, empty list, pending request state if locally available, complete/reject controls and required inputs |

If a state cannot be reached locally without unsafe setup, document that limitation instead of using production data.

## Screenshot Safety Rules

Screenshots and visual summaries must not include:

- production wallet addresses tied to real users unless explicitly approved
- private keys, mnemonics, seed phrases, API tokens, or credentials
- production database contents
- private customer information
- internal notes that should not be public
- raw signer material or custody details
- unredacted transaction hashes if they reveal sensitive operational context

Use local mock/test data, seeded local fixtures, or redacted examples only.

## Review Questions

Future reviewers should ask:

- Are funding actions clearly beta-gated or disabled when not approved?
- Are admin-only actions visually separated from user-facing actions?
- Are dangerous actions still protected by the same confirmations, required inputs, and disabled/busy states?
- Are ledger/balance claims display-only and backed by existing behavior?
- Does copy avoid promising real deposits, withdrawals, custody, or public launch readiness?
- Are empty/error states safe and non-misleading?
- Does the PR avoid changing API calls, payloads, auth checks, and handler semantics?

## Non-Auto-Merge Boundary

Do not auto-merge future PRs that touch:

- `/wallet`
- `/admin/deposits`
- `/admin/withdrawals`
- wallet/deposit/withdrawal UI actions
- admin finance operation controls
- transaction hash submission or completion flows
- balance, ledger, settlement, order, fill, trade, or position display logic
- auth/admin behavior
- package scripts, workflows, executable scripts, Prisma, migrations, deployment config, secrets, or production settings

These PRs may be opened after validation, but they should remain human-reviewed unless a later explicit policy allows otherwise.

## Validation Required For Future UI PRs

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

Run focused route screenshots or Playwright/browser smoke checks when practical and safe.

## Human Review Required

Human review is required for:

- any PR that changes covered pages
- any PR that changes funding-related copy
- any PR that changes wallet/account balance display semantics
- any PR that changes admin deposit/withdrawal operator controls
- any PR that introduces new funding or custody claims
- any PR whose screenshots require redaction

## Decision

Future admin/funding UI work must provide visual evidence, but visual evidence does not make funding, custody, withdrawal, ledger, settlement, admin auth, or production readiness approved. Those decisions remain human-owned and must be recorded in `docs/reviews/HUMAN_DECISION_REQUIRED.md`.
