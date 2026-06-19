# Controlled Internal Funding Beta Repo Inspection

Date: 2026-06-19

Branch: `agent/beta-funding-architecture-plan`

Scope: Phase 0 inspection only. This document records what exists today and what must be reviewed before implementing controlled internal funding beta behavior. No product code, schema, migrations, secrets, bot runtime, deployment, wallet funding logic, ledger mutation logic, matching, settlement, or admin auth behavior is changed by this review.

## Owner Funding Beta Decisions

- `CONTROLLED_INTERNAL_FUNDING_BETA=true`
- `ALLOW_INTERNAL_DEPOSIT_TESTING=true`
- `ALLOW_AUTO_DEPOSIT_CREDIT=true`
- `ALLOW_USER_WITHDRAWAL_REQUEST=true`
- `WITHDRAWALS_MANUAL_REVIEW_ONLY=true`
- `SELF_MANAGED_EVM_DEPOSIT_WALLETS=true`
- `PUBLIC_BETA=false`
- `PRODUCTION_LAUNCH=false`
- `AUTO_WITHDRAWAL_BROADCAST=false`
- `LIVE_BOTS=false`

## Files Inspected

- `prisma/schema.prisma`
- `src/lib/config.ts`
- `src/lib/auth.ts`
- `src/lib/admin.ts`
- `src/lib/internalAdminAuth.ts`
- `src/lib/wallets/depositWalletCrypto.ts`
- `src/lib/wallets/userDepositAddresses.ts`
- `src/lib/deposits/polygonDeposits.ts`
- `src/lib/deposits/verifyUsdcDeposit.ts`
- `src/workers/depositMonitor/polygonMonitor.ts`
- `src/server/services/ledger.ts`
- `src/server/services/withdrawals.ts`
- `src/app/api/deposits/address/route.ts`
- `src/app/api/admin/deposits/route.ts`
- `src/app/api/admin/deposits/rescan/route.ts`
- `src/app/api/withdrawals/request/route.ts`
- `src/app/api/withdrawals/route.ts`
- `src/app/api/admin/withdrawals/route.ts`
- `src/app/api/admin/withdrawals/[id]/complete/route.ts`
- `src/app/api/admin/withdrawals/[id]/reject/route.ts`
- `src/app/wallet/page.tsx`
- `src/app/admin/deposits/page.tsx`
- `src/app/admin/withdrawals/page.tsx`
- `src/server/services/__tests__/ledger.phase3.test.ts`
- `src/server/services/__tests__/withdrawals.phase8.test.ts`
- funding, wallet, ledger, public beta, and admin review docs under `docs/reviews/`

## Current Funding Implementation Status

POLY already contains significant funding infrastructure:

- Self-managed Polygon USDC deposit address model exists as `UserDepositAddress`.
- Encrypted private key storage exists as `UserDepositAddress.encryptedPrivateKey`.
- Private key encryption helper exists in `src/lib/wallets/depositWalletCrypto.ts`.
- Deposit address get-or-create helper exists in `src/lib/wallets/userDepositAddresses.ts`.
- Deposit address API exists at `GET /api/deposits/address`.
- Deposit monitor service exists in `src/lib/deposits/polygonDeposits.ts`.
- Deposit monitor worker wrapper exists in `src/workers/depositMonitor/polygonMonitor.ts`.
- Deposit records exist as `Deposit`.
- Legacy/manual verification event model exists as `ChainDepositEvent`.
- Ledger balance model exists as `UserBalance`.
- Ledger entry model exists as `LedgerEntry`.
- Ledger transaction model exists as `LedgerTransaction`.
- Withdrawal request model exists as `WithdrawalRequest`.
- User withdrawal request API exists at `POST /api/withdrawals/request`.
- Admin withdrawal list, completion, and rejection APIs exist under `/api/admin/withdrawals`.
- Admin deposit list and rescan APIs exist under `/api/admin/deposits`.
- Ledger tests cover deposit idempotency, withdrawal request idempotency, balance locking, withdrawal completion, withdrawal rejection, and reconciliation.
- Withdrawal tests cover request, insufficient funds, invalid destination, limits, completion, rejection, double completion, complete-after-reject, reject-after-complete, and ledger entries.

## Existing Wallet, Deposit, And Withdrawal Routes

User-facing:

- `/wallet`
- `GET /api/deposits/address`
- `GET /api/withdrawals`
- `POST /api/withdrawals/request`
- legacy/faucet/linking routes under `/api/wallet/*`

Admin:

- `/admin/deposits`
- `/admin/withdrawals`
- `GET /api/admin/deposits`
- `POST /api/admin/deposits/rescan`
- `GET /api/admin/withdrawals`
- `POST /api/admin/withdrawals/[id]/complete`
- `POST /api/admin/withdrawals/[id]/reject`

Important UI observation:

- `/wallet` currently has beta-safe copy saying real-money deposits and withdrawals are disabled.
- The wallet page currently defines a static empty `depositAddressInfo` object and does not appear to fetch `GET /api/deposits/address` for a usable address in the inspected section.
- The wallet page still contains withdrawal request UI logic calling `/api/withdrawals/request`, but visible copy says withdrawals are not available for public beta use.

