# Controlled Internal Funding Beta Schema And Ledger Readiness

Date: 2026-06-19
Branch: `agent/beta-funding-schema-ledger-readiness`
Scope: docs-only Phase 2 readiness review

This document reviews whether the current POLY main app repo is ready to proceed from controlled internal funding beta planning into implementation. It does not change schema, migrations, product code, wallet behavior, deposit behavior, withdrawal behavior, ledger behavior, admin auth, bot behavior, deployment, workflows, scripts, or secrets.

## 1. Executive Summary

POLY already has several important funding primitives:

- Per-user Polygon USDC deposit address records.
- Server-side self-managed EVM wallet generation.
- AES-256-GCM private-key encryption helper.
- Deposit records with `(chain, txHash, logIndex)` uniqueness.
- Polygon USDC Transfer-log scanning.
- Confirmations-based deposit crediting.
- Ledger-backed `UserBalance` available and locked buckets.
- Withdrawal request, rejection, and completion services.
- Admin deposit and withdrawal API/page surfaces.
- Ledger and withdrawal tests covering idempotency, locking, release, and completion paths.

The current repo is not yet ready for Phase 3 deposit wallet generation as an Internal Funding Beta feature because the existing wallet-generation and withdrawal paths are authenticated but not restricted to a canonical internal funding allowlist. The current repo also lacks a global funding kill switch that consistently blocks deposit address generation, deposit auto-credit, and withdrawal request creation.

The safest next implementation PR is not Phase 3 wallet generation. The next PR should add controlled internal funding beta gates: allowlist representation, funding enablement guard, kill switch guard, and tests proving anonymous and non-allowlisted users are blocked.

## 2. Current Readiness Classification

Classification: **Not ready for Phase 3**

Reason:

- Deposit wallet generation exists, but it is not allowlist-gated.
- Withdrawal requests exist, but they are not allowlist-gated.
- Deposit monitor crediting exists, but no explicit global funding kill switch was found in the deposit monitor path.
- There is no canonical `UserFundingProfile` or equivalent model separate from admin status.
- Audit logging is incomplete for controlled funding beta operations.
- Schema can represent much of the current flow, but it does not fully encode the target owner decisions for controlled internal funding beta.

## 3. Existing Schema And Model Mapping

| Required concept | Current mapping | Readiness |
| --- | --- | --- |
| User | `User` | Present |
| Admin marker | `User.isAdmin` | Present, but not funding allowlist |
| User funding allowlist | No canonical model/field found | Missing |
| User deposit wallet | `UserDepositAddress` | Partially ready |
| Deposit wallet status | `DepositAddressStatus` | Present |
| Deposit wallet chain/token | `SupportedChain`, `SupportedToken` | Present for Polygon USDC |
| Encrypted wallet key | `UserDepositAddress.encryptedPrivateKey` | Present |
| Encryption version | JSON payload includes `v: 1`; no schema column | Partially ready |
| Wallet provider | No explicit `self_managed` field | Missing |
| Deposit record | `Deposit` | Partially ready |
| Deposit idempotency | `@@unique([chain, txHash, logIndex])` | Present |
| Chain event record | `ChainDepositEvent` | Present, separate/legacy-adjacent |
| Balance | `UserBalance.availableUSDC`, `lockedUSDC` | Present |
| Ledger entry | `LedgerEntry` | Present |
| Ledger idempotency | `LedgerEntry.idempotencyKey` unique | Present |
| Withdrawal request | `WithdrawalRequest` | Partially ready |
| Admin processor | `WithdrawalRequest.processedByAdminId` | Present |
| Audit log | No canonical `AuditLog` model found | Missing |

## 4. Missing Schema Fields

Likely required before controlled internal funding beta:

- `UserFundingProfile` or equivalent:
  - `userId`
  - `fundingBetaAllowed`
  - `status`
  - optional limits
  - audit metadata
- Funding-specific global state or config source:
  - global funding enabled/disabled
  - deposit address generation enabled/disabled
  - auto-credit enabled/disabled
  - withdrawals enabled/disabled
