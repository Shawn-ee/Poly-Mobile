# Deposit Custody Runbook Outline

Task id: WDW-004
Assigned subagents: SecurityAgent, LedgerWalletReviewerAgent, DeploymentAgent
Risk level: Critical by domain
Status: Docs-only runbook outline

## Purpose

Per-user deposit addresses imply custody responsibilities. This outline defines the minimum runbook topics POLY must resolve before production deposits are enabled. It does not inspect, print, create, move, rotate, or modify private keys, wallets, secrets, config, code, or production systems.

## Custody Principles

- Production private keys must never be committed.
- Production private keys must never be printed in logs or reports.
- Test/mock wallet flows must be clearly separated from production wallet flows.
- Deposit crediting requires an external transaction reference.
- Reconciliation failures block launch.
- Human approval is required before production custody is enabled.

## Required Runbook Sections

### Key Generation

The production runbook must define:

- Who may generate deposit wallets.
- Where generation occurs.
- How entropy/source is validated.
- How testnet/local generation differs from production.
- How generated addresses are assigned to users.

### Key Storage

The production runbook must define:

- Approved storage system.
- Encryption approach.
- Access policy.
- Backup policy.
- Recovery process.
- Audit log requirements.

### Access Control

The production runbook must define:

- Who can read custody material.
- Who can initiate sweeps.
- Who can approve rotation.
- How access is reviewed and revoked.
- Break-glass process.

### Sweep Policy

The production runbook must define:

- Whether deposits are swept.
- Sweep frequency.
- Hot wallet/cold wallet destination policy.
- Minimum sweep threshold.
- Gas/funding policy.
- Failure handling.

### Rotation Policy

The production runbook must define:

- When deposit keys are rotated.
- How users are notified if an address changes.
- How old addresses are monitored.
- How compromised addresses are handled.

### Incident Response

The production runbook must cover:

- Suspected private-key exposure.
- Wrong-chain deposit.
- Wrong-token deposit.
- Duplicate credit.
- Missing credit.
- Monitor outage.
- Sweep failure.
- Reconciliation mismatch.
- Admin/operator mistake.

### Monitoring And Reconciliation

The production runbook must define:

- Deposit monitor owner.
- Monitor alerting.
- Reconciliation frequency.
- Launch-blocking failure thresholds.
- Manual review process.
- User-support process.

## Forbidden Autonomous Actions

Agents must not automatically:

- Open secret files.
- Print private keys or seed phrases.
- Generate production wallets.
- Rotate production keys.
- Sweep funds.
- Run production deposit monitors.
- Run repair/reconciliation scripts against production.
- Change private-key handling code.
- Change config or deployment for custody.

## Required Future Tests

Future implementation should test:

- Secrets are never returned by APIs.
- Deposit address response does not expose private keys.
- Duplicate deposit events do not double-credit.
- Reconciliation catches missing and duplicate credit.
- Wrong chain/token handling is safe.

## Launch Blockers

Production deposits remain blocked until:

- Custody storage is approved.
- Access control is approved.
- Sweep policy is approved.
- Rotation policy is approved.
- Incident response is approved.
- Reconciliation is tested.
- Funding gates default disabled and are tested.
- Human approval is recorded.

## Non-Goals

This outline does not:

- Change wallet, deposit, ledger, balance, Prisma, migration, deployment, config, or secret handling.
- Run monitors, scripts, external APIs, or chain calls.
- Approve production custody.

## Validation For This Outline

This outline is docs-only. Validation for this PR should be:

```bash
git diff --check
```
