# Cycle OS - Provider Breadth / Line Inspection

## Scope

Focused Provider Breadth Runtime Loop continuation for the Local MVP retail betting path.

This cycle:

- Rechecked current-match Polymarket Gamma line-market availability.
- Rechecked broader Polymarket line-market candidate availability without weakening relevance gates.
- Scanned active Polymarket sports markets for usable World Cup provider-backed candidates.
- Refreshed provider-breadth route proof for broad World Cup/Search visibility.
- Proved the provider-backed Search surface on Samsung S23 after a fresh server-mode Expo reload.

No order book UI, chat, live stats, social, deposit/withdraw, backend schema, order routes, or broad visual UI polish were changed.

## Reference / Provider Audit

Provider source:

- Polymarket Gamma API.
- Existing CLOB/reference snapshot data already attached to imported provider-backed markets.

Evidence:

- Current match line availability: `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-current-match-line-availability.json`
- Broad line candidate guard: `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-broad-line-market-availability.json`
- Active sports candidates: `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-active-sports-candidates.json`
- Provider breadth route proof: `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-provider-breadth-runtime-route.json`
- Search provider breadth route proof: `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-search-provider-breadth-route.json`

Findings:

- `argentina-vs-egypt` has 3 real Polymarket match-winner markets.
- `argentina-vs-egypt` has 0 Polymarket Gamma line markets for Spread/Totals/Team Total.
- Holiwyn exposes 4 contract-fixture line markets for the Local MVP path, with source disclosure.
- Broad World Cup route has 3 provider-backed events:
  - `which-continent-will-win-the-world-cup`
  - `provider-breadth-world-cup-winner`
  - `argentina-vs-egypt`
- Active sports scan found usable World Cup Winner candidates already represented by the imported World Cup Winner provider event.

## Acceptance Criteria

P0:

- Current match provider availability proof must confirm regulation winner status and line-market status from live route data.
- The relevance gate must reject irrelevant/wrong-family line candidates instead of attaching them as provider lines.
- Broad provider route must expose multiple Polymarket-backed World Cup events.
- Samsung S23 must show multiple provider-backed events in mobile Search using server-mode data.
- Missing `OPTIC_ODDS_API_KEY` must remain optional/unconfigured and non-blocking.

P1:

- Real provider-backed Spread/Totals/Team Total line markets remain required when Polymarket exposes attach-ready markets or another approved provider is configured.
- Import additional current/live match events when real attach-ready Polymarket provider data exists.
- Scheduled provider refresh remains future work.

## Implementation

Code changed:

- `scripts/prove_mobile_provider_breadth_runtime.ts`
- `scripts/prove_mobile_search_provider_breadth.ts`

Change:

- Both proof scripts now accept `--cycle=...` so generated evidence names the current cycle instead of carrying stale `OM` / `OP` labels.

No mobile UI source or backend route behavior changed.

## Holiwyn Android Proof

Device:

- Samsung S23 `SM-S911U1`
- ADB: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`

Passed proof after force-stopping Expo Go and rebuilding Metro with:

- `EXPO_PUBLIC_MARKET_DATA_MODE=server`
- `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3002`
- `adb reverse tcp:3002 tcp:3002`

Evidence:

- Screenshot: `docs/mobile/screenshots/cycle-OS-provider-breadth-line-inspection/cycle-OS-s23-search-provider-breadth-servermode-reload.png`
- XML: `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-s23-search-provider-breadth-servermode-reload.xml`

Result:

- `Which continent will win the World Cup`: present.
- `World Cup Winner`: present.
- `Argentina vs. Egypt`: present.
- `Polymarket`: present.
- `0 results`: absent.

## Audit Gate

Pass for focused OS scope.

Unresolved P0 gaps:

- None for provider-breadth route visibility, Search visibility, and line-market availability classification.

Remaining P1:

- Real provider-backed Spread/Totals/Team Total line markets are still unavailable for the current match.
- Broader current/live match provider inventory is still limited.
- Provider refresh should become scheduled instead of proof-script driven.
