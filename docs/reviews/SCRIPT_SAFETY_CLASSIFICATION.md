# Script Safety Classification

This DOC-001 document classifies visible scripts and package commands for safe agent use. It is docs-only and does not run or modify scripts.

## Safety Classes

| Class | Meaning | Agent default |
|---|---|---|
| Read-only inventory | Lists, scans, reports, or inspects state without intended mutation. | May run only with test/local inputs and no secrets. |
| Test-only | Runs tests or smoke checks in a controlled local/test environment. | May run when task scope authorizes it. |
| Local-mutating seed/setup | Creates or resets local/dev data. | Human approval recommended; never against production. |
| Repair/backfill | Changes persisted data to repair, reconcile, or backfill state. | Human approval required. |
| Funding/custody | Touches deposits, withdrawals, balances, private keys, or chain state. | Human approval required; production forbidden by default. |
| Bot/liquidity | Creates bot credentials, resets bot state, runs market making, or liquidity simulation. | Human approval required; live trading forbidden by default. |
| Deployment/production | Builds, starts, smokes, or operates production-like services. | Human approval required; no deployment by agents. |
| Unknown/high-risk | Purpose is unclear or crosses high-risk areas. | Do not run until classified by a human. |

## Package Script Classification

| Command | Class | Notes |
|---|---|---|
| `npm run dev`, `npm run build`, `npm run start` | Deployment/production | `dev` is local-only; `build/start` can affect runtime validation but must not deploy. |
| `npm run lint` | Test-only | Safe if it does not auto-fix files. |
| `npm run test:ci` | Test-only | Required safe CI smoke command. |
| `npm run test:jest` | Test-only but unstable | Not required CI; broad suite is not stable yet. |
| `npm run test:phase3`, `test:phase3:watch` | Test-only high-review | Vitest ledger service tests; financial area requires review. |
| `npm run e2e*` | Test-only assisted | Requires local app and test-only env; never production credentials. |
| `npm run db:push`, `db:migrate`, `db:studio` | Deployment/production data risk | Agents must not run without explicit human approval. |
| `npm run seed:*` | Local-mutating seed/setup | Test/dev only; never production. |
| `npm run reconcile:*`, `debug:*`, `backfill:*` | Repair/backfill or read-only unknown | Treat as human-reviewed until each command is proven read-only. |
| `npm run deposits:monitor` | Funding/custody | Do not run in agent workflows without explicit approval. |
| `npm run bots:*`, `bot:e2e:*` | Bot/liquidity | Dry-run/test only when explicitly scoped; never live trading. |
| `npm run soak:*`, `simulate:*`, `smoke:*` | Test/deployment/bot risk | Requires task-specific review before running. |
| `npm run agent:orchestrator:*` | Agent operations | Keep `DRY_RUN=true`; do not enable production autonomy. |

## Script File Classification

### Agent Workflow Scripts

| Files | Class | Notes |
|---|---|---|
| `scripts/agent-validate.sh`, `scripts/agent-report.sh` | Test-only/read-only reporting | Safe within agent validation scope. |
| `scripts/agent/*.sh` | Agent operations | Worktree/branch helpers; do not run if branch or filesystem mutation is not authorized. |

### Read-Only Or Inventory Candidates

| Files | Class | Notes |
|---|---|---|
| `scripts/audit_launch_markets.ts`, `scripts/count_fills.cjs`, `scripts/debug_markets.ts`, `scripts/inspect_market_collateral.ts`, `scripts/inspect_users.ts`, `scripts/report_orderbook_collateral_ledger.ts`, `scripts/report_orderbook_funding.ts`, `scripts/scan_polymarket_reference_candidates.ts`, `scripts/scan_polymarket_sports.ts`, `prisma/check_market_routing.ts`, `prisma/check_deposit_verify.ts` | Read-only candidate | Verify database target and source code before running; do not use production credentials. |

### Test And Simulation Candidates

