# Funding Beta Continuation Prompt

Timestamp: 2026-06-19
Current branch: `agent/beta-internal-deposit-wallet-generation-tests`
Completed phases:

- Phase 1: controlled internal funding beta architecture, merged through PR #215.
- Phase 2: funding schema and ledger readiness review, merged through PR #216.
- Phase 2B / 2C: env-backed internal funding allowlist and kill-switch guards merged through PR #217.
- Phase 3: focused test coverage added for existing self-managed Polygon USDC deposit wallet generation.

## Current Status

The current branch verifies the existing self-managed deposit wallet generation path without changing runtime funding behavior.

Covered behavior:

- existing active Polygon USDC deposit wallet is reused.
- a new mocked wallet is only created when no active wallet exists.
- raw private key is passed to encryption before database storage.
- Prisma create payload stores `encryptedPrivateKey` and not the raw private key.
- unsafe deposit wallet encryption config blocks wallet generation before key creation.

## Next Step

Next step is **human review** of the Phase 3 deposit wallet generation test PR.

Do not continue to deposit auto-credit, withdrawal automation, or production funding rollout in the same run.

After human review, choose one:

1. **Phase 3B deposit wallet generation review** if reviewers want more security evidence around encryption and API response behavior.
2. **Phase 4 deposit address API/UI evidence** for allowlisted users only.
3. **Phase 2D schema-based funding profile** if env-backed allowlist is not durable enough.

## Validation To Re-Run

```powershell
git diff --check
git diff --cached --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npx jest --runInBand src/__tests__/funding-beta.deposit-wallet-generation.test.ts
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
