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

Controlled local live-internal proof:

- Target: England outright market only.
- Seed:
  - `npm run liquidity:seed-market-bot -- --baseUrl http://127.0.0.1:3002 --devAdminUserId <local-dev-admin> --slug will-england-win-the-2026-fifa-world-cup-937 --capitalDollars 25 --mintDollars 5 --dryRun false --confirmSeed true`
  - Result: seeded local `system-liquidity-bot` fake-token account/runtime for the England market.
- Enable:
  - `npm run liquidity:enable-event-mm -- --baseUrl http://127.0.0.1:3002 --devAdminUserId <local-dev-admin> --eventSlug mobile-fj-real-world-cup-winner --allowlist England --maxMarkets 1 --dryRun false --confirmEnable true`
  - `npm run markets:enable-event-trading -- --baseUrl http://127.0.0.1:3002 --devAdminUserId <local-dev-admin> --eventSlug mobile-fj-real-world-cup-winner --allowlist England --maxMarkets 1 --dryRun false --confirmEnable true`
  - Result: market reached `live_ready`.
- Live-local runner:
  - Bot-process env used: `POLY_BOTS_ENABLED=true`, `POLY_BOTS_LIVE_TRADING=true`, `POLY_BOTS_GLOBAL_KILL_SWITCH=false`, `POLY_BOTS_MODE=liveInternal`, `SYSTEM_LIQUIDITY_DRY_RUN=false`, `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`.
  - Proof caps: 1-share max order size, 1-dollar max single-order notional, zero local proof cash reserve, zero local proof minimum inventory.
  - Command: `npm run bot:polymarket:mm:live-local -- --baseUrl http://127.0.0.1:3002 --devAdminUserId <local-dev-admin> --eventSlug mobile-fj-real-world-cup-winner --allowlist England --maxMarkets 1 --durationSeconds 4 --pollMs 3000`
  - Result: local runner transitioned England from `live_ready` to `live_enabled` and placed four local fake-token orders:
    - England BUY @ `0.13`, size `1`
    - England SELL @ `0.17`, size `1`
    - No BUY @ `0.83`, size `1`
    - No SELL @ `0.87`, size `1`
  - No Polymarket orders were placed. Polymarket was used only for public reference prices.

Post-run backend proof for England:

- `/api/mobile/events/mobile-fj-real-world-cup-winner/live-detail`
  - market type: `outright`
  - group: `Outrights`
  - England provider price: `0.1475`
  - England provider bid/ask: `0.147 / 0.148`
  - No provider price: `0.8525`
  - No provider bid/ask: `0.852 / 0.853`
  - local orderbook depth count: `4`

## Validation

- `npm run test:mobile-api`: pass, 38 files / 161 tests.
- `mobile npm run typecheck`: pass.
- backend `npx tsc --noEmit`: pass.
- Local API contract probe: pass.

## Remaining Runtime Decision

The system is ready for internal S23 viewing of real backend/provider event data and has a proven local fake-token market-maker placement path for one allowlisted World Cup outright market. Keep production/real-money bots disabled. For broader internal soak, expand only by explicit allowlist and small caps.

## Git State

Poly repo was clean after commit/push. `poly-bot` cleanup/inventory was committed and pushed separately on `dev` as `854015b`.