- `UserDepositAddress.walletProvider` or equivalent marker for `self_managed`.
- Optional `UserDepositAddress.encryptionVersion` if the team wants queryable encryption versioning instead of JSON-only versioning.
- `Deposit.creditedLedgerEntryId` or equivalent durable reference to the exact ledger entry used for credit.
- Expanded `DepositStatus` values if the owner wants explicit duplicate/rejected lifecycle states.
- Expanded `WithdrawalRequestStatus` values if the owner wants `requested`, `pending_review`, `approved`, `sent`, and `completed` separated.
- `WithdrawalRequest` chain and asset fields.
- `WithdrawalRequest` hold/release/complete ledger entry references.
- Canonical audit log table for funding operations.

These gaps suggest a schema migration is required before Phase 3 should be exposed as a controlled internal beta feature.

## 5. Existing Funding Wallet Support

Current support:

- `UserDepositAddress` stores one active address per `userId`, `chain`, and `token`.
- `ensurePolygonUsdcDepositAddress(userId)` creates a new EVM wallet if no active Polygon USDC address exists.
- The generated address is normalized and stored.
- The raw private key is encrypted before persistence.
- `GET /api/deposits/address` returns only public deposit metadata and the deposit address.

Current gaps:

- No funding allowlist guard.
- No separate internal beta funding profile.
- No global funding kill switch guard.
- No explicit wallet provider field.
- Existing endpoint allows any authenticated user to create or retrieve a deposit address when deposit config is valid.

## 6. Private Key Encryption Readiness

Current support:

- `src/lib/wallets/depositWalletCrypto.ts` uses AES-256-GCM.
- Key material is derived by SHA-256 hashing `DEPOSIT_WALLET_ENCRYPTION_KEY`.
- `getDepositConfigIssues` requires `DEPOSIT_WALLET_ENCRYPTION_KEY` to be 64 hex characters when provided.
- Encrypted payload includes algorithm, IV, tag, data, and version.
- API responses inspected do not return raw or encrypted private-key fields.

Warnings:

- The wallet creation service logs user id, deposit address id, chain, token, and public address. It does not log private keys.
- Decryption exists server-side and should remain isolated. No current withdrawal broadcast should use generated deposit private keys.
- There is no dedicated test proving that API responses exclude raw/encrypted private-key fields.
- There is no dedicated operational rotation or incident runbook in schema.

Readiness: **Partially ready**

## 7. Deposit Monitor Readiness

Current support:

- `scanPolygonUsdcDeposits` uses a Polygon RPC provider and the configured Polygon USDC token address.
- It scans ERC-20 Transfer events.
- It matches transfers to active known deposit addresses.
- It tracks confirmations.
- It upserts deposits by `(chain, txHash, logIndex)`.
- It credits eligible deposits through `applyDepositTx`.
- It updates `lastScannedBlock` for active deposit addresses.

Current gaps:

- No explicit auto-credit enable/disable flag was found.
- No explicit funding kill switch guard was found in the monitor path.
- No internal funding allowlist check was found when scanning active deposit addresses.
- Audit log coverage is missing.
- The monitor depends on live RPC configuration and should remain disabled unless explicitly configured for controlled internal beta.

Readiness: **Partially ready, blocked by gates**

## 8. Auto-Credit Readiness

Current support:

- `creditPolygonDepositIfEligible` waits for configured confirmations.
- Credit goes through `applyDepositTx`.
- The ledger idempotency key is derived from Polygon USDC transaction hash and log index.
- Already credited deposits return without applying a second credit.
- Deposit record uniqueness also blocks duplicate deposit rows.

Current gaps:

- No durable `creditedLedgerEntryId` on `Deposit`.
- No explicit auto-credit kill switch.
- No allowlist guard before credit.
- No test file was identified specifically for Polygon deposit monitor duplicate auto-credit behavior.

Readiness: **Technically close, but not beta-ready until gates and tests exist**

## 9. Ledger Readiness

Current support:

- `LedgerEntry` includes:
  - `asset`
  - `status`
  - `amountDelta`
  - `reason`
  - `operation`
  - available and locked deltas
  - `idempotencyKey`
  - chain/tx/log/token references
  - `referenceType`
  - `referenceId`
- `UserBalance` has available and locked USDC buckets.
- Ledger service locks balance rows with `FOR UPDATE`.
- `applyDepositTx` is idempotent.
- Withdrawal request, reject, and complete paths create ledger entries.
- `recomputeBalanceFromLedger` supports custody reconciliation from ledger deltas.

