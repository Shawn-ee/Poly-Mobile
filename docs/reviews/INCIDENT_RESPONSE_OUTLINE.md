# Incident Response Outline

Task id: DEP-003
Assigned subagents: SecurityAgent, DeploymentAgent, LedgerWalletReviewerAgent, BotAgent
Risk level: High
Status: Docs-only incident response outline

## Purpose

POLY needs a unified incident response outline for funding, trading, admin, bot, deployment, and security issues before public beta. This document defines response phases and categories without changing code, deployment, credentials, financial state, or production behavior.

## Response Phases

1. Detect.
2. Triage.
3. Contain.
4. Communicate.
5. Investigate.
6. Recover.
7. Reconcile.
8. Postmortem.

## Incident Categories

### Funding Or Custody

Examples:

- Missing deposit credit.
- Duplicate deposit credit.
- Wrong-chain/wrong-token deposit.
- Suspected private-key exposure.
- Withdrawal stuck or completed incorrectly.

Immediate actions:

- Disable funding gates if needed.
- Stop deposit monitor if unsafe.
- Freeze affected manual operations.
- Preserve logs without printing secrets.
- Start reconciliation.

### Trading Or Ledger

Examples:

- Negative available or locked balance.
- Incorrect order lock/unlock.
- Bad fill or position update.
- Settlement mismatch.

Immediate actions:

- Pause affected market if appropriate.
- Stop high-risk trading operations.
- Preserve order/ledger snapshots.
- Run only approved read-only diagnostics.
- Escalate to LedgerWalletReviewerAgent and human owner.

### Admin Auth Or Secret Exposure

Examples:

- Admin route accessible to non-admin.
- Secret appears in logs or UI.
- Unauthorized admin mutation.

Immediate actions:

- Revoke exposed credentials if confirmed.
- Disable affected admin surface if possible.
- Preserve evidence.
- Avoid reposting secret values.
- Escalate to SecurityAgent and human owner.

### Bot Or Liquidity

Examples:

- Live bot places unintended orders.
- Risk cap failure.
- Stale reference data used.
- Kill switch failure.

Immediate actions:

- Activate kill switch.
- Disable live bot mode.
- Cancel or freeze according to approved runbook.
- Preserve bot run state.
- Escalate to BotAgent and human owner.

### Deployment Or Service Health

Examples:

- App unavailable.
- Database unavailable.
- Bad deploy.
- Misconfigured environment.

Immediate actions:

- Stop deployment actions.
- Check health endpoints and logs.
- Roll back only through human-approved procedure.
- Do not expose env values in reports.

## Communication Requirements

Every incident should track:

- Incident owner.
- Start time.
- Affected area.
- User impact.
- Current status.
- Containment action.
- Next update time.
- Postmortem owner.

User-facing communication must be reviewed before publication.

## Agent Rules During Incidents

Agents may:

- Create docs-only reports.
- Run approved read-only inspections.
- Summarize logs without secrets.
- Draft postmortems.

Agents must not:

- Deploy.
- Touch production secrets.
- Run repair/backfill scripts.
- Move funds.
- Complete withdrawals.
- Enable/disable production services unless explicitly authorized.
- Enable live bots.
- Modify financial state.

## Postmortem Template Requirements

Future postmortems should include:

- Summary.
- Timeline.
- Impact.
- Root cause.
- Detection gap.
- Containment and recovery.
- Data reconciliation result.
- User communication.
- Follow-up tasks.
- Owner and due date.

## Non-Goals

This outline does not:

- Execute incident response.
- Change code, config, deployment, wallet, ledger, trading, bot, auth, Prisma, migrations, or production behavior.
- Approve public launch.

## Validation For This Outline

This outline is docs-only. Validation for this PR should be:

```bash
git diff --check
```
