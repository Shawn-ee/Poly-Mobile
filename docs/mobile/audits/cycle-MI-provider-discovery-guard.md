# Cycle MI - Provider Discovery Guard

## Scope

Tighten the Polymarket-first provider discovery path for the current Local MVP event after Cycle MH showed:

- Regulation Winner is provider-backed.
- Spread/Totals/Team Total rows are currently backend-shaped contract fixtures.
- Provider discovery could still rank a broad team outright market too highly for a match-specific winner market.

Out of scope:

- Order book UI.
- Chat.
- Live stats.
- Watchlist/social.
- Backend schema migration.

## Change

`mobileLiveProviderCandidates` now includes the local event title in provider candidate search and relevance scoring. This means a match-specific market such as `Argentina vs. Egypt` must match the matchup context, not only one team name plus `win`.

## Evidence

Provider guard proof:

- `docs/mobile/harness/cycle-MI-provider-discovery-guard/cycle-MI-provider-discovery-guard.json`

S23 integrated MVP proof:

- `docs/mobile/harness/cycle-MI-provider-discovery-guard/cycle-MI-current-mvp-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-MI-provider-discovery-guard/`

Tests:

- `npx jest --runInBand src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run -s typecheck` from `mobile/`

## Result

| Area | Result | Notes |
| --- | --- | --- |
| Exact match-winner mapping | Pass | Argentina, draw, and Egypt map to exact `fifwc-arg-egy-2026-07-07-*` candidates. |
| Unsafe outright attach | Pass | `unsafeOutrightAttachCount=0`; broad World Cup outright markets no longer attach to the event-specific match target. |
| Line-market provider availability | Partial | Spread/Totals/Team Total targets remain present but have `attachReadyLineTargetCount=0`. |
| Wrong-family line rejection | Pass | 4 line targets reject match-winner candidates with `provider_family_mismatch`. |
| Android regression | Pass | S23 proof still completes Home -> Event Detail -> line ticket -> swipe submit -> Portfolio/history with orderbook hidden. |

## Remaining Gap

Real provider-backed Spread/Totals/Team Total lines are still unavailable for the inspected event. Continue Local MVP with explicit contract-shaped line markets until real Polymarket line slugs/tokens exist or an approved provider is configured.
