# Bot Credential Handling Review

Task id: SEC-004
Assigned subagents: SecurityAgent, BotAgent, LedgerWalletReviewerAgent
Risk level: High by topic
Status: Docs-only review

## Purpose

This review documents safe handling expectations for bot credentials without opening, printing, creating, rotating, or modifying any secrets. It is based on tracked filenames and existing bot safety docs only.

## Observed Credential-Adjacent Surfaces

Tracked filenames indicate credential-adjacent bot surfaces:

- `scripts/create_sim_bot_credentials.ts`
- `scripts/create_reference_arb_dry_run_credential.ts`
- `src/app/api/account/api-keys/route.ts`
- `src/app/api/account/api-keys/[id]/route.ts`
- `src/app/api/admin/reference-markets/[id]/seed-bot/route.ts`
- `prisma/migrations/20260314133000_phase3_api_credentials/migration.sql`
- `prisma/migrations/20260314180000_phase4_bot_governance/migration.sql`
- `tests/bot-e2e/*`

This review does not inspect secret contents, environment files, private keys, or production credentials.

## Credential Handling Rules

Future bot credential work must ensure:

- Production credentials are never committed.
- Production credentials are never printed in logs, reports, test output, or PR bodies.
- Simulation credentials are clearly separated from production credentials.
- Dry-run credentials cannot place live orders.
- Bot accounts are identifiable and separated from normal users.
- Credential generation scripts are not run by autonomous agents without explicit approval.
- Credential revocation/disable behavior is documented and tested before live use.

## Required Boundaries

### Simulation Credentials

Simulation credentials may be used only in local/test contexts. They should be named and documented so they cannot be mistaken for production credentials.

### Dry-Run Credentials

Dry-run credentials should be scoped so they cannot submit live orders. Dry-run reports must not include secret tokens.

### Production Credentials

Production credentials require human approval, storage policy, rotation policy, revocation policy, and audit trail before use.

## Future Review Checklist

Before any bot credential implementation PR:

- Confirm which credential types exist.
- Confirm where credentials are stored.
- Confirm whether secrets are hashed, encrypted, or tokenized.
- Confirm logs and API responses do not expose raw credential values.
- Confirm disabled/revoked credentials cannot act.
- Confirm production credentials are unavailable in CI.
- Confirm dry-run mode cannot use production credentials.
- Confirm tests use safe fixtures or mocks.

## Forbidden Autonomous Actions

Agents must not automatically:

- Generate production bot credentials.
- Print credential values.
- Open secret files.
- Rotate production credentials.
- Enable live bot credentials.
- Fund bot accounts.
- Change credential storage code.
- Change API key permissions.
- Change trading or liquidity behavior.

## Recommended Future Tests

Future test-only work may verify:

- Credential values are not returned after creation.
- Revoked credentials cannot authenticate.
- Disabled credentials cannot act.
- Dry-run credentials cannot place orders.
- Logs/reports redact token-like values.

These tests should use safe local fixtures and must not require production secrets.

## Non-Goals

This review does not:

- Inspect secret contents.
- Modify code, scripts, migrations, env files, credentials, wallet, ledger, trading, bot runtime, deployment, or production behavior.
- Approve live bot credentials.

## Validation For This Review

This review is docs-only. Validation for this PR should be:

```bash
git diff --check
```
