# Funding Beta Continuation Prompt

Timestamp: 2026-06-19
Current branch: `agent/beta-funding-schema-ledger-readiness`
Completed phase: Phase 2 funding schema and ledger readiness review
Next phase: Phase 2B / 2C controlled funding allowlist and kill-switch controls

## Current Status

Phase 2 was completed as a docs-only review. The readiness classification is:

**Not ready for Phase 3**

Reason:

- Existing deposit wallet generation is authenticated but not allowlist-gated.
- Existing withdrawal request paths are authenticated but not allowlist-gated.
- No canonical internal funding allowlist model or field was found.
- No consistent global funding kill switch was found across deposit address generation, auto-credit, and withdrawal request creation.
- Audit log coverage is incomplete.
- A Prisma migration is likely required before real controlled internal funding beta behavior should proceed.

## Current Dev Commit

At the start of Phase 2, `origin/dev` was:

`3408def docs(beta): add recovery smoke evidence and go-no-go`

Before continuing, run:

```powershell
git fetch origin
git checkout dev
git pull origin dev
git status --short --branch
```

## Open PRs

GitHub CLI authentication failed during this session with:

`HTTP 401: Requires authentication`

Because of that, PR creation could not be verified from Codex.

Phase 1 branch pushed earlier:

`agent/beta-funding-architecture-plan`

Manual PR URL:

`https://github.com/Shawn-ee/POLY/pull/new/agent/beta-funding-architecture-plan`

Phase 2 branch:

`agent/beta-funding-schema-ledger-readiness`

Manual PR URL:

`https://github.com/Shawn-ee/POLY/pull/new/agent/beta-funding-schema-ledger-readiness`

## Validation Results

Phase 2 validation required for docs-only scope:

- `git diff --check`
- `git diff --cached --check`
- new-doc secret-pattern scan

Do not claim validation passed in a future session unless rerun locally.

## Blockers

1. GitHub CLI authentication may need refresh before opening PRs:

```powershell
gh auth login -h github.com
```

If `gh` is not on PATH, use:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth status
```

2. Phase 3 deposit wallet generation must not proceed until controlled funding gates exist.
3. A narrow schema PR is likely required for a funding allowlist.
4. No automatic withdrawal broadcast is approved.
5. Public funding is not approved.
6. Live bots are not approved.
7. Production deployment is not approved.

## Exact Safe Next Instruction

Continue with Phase 2B / 2C:

Create a narrow human-reviewed branch:

`agent/beta-funding-allowlist-kill-switch`

Goal:

- Add or propose durable controlled internal funding allowlist support.
- Add server-only funding guard helpers.
- Add funding kill-switch config.
- Gate deposit address generation.
- Gate withdrawal request creation.
- Gate deposit monitor auto-credit or split monitor gating into the next PR.
- Add tests proving:
  - anonymous users are blocked
  - authenticated non-allowlisted users are blocked
  - kill switch blocks funding paths
  - deposit address responses do not expose raw or encrypted private-key fields

If schema/migrations are needed, keep the PR narrow and leave it open for human review. Do not auto-merge migrations or high-risk funding behavior.

## Warnings

- Do not touch main.
- Do not deploy production.
- Do not print secrets.
- Do not commit `.env` files.
- Do not commit private keys.
- Do not expose raw or encrypted private keys in API responses.
- Do not enable public deposits.
- Do not enable public withdrawals.
- Do not enable automatic withdrawal broadcast.
- Do not enable live bots.
- Do not create checkpoint churn.
- Do not auto-merge high-risk funding PRs.
