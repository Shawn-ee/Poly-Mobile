# Controlled Internal Funding Beta Architecture

Date: 2026-06-19

Scope: Architecture and owner-decision document only. This document does not approve public beta, production launch, live bots, automated withdrawal broadcast, unrestricted deposits, anonymous funding, or broad money movement.

## Owner Decisions

The controlled internal funding beta is approved only under these constraints:

- Internal beta allows deposits.
- Internal beta allows automatic deposit credit after chain confirmation.
- Internal beta uses self-managed EVM deposit addresses.
- Each allowlisted internal user gets a unique EVM deposit address.
- Admin manual credit is not required for normal confirmed deposits.
- Users may request withdrawals.
- Withdrawal request places funds on hold.
- Admin manually reviews withdrawals.
- Admin manually sends payout from treasury/hot wallet.
- Admin manually records payout tx hash.
- Automated withdrawal broadcast is not approved.
- Public funding is not approved.
- Anonymous funding is not approved.
- Production deployment is not approved.
- Live bots are not approved.

## Definition

Controlled internal funding beta means:

- only allowlisted internal users can access funding flows.
- no anonymous user can receive a deposit address or request a withdrawal.
- no non-allowlisted signed-in user can receive a deposit address or request a withdrawal.
- deposits can be monitored and auto-credited after confirmations.
- withdrawal requests can hold funds.
- admin completion records an externally sent payout tx hash.
- the application never signs or broadcasts withdrawals in beta v1.
- all wallet private keys remain server-only, encrypted at rest, and never returned by APIs.

## Deposit Flow

Target flow:

1. User signs in.
2. Server checks controlled funding beta flags.
3. Server checks user funding allowlist.
4. Server checks funding kill switch.
5. Server gets or creates one active self-managed EVM deposit wallet for `(user, chain, asset)`.
6. Server returns only public deposit metadata:
   - deposit address
   - chain
   - asset
   - status
   - minimum amount
   - confirmation requirement
   - internal beta warnings
7. User sends supported token to the public deposit address.
8. Deposit monitor observes supported ERC-20 Transfer event.
9. Monitor matches destination to a known active deposit address.
10. Monitor records a deposit by `(chain, txHash, logIndex)`.
11. Monitor waits until required confirmations.
12. Monitor credits platform balance through ledger-safe deposit path.
13. Duplicate tx/logIndex or duplicate ledger idempotency key cannot credit twice.

## Withdrawal Flow

Target flow:

1. User signs in.
2. Server checks controlled funding beta flags.
3. Server checks user funding allowlist.
4. Server checks funding kill switch.
5. User submits destination EVM address, supported chain/asset, and amount.
6. Server validates address, amount, supported asset, available balance, limits, and pending request count.
7. Server creates a withdrawal request in pending review state.
8. Server moves funds from available to locked through ledger-safe hold.
9. Admin manually reviews the request.
10. Admin either rejects or completes:
    - reject releases locked funds through ledger-safe release.
    - complete requires tx hash from externally/manual payout and consumes locked funds.
11. No app code signs or broadcasts a withdrawal transaction in internal beta v1.

## Self-Managed EVM Wallet Architecture

Existing implementation:

- `UserDepositAddress` stores the deposit address and encrypted private key.
- `src/lib/wallets/userDepositAddresses.ts` creates a new EVM wallet with `ethers.Wallet.createRandom()`.
- `src/lib/wallets/depositWalletCrypto.ts` encrypts the private key with AES-256-GCM.

Target additions:

- Add or identify a canonical funding allowlist guard.
- Add or identify a canonical funding kill-switch guard.
- Add tests proving:
  - raw private key is never stored.
  - raw private key is never returned.
  - encrypted private key is never returned.
  - get-or-create is idempotent.
  - non-allowlisted users are blocked.

## Private Key Encryption Design

Current:

- Env variable: `DEPOSIT_WALLET_ENCRYPTION_KEY`
- Format requirement: 64 hex characters.
- Encryption: AES-256-GCM.
- Payload includes version `v`, algorithm, IV, tag, and encrypted data.

Target:

- Keep private keys server-only.
- Continue storing only encrypted private keys.
- Do not log raw private keys.
- Do not log encrypted private keys.
- Do not expose raw or encrypted private keys in API responses.
- Document whether the canonical env name remains `DEPOSIT_WALLET_ENCRYPTION_KEY` or migrates to `WALLET_ENCRYPTION_KEY`.
- Define key rotation before production or broader beta.

## Env Flags

Recommended flags:

