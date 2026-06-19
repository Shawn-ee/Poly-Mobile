# Funding Beta Continuation Prompt

Timestamp: 2026-06-19
Current branch: `agent/beta-withdrawal-request-hold`
Completed phases:

- Phase 1: controlled internal funding beta architecture, merged through PR #215.
- Phase 2: funding schema and ledger readiness review, merged through PR #216.
- Phase 2B / 2C: env-backed internal funding allowlist and kill-switch guards merged through PR #217.
- Phase 3: focused test coverage for existing self-managed Polygon USDC deposit wallet generation merged through PR #218.
- Phase 3B: deposit wallet security evidence merged through PR #219.
- Phase 4: deposit address API/UI evidence opened as PR #220 and left open for human review because it exposes a guarded funding UI entry point.
- Phase 5: deposit monitor and auto-credit hardening evidence merged through PR #221.
- Phase 6: withdrawal request hold hardening evidence added in the current PR.

## Current Status

The current branch adds withdrawal request hold safety evidence without changing runtime behavior.

Covered behavior:

- anonymous withdrawal requests are blocked before funding checks.
- non-allowlisted withdrawal requests are blocked before rate limit and hold creation.
- kill switch blocks withdrawal request creation.
- withdrawal request success response does not include broadcast fields.
- withdrawal history is allowlist-gated and does not return treasury private key or broadcast fields.
- existing service tests cover hold, reject release, complete finalization, and ledger entries.

## Next Step

Next step is **review of the Phase 6 withdrawal request hold evidence PR**.

Do not continue to deposit auto-credit, withdrawal automation, or production funding rollout in the same run.

After human review, choose one:

1. **Review PR #220** because it remains open for human review.
2. **Phase 7 admin manual withdrawal review evidence**.
3. **Phase 2D schema-based funding profile** if env-backed allowlist is not durable enough.

## Validation To Re-Run

```powershell
git diff --check
git diff --cached --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npx jest --runInBand src/__tests__/funding-beta.routes.test.ts src/server/services/__tests__/withdrawals.phase8.test.ts
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