| Files | Class | Notes |
|---|---|---|
| `scripts/phase3_sanity.ts`, `scripts/test_orderbook_*.ts`, `scripts/test_phase5_matching.ts`, `scripts/test_polygon_deposits.ts`, `scripts/test_reference_bot_initialization.ts`, `scripts/simulate_exchange_phase85.ts`, `scripts/smoke_phase9.ts`, `tests/e2e/*`, `tests/bot-e2e/*` | Test-only / high-review | May touch financial or bot domains; run only in test environment with explicit scope. |

### Local Seed And Setup

| Files | Class | Notes |
|---|---|---|
| `prisma/seed.ts`, `prisma/seed_nba.ts`, `scripts/seed_random_orderbook.ts`, `scripts/seed_used_environment.ts`, `scripts/create_sample_event.ts`, `scripts/import_launch_pool.ts`, `scripts/import_polymarket_event.ts`, `scripts/import_polymarket_reference_markets.ts`, `scripts/group_worldcup_event.ts` | Local-mutating seed/setup | Can create or mutate data. Do not run automatically. |

### Repair, Backfill, Cleanup, And Reconciliation

| Files | Class | Notes |
|---|---|---|
| `scripts/backfill_event_grouping_metadata.ts`, `scripts/backfill_realized_pnl.ts`, `scripts/cleanup_launch_markets.ts`, `scripts/delete_market.ts`, `scripts/delete_soak_markets.ts`, `scripts/reconcile_balances.ts`, `scripts/reconcile_markets.ts`, `scripts/reconcile_withdrawals.ts`, `scripts/repair_balance_state.ts`, `scripts/repair_balances_from_ledger.ts`, `scripts/reset-phase2.ts`, `scripts/trace_negative_ledger_users.ts` | Repair/backfill | Human approval required. Never run against production without a runbook and rollback plan. |

### Funding, Custody, And Wallet

| Files | Class | Notes |
|---|---|---|
| `scripts/run_polygon_deposit_monitor.ts`, `scripts/credit_sim_users.ts`, `scripts/clear_sim_daily_notional_caps.ts` | Funding/custody or balance risk | Do not run automatically. Requires SecurityAgent and LedgerWalletReviewerAgent review. |

### Bot, Liquidity, And Reference Market Operations

| Files | Class | Notes |
|---|---|---|
| `scripts/create_reference_arb_dry_run_credential.ts`, `scripts/create_sim_bot_credentials.ts`, `scripts/mark_launch_liquidity_live_ready.ts`, `scripts/refresh_reference_snapshots.ts`, `scripts/reset_bot_state.ts`, `scripts/soak_orderbook_bots.ts`, `scripts/verify_bot_mint_replenishment_integration.ts`, `scripts/admin_user_soak.ts`, `scripts/admin_user_soak_http.ts`, `scripts/analyze_recent_soak_batch.ts`, `scripts/analyze_recent_soak_pnl.ts`, `scripts/qa_launch_trade.ts` | Bot/liquidity | Dry-run/test only when explicitly scoped. Live-readiness or liquidity scripts require human approval. |

### Deployment And External Tooling

| Files | Class | Notes |
|---|---|---|
| `scripts/smoke_deployment.sh`, `scripts/e2e/*.ps1`, `scripts/ask-deepseek.js` | Deployment/external tooling | Do not run in normal agent cycles unless explicitly scoped. External API or deployment assumptions require human approval. |

## Default Agent Rules

- Do not run scripts that mutate database state unless the task explicitly authorizes the exact command and target environment.
- Do not run funding, deposit, withdrawal, custody, repair, live bot, or deployment scripts in autonomous cycles.
- Do not use production credentials or production databases for script validation.
- Prefer `git diff --check`, `npx prisma validate`, `npx prisma generate`, `npx tsc`, and `npm run test:ci` as normal safe validation.
- If a script purpose is unclear, classify it as unknown/high-risk and stop for human review.

## Follow-Up Needed

- Confirm which read-only candidates are truly read-only by inspecting each script body in a future review task.
- Add script-level runbooks for any command that may be used in staging or production.
- Add explicit test-only environment examples for approved smoke and simulation commands.
- Keep this classification updated when package scripts or `scripts/` files change.

## Non-Goals

This document does not:

- Run scripts.
- Delete or modify scripts.
- Change package scripts.
- Change CI.
- Change database, wallet, ledger, trading, bot, or deployment behavior.