- `CONTROLLED_INTERNAL_FUNDING_BETA=true`
- `FUNDING_KILL_SWITCH=false`
- `ALLOW_INTERNAL_DEPOSIT_TESTING=true`
- `ALLOW_AUTO_DEPOSIT_CREDIT=true`
- `ALLOW_USER_WITHDRAWAL_REQUEST=true`
- `WITHDRAWALS_MANUAL_REVIEW_ONLY=true`
- `AUTO_WITHDRAWAL_BROADCAST=false`
- `PUBLIC_FUNDING_ENABLED=false`
- `ANONYMOUS_FUNDING_ENABLED=false`
- `LIVE_BOTS=false`
- `SUPPORTED_FUNDING_CHAIN=POLYGON`
- `SUPPORTED_FUNDING_ASSET=USDC`
- `POLYGON_RPC_URL`
- `POLYGON_USDC_ADDRESS`
- `DEPOSIT_CONFIRMATIONS`
- `DEPOSIT_MIN_USD`
- `DEPOSIT_MONITOR_POLL_INTERVAL_MS`
- `DEPOSIT_WALLET_ENCRYPTION_KEY` or approved replacement `WALLET_ENCRYPTION_KEY`

Existing related env/config:

- `POLYGON_RPC_URL`
- `POLYGON_USDC_ADDRESS`
- `DEPOSIT_CONFIRMATIONS`
- `DEPOSIT_MIN_USD`
- `DEPOSIT_MONITOR_POLL_INTERVAL_MS`
- `DEPOSIT_WALLET_ENCRYPTION_KEY`
- `WITHDRAWAL_MIN_USDC`
- `WITHDRAWAL_USER_DAILY_LIMIT_USDC`
- `WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC`
- `WITHDRAWAL_MAX_PENDING_PER_USER`
- `TREASURY_WALLET_ADDRESS`
- `TREASURY_PRIVATE_KEY`

`TREASURY_PRIVATE_KEY` should not be used for internal beta v1 withdrawals because automated withdrawal broadcast is not approved.

## Allowlist Design

Recommended Phase 2 decision:

- Add `UserFundingProfile` or equivalent table:
  - `userId`
  - `fundingBetaAllowed`
  - `status`
  - timestamps
  - optional limits
  - optional reviewer fields

Alternative:

- Use an env allowlist of emails/user IDs for the first internal test, but this is less auditable and harder to operate.

Preferred:

- Database-backed allowlist with admin/manual provisioning, plus explicit tests.

Guard requirements:

- authenticated user required.
- allowlisted internal funding user required.
- admin status alone should not imply funding allowlist.
- allowlist check must be used by:
  - deposit address API.
  - withdrawal request API.
  - any future wallet UI funding endpoint.

## Kill Switch Design

Recommended guards:

- global funding kill switch blocks deposit address creation and withdrawal request.
- auto-credit switch blocks ledger credit in the monitor without blocking detection records.
- public funding switch remains false.
- anonymous funding switch remains false.

Minimum required behavior:

- kill switch on:
  - `GET /api/deposits/address` returns unavailable.
  - `POST /api/withdrawals/request` returns unavailable.
  - deposit monitor does not credit balances.
- monitor can optionally still detect deposits for operator review if explicitly approved.

## Deposit Monitor Design

Existing monitor should remain the base:

- Polygon USDC only.
- ERC-20 Transfer logs only.
- Known active deposit addresses only.
- Unique `(chain, txHash, logIndex)` deposit record.
- Confirmation threshold from config.
- Ledger idempotency key based on tx hash/log index.

Required before internal funding beta:

- explicit funding kill-switch check.
- explicit auto-credit enabled check.
- tests for duplicate tx/logIndex.
- tests for unsupported token/chain.
- tests for insufficient confirmations.
- tests proving no private key is needed for monitoring.

## Auto-Credit Design

Auto-credit is approved for confirmed internal deposits.

Safety requirements:

- credit only confirmed supported token deposits.
- credit only known active deposit addresses.
- credit only once per `(chain, txHash, logIndex)`.
- credit only once per ledger idempotency key.
- mutate balances only through ledger-safe path.
- no admin manual credit required for normal confirmed deposits.
- below-minimum or unsupported deposits are not credited automatically.

Existing support:

- `Deposit` unique `(chain, txHash, logIndex)`.
- `applyDepositTx` ledger idempotency.
- `UserBalance` row lock.

## Ledger Design

Existing ledger can represent:

- deposit credit: `LedgerReason.DEPOSIT`, `LedgerOperation.DEPOSIT`.
- withdrawal hold: `WITHDRAWAL_REQUEST`.
- withdrawal completion: `WITHDRAWAL_COMPLETE`.
- withdrawal release/reject: `WITHDRAWAL_REJECT`.

Recommended Phase 2 review:

- decide whether to add direct ledger-entry foreign keys on `Deposit` and `WithdrawalRequest`.
- decide whether current `reason` / `operation` naming is acceptable or whether new explicit enum values are needed.
- add tests for any new funding guards before any behavior change.

## Withdrawal Hold Design

Existing withdrawal service already implements:

