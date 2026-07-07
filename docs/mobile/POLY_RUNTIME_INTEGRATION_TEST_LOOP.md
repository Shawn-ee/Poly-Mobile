# Poly Runtime Integration Test Loop

Purpose: run Holiwyn mobile as the mobile frontend for the existing Poly backend exchange in local/internal fake-token mode.

This is an operator/testing loop, not a normal feature-development loop. The loop should start services, import/reference markets, run safe bots, verify mobile behavior, document every issue found, and fix only the issues required to make the local integrated system work.

## Target Architecture

Polymarket is the external reference source. Poly is the exchange backend.

The intended runtime flow is:

1. Discover relevant Polymarket markets.
2. Import selected markets into Poly `Event`, `Market`, and `Outcome` records.
3. Group and classify imported markets for mobile display.
4. Refresh Polymarket reference prices and snapshots.
5. Seed/enable local fake-token liquidity where safe.
6. Run Poly market-maker bots against Poly local markets.
7. Quote local Poly orderbook prices using a controlled shift from Polymarket reference prices, such as two ticks worse than Polymarket.
8. Holiwyn mobile reads Poly backend routes only.
9. Internal test users place fake-token predictions through Poly `/api/orders`.
10. Portfolio, open orders, positions, history, cashout, and cancel reflect Poly backend state.

Users should not trade directly on Polymarket. Polymarket is used for market metadata and reference pricing only.

## Non-Negotiable Safety Rules

- Local device only.
- Fake-token/internal mode only.
- No production deployment.
- No real-money trading.
- No real Polymarket order placement.
- No production bot enablement.
- Read relevant docs and script source before running any service, script, or bot.
- Dry-run before live-local.
- Live-local requires explicit allowlist and tiny caps.
- Keep kill switches and notional/order-size caps active.
- Keep git clean before and after each cycle.
- Push reports/docs/code to `poly-mobile`.

## Required Docs Before Running Commands

Before running any command, consult the relevant docs and script source. At minimum, check these when applicable:

- `docs/runbook.md`
- `docs/POLY_BOT_SPORTS_COMPATIBILITY.md`
- `docs/polymarket-structure-transition.md`
- `docs/reviews/BOT_PACKAGE_LOCATION_INVENTORY.md`
- `docs/reviews/BOT_RISK_CONTROL_PLAN.md`
- `docs/reviews/BOT_DRY_RUN_SAFETY_TEST_PLAN.md`
- `docs/reviews/BOT_DRY_RUN_TEST_IMPLEMENTATION_SCOPE.md`
- `docs/reviews/BOT_ADMIN_CONFIRMATION_REQUIREMENTS.md`
- `docs/reviews/BOT_FUNDING_RUNTIME_SAFETY.md`
- `docs/reviews/BOT_OPERATIONS_RUNBOOK_OUTLINE.md`
- `docs/mobile/POLY_SYSTEM_UNDERSTANDING_REPORT.md`
- `docs/mobile/POLY_SHARED_BACKEND_RUNTIME_PLAN.md`, if present
- `package.json`
- the exact script source before running the script

Every command record must include:

- command
- purpose
- doc/source consulted
- classification: read-only, dry-run, local-mutating, live-local, or production-dangerous
- required environment variables
- expected database changes
- expected mobile-visible changes
- pass/fail result
- rollback or cleanup note if needed

## Loop Phases

### Phase 1: Readiness

- Verify git is clean and branch is aligned with `poly-mobile`.
- Verify local-only/fake-token environment.
- Verify kill switches, caps, and dry-run defaults.
- Inventory service ports and currently running processes.
- Classify all planned commands before running them.

### Phase 2: Start Core Services

Start and verify:

- Postgres/database
- Poly backend/API server
- Holiwyn Expo/mobile dev server
- Android/S23 reachability to backend

Required checks:

- `/api/health`
- mobile API base URL points to local Poly backend
- `EXPO_PUBLIC_ORDER_MODE=server`
- `EXPO_PUBLIC_MARKET_DATA_MODE=server`
- valid local mobile dev API credential

### Phase 3: Provider Market Import And Visibility

Goal: make multiple relevant Polymarket-backed markets visible through Poly backend and Holiwyn mobile.

Steps:

