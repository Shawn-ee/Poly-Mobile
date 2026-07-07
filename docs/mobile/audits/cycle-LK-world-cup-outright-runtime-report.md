# Cycle LK - World Cup Outright Runtime Report

Date: 2026-07-07
Branch: `cycle/fj-real-provider-home-ticket`
Commit: `d16c091f`

## Scope

Runtime validation for the backend-driven World Cup Winner/outright flow and safe local bot/provider behavior.

## Backend/Mobile Contract Fix

- `/api/events?source=polymarket&includeMobileMarkets=1` now returns the World Cup Winner event as:
  - `eventType: future`
  - `marketProfile: outright`
  - `resultMode: one_winner`
  - `supportedMarketTypes: ["outright"]`
  - child markets with `marketType: outright` and `marketGroupTitle: Outrights`
- `/api/mobile/events/:slug/live-detail` returns the same outright contract, including `selection.marketType: outright`.
- Mobile Home and Event Detail render each team as an outright selection from its backend child market. The binary `No` leg remains in market data but is not promoted as the normal event card/game-line choice.

## Local Runtime

- Backend: `http://100.106.189.107:3002`
- Expo: port `8081`
- Database: Postgres on `5432`
- S23-reachable backend proof:
  - route reachable: yes
  - slug: `mobile-fj-real-world-cup-winner`
  - profile: `outright`
  - first market type: `outright`
  - first outcome: `Argentina`
  - first price: `0.1845`

## Bot/Provider Checks

Poly bot safety checks:

- `npm run bots:safety`: pass
- `npm run test:world-cup-market-making-guardrails`: pass
- `npm run test:reference-liquidity`: pass
- `npm run typecheck`: pass

Provider/reference dry runs:

- `npm run bot:polymarket:discover`: pass, selected 11 World Cup candidates.
- `npm run reference:cache-dry-run -- --slug will-argentina-win-the-2026-fifa-world-cup-245 --durationSeconds 5 --pollIntervalMs 2000`: pass.
  - Argentina Yes reference price: `0.1845`
  - best bid/ask: `0.184 / 0.185`
  - quality: `high_quality`
  - `mmEligible: true`
- `npm run bot:polymarket:mm:dry-run -- --baseUrl http://127.0.0.1:3002 --devAdminUserId <local-dev-admin> --eventSlug mobile-fj-real-world-cup-winner --maxMarkets 2 --durationSeconds 8 --pollMs 3000`: pass.
  - Runtime found Argentina and France markets.
  - Planned local bot quotes.
  - No orders placed because `dryRun` is true, live orders are disabled, and live confirmation is not enabled.

## Validation

- `npm run test:mobile-api`: pass, 38 files / 161 tests.
- `mobile npm run typecheck`: pass.
- backend `npx tsc --noEmit`: pass.
- Local API contract probe: pass.

## Remaining Runtime Decision

The system is ready for internal S23 viewing of real backend/provider event data. Live internal market-maker order placement is intentionally still off. To test actual bot order placement, enable it as a separate controlled step with explicit internal-only bot env flags and a small market allowlist.

## Git State

Poly repo was clean after commit/push. `poly-bot` still has pre-existing uncommitted cleanup/inventory items:

- deleted `scripts/slow_down_sim_bots.js`
- untracked `docs/world-cup-bot-inventory.md`

