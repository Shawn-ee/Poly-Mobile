# Poly Runtime Integration Test Report

Generated: 2026-07-07

Branch: `cycle/fj-real-provider-home-ticket`

Remote target: `poly-mobile`

## Summary

This loop tested Holiwyn mobile as a local/internal frontend for the Poly backend exchange and corrected the provider-ingestion model for soccer.

Result:

- Ready for internal bot-backed local testing: yes, with P1 breadth caveats.
- Ready for server deployment rehearsal: no.
- Ready for production/public launch: no.

Polymarket is used as provider/reference metadata and pricing input. Mobile users trade against Poly backend/local fake-token markets through Poly routes. No real Polymarket orders were placed.

## Architecture Correction

The runtime now has a normalized soccer provider-ingestion layer:

- `src/server/services/soccerProviderNormalization.ts`

The layer maps raw Polymarket/Gamma event and market data into Poly-owned fields before mobile or bot usage:

- Event: `sportKey`, `leagueKey`, `eventType`, `homeTeamName`, `awayTeamName`, `marketProfile`, `resultMode`, `gameRules`, `supportedMarketTypes`
- Market: `marketType`, `marketGroupKey`, `marketGroupTitle`, `period`, `line`, `participantType`, `participantName`, `participantId`, `rules`, `rulesText`
- Provider identity: provider slug, market id, condition id, token ids, reference bid/ask, quality state, MM eligibility

World Cup Winner child markets are now normalized as:

- `eventType=future`
- `marketProfile=outright`
- `resultMode=one_winner`
- `marketType=outright`
- `marketGroupKey=outrights`
- `period=futures`
- `participantType=team`

They are no longer stored as generic `moneyline` / `Game Lines` markets.

## Services Verified

| Service | URL/port | Result |
| --- | --- | --- |
| Poly backend/API | `http://127.0.0.1:3002` | Pass |
| Postgres | `5432` | Pass through backend readiness |
| Expo mobile dev server | `exp://172.16.200.14:8081` | Pass |
| Samsung S23 | ADB `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` | Pass |

Mobile runtime mode:

- `EXPO_PUBLIC_ORDER_MODE=server`
- `EXPO_PUBLIC_MARKET_DATA_MODE=server`
- Local dev API credential only

Secrets are intentionally omitted.

## Commands And Proof

| Area | Command/proof | Classification | Result |
| --- | --- | --- | --- |
| Normalization tests | `soccerProviderNormalization.test.ts`, `polymarketEventImport.test.ts` | Read-only test | Pass, 7 tests |
| TypeScript | `npx tsc --noEmit --pretty false` | Read-only test | Pass |
| Provider prep | `prove_mobile_real_provider_world_cup_winner.ts --marketLimit=10` | Local-mutating fake-token/reference prep | Pass |
| Route proof | `/api/events`, `/api/mobile/events/:slug/live-detail` | Read-only | Pass |
| Readiness | `poly:internal-exchange-readiness` | Read-only | Pass |
| Bot dry-run | poly-bot `bot:polymarket:mm:dry-run` allowlist England/Argentina/France | Dry-run | Pass |
| Backend order safety | `canonical_order_submission.phase5.test.ts` | Read-only test | Pass, 11 tests |
| Mobile cashout/cancel services | `positionCloseService`, `openOrderService`, `api` tests | Read-only test | Pass, 32 tests |
| S23 Home proof | UI hierarchy inspection | Device proof | Pass |
| S23 Portfolio proof | UI hierarchy inspection | Device proof | Pass |

## Provider Import And Visibility

Provider-backed event:

- Slug: `mobile-fj-real-world-cup-winner`
- Title: `World Cup Winner`
- Provider event slug: `world-cup-winner`
- Market profile: `outright`
- Result mode: `one_winner`
- Supported market types: `outright`
- Mobile-visible provider markets: 9

Mobile route proof:

- `/api/events?source=polymarket&includeMobileMarkets=1&limit=5`
  - first event: `mobile-fj-real-world-cup-winner`
  - home market count: 9
  - event profile: `outright`
  - result mode: `one_winner`
- `/api/mobile/events/mobile-fj-real-world-cup-winner/live-detail`
  - detail market count: 9
  - market types: `outright`
  - groups: `outrights`
  - sample participants: Argentina, France, Spain, England, Belgium

Readiness gate:

- DB connected: yes
- Mobile-visible event count: 7
- Provider-backed mobile-visible event count: 1
- Provider markets inspected: 9
- Snapshot-ready provider markets: 9
- Local market-maker-ready provider markets: 3
- Open-order-backed provider markets: 3
- Readiness blockers: none