Warnings:

- Some trading and settlement paths also mutate balances and write ledger entries. They are outside this funding review and must not be changed as part of funding beta.
- `LedgerEntry` uses generic `LedgerReason` and `LedgerOperation` values rather than the exact target names `deposit_credit`, `withdrawal_hold`, `withdrawal_release`, and `withdrawal_complete`.
- The current names are usable but should be mapped explicitly in docs/tests.

Readiness: **Ready with warnings for funding-only use after gates are added**

## 10. Withdrawal Hold Readiness

Current support:

- `requestWithdrawal` validates amount, destination EVM address, minimum withdrawal, available balance, daily limits, and max pending count.
- It creates a `WithdrawalRequest` with `PENDING` status.
- It moves funds from available to locked.
- It writes a `WITHDRAWAL_REQUEST` ledger entry.
- `rejectWithdrawalByAdmin` releases locked funds back to available and writes `WITHDRAWAL_REJECT`.
- `completeWithdrawalByAdmin` consumes locked funds, requires a transaction hash, and writes `WITHDRAWAL_COMPLETE`.
- No automatic blockchain broadcast code was observed in the withdrawal service.

Current gaps:

- No funding allowlist guard.
- No funding kill switch guard.
- `WithdrawalRequest` does not store chain/asset.
- No explicit hold/release/complete ledger entry id fields on `WithdrawalRequest`.
- Status model is compressed to `PENDING`, `COMPLETED`, `REJECTED`, `FAILED`.

Readiness: **Partially ready, blocked by gates and schema precision**

## 11. Admin Manual Review Readiness

Current support:

- Admin withdrawal list route exists.
- Admin complete and reject routes exist.
- Admin complete requires tx hash.
- Admin routes call admin guards.
- Admin action passes `adminUserId` into the withdrawal service.
- Admin deposits list and rescan route exist.

Current gaps:

- No canonical audit log.
- Rescan route can trigger deposit scanning/crediting and should be treated as high risk.
- Admin complete/reject is operationally sensitive and needs additional manual review/testing before real internal funds.

Readiness: **Partially ready**

## 12. Audit Log Readiness

Current support:

- Ledger entries provide financial event traces.
- Withdrawal records store processed admin user id and notes.
- Console logs exist for deposit and withdrawal operations.

Missing:

- No canonical `AuditLog` model found.
- No structured audit trail for allowlist changes.
- No structured audit trail for kill-switch changes.
- No structured audit trail for deposit wallet creation without relying on application logs.
- No structured audit trail for admin funding actions beyond withdrawal fields and ledger entries.

Readiness: **Not ready**

## 13. Allowlist Readiness

Current support:

- Authentication exists.
- Admin marker exists.
- Admin routes use admin checks.

Missing:

- No canonical funding allowlist separate from admin.
- No field such as `fundingBetaAllowed`.
- No helper such as `requireInternalFundingUser`.
- Deposit address route does not block authenticated non-allowlisted users.
- Withdrawal request routes do not block authenticated non-allowlisted users.
- Deposit monitor does not filter active addresses by allowlist state.

Readiness: **Not ready**

## 14. Kill Switch Readiness

Current support:

- Config has many funding-related values:
  - `POLYGON_RPC_URL`
  - `POLYGON_USDC_ADDRESS`
  - `DEPOSIT_CONFIRMATIONS`
  - `DEPOSIT_MIN_USD`
  - `DEPOSIT_WALLET_ENCRYPTION_KEY`
  - `DEPOSIT_MONITOR_POLL_INTERVAL_MS`
  - withdrawal limits
- Missing config disables parts of deposit setup.

Missing:

- No explicit `FUNDING_KILL_SWITCH`.
- No explicit `INTERNAL_FUNDING_BETA_ENABLED`.
- No explicit `AUTO_DEPOSIT_CREDIT_ENABLED`.
- No explicit `WITHDRAWALS_ENABLED`.
- No consistent guard across deposit address generation, monitor crediting, and withdrawal request creation.

Readiness: **Not ready**

## 15. Limits Readiness

Current support:

- Withdrawal minimum, per-user daily limit, global daily limit, and max pending count are present in config and enforced by `requestWithdrawal`.
- Deposit minimum exists.