- validation of amount.
- validation of EVM destination format.
- min withdrawal.
- per-user daily limit.
- global daily limit.
- max pending per user.
- available balance check.
- pending request creation.
- available-to-locked hold.
- admin completion with tx hash.
- admin rejection releasing hold.
- no observed automatic broadcast.

Required before controlled beta:

- allowlist guard.
- kill switch guard.
- route-level tests for anonymous/non-allowlisted users.
- explicit no-auto-broadcast assertion.
- operator runbook for manual payout.

## Admin Manual Payout Workflow

Target admin workflow:

1. Admin reviews pending request.
2. Admin verifies destination address, amount, user identity, limits, and risk notes.
3. Admin manually sends payout from treasury/hot wallet outside the app.
4. Admin copies payout tx hash into POLY.
5. POLY validates tx hash format and uniqueness.
6. POLY marks request completed and consumes locked funds.

Important:

- Admin UI must not contain or display treasury private key.
- POLY must not sign or broadcast the withdrawal.
- Completion means "admin says external/manual payout was sent and records tx hash", not "app sent payout".

## Audit Log Design

No dedicated `AuditLog` model was found.

Recommended:

- Add audit logging before or alongside admin funding operations if the team wants operational-grade traceability.
- Minimum audit events:
  - funding allowlist change.
  - deposit address created.
  - deposit detected.
  - deposit credited.
  - withdrawal requested.
  - withdrawal rejected.
  - withdrawal completed.
  - deposit rescan requested.
  - funding kill switch changed, if made app-managed.

Until a dedicated audit log exists, `LedgerEntry`, `Deposit`, `WithdrawalRequest`, and server logs provide partial evidence but not a complete audit trail.

## Limit Design

Existing withdrawal limits:

- `WITHDRAWAL_MIN_USDC`
- `WITHDRAWAL_USER_DAILY_LIMIT_USDC`
- `WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC`
- `WITHDRAWAL_MAX_PENDING_PER_USER`

Recommended deposit limits:

- minimum deposit already exists as `DEPOSIT_MIN_USD`.
- add or document maximum per deposit.
- add or document daily credit cap per user.
- add or document global auto-credit cap.
- add operator alerting for deposits below minimum, unsupported token, or repeated failures.

## Risks

Critical:

- Deposit address and withdrawal request are not currently gated by a controlled funding allowlist.
- Deposit monitor auto-credit lacks explicit funding kill-switch / auto-credit-enabled guard.
- Wallet UI still says real deposits and withdrawals are disabled, while APIs exist.

High:

- No dedicated audit log model.
- `TREASURY_PRIVATE_KEY` exists in config and must not be used for beta withdrawal broadcast.
- Admin deposit rescan can trigger monitor behavior and should be operator-reviewed.
- Public beta docs still say public beta is blocked; controlled internal funding beta must remain separate.

Medium:

- Schema naming differs from owner target but may be operationally sufficient.
- Direct ledger-entry IDs are not stored on deposit/withdrawal models.
- Withdrawal statuses are simpler than target statuses.

## Blockers

Before behavior PRs:

1. Define canonical funding allowlist model or guard.
2. Define canonical funding kill switch.
3. Add tests for allowlist and kill switch.
4. Decide whether schema changes are needed for `UserFundingProfile`, audit log, direct ledger refs, provider, encryption version, and expanded statuses.
5. Decide env name compatibility for `DEPOSIT_WALLET_ENCRYPTION_KEY` versus `WALLET_ENCRYPTION_KEY`.

## Phase-By-Phase Implementation Plan

Phase 0: inspection

- Completed by `CONTROLLED_INTERNAL_FUNDING_BETA_REPO_INSPECTION.md`.

Phase 1: architecture docs and owner decisions

- Complete in docs-only PR.

Phase 2: schema/ledger readiness review

- Decide whether schema changes are required.
- If required, create one schema-only PR and leave open for human review.

Phase 3: deposit wallet generation

- Add allowlist and kill-switch guard before relying on existing deposit address generation.
- Add no-leak and idempotency tests.

Phase 4: deposit address API/UI

- Expose address only to allowlisted users.
- Align wallet UI copy with controlled internal funding beta.

Phase 5: chain monitor + auto-credit

- Add auto-credit and kill-switch guards.
- Add duplicate, unsupported token, and confirmation tests.

Phase 6: withdrawal request + balance hold

- Add allowlist and kill-switch guard to user request route.
- Confirm no automatic broadcast.

Phase 7: admin manual withdrawal review

- Strengthen admin route tests and audit evidence.

Phase 8: evidence and go/no-go

- Produce internal funding beta evidence and go/no-go docs.

## Non-Goals

This architecture PR does not:

- change Prisma schema.
- generate wallets.
- decrypt private keys.
- alter private-key handling.
- enable deposits.
- enable withdrawals.
- alter ledger mutation behavior.
- alter deposit monitor behavior.
- alter withdrawal hold/complete/reject behavior.
- change admin auth.
- change bot behavior.
- deploy production.
- approve public beta.
