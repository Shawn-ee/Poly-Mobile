# Public Beta Readiness Checklist

Task id: DEP-001
Assigned subagents: DeploymentAgent, SecurityAgent, PlannerAgent
Risk level: High
Status: Docs-only readiness checklist

## Purpose

This checklist defines the conditions POLY should satisfy before moving from internal beta to public beta. It does not deploy, change config, enable funding, alter code, or approve production launch.

## Status Legend

- Pass: Ready for public beta.
- Warn: Acceptable only with documented limitation.
- Block: Must be fixed before public beta.

## Product Readiness

| Area | Exit criteria | Status before evidence |
|---|---|---|
| Sports-first IA | Primary routes and navigation are implemented and tested. | Block |
| Market discovery | Users can browse sports/events/markets clearly. | Block |
| Trade ticket | Yes/No trading is understandable with review step. | Block |
| Portfolio/account | Available, locked, positions, open orders, and history are clear. | Block |
| Wallet beta state | Funding disabled/internal states are explicit. | Block |
| Risk copy | Prediction and funding risks are visible and plain. | Block |

## Safety And Finance Readiness

| Area | Exit criteria | Status before evidence |
|---|---|---|
| Canonical deposit architecture | Approved and implemented behind gates. | Block |
| Funding gates | Default disabled and tested. | Block |
| Custody runbook | Approved by human/security owner. | Block |
| Withdrawal runbook | Approved with tx hash, reject/unlock, and reconciliation rules. | Block |
| Ledger invariants | Balance/locked/ledger tests pass. | Block |
| Reconciliation | Deposit, withdrawal, balance, and market collateral reconciliation pass. | Block |

## Admin And Security Readiness

| Area | Exit criteria | Status before evidence |
|---|---|---|
| Admin auth matrix | 401/403/admin-positive coverage exists. | Block |
| Admin operations IA | High-risk sections separated. | Warn |
| Secret audit | No committed production secrets; handling documented. | Block |
| No-leak tests | Public/API/admin surfaces do not expose secrets. | Block |
| Incident response | Funding/trading/admin/bot incidents have a runbook. | Block |

## Bot And Liquidity Readiness

| Area | Exit criteria | Status before evidence |
|---|---|---|
| Dry-run/live separation | Tested and visible. | Block |
| Kill switch | Implemented and tested before live use. | Block |
| Caps/allowlists | Market/account/notional caps exist. | Block |
| Public UX boundary | Users do not see bot internals. | Block |
| Live bot launch | Human-approved only. | Block |

## Testing And CI Readiness

| Area | Exit criteria | Status before evidence |
|---|---|---|
| Standard CI | Prisma generate/validate, TypeScript, Jest CI pass. | Block |
| Public route smoke | Public market/sports/account pages covered. | Block |
| Public API smoke | Read APIs have safe smoke/no-leak tests. | Block |
| Admin auth tests | Admin routes covered. | Block |
| Financial invariant tests | Ledger/trading/settlement/reconciliation tests pass. | Block |

## Deployment And Operations Readiness

| Area | Exit criteria | Status before evidence |
|---|---|---|
| Environment docs | Required env vars documented without secrets. | Block |
| Rollback plan | Human-approved rollback path exists. | Block |
| Logging/monitoring | Operational logs and alerts defined. | Block |
| Production deployment | Human-only deployment checklist exists. | Block |
| Support process | User support path for funding/trading issues exists. | Block |

## Public Beta Decision Rule

Public beta should not start while any Block item remains unresolved. Warn items require explicit owner sign-off and user-safe disclosure.

## Forbidden Autonomous Actions

Agents must not automatically:

- Mark public beta ready.
- Enable deposits or withdrawals.
- Deploy production.
- Change production config.
- Enable live bots.
- Modify ledger, matching, settlement, admin auth, Prisma, migrations, or secrets.

## Validation For This Checklist

This checklist is docs-only. Validation for this PR should be:

```bash
git diff --check
```