## Existing Balance And Ledger Models

`UserBalance`:

- `userId`
- `availableUSDC`
- `lockedUSDC`
- `version`
- timestamps

`LedgerEntry`:

- `userId`
- `asset`
- `status`
- `currency`
- `amountDelta`
- `reason`
- `operation`
- `deltaAvailableUSDC`
- `deltaLockedUSDC`
- `balanceBefore`
- `balanceAfter`
- `idempotencyKey`
- `chainId`
- `txHash`
- `logIndex`
- `tokenAddress`
- `referenceType`
- `referenceId`
- `createdAt`
- unique `idempotencyKey`

Ledger services include row-locking and idempotent deposit application through `applyDeposit` / `applyDepositTx`.

## Existing Deposit Models

`UserDepositAddress` maps closely to the desired `UserDepositWallet` concept:

- `userId`
- `chain`
- `token`
- `address`
- `encryptedPrivateKey`
- `status`
- `lastScannedBlock`
- timestamps
- unique `(userId, chain, token)`
- unique `address`

`Deposit` maps closely to the desired deposit record:

- `userId`
- `depositAddressId`
- `chain`
- `token`
- `txHash`
- `logIndex`
- `fromAddress`
- `toAddress`
- `amount`
- `blockNumber`
- `confirmations`
- `detectedAt`
- `creditedAt`
- `status`
- `rawEventJson`
- timestamps
- unique `(chain, txHash, logIndex)`

Current deposit statuses:

- `DETECTED`
- `CONFIRMING`
- `CREDITED`
- `FAILED`
- `IGNORED`

Missing compared with the owner target:

- explicit `DUPLICATE` status, though duplicate safety is currently represented by the unique `(chain, txHash, logIndex)` constraint and ledger idempotency key.
- explicit `REJECTED` status.
- direct `creditedLedgerEntryId` field.
- explicit `walletProvider = self_managed` field.
- explicit encryption version field separate from encrypted payload metadata.

## Existing Withdrawal Model

`WithdrawalRequest` includes:

- `id`
- `userId`
- `processedByAdminId`
- `amountUSDC`
- `destinationAddress`
- `status`
- `adminNotes`
- `requestedAt`
- `completedAt`
- `rejectedAt`
- `completedTxHash`
- timestamps
- unique `completedTxHash`

Current statuses:

- `PENDING`
- `COMPLETED`
- `REJECTED`
- `FAILED`

Existing service behavior:

- User request locks available funds into locked funds through a `WITHDRAWAL_REQUEST` ledger entry.
- Admin completion consumes locked funds and records `completedTxHash` through a `WITHDRAWAL_COMPLETE` ledger entry.
- Admin rejection releases locked funds through a `WITHDRAWAL_REJECT` ledger entry.
- No automatic blockchain payout or signing behavior was observed in the withdrawal service.

Missing compared with the owner target:

- explicit `REQUESTED`, `PENDING_REVIEW`, `APPROVED`, and `SENT` statuses.
- explicit `chain` and `asset` fields.
- direct `holdLedgerEntryId`, `releaseLedgerEntryId`, and `completeLedgerEntryId` fields.
- dedicated audit log model for admin review actions.
- explicit allowlist/funding-beta guard in the request route.

## Existing Admin Review Capability

Admin withdrawal review exists:

- `GET /api/admin/withdrawals` lists pending/recent withdrawal requests.
- `POST /api/admin/withdrawals/[id]/complete` requires admin, requires tx hash, completes the request, and consumes locked balance.
- `POST /api/admin/withdrawals/[id]/reject` requires admin and releases the hold.

Admin deposit review exists:

- `GET /api/admin/deposits` lists pending/recent Polygon USDC deposits.
- `POST /api/admin/deposits/rescan` allows admin-triggered deposit rescans.

Admin guard:

- `requireAdmin` checks signed-in user `isAdmin`.
- Some admin routes use `assertAdmin` through market guards.
- Dev admin override exists only outside production via `x-dev-admin-user-id`.

## Existing Auth And Allowlist Mechanism

Authentication exists through session cookies and user records.

Admin authorization exists through `isAdmin`.

No dedicated controlled-funding allowlist was found:

- no `UserFundingProfile` model.
- no `fundingBetaAllowed` field on `User`.
- no explicit `INTERNAL_FUNDING_ALLOWLIST` env parser found.
- no reusable funding allowlist guard was found.
- deposit address creation only requires authenticated user plus deposit config.
- withdrawal request only requires authenticated user plus available balance and limits.

This is the most important Phase 2/3 blocker for controlled internal funding beta.

## Existing Chain Monitor Capability

Polygon USDC monitor exists:

- Reads active `UserDepositAddress` rows.
- Fetches ERC-20 Transfer logs for known destination addresses.
- Matches transfers to known deposit addresses.
- Upserts `Deposit` records by `(chain, txHash, logIndex)`.
- Ignores deposits below minimum.
- Requires configured confirmations before crediting.
- Credits through `applyDepositTx` with idempotency key `polygon-usdc:{txHash}:{logIndex}`.
- Tracks errors in scan summary.

