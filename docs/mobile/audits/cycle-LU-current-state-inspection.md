# Cycle LU - Current State Inspection And Home MVP Feed Tightening

Date: 2026-07-08

## Scope

Inspect the current Holiwyn Local MVP service/mobile state before continuing the original loop.

Focus:

- Home route readiness
- Event Detail market source readiness
- Whether Regulation Winner and line markets are real provider-backed data
- S23 proof that current source code, not the stale installed APK bundle, is being tested
- Home feed cleanup for World Cup match-only MVP behavior

Out of scope:

- Order book UI
- Chat
- Live sports statistics
- Social/watchlist work
- Backend schema migration

## Inspection Result

Backend/service state is partially ready for the Local MVP flow.

- `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` returns 3 events before mobile filtering:
  - `switzerland-vs-colombia`: match, provider-backed Regulation Winner, contract-fixture line markets
  - `argentina-vs-egypt`: match, provider-backed Regulation Winner, no line markets
  - `mobile-fj-real-world-cup-winner`: futures, provider-backed outright markets
- `GET /api/mobile/events/switzerland-vs-colombia/live-detail` returns:
  - 3 `polymarket` Regulation Winner rows
  - 4 `contract-fixture` line rows for Spread, Totals, and Team Totals
  - 0 provider-backed line markets

Conclusion:

- Regulation Winner is turned on for live match cards.
- Real provider-backed Spread/Totals/Team Total markets are not available for the selected Polymarket Gamma event.
- Local MVP line markets are currently backend-shaped contract fixtures, not frontend-only random mock data.

## S23 Device Findings

Device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- `SM-S911U1`
- `1080x2340`

The installed package `com.holiwyn.mobile` is stale. It launched an old bundled Home screen with:

- Trending
- Home search
- Futures tab/card
- old Mexico/Ecuador local data
- Account tab

This installed APK/dev build should not be used to mark current source complete until it is rebuilt.

Expo Go with the current Metro URL did load current source code and server-mode data.

## Fix Applied

The mobile Home feed now requests `leagueKey=world_cup` and filters server results to soccer match events only.

This prevents broad provider/futures records such as `Ballon d'Or Winner 2026` or `World Cup Winner` from appearing in the Local MVP Home feed.

## Acceptance Criteria

| Criterion | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Backend inspection identifies current Home/Event Detail readiness | P0 | Pass | `docs/mobile/harness/cycle-LU-current-state-inspection/cycle-LU-current-state-inspection.json` |
| Home feed is World Cup match-only in current source | P0 | Pass | S23 XML shows `visible-2-of-2` and only two match cards |
| Home does not show Trending or Home search | P0 | Pass | S23 XML has no `Trending` or `Search World Cup markets` |
| Home does not show non-MVP futures cards | P0 | Pass | S23 XML has no `Ballon d'Or` or `World Cup Winner` |
| Installed APK is identified as stale | P1 | Open | `holiwyn-launch.png` shows old bundled UI |
| Full Home -> Event Detail -> line ticket -> order -> Portfolio/history S23 proof | P0 | Next | Not completed in LU |

## Evidence

- `docs/mobile/screenshots/cycle-LU-current-state-inspection/current-screen.png`
- `docs/mobile/screenshots/cycle-LU-current-state-inspection/holiwyn-launch.png`
- `docs/mobile/screenshots/cycle-LU-current-state-inspection/expo-launch.png`
- `docs/mobile/screenshots/cycle-LU-current-state-inspection/home-filtered-s23-reload.png`
- `docs/mobile/harness/cycle-LU-current-state-inspection/cycle-LU-current-state-inspection.json`
- `docs/mobile/harness/cycle-LU-current-state-inspection/home-filtered-s23-reload.xml`

Validation:

- `npx tsx scripts/inspect_mobile_mvp_current_state.ts --baseUrl=http://127.0.0.1:3002 --summaryPath=docs/mobile/harness/cycle-LU-current-state-inspection/cycle-LU-current-state-inspection.json`
- `npm run typecheck -- --pretty false` from `mobile`

Blocked validation:

- `npx vitest run src/__tests__/homeEventFeedService.test.ts src/__tests__/mvpBackendReadinessGate.test.ts` from `mobile` did not run because the active Vitest configuration only includes `src/server/services/__tests__/**/*.test.ts`.

## Adjusted Path

Next cycle should not chase more provider discovery before visible MVP proof.

Recommended next step:

1. Keep Expo Go as the current S23 proof path until a fresh development build/APK is created.
2. Prove Home -> Event Detail for `switzerland-vs-colombia`.
3. Confirm Event Detail visibly shows provider-backed Regulation Winner and contract-fixture Spread/Totals/Team Total rows.
4. Open a line ticket, submit a server-backed fake-token order, and prove Portfolio/history.
5. After that, rebuild the installed Holiwyn dev APK so manual S23 testing does not accidentally open stale source.
