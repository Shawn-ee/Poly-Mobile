# Funding Beta Continuation Prompt

Timestamp: 2026-06-19
Current branch: `agent/beta-funding-schema-ledger-readiness`
Completed phases:

- Phase 1: controlled internal funding beta architecture, merged through PR #215.
- Phase 2: funding schema and ledger readiness review.

Next phase: Phase 2B / 2C controlled funding allowlist and kill-switch controls.

## Current Status

Phase 2 was completed as a docs-only review. The readiness classification is:

**Not ready for Phase 3**

Reason:

- Existing deposit wallet generation is authenticated but not allowlist-gated.
- Existing withdrawal request paths are authenticated but not allowlist-gated.
- No canonical internal funding allowlist model or field was found.
- No consistent global funding kill switch was found across deposit address generation, auto-credit, and withdrawal request creation.
- Audit log coverage is incomplete.
- A narrow schema PR may eventually be required, but Phase 2B / 2C should first add the smallest safe env-based temporary guard if schema support is not already available.

## Current Dev State

Before continuing, run:

```powershell
$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH
git fetch origin
git checkout dev
git pull origin dev
git status --short --branch
```

## Open PR Context

Phase 1 architecture branch:

`agent/beta-funding-architecture-plan`

Phase 1 PR:

`https://github.com/Shawn-ee/POLY/pull/215`

Phase 2 branch:

`agent/beta-funding-schema-ledger-readiness`

Phase 2 PR:

`https://github.com/Shawn-ee/POLY/pull/216`

## Validation Results

Phase 2 validation required for docs-only scope:

- `git diff --check`
- `git diff --cached --check`

Do not claim validation passed in a future session unless rerun locally.

## Blockers

1. Phase 3 deposit wallet generation must not proceed until controlled funding gates exist.
2. Deposit address generation needs an internal funding allowlist guard.
3. Withdrawal request creation needs an internal funding allowlist guard.
4. Deposit monitor auto-credit needs a funding kill-switch guard.
5. Public funding is not approved.
6. Automatic withdrawal broadcast is not approved.
7. Live bots are not approved.
8. Production deployment is not approved.

## Exact Safe Next Instruction

Continue with Phase 2B / 2C:

Create a focused branch:

`agent/beta-funding-allowlist-killswitch`

Goal:

- Add server-only controlled funding guard helpers.
- Add env-backed internal funding beta flags if no schema-backed allowlist exists.
- Use these env names unless the repo already has a canonical equivalent:
  - `INTERNAL_FUNDING_BETA_ENABLED`
  - `FUNDING_KILL_SWITCH`
  - `INTERNAL_FUNDING_ALLOWLIST_EMAILS`
- Gate deposit address generation.
- Gate withdrawal request creation.
- Gate deposit monitor auto-credit or document why monitor gating must be split into another PR.
- Add targeted tests proving:
  - anonymous users are blocked
  - authenticated non-allowlisted users are blocked
  - allowlisted users are allowed only when funding beta is enabled and kill switch is off
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
