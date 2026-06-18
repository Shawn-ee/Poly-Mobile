# Bot Package Location Inventory

Task id: BOT-001
Assigned subagents: BotAgent, SecurityAgent, DocsAgent
Risk level: Medium
Status: Review and planning only

## Purpose

POLY has several bot, reference market, liquidity, and automation surfaces spread across scripts, server services, admin UI, API routes, tests, and docs. This inventory identifies where those surfaces live so future agents can avoid changing live-trading or liquidity behavior without explicit human review.

This document does not run bots, enable bots, change risk limits, change credentials, or modify production behavior.

## Current Top-Level Package Shape

There is no standalone `poly-bot/` package in the current repository tree. Bot-related behavior appears to be integrated into the main Next.js application and supporting scripts.

Relevant surfaces are currently organized as:

- `scripts/` for bot credential generation, state reset, reference market imports, snapshots, and soak/test utilities.
- `src/server/services/` for reference quote snapshots, reference liquidity seeding, bot readiness, bot initialization, run state, and admin monitoring.
- `src/app/api/admin/` for admin bot and reference market endpoints.
- `src/app/admin/` and `src/components/admin/` for admin monitoring and reference market review UI.
- `tests/bot-e2e/` for bot end-to-end fixture, seed, shared, and runner files.
- `docs/` and `docs/reviews/` for bot compatibility, product review, roadmap, and safety planning.

## Bot-Related Package Scripts

The root `package.json` exposes several bot-adjacent commands:

- `soak:run` - runs `scripts/soak_orderbook_bots.ts`.
- `test:reference-bot-initialization` - runs `scripts/test_reference_bot_initialization.ts`.
- `bots:generate-sim-credentials` - runs `scripts/create_sim_bot_credentials.ts`.
- `bots:reset-state` - runs `scripts/reset_bot_state.ts`.
- `bot:e2e:seed` - runs `tests/bot-e2e/seed.ts`.
- `bot:e2e:run` - runs the bot e2e seed and runner.
- `reference:snapshot-refresh` - runs `scripts/refresh_reference_snapshots.ts`.
- `reference:snapshot-watch` - runs reference snapshot refresh in watch mode.
- `import:polymarket-reference-markets` - imports reference markets.
- `inspect:polymarket-reference-candidates` - scans reference candidates.

These commands should not be run by autonomous agents against production data or production credentials. Future automation should classify each command as safe, local-mutating, external-read, or production-dangerous before use.

## Script Inventory

Bot and reference-adjacent scripts currently visible in the repository include:

- `scripts/create_sim_bot_credentials.ts`
- `scripts/create_reference_arb_dry_run_credential.ts`
- `scripts/reset_bot_state.ts`
- `scripts/soak_orderbook_bots.ts`
- `scripts/test_reference_bot_initialization.ts`
- `scripts/verify_bot_mint_replenishment_integration.ts`
- `scripts/refresh_reference_snapshots.ts`
- `scripts/scan_polymarket_reference_candidates.ts`
- `scripts/import_polymarket_reference_markets.ts`
- `scripts/mark_launch_liquidity_live_ready.ts`

Future agents must treat these scripts as unsafe to run by default unless a task explicitly authorizes the exact command, environment, and expected side effects.

## Server Service Inventory

Bot and reference-adjacent server services currently visible include:

- `src/server/services/adminBotMonitor.ts`
- `src/server/services/botRunState.ts`
- `src/server/services/referenceBotInitialization.ts`
- `src/server/services/referenceBotReadiness.ts`
- `src/server/services/referenceLiquiditySeeding.ts`
- `src/server/services/referenceQuoteSnapshots.ts`
- `src/server/services/polymarketReferenceImport.ts`
- `src/server/services/polymarketReferencePreview.ts`
- `src/server/services/polymarketReferenceSnapshots.ts`

These services likely define important operational boundaries for future bot work. Any implementation changes here require BotAgent review and SecurityAgent review. If changes can affect orders, balances, liquidity, market making, live trading, external reference data, or production state, human review is required and auto-merge is forbidden.

