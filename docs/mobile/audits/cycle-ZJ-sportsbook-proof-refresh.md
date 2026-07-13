# Cycle ZJ - Sportsbook Backend Proof Refresh

Date: 2026-07-13

## Scope

Refresh the temporary Odds API sportsbook bridge proof used by the internal readiness batch without spending provider quota.

This cycle stays inside the Local MVP tester flow:

- backend-owned sportsbook replay data
- mobile-visible Event Detail market contract
- fake-token buy/sell/cashout
- Portfolio/history reflection
- no order book UI, chat, social, or new provider scanning

## Issue

`npm run mobile:internal-readiness-batch` reported `temporary_sportsbook_backend_proof_stale_or_missing` as P1 because the smaller single-event seed and fake-token mobile-flow artifacts were older than the 24-hour freshness window.

The richer internal-environment proof also failed when run directly because the proof script touched Prisma before loading the local `DATABASE_URL`.

## Fixes

- Added local env preload support for scripts that are meant to run directly from a clean shell.
- Hardened `mobile:odds-api-internal-env-proof` so Prisma-backed imports happen only after local env is loaded.
- Added `mobile:the-odds-api-single-event:replay` for no-quota replay refresh from the committed redacted fixture.
- Made replay refresh write the canonical `single-event-summary.redacted.json` as well as replay-specific evidence.
- Updated the mobile fake-token flow proof to select a route-visible Event Detail market before trading, so hidden raw provider lines are not traded behind the UI.
- Isolated the fake-token proof on reused local DBs by canceling stale blocking orders for the selected market/outcome before buy and cashout legs.

## Proof

- `npm run mobile:the-odds-api-single-event:replay` passed.
- `npm run mobile:the-odds-api-single-event-flow` passed.
- `npm run mobile:odds-api-internal-env-proof` passed.
- `npm run mobile:internal-readiness-batch` passed with no P0 blockers.

Key evidence:

- `docs/mobile/harness/the-odds-api-single-event/single-event-summary.redacted.json`
- `docs/mobile/harness/the-odds-api-single-event/mobile-flow-proof.redacted.json`
- `docs/mobile/harness/the-odds-api-internal-environment/internal-environment-proof.redacted.json`
- `docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json`
- `docs/mobile/audits/BATCH_INTERNAL_READINESS_GAP_LIST.md`

## Result

`temporary_sportsbook_backend_proof_stale_or_missing` was removed from the batch P1 blocker list.

Remaining P1 blockers are provider/Google/manual-env readiness items:

- Polymarket World Cup match books unavailable or closed.
- No attach-ready Polymarket World Cup line markets.
- Cached Polymarket provider evidence is stale.
- Manual server-mode API key and Google login preflight warnings remain.

## Runtime Notes

- Provider quota used by this cycle: none.
- S23 proof remained fresh.
- Backend stayed on port 3002.
- Expo was not started.
- Bot/market maker remained one-shot proof liquidity only, not a continuous daemon.
