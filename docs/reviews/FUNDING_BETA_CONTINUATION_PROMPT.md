# Funding Beta Continuation Prompt

Timestamp: 2026-06-19
Current branch: `agent/beta-funding-allowlist-killswitch`
Completed phases:

- Phase 1: controlled internal funding beta architecture, merged through PR #215.
- Phase 2: funding schema and ledger readiness review, merged through PR #216.
- Phase 2B / 2C: env-backed internal funding allowlist and kill-switch guards implemented in the current PR.

## Current Status

The current branch implements the required safety gate before any Phase 3 deposit wallet generation or auto-credit rollout:

- `INTERNAL_FUNDING_BETA_ENABLED`
- `INTERNAL_FUNDING_ALLOWLIST_EMAILS`
- `FUNDING_KILL_SWITCH`
- `ALLOW_AUTO_DEPOSIT_CREDIT`

Guarded paths:

- deposit address lookup/create
- deposit history API
- withdrawal request creation
- withdrawal history API
- deposit monitor scan / auto-credit entrypoints

## Next Step

Next step is **human review** of the Phase 2B / 2C implementation PR.

Do not continue to Phase 3 in the same run.

After human review, choose one:

1. **Phase 2D schema-based funding profile** if env-backed allowlist is not durable enough.
2. **Phase 2E more access-control tests** if reviewers want more funding API/UI boundary coverage first.
3. **Phase 3 controlled deposit wallet generation** only if reviewers approve the env-backed gates and validation results.

## Validation To Re-Run

```powershell
git diff --check
git diff --cached --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npx jest --runInBand src/__tests__/funding-beta.guard.test.ts src/__tests__/funding-beta.routes.test.ts src/__tests__/funding-beta.deposit-monitor.test.ts
```

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
- Do not auto-merge high-risk funding behavior without human review.
