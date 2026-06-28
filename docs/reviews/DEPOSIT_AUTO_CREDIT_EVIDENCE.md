# Deposit Auto-Credit Evidence

Date: 2026-06-19

Branch: `agent/beta-auto-deposit-credit-hardening`

## Executive Summary

Phase 5 adds tests and evidence for the existing Polygon USDC deposit monitor and confirmed deposit auto-credit flow.

This PR is tests/docs only. It does not change deposit monitor runtime behavior, ledger math, balance mutation semantics, private-key behavior, schema, migrations, package files, workflows, deployment, withdrawal behavior, admin payout behavior, public funding, or automatic withdrawal broadcast.

## Reviewed Implementation

Reviewed files:

- `src/lib/deposits/polygonDeposits.ts`
- `src/lib/fundingBeta.ts`
- `src/server/services/ledger.ts`
- `src/__tests__/funding-beta.deposit-monitor.test.ts`

## Evidence Added

`src/__tests__/funding-beta.deposit-monitor.test.ts` now verifies:

- kill switch / auto-credit guard blocks monitor scan before chain access.
- unsupported chain is ignored before deposit upsert.
- unsupported token is ignored before deposit upsert.
- unconfirmed supported transfer records a deposit and marks it confirming without ledger credit.
- confirmed deposit calls `applyDepositTx` with a deterministic `polygon-usdc:<txHash>:<logIndex>` idempotency key.
- confirmed deposit references the `Deposit` row when applying ledger credit.
- already credited deposit does not call `applyDepositTx` again.

## Safety Review

DepositMonitorAgent result: Pass for tests/docs scope.

LedgerAgent result: Pass for tests/docs scope.

SecurityAgent result: Pass for tests/docs scope.

The existing implementation uses:

- `assertAutoDepositCreditAllowed()` before monitor scan and before direct credit eligibility.
- supported Polygon chain id `137`.
- normalized configured Polygon USDC token address.
- `Deposit` uniqueness on `(chain, txHash, logIndex)`.
- ledger `applyDepositTx(...)` with event-key idempotency.

## Runtime Impact

Runtime behavior changed: No.

Auto-credit behavior changed: No.

Ledger behavior changed: No.

Private-key behavior changed: No.

## Remaining Risks

- This is mocked unit evidence, not a live Polygon RPC run.
- Error-path tests for log-fetch failures remain future work.
- Full end-to-end funding evidence still needs a controlled local/private-staging run with safe test wallets and no production secrets printed.
- Admin/operator runbook must explain how to keep `ALLOW_AUTO_DEPOSIT_CREDIT=false` until the owner intentionally enables it for controlled internal beta.

## Recommended Next Phase

Proceed to Phase 6 withdrawal request and hold hardening.

Phase 6 must prove allowlist/kill-switch gating, ledger-safe hold creation, reject release, completion finalization, and no automatic blockchain broadcast.
