# Funding Beta Deposit Wallet Generation Review

Date: 2026-06-19

Branch: `agent/beta-internal-deposit-wallet-generation-tests`

## Executive Summary

Phase 3 reviewed the existing controlled internal funding beta deposit wallet path and added focused tests for the current self-managed Polygon USDC deposit wallet generation service.

This PR does not add a new funding feature, schema migration, chain monitor, ledger mutation, withdrawal behavior, public funding path, or production deployment. It verifies the existing server-side get-or-create behavior before any broader internal funding beta rollout.

## Scope

Changed files:

- `src/__tests__/funding-beta.deposit-wallet-generation.test.ts`
- `docs/reviews/FUNDING_BETA_DEPOSIT_WALLET_GENERATION_REVIEW.md`
- `docs/reviews/FUNDING_BETA_CONTINUATION_PROMPT.md`

Runtime behavior changed: No.

Schema or migration changed: No.

Private-key behavior changed: No.

Ledger, balance, matching, settlement, trading, withdrawal, bot, admin auth, deployment, package, workflow, or secret behavior changed: No.

## Existing Implementation Reviewed

The current implementation already includes:

- `UserDepositAddress` with unique `(userId, chain, token)`.
- Server-side `ensurePolygonUsdcDepositAddress(userId)`.
- Existing active wallet lookup before wallet creation.
- `ethers.Wallet.createRandom()` for self-managed EVM wallet creation.
- `encryptPrivateKey(...)` before database storage.
- `DEPOSIT_WALLET_ENCRYPTION_KEY` validation through deposit config checks.
- Deposit address API guards from Phase 2B / 2C:
  - authenticated user required.
  - internal funding allowlist required.
  - funding kill switch respected.
  - response excludes raw and encrypted private-key fields.

## Tests Added

`src/__tests__/funding-beta.deposit-wallet-generation.test.ts` verifies:

1. Existing active Polygon USDC deposit wallet is returned without generating a new private key.
2. A new wallet is created only when no active wallet exists.
3. Raw private key is passed to the encryption helper and not persisted in the Prisma create payload.
4. Created wallet payload stores only `encryptedPrivateKey`.
5. Unsafe or missing deposit wallet encryption config blocks wallet generation before key creation.

The tests use mocks for Prisma, wallet creation, and encryption. They do not generate a real production wallet, use a real RPC, require secrets, print private keys, or touch production data.

## Security Review

ReviewerAgent result: Pass.

SecurityAgent result: Pass.

LedgerWalletReviewerAgent result: Pass for test-only scope.

The tests do not inspect or print secret values. They use a synthetic placeholder raw private-key string only inside a mocked unit test and assert it is not stored in the database create payload.

## Remaining Risks

- The implementation still relies on env-backed allowlisting rather than a durable schema-backed funding profile.
- A future Phase 3 implementation review should decide whether env-backed allowlisting is enough for the first internal funding beta cohort.
- End-to-end route coverage for real session/auth wiring remains separate from these unit tests.
- Real deposit monitoring and auto-credit remain blocked until later phases with duplicate-safe ledger evidence.

## Phase 3 Readiness

Deposit wallet generation can proceed to human review with these tests in place. This PR should not be treated as approval for:

- public deposits.
- anonymous deposits.
- auto-credit rollout.
- withdrawal automation.
- production custody.
- live bot behavior.
- deployment.

## Recommended Next Phase

After this PR is reviewed, choose one:

1. Phase 3B: human review of existing deposit wallet generation plus env-backed allowlist model.
2. Phase 4: deposit address API/UI evidence for allowlisted users only.
3. Phase 2D: schema-backed funding profile if env-backed allowlist is considered insufficient.
