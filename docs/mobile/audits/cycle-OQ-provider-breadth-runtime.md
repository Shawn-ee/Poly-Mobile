# Cycle OQ - Provider Breadth Runtime

## Scope

Focused provider-breadth/runtime cycle for the Local MVP retail betting path.

This cycle did not change mobile UI source code. It imported and refreshed more real Polymarket-backed World Cup provider data, proved the broader provider surface on Samsung S23 Search, and ran a tiny allowlisted fake-token bot dry-run/live-local path.

## Reference Audit

Polymarket provider source:

- Gamma event: `which-continent-will-win-the-world-cup`
- Imported markets:
  - `will-africa-win-the-2026-fifa-world-cup`
  - `will-europe-win-the-2026-fifa-world-cup`
  - `will-south-america-win-the-2026-fifa-world-cup`
- CLOB/reference snapshots refreshed with best bid/ask, spread, last trade price, quality status, and token ids.

Related existing provider events:

- `world-cup-winner`
- `fifwc-arg-egy-2026-07-07`

## Acceptance Criteria

P0:

- Missing `OPTIC_ODDS_API_KEY` must not block the cycle.
- At least one additional real Polymarket-backed World Cup event must be imported or proven route-visible.
- Provider-backed events must expose compact mobile route fields through `/api/events?...includeMobileMarkets=1`.
- Samsung S23 must show the broader provider-backed surface in Holiwyn.
- Reference snapshots must refresh successfully for the newly imported event.
- Tiny bot dry-run/live-local must either pass or produce a concrete readiness blocker.

P1:

- Add more provider-backed live/current match events.
- Replace contract-fixture match line markets with real provider-backed line markets when attach-ready Polymarket data exists.
- Move provider refresh and bot readiness to a scheduled loop.

## Holiwyn Proof

Route proof:

- `docs/mobile/harness/cycle-OQ-provider-breadth-runtime/cycle-OQ-provider-breadth-runtime-route.json`
- Result: pass
- Broad World Cup route now shows 3 provider-backed events:
  - `which-continent-will-win-the-world-cup`
  - `provider-breadth-world-cup-winner`
  - `argentina-vs-egypt`

S23 proof:

- Device: Samsung S23 `SM-S911U1`
- ADB: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Summary: `docs/mobile/harness/cycle-OQ-provider-breadth-runtime/cycle-OQ-s23-search-provider-breadth-summary.json`
- Screenshot: `docs/mobile/screenshots/cycle-OQ-provider-breadth-runtime/cycle-OQ-search-provider-breadth.png`
- XML: `docs/mobile/harness/cycle-OQ-provider-breadth-runtime/cycle-OQ-search-provider-breadth.xml`
- Result: pass

Bot/runtime proof:

- Dry-run: `docs/mobile/harness/cycle-OQ-provider-breadth-runtime/cycle-OQ-bot-dry-run.txt`
- Live-local: `docs/mobile/harness/cycle-OQ-provider-breadth-runtime/cycle-OQ-bot-live-local.txt`
- Allowlist: `Africa (CAF)`
- Market id: `fd7d40f6-898d-402b-b4b1-5d1d0380e38c`
- Result: pass for one tiny fake-token local-MM-ready provider market.

## Audit Gate

Pass for focused provider-breadth/runtime scope.

Unresolved P1 gaps:

- Current MVP match line markets remain `contract-fixture`.
- Argentina/Egypt provider winner markets are no longer useful for MM readiness because provider books are missing/invalid/one-sided.
- Futures/outright breadth does not replace live event detail parity for soccer match pages.
- Scheduled provider refresh is still needed to keep readiness stable.
