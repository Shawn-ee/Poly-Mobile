# Bot Live/Dry-Run Risk-Control Plan

Task id: BOT-002
Assigned subagents: BotAgent, SecurityAgent, TestingAgent
Risk level: High
Status: Docs-only risk-control plan

## Purpose

POLY has bot, reference market, liquidity, and market-making surfaces that must be proven safe before any live trading behavior is enabled. This plan defines required live/dry-run separation, caps, kill switches, stale-data checks, and test evidence for future bot work.

This document does not run bots, create credentials, modify bot code, change liquidity behavior, place orders, change risk limits, modify wallets or ledgers, change deployment, or enable live trading.

## Core Decision

Bot live trading must remain disabled until a human approves a specific live launch checklist. Dry-run and simulation may be used only in explicitly scoped local/test environments.

Future bot implementation must prove:

- Dry-run mode cannot place real orders.
- Live mode cannot be reached accidentally.
- Risk caps are enforced before order placement.
- Stale reference data blocks trading.
- A kill switch can halt trading.
- Bot accounts are separated from normal users.
- Bot activity is auditable.
- CI/test runs cannot use production credentials.

## Required Mode Separation

Future bot runtime should have explicit modes:

| Mode | Purpose | Allowed by default | Production credentials |
|---|---|---:|---:|
| `disabled` | No bot activity | Yes | No |
| `dry-run` | Compute intended actions without placing orders | Test/local only | No |
| `simulation` | Exercise local fixtures or seeded environments | Test/local only | No |
| `staging-live` | Controlled staging execution | Human-approved only | Staging only |
| `production-live` | Real market activity | Human-approved only | Human-approved only |

Mode should be visible in admin UI, logs, run reports, and validation output.

## Live Trading Preconditions

Before any future production-live mode:

- Human approval is recorded.
- Environment gate explicitly allows live bot trading.
- Bot account is identified and separated from user accounts.
- Bot credentials are provisioned without committing or printing secrets.
- Market allowlist exists.
- Per-market exposure cap exists.
- Per-event exposure cap exists.
- Daily notional cap exists.
- Maximum order size exists.
- Maximum open order count exists.
- Maximum stale-data age exists.
- Kill switch exists and is tested.
- Admin monitor shows mode, status, limits, and blocked reasons.
- Reconciliation can identify bot positions and activity.
- Dry-run tests pass in CI or a documented local test environment.

## Required Risk Controls

### Market Allowlist

Bots may only act on explicitly allowlisted markets. Default should be no markets.

### Exposure Caps

Future controls should include:

- Per-market notional cap.
- Per-event notional cap.
- Daily notional cap.
- Aggregate bot account exposure cap.
- Max loss or collateral-at-risk cap if supported.

### Order Caps

Future controls should include:

- Max order size.
- Max number of open bot orders.
- Max order age.
- Cancel-on-stale-data behavior.
- Refuse-crossing behavior unless explicitly approved.

### Stale-Data Controls

Bots must stop or refuse action when:

- Reference market data is stale.
- POLY orderbook data is stale.
- System clock or timestamp checks fail.
- Market status is not open.
- Event/market resolution state is unclear.
- External reference API is unavailable.

### Kill Switch

Kill switch requirements:

- Defaults to halted when config is missing.
- Can be activated by admin/operator.
- Blocks new orders.
- Cancels or leaves open orders according to a documented policy.
- Emits visible admin status.
- Is tested before live launch.

## Public UX Boundary

Normal users should not see bot internals. User-facing pages may show simple liquidity or unavailable states, but must not expose:

- Bot account ids.
- Credential ids.
- Internal readiness flags.
- Seed-bot controls.
- Risk-limit internals.
- Reference import job details.
- Claims of guaranteed liquidity.

See `docs/reviews/REFERENCE_LIQUIDITY_UX_BOUNDARY_PLAN.md`.

## Admin UX Requirements

Admin bot/reference pages should show:

- Current mode.
- Live/dry-run status.
- Kill-switch status.
- Last run time.
- Last blocked reason.
- Stale-data status.
- Market allowlist status.
- Current exposure vs cap.
- Credential status without exposing secrets.

Mutating controls should require confirmation in future implementation PRs.

## CI And Validation Strategy

Future bot CI should start with dry-run proof only:

- No production credentials.
- No live order placement.
- Fixture-backed market/reference data.
- Assert intended actions are reported but not executed.
- Assert stale data blocks action.
- Assert missing config defaults to disabled.
- Assert kill switch blocks action.
- Assert caps block oversized action.

Suggested future validation:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Bot e2e commands should remain separate from required CI until classified safe and stable.

## Forbidden Autonomous Actions

Agents must not automatically:

- Run live bot trading.
- Create production bot credentials.
- Fund bot accounts.
- Change liquidity runtime behavior.
- Mark launch liquidity live-ready.
- Import production reference markets.
- Run snapshot watch loops against production.
- Change order placement, cancellation, matching, fills, ledger, balances, positions, settlement, deposits, or withdrawals.
- Change production deployment settings.

## Required Human Review

Human review is required for any PR that:

- Enables live mode.
- Changes bot order placement.
- Changes bot cancellation.
- Changes liquidity seeding.
- Changes market-making risk controls.
- Changes reference import behavior.
- Changes credentials or private-key handling.
- Changes production config or deployment.
- Touches financial state or trading semantics.

## Recommended Follow-Up Tasks

1. `BOT-004 - Bot Admin Confirmation Requirements`
   - Define confirmation and audit requirements for bot/reference mutations.
   - Docs-only first.

2. `TST-008 - Bot Dry-Run Safety Test Plan`
   - Plan tests proving disabled/dry-run modes cannot place orders.
   - Docs-only first.

3. `SEC-004 - Bot Credential Handling Review`
   - Review how bot credentials are generated, stored, and hidden.
   - Docs-only first; do not print secrets.

4. `DEP-004 - Bot Operations Runbook Outline`
   - Define human operation steps for kill switch, incident response, and rollback.
   - Docs-only first.

## Non-Goals

This plan does not:

- Enable bots.
- Run bot scripts.
- Create credentials.
- Modify bot, liquidity, reference, trading, ledger, wallet, admin auth, deployment, Prisma, or migration code.
- Approve public launch.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```