Potential blocker:

- No explicit `AUTO_DEPOSIT_CREDIT_ENABLED` or `FUNDING_KILL_SWITCH` guard was found in the monitor path.
- No funding allowlist guard was found in the monitor path beyond known deposit addresses.

## Existing Private Key Handling

Observed safe properties:

- `Wallet.createRandom()` is server-side in `src/lib/wallets/userDepositAddresses.ts`.
- Private key is encrypted before database storage by `encryptPrivateKey`.
- API response from `GET /api/deposits/address` returns only public address/network/token/minimum/confirmation/warnings.
- Admin deposit APIs return deposit address but not encrypted private key.

Concerns:

- The encryption key env var is currently named `DEPOSIT_WALLET_ENCRYPTION_KEY`, while the owner target names `WALLET_ENCRYPTION_KEY`.
- The current encryption helper hashes the configured secret with SHA-256 before AES-256-GCM. This can be acceptable if the env secret is high-entropy, but the design should explicitly document rotation and naming before Phase 3 changes.
- `decryptPrivateKey` exists and should stay server-only. No inspected deposit monitor or withdrawal service uses it.
- No test was found specifically asserting the deposit address API does not return `privateKey` or `encryptedPrivateKey`.

## Missing Schema / Models

Likely missing or incomplete for the owner target:

- `UserFundingProfile` or equivalent allowlist state.
- funding kill switch state or explicit env-driven funding gates.
- direct audit log model.
- direct ledger-entry references from `Deposit` and `WithdrawalRequest`.
- explicit `walletProvider` and encryption version fields if required by future audits.
- expanded withdrawal statuses if the product wants `requested`, `pending_review`, `approved`, `sent`, `completed`, `failed`.

However, the existing schema can represent core internal beta flows today with conventions:

- `UserDepositAddress` can serve as the self-managed wallet record.
- `Deposit` plus `LedgerEntry.idempotencyKey` can represent duplicate-safe auto-credit.
- `WithdrawalRequest` plus ledger entries can represent hold/release/complete.

## Missing Tests

Known missing or incomplete tests for controlled internal funding beta:

- Deposit address API authorization and response no-leak tests.
- Deposit wallet encryption no-plaintext persistence tests.
- Deposit get-or-create idempotency tests.
- Funding allowlist guard tests.
- Funding kill switch guard tests.
- Auto-credit disabled tests.
- Deposit monitor duplicate tx/logIndex tests specific to `Deposit`.
- Unsupported token/chain ignore tests for monitor.
- Admin deposit rescan authorization tests.
- User withdrawal route allowlist/kill-switch tests.
- Admin withdrawal route unauthorized/forbidden/positive tests beyond current complete-route coverage.
- No automatic withdrawal broadcast/no signing-code assertion.

Existing relevant tests:

- `src/server/services/__tests__/ledger.phase3.test.ts`
- `src/server/services/__tests__/withdrawals.phase8.test.ts`
- `src/__tests__/admin.withdrawals.complete.route.test.ts`
- public no-leak tests that include private-key forbidden keys for public route groups.

## Blockers Before Funding Behavior PRs

Critical blockers:

1. Controlled funding allowlist is missing or not canonical.
2. Funding kill switch is missing from deposit address, deposit monitor, and withdrawal request paths.
3. Deposit address generation currently allows any authenticated user if config is present.
4. Withdrawal request currently allows any authenticated user with balance if config/limits pass.
5. Wallet UI copy currently says deposits/withdrawals disabled, so behavior and UI are not aligned for allowlisted internal users.
6. No explicit internal-funding env flag set was found.
7. No audit log model was found.
8. `gh` authentication failed in this Codex session, so PR opening may be blocked even if branch push succeeds.

High blockers:

1. Deposit monitor auto-credit exists but needs kill-switch and auto-credit-enable guard before internal funding beta.
2. Deposit address no-leak tests should be added before exposing addresses to allowlisted beta users.
3. Withdrawal request route tests should prove anonymous/non-allowlisted/kill-switch paths are blocked.
4. Admin funding screens should be reviewed before operational use.

## Recommended First PR

Recommended first PR:

`docs(beta): define controlled internal funding beta architecture`

Branch:

`agent/beta-funding-architecture-plan`

Scope:

- create Phase 0 inspection doc.
- create controlled internal funding beta architecture doc.
- create owner human decision record.
- create implementation plan.
- create funding beta continuation prompt.

Why first:

- The repo already contains partial funding behavior, so the safest immediate step is to document the exact controlled-beta target and the gaps before touching schema, wallet generation, ledger mutation, deposit monitor, or withdrawal routes.

Next recommended implementation phase after this PR:

- Phase 2 schema/ledger readiness review, with a narrow decision on whether to add `UserFundingProfile` and funding gates before any deposit address or withdrawal behavior change.
