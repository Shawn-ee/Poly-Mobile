# Withdrawal Operations Hardening Plan

Task id: WDW-003
Assigned subagents: LedgerWalletReviewerAgent, SecurityAgent, TestingAgent
Risk level: Critical by domain
Status: Docs-only operations plan

## Purpose

Withdrawals are production money movement and must be treated as human-reviewed financial operations. This plan defines future hardening requirements for withdrawal request, review, rejection, completion, reconciliation, and audit flows without changing any code or operational behavior now.

## Required Withdrawal Lifecycle

Future withdrawal flow should have explicit states:

1. Requested.
2. Funds locked.
3. Under admin review.
4. Rejected and unlocked, or approved for payment.
5. External payment submitted.
6. Completed with transaction hash.
7. Failed or exception state requiring reconciliation.

No off-platform payment should be made before funds are locked.

## User-Facing Requirements

Users should see:

- Requested amount.
- Destination summary.
- Status.
- Submitted time.
- Review/processing message.
- Rejection reason if safe.
- Completion transaction hash when completed.

Users should not see:

- Private operational notes.
- Internal custody details.
- Raw admin ids.
- Secrets, keys, or signer references.

## Admin Requirements

Admin withdrawal review should show:

- User/account.
- Amount.
- Destination.
- Available/locked state summary.
- Request timestamp.
- Risk flags.
- Previous withdrawal activity if safe.
- Required confirmation for reject/complete.

Completion must require:

- Admin identity.
- Transaction hash.
- Confirmation that external payment was submitted.
- Audit trail.

Rejection must require:

- Admin identity.
- Reason.
- Unlock behavior.
- Audit trail.

## Reconciliation Requirements

Future reconciliation must verify:

- Requested withdrawal exists.
- Funds were locked before processing.
- Completed withdrawal has tx hash.
- Rejected withdrawal unlocked funds.
- Ledger entries match user balance.
- Duplicate tx hashes are rejected.
- Stuck pending withdrawals are visible.

Reconciliation failures should block public launch.

## Required Future Tests

Future implementation/test work should cover:

- Request locks funds.
- Request fails when available balance is insufficient.
- Reject unlocks funds.
- Complete requires tx hash.
- Duplicate completion tx hash is rejected.
- Non-admin cannot list, reject, or complete.
- Signed-out user cannot request withdrawal.
- Failed completion does not leave inconsistent ledger/balance state.
- Reconciliation detects stuck, duplicate, and mismatched states.

## Runbook Requirements

Before production withdrawals:

- Define who may approve withdrawals.
- Define daily/manual limits.
- Define escalation path.
- Define incident response for wrong destination, failed chain tx, stuck pending, duplicate tx hash, and reconciliation mismatch.
- Define rollback limitations.
- Define customer-support copy.

## Forbidden Autonomous Implementation

Agents must not automatically:

- Enable withdrawals.
- Change withdrawal APIs.
- Change admin withdrawal UI.
- Change ledger or balance locking.
- Complete or reject withdrawals.
- Run reconciliation or repair scripts.
- Change Prisma schema or migrations.
- Touch production credentials or private keys.

## Non-Goals

This plan does not:

- Change withdrawal code.
- Change wallet, ledger, balance, matching, settlement, admin auth, deployment, Prisma, migration, or production behavior.
- Approve public withdrawals.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```
