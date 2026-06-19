# Withdrawal Request Hold Evidence

Date: 2026-06-19

Branch: `agent/beta-withdrawal-request-hold`

## Executive Summary

Phase 6 adds tests and evidence for the controlled internal funding beta withdrawal request and hold workflow.

This PR is tests/docs only. It does not change withdrawal runtime behavior, ledger math, balance accounting, private-key behavior, schema, migrations, package files, workflows, deployment, admin payout behavior, public withdrawals, or automatic withdrawal broadcast.

## Existing Implementation Reviewed

Reviewed files:

- `src/app/api/withdrawals/request/route.ts`
- `src/app/api/withdrawals/route.ts`
- `src/server/services/withdrawals.ts`
- `src/server/services/__tests__/withdrawals.phase8.test.ts`
- `src/__tests__/funding-beta.routes.test.ts`

## Existing Service Evidence

`src/server/services/__tests__/withdrawals.phase8.test.ts` already covers:

- successful withdrawal request locks funds.
- insufficient available USDC is rejected.
- invalid destination address is rejected.
- per-user daily limit is enforced.
- global daily limit is enforced.
- completion stores payout tx hash and consumes locked funds.
- rejection returns locked funds to available.
- double completion is rejected.
- complete-after-reject is rejected.
- reject-after-complete is rejected.
- ledger entries are written for request, complete, and reject.

## Route Evidence Added

`src/__tests__/funding-beta.routes.test.ts` now additionally verifies:

- anonymous withdrawal request is blocked before funding checks.
- non-allowlisted withdrawal request is blocked before rate limit and hold creation.
- kill switch blocks withdrawal request creation.
- successful withdrawal request response does not include broadcast transaction fields.
- non-allowlisted withdrawal history is blocked before request listing.
- withdrawal history returns request state without treasury private key or broadcast transaction fields.

## Safety Review

WithdrawalAgent result: Pass for tests/docs scope.

LedgerAgent result: Pass for tests/docs scope.

SecurityAgent result: Pass for tests/docs scope.

The reviewed flow keeps v1 withdrawals manual:

- users submit requests.
- funds are held through ledger/balance updates.
- admin review remains separate.
- payout tx hash is recorded manually after external payout.
- no automatic blockchain transaction broadcast is present in this phase.

## Runtime Impact

Runtime behavior changed: No.

Ledger behavior changed: No.

Withdrawal behavior changed: No.

Admin payout behavior changed: No.

Private-key behavior changed: No.

## Remaining Risks

- This phase does not prove admin route access controls; that is Phase 7.
- This phase does not execute a live payout and must not be interpreted as production withdrawal readiness.
- Operator runbook still needs clear manual payout and rollback instructions.

## Recommended Next Phase

Proceed to Phase 7 admin manual withdrawal review evidence.

Phase 7 must prove admin-only access, pending request listing, rejection, completion with tx hash, and no automatic signing/broadcast.
