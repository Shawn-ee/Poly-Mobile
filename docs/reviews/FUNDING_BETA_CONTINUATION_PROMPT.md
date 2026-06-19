# Funding Beta Continuation Prompt

Current timestamp: 2026-06-19

Current branch: `agent/beta-funding-architecture-plan`

Current dev commit at branch creation: `3408def`

Completed phase: Phase 0 repo inspection and Phase 1 architecture/docs planning.

Next phase: Phase 2 schema and ledger readiness review.

Open PRs:

- Phase 1 architecture PR should be opened from `agent/beta-funding-architecture-plan` into `dev`.
- Existing older PR #25 remains broad/draft/human-only and must not be auto-merged.
- Other stale checkpoint PRs may exist; do not create checkpoint churn.

Validation results for Phase 1:

- Run `git diff --check`.
- Run `git diff --cached --check` before commit.
- This phase is docs-only.

Blockers:

- `gh` authentication failed in this Codex session with `HTTP 401` / invalid token. If PR opening fails, push the branch and ask the owner to reauthenticate GitHub CLI with `gh auth login -h github.com`.
- Controlled funding allowlist is not currently canonical.
- Funding kill switch is not currently canonical.
- Deposit address generation and withdrawal request routes currently lack controlled funding allowlist checks.
- Deposit monitor auto-credit lacks explicit funding kill-switch / auto-credit-enabled guard.
- Schema may need `UserFundingProfile`, audit log, direct ledger references, provider/encryption version fields, or expanded withdrawal statuses.

Exact safe next instruction for Codex:

```text
You are Codex in C:\Users\hecto\Desktop\projects\PolyProj\poly.
Continue Controlled Internal Funding Beta from Phase 2 only.
Do not create checkpoint churn.
Do not implement the whole system.
Inspect prisma/schema.prisma, ledger services, deposit services, withdrawal services, auth/admin guards, and tests.
Create docs/reviews/FUNDING_BETA_SCHEMA_REVIEW.md.
If schema changes are required, create one narrow schema-only PR and leave it open for human review.
Do not auto-merge Prisma migrations or funding behavior.
Do not touch main, deploy, print secrets, enable public funding, enable automatic withdrawal broadcast, or enable live bots.
```

Warnings:

- Do not auto-merge high-risk funding PRs.
- Do not modify wallet private-key behavior without tests and human review.
- Do not implement automatic withdrawal broadcast.
- Do not expose raw or encrypted private keys to frontend or API responses.
- Do not use production data or secrets.
- Stop after one coherent Phase 2 PR or blocker report.
