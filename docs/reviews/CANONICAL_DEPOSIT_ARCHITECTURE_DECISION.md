# Canonical Deposit Architecture Decision

Task id: WDW-001
Assigned subagents: LedgerWalletReviewerAgent, SecurityAgent, PlannerAgent
Risk level: High
Status: Docs-only architecture decision

## Decision Summary

POLY should treat the Polygon per-user deposit address model as the intended canonical deposit architecture for a future real-money launch, but it must remain disabled or internal-beta-only until custody, reconciliation, monitoring, UI gates, and withdrawal operations are approved and tested.

Legacy Base deposit verification routes should be marked legacy/internal in future work and should not be presented to normal users as a production funding path.

This decision does not enable deposits, change deposit code, change wallet private-key handling, modify Prisma schema, modify ledger behavior, alter admin tools, run monitors, or move funds.

## Why This Decision Is Needed

The review docs identify ambiguous funding paths:

- Legacy wallet deposit intent/verification/status routes.
- Polygon per-user deposit address routes.
- Admin deposit review and rescan surfaces.
- Wallet UI states that may imply funding readiness.
- Deposit monitor and reconciliation scripts that are high-risk to run without explicit scope.

Before public beta, POLY needs one canonical funding architecture and a clear legacy policy. Users should never see competing deposit flows or unclear chain/token instructions.

## Canonical Future Flow

The future canonical flow should be:

1. User requests a deposit address.
2. System returns the user's assigned Polygon USDC deposit address.
3. User sends the supported token on the supported chain only.
4. Deposit monitor observes an external chain event.
5. Deposit credit is created only after an external transaction reference exists.
6. Crediting is idempotent by chain, transaction hash, and log index or equivalent event key.
7. Balance changes happen only inside a database transaction.
8. Balance changes create auditable ledger entries.
9. Reconciliation verifies external deposits, ledger entries, and user balances.
10. Admin/operator views show review and exception states without exposing secrets.

This is an architecture target, not an implementation approval.

## Canonical Chain And Token

Proposed target:

- Chain: Polygon.
- Token: USDC.
- Address model: one assigned deposit address per user.
- Crediting trigger: observed external transaction event.
- Crediting requirement: external tx reference before balance mutation.

Open decisions before implementation:

- Exact supported USDC contract address per environment.
- Minimum deposit amount.
- Confirmation depth.
- Sweep policy.
- Custody model for generated deposit private keys.
- Rotation and incident-response process.
- How testnet/local environments represent deposits.

## Legacy Flow Policy

Future work should mark these as legacy/internal unless a human explicitly re-approves them:

- Legacy Base deposit intent.
- Legacy Base deposit confirmation.
- Legacy Base deposit status.
- Legacy Base deposit verification.
- Any mock/manual deposit path that can be confused with real production funding.

Legacy routes may remain for internal compatibility while hidden from normal users, but user-facing copy must not present them as production-ready.

## Required Launch Gates

Deposits must remain public-disabled until all of these are true:

- Funding exposure gate exists and defaults disabled.
- User-facing wallet copy clearly identifies beta/internal status.
- Deposit address generation and storage have a reviewed custody model.
- Production private keys are never committed, printed, logged, or exposed in reports.
- Deposit monitor has a safe runbook.
- Deposit crediting is idempotent.
- Crediting creates auditable ledger entries.
- Reconciliation can detect missing, duplicate, or mismatched credits.
- Admin deposit review exposes exceptions without exposing private keys.
- Tests cover happy path, duplicate event, wrong chain/token, below minimum, and monitor/reconciliation failure where applicable.
- Human has approved public funding launch.

## Required Human Decisions

The following decisions are intentionally not made by this document:

- Whether POLY is ready to custody real user funds.
- Which production wallet/key-management system is acceptable.
- Whether deposits are enabled for internal beta, public beta, or production.
- Which contract addresses and chain ids are production-approved.
- Operational responsibility for monitoring, sweep, incident response, and support.
- Legal/compliance approval for real-money funding.

These are business, security, custody, and operational decisions requiring human approval.

## Future Implementation Boundaries

Automatic implementation is forbidden for:

- Deposit address generation or private-key handling.
- Deposit monitor runtime behavior.
- Deposit crediting or balance mutation.
- Ledger entry creation.
- Reconciliation repair logic.
- Wallet deposit UI that implies public launch readiness.
- Admin deposit mutation or rescan behavior.
- Prisma schema or migration changes.
- Production config, secrets, or deployment changes.

Future implementation PRs in these areas must receive SecurityAgent, LedgerWalletReviewerAgent, and human review.

## API Route Treatment

### Canonical Future Routes

Likely canonical public/account routes after future implementation review:

- `/api/deposits`
- `/api/deposits/address`

Rules:

- Must be gated by funding environment/config.
- Must not expose private keys or custody internals.
- Must return beta-safe status when deposits are disabled.

### Legacy/Internal Routes

Routes that should be marked legacy/internal unless re-approved:

- `/api/wallet/deposit-intent`
- `/api/wallet/deposit-confirm`
- `/api/wallet/deposit-status`
- `/api/wallet/deposit-verify`

Rules:

- Hide from normal user flows.
- Do not remove automatically.
- Do not repurpose without a canonical migration plan.

### Admin Routes

Admin routes remain high-risk:

- `/api/admin/deposits`
- `/api/admin/deposits/rescan`

Rules:

- Require admin auth and audit expectations.
- Future mutations require human review.
- Rescan behavior must not be run automatically.

## UI Treatment

Future wallet UI should:

- Show deposits as disabled, beta-only, or internal until launch gates pass.
- Show one canonical deposit chain/token once approved.
- Avoid showing multiple conflicting deposit options.
- Avoid claiming instant credit before monitor and reconciliation are approved.
- Mark legacy/mock/manual flows as legacy/internal or hide them.
- Never expose private keys or operational custody details.

## Reconciliation Requirements

Before public deposit launch, reconciliation must verify:

- External transaction event exists.
- Deposit record exists.
- Ledger entry exists.
- User balance reflects the ledger.
- Duplicate events do not double-credit.
- Wrong-chain or wrong-token events do not credit.
- Monitor downtime can be recovered safely.
- Exceptions are visible to admins without exposing secrets.

Reconciliation failures should block launch and high-risk merges until reviewed.

## Script And Operational Rules

The following commands remain human-reviewed and must not run in autonomous cycles:

- `npm run deposits:monitor`
- Deposit monitor scripts.
- Deposit verification scripts.
- Balance reconciliation scripts.
- Repair/backfill scripts.
- Any script requiring production credentials, custody keys, or production database access.

Agents may document these commands, but must not execute them without explicit task-level approval.

## Acceptance Criteria For Future Funding PR

A future funding implementation PR is not acceptable unless it:

- Names the exact environment and launch gate.
- Includes focused tests.
- Preserves idempotency.
- Uses auditable ledger entries.
- Keeps available and locked balances non-negative.
- Does not expose secrets.
- Has a rollback and reconciliation plan.
- Has SecurityAgent and LedgerWalletReviewerAgent review.
- Has human approval before merge.

## Non-Goals

This document does not:

- Enable deposits.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, or balance code.
- Change private-key handling.
- Change Prisma schema or migrations.
- Run monitors, scripts, reconciliation, or external chain calls.
- Approve public real-money launch.
- Replace legal, compliance, custody, or production operations review.

## Validation For This Decision

This decision is docs-only. Validation for this PR should be:

```bash
git diff --check
```
