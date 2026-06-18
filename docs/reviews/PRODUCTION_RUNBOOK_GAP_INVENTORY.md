# Production Runbook Gap Inventory

Task id: DEP-002
Assigned subagents: DeploymentAgent, SecurityAgent, DocsAgent
Risk level: High
Status: Docs-only inventory

## Purpose

This inventory lists production runbook gaps for POLY before public beta or production operation. It does not deploy, start services, enable systemd, edit config, change secrets, or modify runtime behavior.

## Environment Split

POLY currently needs clear separation between:

- Windows local development.
- Linux production/server operation.
- CI validation.
- Internal beta operations.

Runbooks should not assume that local Windows commands are production-safe, and production Linux service instructions should not be required for normal PR validation.

## Missing Runbook Areas

### Environment And Secrets

Needed:

- Required environment variable list by environment.
- Secret ownership and rotation process.
- Explicit rule that secrets are never committed or printed.
- Local example config separate from production secrets.

### Deployment

Needed:

- Human-only deployment checklist.
- Build/start commands.
- Rollback procedure.
- Health check procedure.
- Post-deploy smoke checklist.

### Service Management

Needed:

- Which services exist.
- Which services are systemd-managed.
- How to view logs.
- How to stop/restart safely.
- Which services must never be started by agents.

### Database Operations

Needed:

- Migration policy.
- Backup/restore policy.
- Prisma command safety.
- Production database access policy.
- Destructive command prohibition.

### Funding And Custody Operations

Needed:

- Deposit monitor runbook.
- Withdrawal operations runbook.
- Custody runbook.
- Reconciliation runbook.
- Incident response path.

### Bot Operations

Needed:

- Dry-run/live mode runbook.
- Kill switch instructions.
- Risk caps and allowlists.
- Credential handling policy.
- Incident response.

### Monitoring And Alerts

Needed:

- App health alerts.
- Database alerts.
- Funding monitor alerts.
- Reconciliation alerts.
- Bot stale-data/live-risk alerts.
- Admin auth/security alerts.

## Human-Only Operations

Agents must not automatically:

- Deploy production.
- Start/stop production services.
- Run migrations against production.
- Run repair/backfill/reconciliation against production.
- Run deposit monitors against production.
- Complete withdrawals.
- Enable live bots.
- Touch production secrets.

## Recommended Follow-Up Runbooks

1. Production deployment checklist.
2. Production rollback checklist.
3. Environment variable reference.
4. Database migration and backup policy.
5. Deposit monitor runbook.
6. Withdrawal operations runbook.
7. Bot operations runbook.
8. Incident response runbook.

## Non-Goals

This inventory does not:

- Change deployment files.
- Change systemd config.
- Change env vars.
- Run services.
- Deploy or roll back production.
- Change wallet, ledger, trading, bot, admin auth, Prisma, migration, or production behavior.

## Validation For This Inventory

This inventory is docs-only. Validation for this PR should be:

```bash
git diff --check
```
