# Cycle OV - Nation Top Goalscorer Provider Breadth And Classification Guard

Date: 2026-07-08

## Scope

Continue the Provider Breadth Runtime Loop with a material structural gap:

- Import/normalize another real Polymarket-backed World Cup event.
- Refresh reference prices through Polymarket Gamma/CLOB.
- Prove mobile Search shows the expanded provider breadth on Samsung S23.
- Guard Local MVP Home/Live so broad futures do not leak into the match-only user flow.
- Run tiny allowlisted bot dry-run/live-local and document the real blocker.

This cycle intentionally does not add order book UI, chat, live stats, social surfaces, or source-label-only polish.

## Reference / Provider Audit

Provider source:

- Polymarket Gamma event discovery for `world-cup-nation-of-top-goalscorer`.
- Polymarket CLOB public market data for token-backed quote refresh.
- `OPTIC_ODDS_API_KEY` remains optional and is not a blocker.

Observed import:

- Gamma event title: `World Cup: Nation of Top Goalscorer`.
- Gamma markets: 54.
- Imported route markets: 8.
- Approved imported markets include France, Norway, Argentina, and England.

Regression discovered:

- Before the normalization fix, this event was classified as `eventType=match` because it did not contain `winner`.
- That made it appear in the Local MVP `mobileMvpMatches=1` route, which would pollute Home/Live with a futures event.
- The implementation fixed the normalization guard so top-goalscorer/stat/award-like World Cup events are `future/outright`.

## Acceptance Criteria

P0:

- Missing Optic Odds key must not fail provider readiness.
- Import must produce real provider-owned markets with external slugs/ids and token-backed price fields.
- Reference refresh must update provider quote snapshots for the imported event.
- Broad provider route proof must show at least 5 provider-backed World Cup events after import.
- The new Nation Top Goalscorer event must be classified as `future`, not `match`.
- The Local MVP match-only route must still contain only real match events.
- Samsung S23 proof must show the newly imported event in Holiwyn Search.
- Bot dry-run/live-local must be attempted only with a tiny allowlist, and any quote-placement blocker must be recorded honestly.
- Expo/Metro and stale worker processes must be cleaned after proof.

P1:

- Real provider-backed current/live World Cup match breadth.
- Real provider-backed Spread/Totals/Team Total line markets for match detail pages.
- Scheduled refresh for reference snapshots.
- Bot seed/risk-cap sizing that allows local quote placement after seeding.

P2:

- Continue reducing tester-facing source-label visual weight only when it blocks testing.

## Implementation Notes

Changed:

- `src/server/services/soccerProviderNormalization.ts`
- `src/server/services/__tests__/soccerProviderNormalization.test.ts`

Behavior:

- World Cup futures with phrases such as top goalscorer, top scorer, golden boot, golden ball, golden glove, clean sheets, assists, goal contributions, and related award/stat wording now normalize as `future/outright`.
- Existing match winner normalization remains unchanged.

Material user-visible change:

- S23 Search now shows 5 provider-backed World Cup results, led by `World Cup: Nation of Top Goalscorer` with `Polymarket 8 markets`.
- Home/Live remain cleaner because this futures event is excluded from the match-only route.

## Proof

Provider/route proof:

- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-nation-top-scorer-import-dry-run.json`
- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-nation-top-scorer-import-live-after-classification-fix.json`
- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-nation-top-scorer-reference-refresh.json`
- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-provider-breadth-runtime-route-after-classification-fix.json`
- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-search-provider-breadth-route-after-classification-fix.json`

Samsung S23 proof:

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM_S911U1`.
- Screenshot: `docs/mobile/screenshots/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-s23-provider-breadth-search.png`
- XML: `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-s23-provider-breadth-search.xml`

Bot proof:

- Dry-run: `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-bot-dry-run-final.txt`
- Live-local: `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-bot-live-local-final.txt`

Validation:

- `npx vitest run src/server/services/__tests__/soccerProviderNormalization.test.ts`: passed.
- `npm run typecheck` in `mobile/`: passed.
- Backend health on `http://127.0.0.1:3002`: passed during route/mobile proof.
- S23 proof passed after Expo reload into server mode.

## Audit Gate

Result: Pass for provider breadth/Search visibility and match-only classification guard; partial for bot quote placement.

P0 unresolved for provider breadth/Search/classification: 0.

Bot runtime result:

- Dry-run/live-local used the tiny `England` allowlist.
- Runtime consumed fresh reference bid/ask and planned bid/ask quotes.
- Quote placement was skipped by `per_market_exposure_cap_reached_20060_of_20000`; this remains a P1 seed/risk-cap sizing blocker.

Remaining gaps:

- P1: Real current/live World Cup match breadth remains limited.
- P1: Polymarket-backed line markets for match detail remain unavailable.
- P1: Scheduled refresh/bot breadth remains manual and narrow.
- P1: Bot quote placement needs seed sizing or risk-cap configuration.