## API Route Inventory

Bot and reference-adjacent API routes currently visible include:

- `src/app/api/admin/bots/route.ts`
- `src/app/api/admin/bots/[id]/route.ts`
- `src/app/api/admin/reference-markets/route.ts`
- `src/app/api/admin/reference-markets/[id]/route.ts`
- `src/app/api/admin/reference-markets/[id]/refresh-snapshot/route.ts`
- `src/app/api/admin/reference-markets/[id]/seed-bot/route.ts`
- `src/app/api/admin/reference-markets/polymarket/import/route.ts`
- `src/app/api/admin/reference-quote-snapshots/route.ts`
- `src/app/api/markets/[id]/reference/route.ts`

Future route work should distinguish read-only monitoring from mutating operations such as imports, snapshots, readiness toggles, seeding, bot state changes, and liquidity operations.

## Admin UI Inventory

Admin bot and reference surfaces currently visible include:

- `src/app/admin/bots/page.tsx`
- `src/app/admin/reference-markets/page.tsx`
- `src/components/admin/BotMonitorDashboard.tsx`
- `src/components/admin/ReferenceMarketsReview.tsx`

Future UI work in these areas should be treated as admin-only and reviewed for permission, status clarity, confirmation states, and production-safety copy.

## Test Inventory

Bot-related tests and fixtures currently visible include:

- `tests/bot-e2e/fixture.json`
- `tests/bot-e2e/run.mjs`
- `tests/bot-e2e/run.ts`
- `tests/bot-e2e/seed.ts`
- `tests/bot-e2e/shared.ts`

These tests may mutate local test state. They should not be required in broad CI until their environment assumptions, fixtures, cleanup behavior, and external dependencies are documented.

## Documentation Inventory

Bot and reference docs currently visible include:

- `BOT_E2E_TEST_PLAN.md`
- `docs/POLY_BOT_SPORTS_COMPATIBILITY.md`
- `docs/reviews/FULL_PLATFORM_REVIEW.md`
- `docs/reviews/ARCHITECTURE_REVIEW.md`
- `docs/reviews/FINANCIAL_SAFETY_REVIEW.md`
- `docs/reviews/IMPLEMENTATION_ROADMAP.md`
- `docs/reviews/EXECUTION_BACKLOG.md`
- `docs/reviews/NEXT_10_SUBAGENT_TASKS.md`

Future bot docs should link back to this inventory when defining implementation tasks.

## Risk Boundaries

Automatic implementation is forbidden for:

- Live market-making behavior.
- Liquidity runtime behavior.
- Bot credential generation for production.
- Bot account funding.
- Order placement, cancellation, fills, matching, or settlement.
- Balance, ledger, deposit, withdrawal, or position updates.
- Admin endpoints that mutate bot state, seed liquidity, import markets, or toggle readiness.
- Production reference-market imports or snapshot watches.

Docs-only inventories and plans may proceed through normal PR review. Any implementation task in the areas above requires explicit human approval.

## Recommended Follow-Up Tasks

1. `BOT-002 - Bot Command Safety Matrix`
   - Goal: Classify each bot/reference script as read-only, local-mutating, external-read, test-only, or production-dangerous.
   - Risk: Medium.
   - Required review: BotAgent and SecurityAgent.

2. `BOT-003 - Reference Liquidity UX Boundary Plan`
   - Goal: Define how user-facing UI should describe bot-provided liquidity and reference pricing without implying guarantees.
   - Risk: Medium.
   - Required review: BotAgent, SecurityAgent, and Product/Planner review.

3. `BOT-004 - Bot Admin Confirmation Requirements`
   - Goal: Specify confirmation, audit, and permission requirements before any admin bot mutation.
   - Risk: High planning.
   - Required review: BotAgent, SecurityAgent, and human review.

## Validation For This Inventory

This inventory is docs-only. Validation for this PR should be:

```bash
git diff --check
```

No bot commands should be run for this inventory task.