- Discover selected Polymarket World Cup/soccer markets.
- Import a small controlled allowlist.
- Preserve provider metadata: source, slugs, condition ids, token ids, market ids, outcome ids.
- Group/classify markets correctly:
  - outright/futures
  - single-game winner
  - to advance
  - spread/handicap
  - totals
  - team totals
  - first half / second half
  - player props only if valid backend/provider data exists
- Ensure imported markets are listed/mobile-visible only when safe.
- Verify `/api/events` and Event Detail routes expose them.

### Phase 4: Reference Price Refresh

For imported markets:

- refresh Polymarket reference snapshots
- verify best bid/ask/reference price
- identify `mmEligible` markets
- record markets missing provider tokens, snapshots, or quality
- do not invent prices in server mode

### Phase 5: Market Maker Dry Run

Run market-maker dry-run only after import and reference refresh pass.

Dry-run must prove:

- selected allowlist markets are found
- reference prices are read
- two-tick shifted local quotes are planned
- no local orders are placed
- no Polymarket orders are placed
- caps and kill switches are respected

### Phase 6: Live-Local Fake-Token Bot Test

Only if dry-run passes:

- explicit allowlist only
- tiny caps only
- short runtime window
- fake-token local orders only
- no real Polymarket orders

Proof must show:

- local bot quotes/orders are placed in Poly backend
- local orderbook/quote routes expose them
- mobile can see the resulting prices/liquidity

### Phase 7: Mobile Internal User Flow

On S23/mobile, prove:

- Home displays multiple backend/provider markets
- Search finds imported markets
- Event Detail layout matches market type
- Trade Ticket opens with correct `marketId` and `outcomeId`
- quote route returns backend/reference/bot data or clear unavailable state
- fake-token order submit works through `/api/orders`
- Portfolio shows backend open orders, positions, history, and value chart
- cancel and cashout/sell safety still work
- server mode does not hide backend failures with mock fallback data

### Phase 8: Issue Handling

Whenever a problem is found:

1. Document the problem immediately.
2. Classify severity:
   - P0: blocks local integrated internal testing
   - P1: limits breadth or reliability but has a workaround
   - P2: future polish or production hardening
3. Identify owner area:
   - provider discovery/import
   - backend schema/classification
   - reference snapshot/quote
   - market maker/bot
   - backend route/serializer
   - mobile API/service wiring
   - mobile UI rendering
   - environment/device/service startup
4. Fix P0 issues before continuing broad runs.
5. Use multiple agents only when file ownership is separable.

## Multi-Agent Structure

Use multi-agent work only when tasks are independent:

- Agent A: provider import, backend schema/classification, backend route contracts.
- Agent B: bot/reference snapshot/liquidity/market-maker runtime.
- Agent C: mobile route proof, S23 validation, reports, audit gates.
- Lead: integration, conflict control, final readiness decision, git hygiene.

Avoid multiple agents editing the same major file or mobile screen at the same time.

## Final Report

Each long run must produce or update:

`docs/mobile/POLY_RUNTIME_INTEGRATION_TEST_REPORT.md`

Required sections:

- services started
- commands run and classification
- docs/source consulted
- imported market count
- mobile-visible event count
- reference snapshot count
- `mmEligible` count
- bot-enabled count
- bot dry-run result
- live-local fake-token result, if run
- S23 proof summary
- fake-token order proof
- Portfolio proof
- cashout/cancel safety proof
- issues found and fixes made
- remaining P0/P1/P2 gaps
- bots to keep
- bots to disable
- bots to improve
- next recommended loop

## Completion Criteria

The loop can claim success only when:

1. Core local services are running and reachable.
2. Holiwyn mobile uses Poly backend as the single source of truth.
3. Multiple imported Polymarket-backed markets are visible in mobile.
4. Reference prices are refreshed for the tested markets.
5. Market-maker dry-run proves shifted quotes without placing orders.
6. Live-local fake-token market making succeeds if safely enabled.
7. Mobile fake-token order placement works.
8. Portfolio reflects backend state.
9. No real Polymarket orders are placed.
10. No production bots are enabled.
11. All P0 issues found during testing are fixed or explicitly blocked with evidence.
12. Final report exists.
13. Repo is clean and pushed to `poly-mobile`.

The final answer must state:

- Ready for internal bot-backed local testing: yes/no
- Ready for server deployment rehearsal: yes/no
- Ready for production/public launch: no unless separately proven
