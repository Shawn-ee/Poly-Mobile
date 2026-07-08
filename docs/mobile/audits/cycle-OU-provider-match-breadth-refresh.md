# Cycle OU - Golden Boot Provider Breadth Refresh

Date: 2026-07-08

## Scope

Finish the current provider readiness proof and keep the loop pointed at meaningful provider breadth instead of source-label micro-proof:

- Inspect attach-ready Polymarket-backed World Cup provider data.
- Import/normalize one additional real provider-backed World Cup event.
- Refresh reference prices through the Polymarket-first provider path.
- Prove multiple provider-backed events in mobile Search on Samsung S23.
- Run tiny allowlisted bot dry-run/live-local and record the real blocker if quote placement fails.

This cycle intentionally does not add order book UI, chat, live stats, social surfaces, schema changes, or visual source-label-only work.

## Reference / Provider Audit

Provider source:

- Polymarket Gamma event discovery for `world-cup-golden-boot-winner`.
- Polymarket CLOB public market data for token-backed quote refresh.
- `OPTIC_ODDS_API_KEY` remains optional and is not a blocker.

Initial match-event attempt:

- The current match candidate `fifwc-col-gha-2026-07-03` failed the attach-ready gate because it exposed fewer than 2 attachable markets.
- The cycle did not weaken the relevance gate or mark that candidate as passing.
- The cycle pivoted to `world-cup-golden-boot-winner`, which imported 12 real Polymarket markets.

Observed route-visible state after import/refresh:

- `World Cup: Golden Boot Winner`: 12 real Polymarket markets.
- `World Cup Winner`: 8 real Polymarket markets.
- `Which continent will win the World Cup?`: 3 real Polymarket markets.
- `Argentina vs. Egypt`: 3 Polymarket winner markets plus 4 Local MVP contract-fixture line markets.

## Acceptance Criteria

P0:

- Missing Optic Odds key must not fail provider readiness.
- Import must produce real provider-owned markets with external slugs/ids and token-backed price fields.
- Reference refresh must update provider quote snapshots for the imported event.
- Backend provider breadth route proof must show at least 4 provider-backed World Cup events after import.
- Search route proof must show source/status fields consumed by mobile.
- Samsung S23 proof must show the newly imported event in Holiwyn Search.
- Bot dry-run/live-local must be attempted only with a tiny allowlist, and any quote-placement blocker must be recorded honestly.
- Expo/Metro and stale worker processes must be cleaned after proof.

P1:

- Real provider-backed current/live World Cup match breadth.
- Real provider-backed Spread/Totals/Team Total line markets for match detail pages.
- Scheduled refresh for reference snapshots.
- Local trading-kill-switch policy for bot quote placement.

P2:

- Reduce internal source label visual prominence after it blocks tester comfort, without removing proof markers needed by harnesses.

## Implementation Notes

Changed:

- No mobile UI, backend route source, Prisma schema, order route, order book, chat, live stats, or social source files changed.
- Local provider runtime data was expanded by importing `world-cup-golden-boot-winner`.
- Existing proof and refresh scripts were used to validate the current runtime.

Material user-visible change:

- S23 Search now shows 4 provider-backed World Cup results, led by `World Cup: Golden Boot Winner` with `Polymarket 12 markets`.

## Proof

Provider/route proof:

- `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-provider-breadth-runtime-route.json`
- `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-search-provider-breadth-route.json`
- `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-golden-boot-reference-refresh.json`

Samsung S23 proof:

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Screenshot: `docs/mobile/screenshots/cycle-OU-provider-match-breadth-refresh/cycle-OU-s23-provider-breadth-search.png`
- XML: `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-s23-provider-breadth-search.xml`

Bot proof:

- Dry-run: `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-bot-dry-run-final.txt`
- Live-local: `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-bot-live-local-final.txt`

Validation:

- `npm run typecheck` in `mobile/`: passed.
- Backend health on `http://127.0.0.1:3002`: passed during route/mobile proof.
- S23 proof passed after Expo reload into server mode.

## Audit Gate

Result: Pass for focused provider breadth/Search visibility; partial for bot quote placement.

P0 unresolved for provider breadth/Search visibility: 0.

Bot runtime result:

- Dry-run produced planned bid/ask quotes for the tiny `Kylian Mbappe` allowlist.
- Live-local reached `manage_quotes`, proving the provider/runtime path is no longer blocked by discovery or missing freshness.
- Fake-token quote placement was rejected by `TRADING_KILL_SWITCH_ACTIVE`; this remains a P1 local trading-gate blocker.

Remaining gaps:

- P1: Real current/live World Cup match breadth remains limited.
- P1: Polymarket-backed line markets for match detail remain unavailable.
- P1: Scheduled refresh/bot breadth remains manual and narrow.
- P1: Internal source labels should remain available for harnesses but should not dominate final tester UI.
