# Funding Exposure Gates Plan

Task id: WDW-002
Assigned subagents: SecurityAgent, LedgerWalletReviewerAgent, TestingAgent
Risk level: Critical by domain
Status: Docs-only gate plan

## Purpose

Funding APIs and wallet UI must not become publicly usable by accident. This plan defines future exposure gates for deposits, withdrawals, external wallet reads, faucets, and funding UI without changing config, code, routes, wallet behavior, ledger behavior, or production settings.

## Core Rule

All funding exposure must default disabled.

No user-facing deposit, withdrawal, external balance, faucet, monitor, rescan, or admin completion behavior should be public-enabled unless an explicit gate allows it for the current environment, account, and route.

## Proposed Future Gates

Future implementation may define equivalent names, but the behavior should preserve these boundaries:

| Gate | Default | Purpose |
|---|---:|---|
| `FUNDING_UI_ENABLED` | `false` | Shows user-facing wallet funding controls. |
| `DEPOSITS_ENABLED` | `false` | Allows user deposit address/status flows. |
| `WITHDRAWALS_ENABLED` | `false` | Allows user withdrawal requests. |
| `EXTERNAL_WALLET_READS_ENABLED` | `false` | Allows chain balance reads for linked wallets. |
| `FAUCET_ENABLED` | `false` | Allows test-credit faucet behavior. |
| `ADMIN_DEPOSIT_RESCAN_ENABLED` | `false` | Allows admin deposit rescans. |
| `ADMIN_WITHDRAWAL_COMPLETION_ENABLED` | `false` | Allows admin withdrawal completion. |
| `PRODUCTION_FUNDING_APPROVED` | `false` | Final production launch guard. |

Names are proposals only. Implementation requires a separate PR.

## Environment Defaults

### Local Development

- Funding UI may be visible only as disabled/beta state by default.
- Test faucet may be enabled only if explicitly configured.
- Real chain deposit/withdrawal behavior remains disabled unless explicitly scoped.

### CI

- All real funding behavior disabled.
- No production credentials.
- No external chain calls unless mocked.
- Tests should assert disabled defaults.

### Staging

- Funding remains disabled unless a human approves a staging exercise.
- Staging credentials must be separate from production.

### Production

- All gates default disabled.
- `PRODUCTION_FUNDING_APPROVED` must be true before any public funding behavior is available.
- Human approval and launch checklist are required.

## Route Gate Expectations

### User Deposit Routes

Routes:

- `/api/deposits`
- `/api/deposits/address`
- Legacy `/api/wallet/deposit-*`

Expected gates:

- `FUNDING_UI_ENABLED`
- `DEPOSITS_ENABLED`
- `PRODUCTION_FUNDING_APPROVED` for public production behavior

Rules:

- Legacy routes stay hidden/internal unless explicitly migrated.
- Disabled responses should be safe and clear.

### User Withdrawal Routes

Routes:

- `/api/wallet/withdraw`
- `/api/wallet/withdraw/complete`
- `/api/withdrawals`
- `/api/withdrawals/request`

Expected gates:

- `FUNDING_UI_ENABLED`
- `WITHDRAWALS_ENABLED`
- `PRODUCTION_FUNDING_APPROVED` for public production behavior

Rules:

- Request flow must lock funds before any manual/off-platform payment.
- Completion behavior must remain admin-only and tx-hash backed.

### External Wallet Reads

Routes:

- `/api/wallet/usdc-balance`
- wallet link/list/challenge routes as applicable

Expected gates:

- `EXTERNAL_WALLET_READS_ENABLED` for chain reads.

Rules:

- Wallet auth/linking must stay distinct from funding/custody.
- Chain reads must not imply POLY account balance.

### Faucet

Routes:

- `/api/wallet/faucet`

Expected gates:

- `FAUCET_ENABLED`

Rules:

- Faucet must be clearly test-credit/beta-only.
- Production public faucet requires explicit approval or must remain disabled.

### Admin Funding Routes

Routes:

- `/api/admin/deposits`
- `/api/admin/deposits/rescan`
- `/api/admin/withdrawals`
- `/api/admin/withdrawals/[id]/complete`
- `/api/admin/withdrawals/[id]/reject`

Expected gates:

- Admin auth always.
- `ADMIN_DEPOSIT_RESCAN_ENABLED` for rescan.
- `ADMIN_WITHDRAWAL_COMPLETION_ENABLED` for completion.
- `PRODUCTION_FUNDING_APPROVED` for production money movement.

Rules:

- Reject/read-only review may have different gate rules than completion/rescan.
- Financial admin mutations require audit and human review.

## Required Future Tests

Future implementation must test:

- All gates default disabled.
- Disabled deposit route returns safe disabled response.
- Disabled withdrawal route returns safe disabled response.
- Disabled faucet route returns safe disabled response.
- External chain reads are disabled by default.
- Admin deposit rescan is disabled by default.
- Admin withdrawal completion is disabled by default.
- Production funding cannot be enabled by a single accidental gate.
- User-facing wallet does not show active funding CTA when disabled.
- No secret/config values are exposed in disabled responses.

## Rollout Requirements

Before any funding gate is enabled outside local development:

- Canonical deposit architecture is approved.
- Wallet beta-state UX is implemented and reviewed.
- Reconciliation plan exists.
- Withdrawal operations plan exists.
- Custody/private-key runbook exists.
- Admin auth coverage exists.
- Incident response path exists.
- Human approval is recorded.

## Forbidden Autonomous Implementation

Agents must not automatically:

- Add or change funding env vars.
- Change config validation.
- Enable deposit or withdrawal routes.
- Change wallet UI to expose active funding controls.
- Run monitors or rescans.
- Change ledger, balance, matching, settlement, Prisma, or migrations.
- Change production deployment settings.
- Handle or print secrets.

## Non-Goals

This plan does not:

- Implement gates.
- Modify `.env`, config, CI, scripts, source code, routes, Prisma, migrations, deployment, wallet, ledger, matching, settlement, or admin behavior.
- Enable deposits or withdrawals.
- Approve public funding launch.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```
