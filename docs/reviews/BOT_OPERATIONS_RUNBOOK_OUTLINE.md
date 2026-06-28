# Bot Operations Runbook Outline

Task id: DEP-004
Assigned subagents: DeploymentAgent, BotAgent, SecurityAgent
Risk level: High by topic
Status: Docs-only runbook outline

## Purpose

This outline defines the minimum operations runbook sections required before POLY bots or liquidity automation can run beyond local/test dry-run mode. It does not run bots, change services, modify credentials, deploy, or enable live trading.

## Required Runbook Sections

### Mode Management

The runbook must define:

- How to verify current mode.
- How disabled, dry-run, simulation, staging-live, and production-live differ.
- Who may approve mode changes.
- How mode changes are audited.

### Kill Switch

The runbook must define:

- Where kill-switch state is visible.
- Who may activate it.
- Who may clear it.
- What happens to new orders.
- What happens to existing open orders.
- How to verify the bot is halted.

### Market Allowlist And Caps

The runbook must define:

- How markets are allowlisted.
- How exposure caps are reviewed.
- How stale data blocks action.
- What alert fires when a cap blocks a bot.

### Credential Handling

The runbook must define:

- How credentials are provisioned.
- How credentials are stored.
- How credentials are revoked.
- How secrets are redacted from logs and reports.
- Who owns rotation.

### Incident Response

The runbook must define actions for:

- Unintended live order.
- Stale data used.
- Cap exceeded.
- Kill switch failure.
- Credential exposure.
- External reference API issue.

### Recovery And Postmortem

The runbook must define:

- How to preserve logs without secrets.
- How to reconcile bot account state.
- How to verify no user balances were affected incorrectly.
- How to write a postmortem.

## Human-Only Actions

Agents must not automatically:

- Enable live bot mode.
- Disable kill switch.
- Generate production credentials.
- Fund bot accounts.
- Run production bot loops.
- Change production deployment.
- Change bot order behavior.
- Repair financial state.

## Future Test Requirements

Before live launch:

- Dry-run cannot place orders.
- Missing config defaults disabled.
- Kill switch blocks intended actions.
- Caps block oversized actions.
- Stale data blocks intended actions.
- Credential-like values are redacted from reports.

## Non-Goals

This outline does not:

- Change bot code.
- Change admin UI.
- Change deployment.
- Change wallet, ledger, matching, settlement, orders, credentials, Prisma, migrations, or production behavior.
- Approve live bot operations.

## Validation For This Outline

This outline is docs-only. Validation for this PR should be:

```bash
git diff --check
```
