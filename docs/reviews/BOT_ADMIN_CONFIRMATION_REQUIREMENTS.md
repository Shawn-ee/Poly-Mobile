# Bot Admin Confirmation Requirements

Task id: BOT-004
Assigned subagents: BotAgent, SecurityAgent, LedgerWalletReviewerAgent
Risk level: High
Status: Docs-only confirmation requirements

## Purpose

Admin bot and reference-market actions can affect liquidity, market state, operational readiness, and user trust. This document defines future confirmation and audit requirements for admin bot/reference mutations without changing UI, API routes, bot behavior, liquidity runtime, credentials, trading, or deployment.

## Actions Requiring Confirmation

Future admin UI/API implementation should require explicit confirmation for:

- Reference market import.
- Reference market refresh snapshot.
- Seed bot/liquidity action.
- Mark launch liquidity live-ready.
- Bot run-state reset.
- Bot credential generation.
- Bot kill switch disable or re-enable.
- Any transition from dry-run/simulation to live behavior.
- Any action that can create, cancel, or alter bot orders.

## Confirmation Content

Each confirmation should show:

- Action name.
- Target market/reference id.
- Current mode: disabled, dry-run, simulation, staging-live, or production-live.
- Expected effect.
- Whether real orders can be affected.
- Whether user-facing liquidity can be affected.
- Required gate status.
- Operator/admin identity.
- Timestamp.
- Rollback or cancellation limitations.

## Required Typed Confirmations

High-risk actions should require typed confirmation text:

| Action | Suggested typed phrase |
|---|---|
| Seed bot/liquidity | `SEED LIQUIDITY` |
| Mark live-ready | `MARK LIVE READY` |
| Disable kill switch | `DISABLE KILL SWITCH` |
| Enable production-live | `ENABLE LIVE BOT` |
| Generate bot credentials | `GENERATE BOT CREDENTIALS` |

Future implementation may choose exact phrases, but dangerous actions should not be single-click.

## Audit Requirements

Future implementation should record:

- Admin user id.
- Action type.
- Target entity id.
- Previous state.
- Requested new state.
- Confirmation text where applicable.
- Timestamp.
- Result: success, rejected, failed, blocked.
- Blocked reason if applicable.

Audit records must not store secrets, private keys, raw credentials, or sensitive external tokens.

## Gate Requirements

Bot/reference mutation controls should check:

- Admin auth.
- Bot mode.
- Kill switch status.
- Environment gate.
- Market allowlist.
- Stale-data status.
- Risk cap status.
- Production approval gate when applicable.

If any required gate fails, the action should be blocked with a safe admin-visible reason.

## UI Requirements

Future admin UI should:

- Separate monitor-only actions from mutating actions.
- Label high-risk actions clearly.
- Use disabled controls when gates fail.
- Show why controls are disabled.
- Confirm before mutation.
- Avoid exposing credentials or private keys.
- Show dry-run/live mode prominently.

## API Requirements

Future API implementation should:

- Re-check authorization server-side.
- Re-check gate status server-side.
- Reject missing or incorrect confirmation for high-risk actions.
- Return safe error messages.
- Avoid logging secrets.
- Avoid relying only on UI-side disabled states.

## Test Requirements

Future implementation should test:

- Signed-out admin mutation request returns 401.
- Non-admin mutation request returns 403.
- Missing confirmation is rejected.
- Incorrect confirmation is rejected.
- Gate-disabled action is rejected.
- Kill-switch-blocked action is rejected.
- Successful dry-run-only action records audit data.
- Public users cannot see bot admin internals.
- No secrets appear in responses or logs captured by tests.

## Forbidden Autonomous Implementation

Agents must not automatically:

- Add bot mutation controls.
- Enable live mode.
- Generate production bot credentials.
- Change bot order placement/cancellation behavior.
- Change liquidity seeding behavior.
- Change reference import behavior.
- Disable kill switches.
- Change admin auth.
- Change production deployment.

## Non-Goals

This document does not:

- Change admin UI.
- Change bot/reference API routes.
- Change bot runtime behavior.
- Change liquidity, trading, order, ledger, wallet, settlement, Prisma, migration, deployment, or production behavior.
- Run bot scripts.
- Generate credentials.

## Validation For This Document

This document is docs-only. Validation for this PR should be:

```bash
git diff --check
```