## Reference Prices And Market Maker

Reference snapshots refreshed for 9 provider-backed World Cup Winner markets.

Bot dry-run settings:

- `SYSTEM_LIQUIDITY_DRY_RUN=true`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=false`
- `QUOTE_OFFSET_TICKS=2`
- `TICK_SIZE=0.01`
- Allowlist: England, Argentina, France

Observed shifted quote plans:

- England reference `0.146 / 0.147`, planned local `0.13 / 0.17`
- Argentina reference `0.184 / 0.185`, planned local `0.16 / 0.20`
- France reference `0.331 / 0.332`, planned local `0.31 / 0.35`

This proves the core model: local bid is worse than Polymarket bid by configured ticks, and local ask is worse than Polymarket ask by configured ticks. No orders were placed in dry-run.

Earlier live-local fake-token proof also moved England, France, and Argentina through `live_enabled`/`manage_quotes` with local Poly orders only. No real Polymarket order path was used.

## S23 Proof

S23 Home after normalization:

- `World Cup Winner` visible
- backend card marker `event-card-mobile-fj-real-world-cup-winner` visible
- outcome rail marker `home-card-outright-market` visible
- visible provider outcomes included Argentina, France, England, Spain, plus additional provider outcomes such as Belgium/Norway/Morocco

S23 Portfolio:

- same local backend account showed `Will England win the 2026 FIFA World Cup?`
- displayed `Cash out`
- displayed `Portfolio route proof`
- displayed `Filled shares`

This closes the previous account-split caveat: the S23 app and backend order/portfolio proof now align on the same local account state.

## Cashout, Sell, And Cancel Safety

Backend safety:

- `canonical_order_submission.phase5.test.ts` passed.
- SELL without enough position is rejected and stored as failed canonical order response.
- Oversell returns conflict/insufficient balance semantics.

Mobile safety:

- `positionCloseService.test.ts` passed.
- Cashout is full-position only.
- Cashout is unavailable without a positive position.
- `openOrderService.test.ts` passed.
- Server-mode cancel waits for backend success.

Status: no unresolved P0 safety gap found in this loop.

## Provider Breadth Search

Read-only Gamma searches were run for:

- `world cup`
- `soccer`
- `champions league`
- `premier league`
- `uefa`
- `mls`
- `club world cup`

Result: active/usable soccer results all collapsed to the same `World Cup Winner` provider event. No second safe active soccer provider event was found in the current public Gamma search slice.

That means the current internal system proves multiple normalized provider-backed markets, but only one provider-backed soccer event. This is a P1 breadth gap, not a P0 runtime blocker.

## Issues

### P0

None remaining from this loop.

### P1

1. Only one provider-backed soccer event is currently mobile-visible.
   - Current state: 9 normalized provider-backed markets under World Cup Winner.
   - Search result: no second safe active soccer provider event found in current Gamma search.
   - Next action: broaden provider discovery or support additional provider categories only after review.

2. Some local non-provider World Cup match rows remain visible.
   - They are useful for UI/game-line testing but are not provider-backed.
   - Next action: add an internal provider-backed-only proof mode if needed.

3. Live-local bot runtime files contain local credentials.
   - They must remain uncommitted and ignored.
   - Next action: sanitize bot output so credential material is never printed during seeding.

4. Chart/history lifecycle can become `refresh_due` faster than quote snapshots.
   - Quotes are fresh and trading proof is not blocked.
   - Next action: keep chart/history out of MVP trading readiness unless explicitly required.

### P2

1. Broaden normalized soccer classifier coverage for corners, cards, and player props when valid provider data exists.
2. Add a clean-book quote-creation proof after local noise cleanup.
3. Add a formal S23 screenshot capture only when needed for stakeholder review.

## Readiness Decision

Ready for internal bot-backed local testing: yes.

Ready for server deployment rehearsal: no.

Ready for production/public launch: no.

Reason: local backend, normalized provider ingestion, mobile server-mode feed, reference snapshots, shifted bot dry-run, fake-token order/portfolio state, cashout/sell safety tests, cancel tests, and S23 Home/Portfolio proof passed. Server deployment and production still need broader provider coverage, environment hardening, credential/output sanitization, monitoring, and public-money safety review.

## Next Recommended Loop

Run a provider breadth loop:

1. Improve read-only discovery for soccer provider events beyond the current top Gamma search slice.
2. Keep unsupported or ambiguous raw markets hidden.
3. Import only a small allowlist through `soccerProviderNormalization`.
4. Prove route/mobile/bot behavior for each imported normalized profile.
5. Commit only source/docs, not generated runtime artifacts.