Missing:

- Per-user daily deposit limit.
- Global beta exposure limit.
- Per-user funding beta limit.
- Controlled internal allowlist-specific limits.
- Explicit auto-credit max amount per transaction/day.

Readiness: **Partially ready**

## 16. Test Coverage Status

Existing coverage identified:

- Ledger invariants and idempotency in `src/server/services/__tests__/ledger.phase3.test.ts`.
- Withdrawal request, completion, rejection, daily limits, invalid address, insufficient balance, and ledger entries in `src/server/services/__tests__/withdrawals.phase8.test.ts`.
- Admin withdrawal complete route test exists.
- Config validation tests exist.

Missing or incomplete for controlled internal funding beta:

- Funding allowlist tests.
- Anonymous blocked tests for deposit address route and withdrawal request route.
- Authenticated non-allowlisted blocked tests.
- Funding kill-switch tests.
- Deposit address private-key no-leak tests.
- Deposit get-or-create idempotency tests.
- Polygon deposit duplicate tx/log no double-credit tests.
- Deposit monitor kill-switch tests.
- Auto-credit disabled tests.
- Admin deposit rescan authorization and safety tests.
- Audit-log tests.

## 17. Exact Blockers

Phase 3 should not start until these are resolved or explicitly accepted for human-reviewed implementation:

1. Add canonical internal funding allowlist representation.
2. Add funding allowlist guard for deposit address generation.
3. Add funding allowlist guard for withdrawal request creation.
4. Add funding kill switch guard across deposit address generation, auto-credit, and withdrawal requests.
5. Add tests proving anonymous and non-allowlisted users cannot access funding paths.
6. Add tests proving private-key fields do not leak through deposit address APIs.
7. Decide whether schema must add provider, ledger reference ids, audit log, and funding profile before any behavior PR.

## 18. Exact Recommended Next PR

Recommended next PR: **Phase 2B / 2C controlled funding gates**

Suggested branch:

`agent/beta-funding-allowlist-kill-switch`

Suggested title:

`funding(beta): add internal funding allowlist and kill switch`

Suggested scope:

- Add or propose the minimal schema support for a controlled internal funding allowlist.
- Add a server-only funding guard.
- Add config flags for internal beta funding gates.
- Gate deposit address generation.
- Gate withdrawal request creation.
- Gate monitor auto-credit or document why monitor gating needs its own PR.
- Add tests for anonymous, non-allowlisted, kill-switch, and no-leak behavior.

Human review required if schema or migrations are included.

## 19. Whether Phase 3 Deposit Wallet Generation Can Start Safely

No.

The repo already has deposit wallet generation, but it should not be treated as an approved Phase 3 internal beta feature until allowlist and kill-switch controls are added and tested.

## 20. Whether Prisma Migration Is Required

Yes, likely.

At minimum, a controlled funding allowlist needs durable representation. The safest approach is a narrow schema PR for a `UserFundingProfile` or equivalent model. Additional schema fields for wallet provider, audit logs, and funding ledger references should be considered before real internal funds.

## 21. Whether Deposit Auto-Credit Can Be Implemented Safely Later

Yes, but only after:

- Funding allowlist exists.
- Funding kill switch exists.
- Auto-credit enable/disable flag exists.
- Duplicate-credit tests pass.
- Deposit monitor tests prove unsupported token/chain ignores.
- Ledger idempotency tests cover the monitor path.
- Audit/reconciliation plan is documented.

## 22. Whether Withdrawal Hold Can Be Implemented Safely Later

Yes, but only after:

- Funding allowlist exists.
- Funding kill switch exists.
- Withdrawal request routes are allowlist-gated.
- Chain/asset semantics are explicit.
- Hold/release/complete ledger references are either added to schema or explicitly mapped to existing ledger entries.
- Admin manual review tests pass.
- No automatic withdrawal broadcast remains true.

## 23. Phase 2 Decision

Decision: **Stop before Phase 3 and proceed to a gated Phase 2B/2C PR.**

Phase 3 should not start from the current state. The current implementation is close in several technical areas, but it is not safe for controlled internal funding beta because the critical product decision is not just "authenticated users may fund"; it is "allowlisted internal users may fund under explicit kill switches and limits."
